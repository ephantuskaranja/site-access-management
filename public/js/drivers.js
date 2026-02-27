// Driver Management JavaScript
// Handles listing, creating, and updating drivers

(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const apiBase = '/api';
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    const PASSCODE_AUTO_HIDE_MS = 8000; // Auto-hide pass codes after a short delay

    const addDriverBtn = document.getElementById('addDriverBtn');
    const uploadDriversBtn = document.getElementById('uploadDriversBtn');
    const driverModal = document.getElementById('driverModal');
    const driverForm = document.getElementById('driverForm');
    const driverModalTitle = document.getElementById('driverModalTitle');
    const driversTableBody = document.getElementById('driversTableBody');
    const statusFilter = document.getElementById('driverStatusFilter');
    const searchInput = document.getElementById('driverSearchInput');
    const clearFiltersBtn = document.getElementById('clearDriverFilters');
    const driverAlert = document.getElementById('driverAlert');
    const uploadModal = document.getElementById('driverUploadModal');
    const uploadForm = document.getElementById('driverUploadForm');
    const uploadInput = document.getElementById('driverUploadInput');
    const uploadErrorBox = document.getElementById('driverUploadError');
    const driverPagination = document.getElementById('driverPagination');
    const driverPageInfo = document.getElementById('driverPageInfo');

    let currentPage = 1;
    const PAGE_SIZE = 5;
    let totalPages = 1;
    let totalCount = 0;

    if (!driversTableBody) return; // Not on drivers page

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderInlineAlert(message, type) {
      if (!driverAlert) return false;
      driverAlert.textContent = message;
      driverAlert.classList.remove('d-none', 'alert-info', 'alert-success', 'alert-warning', 'alert-danger');
      const cls = type === 'danger' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : type === 'success' ? 'alert-success' : 'alert-info';
      driverAlert.classList.add('alert', cls);
      return true;
    }

    function showAlert(message, type) {
      if (window.showAlert) {
        window.showAlert(message, type || 'info');
        renderInlineAlert(message, type || 'info');
        return;
      }
      if (!renderInlineAlert(message, type || 'info')) {
        console[type === 'danger' ? 'error' : 'log'](message);
      }
    }

    async function makeRequest(path, options) {
      const headers = Object.assign({}, options && options.headers);

      if (!(options && options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const resp = await fetch(apiBase + path, Object.assign({}, options, { headers }));
      if (!resp.ok) {
        let msg = 'Request failed';
        let details = null;
        const status = resp.status;
        let json = null;
        try {
          json = await resp.json();
          msg = json && (json.message || json.error) || msg;
          details = json && (json.errors || (json.data && json.data.errors));
        } catch(_) {}

        if (status === 401 && msg.toLowerCase().includes('token')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('accessToken');
          showAlert('Session expired. Please sign in again.', 'danger');
          window.location.href = '/';
          return;
        }

        // Treat duplicate-only bulk upload as handled success to avoid console errors
        if (status === 400 && msg.toLowerCase().includes('duplicates') && /bulk-upload/.test(path)) {
          return {
            duplicateOnly: true,
            status,
            message: msg,
            data: json && json.data ? json.data : undefined,
          };
        }

        const error = new Error(msg);
        error.details = details;
        error.status = status;
        throw error;
      }
      try {
        return await resp.json();
      } catch(_) {
        return null;
      }
    }

    function openModal() {
      if (!driverModal) return;
      driverModal.style.display = 'flex';
      driverModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (!driverModal) return;
      driverModal.style.display = 'none';
      driverModal.classList.remove('show');
      document.body.style.overflow = '';
      if (driverForm) driverForm.reset();
      const idField = document.getElementById('driverId');
      if (idField) idField.value = '';
    }

    function openUploadModal() {
      if (!uploadModal) return;
      uploadModal.style.display = 'flex';
      uploadModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeUploadModal() {
      if (!uploadModal) return;
      uploadModal.style.display = 'none';
      uploadModal.classList.remove('show');
      document.body.style.overflow = '';
      if (uploadForm) uploadForm.reset();
      if (uploadInput) uploadInput.value = '';
      if (uploadErrorBox) {
        uploadErrorBox.classList.add('d-none');
        uploadErrorBox.classList.remove('alert-success');
        uploadErrorBox.classList.add('alert-danger');
        uploadErrorBox.innerHTML = '';
      }
    }

    function populateTable(drivers) {
      if (!driversTableBody) return;

      if (!drivers || !drivers.length) {
        driversTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No drivers found</td></tr>';
        return;
      }

      driversTableBody.innerHTML = drivers.map(d => {
        const created = d.createdAt ? new Date(d.createdAt) : null;
        const updated = d.updatedAt ? new Date(d.updatedAt) : null;
        const fmt = dt => dt ? dt.toLocaleString() : '-';
        const statusBadge = d.status === 'active' ? 'success' : 'secondary';
        const hasPassCode = d.passCode && String(d.passCode).trim() !== '';
        const passCellHtml = hasPassCode
          ? `<span class="driver-passcode-mask" data-passcode="${String(d.passCode).trim()}">••••</span>
             <button type="button" class="btn btn-link btn-sm p-0 ms-2 driver-view-pass-btn" data-driver-id="${d.id}" data-visible="false">View</button>`
          : '<span class="text-muted">Not set</span>';
        return `
          <tr data-driver-id="${d.id}">
            <td>${d.name || '-'}</td>
            <td><span class="badge badge-${statusBadge}">${d.status}</span></td>
            <td>${passCellHtml}</td>
            <td>${fmt(created)}</td>
            <td>${fmt(updated)}</td>
            <td>
              <button class="btn btn-outline-primary btn-sm driver-edit-btn" data-driver-id="${d.id}">Edit</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function updatePageInfo(pageItemsCount) {
      if (!driverPageInfo) return;
      if (!totalCount) {
        driverPageInfo.textContent = 'Showing 0 of 0 drivers';
        return;
      }
      const from = (currentPage - 1) * PAGE_SIZE + 1;
      const to = Math.min(from + pageItemsCount - 1, totalCount);
      driverPageInfo.textContent = `Showing ${from}-${to} of ${totalCount} drivers`;
    }

    function renderPagination() {
      if (!driverPagination) return;
      driverPagination.innerHTML = '';

      if (totalPages <= 1) return;

      const addPageItem = (page, label, disabled, active) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${page}">${label}</a>`;
        driverPagination.appendChild(li);
      };

      addPageItem(currentPage - 1, 'Previous', currentPage === 1, false);

      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);
      for (let p = start; p <= end; p += 1) {
        addPageItem(p, p, false, p === currentPage);
      }

      addPageItem(currentPage + 1, 'Next', currentPage === totalPages, false);
    }

    async function loadDrivers(page) {
      try {
        const targetPage = page || currentPage || 1;
        const params = new URLSearchParams();
        params.set('page', String(targetPage));
        params.set('limit', String(PAGE_SIZE));

        const status = statusFilter ? statusFilter.value : '';
        const search = searchInput ? searchInput.value.trim() : '';
        if (status) params.set('status', status);
        if (search) params.set('search', search);

        const res = await makeRequest('/drivers?' + params.toString(), { method: 'GET' });
        const drivers = res && res.data && res.data.drivers ? res.data.drivers : [];
        const pagination = res && res.data ? res.data.pagination : null;

        currentPage = pagination && pagination.page ? pagination.page : targetPage;
        totalPages = pagination && pagination.pages ? pagination.pages : 1;
        totalCount = pagination && typeof pagination.total === 'number' ? pagination.total : drivers.length;

        populateTable(drivers);
        updatePageInfo(drivers.length);
        renderPagination();
      } catch (e) {
        console.error('Error loading drivers', e);
        showAlert(e.message || 'Error loading drivers', 'danger');
        driversTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Error loading drivers</td></tr>';
        totalCount = 0;
        totalPages = 1;
        updatePageInfo(0);
        renderPagination();
      }
    }

    function startAddDriver() {
      if (!driverForm) return;
      driverForm.reset();
      const idField = document.getElementById('driverId');
      if (idField) idField.value = '';
      if (window.clearFieldError) {
        window.clearFieldError('driverName');
        window.clearFieldError('driverPassCode');
      }
      if (driverModalTitle) driverModalTitle.textContent = 'Add Driver';
      openModal();
    }

    function startEditDriver(driverId) {
      const row = driversTableBody.querySelector('tr[data-driver-id="' + driverId + '"]');
      if (!row || !driverForm) return;

      const cells = row.querySelectorAll('td');
      const nameCell = cells[0];
      const statusCell = cells[1];
      const passCell = cells[2];

      const idField = document.getElementById('driverId');
      const nameField = document.getElementById('driverName');
      const statusField = document.getElementById('driverStatus');
      const passField = document.getElementById('driverPassCode');

      if (idField) idField.value = driverId;
      if (nameField) nameField.value = nameCell ? nameCell.textContent.trim() : '';
      if (statusField && statusCell) {
        const badge = statusCell.querySelector('.badge');
        const statusText = (badge && badge.textContent || '').trim() || 'active';
        statusField.value = statusText;
      }
      if (passField && passCell) {
        const maskEl = passCell.querySelector('.driver-passcode-mask');
        const storedCode = maskEl && maskEl.dataset ? (maskEl.dataset.passcode || '').trim() : '';
        passField.value = storedCode;
      }

      if (window.clearFieldError) {
        window.clearFieldError('driverName');
        window.clearFieldError('driverPassCode');
      }

      if (driverModalTitle) driverModalTitle.textContent = 'Edit Driver';
      openModal();
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!driverForm) return;

      const idField = document.getElementById('driverId');
      const nameField = document.getElementById('driverName');
      const statusField = document.getElementById('driverStatus');
      const passField = document.getElementById('driverPassCode');

      const name = (nameField && nameField.value || '').trim();
      const status = (statusField && statusField.value || 'active').trim();
      const passCodeRaw = (passField && passField.value || '').trim();

      if (!name) {
        if (window.showFieldError) window.showFieldError('driverName', 'Name is required');
        else showAlert('Name is required', 'danger');
        return;
      }

      if (!passCodeRaw || passCodeRaw.length !== 4 || !/^[0-9]{4}$/.test(passCodeRaw)) {
        if (window.showFieldError) window.showFieldError('driverPassCode', 'Pass code must be 4 digits');
        else showAlert('Pass code must be 4 digits', 'danger');
        return;
      }

      const payload = {
        name,
        status,
        passCode: passCodeRaw
      };

      const id = idField && idField.value ? idField.value : null;
      const method = id ? 'PUT' : 'POST';
      const path = id ? ('/drivers/' + encodeURIComponent(id)) : '/drivers';

      try {
        await makeRequest(path, {
          method,
          body: JSON.stringify(payload)
        });
        showAlert('Driver saved successfully', 'success');
        closeModal();
        await loadDrivers();
      } catch (e) {
        console.error('Error saving driver', e);
        showAlert(e.message || 'Error saving driver', 'danger');
      }
    }

    async function handleUpload(e) {
      e.preventDefault();
      if (!uploadInput || !uploadInput.files || !uploadInput.files.length) {
        showAlert('Please select an Excel file to upload', 'danger');
        return;
      }

      if (uploadErrorBox) {
        uploadErrorBox.classList.add('d-none');
        uploadErrorBox.classList.remove('alert-success');
        uploadErrorBox.classList.add('alert-danger');
        uploadErrorBox.innerHTML = '';
      }

      const file = uploadInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await makeRequest('/drivers/bulk-upload', {
          method: 'POST',
          body: formData,
        });

        const duplicateOnly = res && res.duplicateOnly;
        const imported = res && res.data ? (res.data.imported || 0) : 0;
        const updated = res && res.data ? (res.data.updated || 0) : 0;
        const skipped = res && res.data ? (res.data.skipped || 0) : 0;
        const errors = res && res.data ? res.data.errors : [];
        const messages = res && res.data ? res.data.messages : [];

        const summary = res && res.message
          ? res.message
          : `Imported ${imported} driver${imported === 1 ? '' : 's'}, updated ${updated}${skipped ? `, skipped ${skipped}` : ''}`;

        showAlert(summary, 'success');
        if (messages && messages.length) {
          console.info('Upload info:', messages);
        }
        if (errors && errors.length) {
          console.warn('Upload warnings:', errors);
        }
        closeUploadModal();
        await loadDrivers();
        return;
      } catch (err) {
        if (!(err && err.status === 400 && err.message && err.message.toLowerCase().includes('duplicates'))) {
          console.error('Error uploading drivers', err);
        }
        const details = Array.isArray(err && err.details) ? err.details : null;
        if (uploadErrorBox) {
          let html = escapeHtml(err.message || 'Error uploading drivers');
          if (details && details.length) {
            html += '<ul class="mb-0 mt-2">';
            details.slice(0, 10).forEach((d) => { html += '<li>' + escapeHtml(d) + '</li>'; });
            html += '</ul>';
          }
          uploadErrorBox.innerHTML = html;
          uploadErrorBox.classList.remove('d-none');
        }

        if (err.status === 400 && err.message && err.message.toLowerCase().includes('duplicates')) {
          const msg = 'Uploaded file contained only duplicates. 0 new records created; duplicates were updated if present.';
          showAlert(msg, 'success');
          if (uploadErrorBox) {
            uploadErrorBox.classList.remove('d-none', 'alert-danger');
            uploadErrorBox.classList.add('alert-success');
            uploadErrorBox.innerHTML = escapeHtml(msg);
          }
          closeUploadModal();
          await loadDrivers();
          return;
        }

        showAlert(err.message || 'Error uploading drivers', 'danger');
      }
    }

    // Event bindings
    if (addDriverBtn) {
      addDriverBtn.addEventListener('click', startAddDriver);
    }

    if (uploadDriversBtn) {
      uploadDriversBtn.addEventListener('click', openUploadModal);
    }

    if (driverForm) {
      driverForm.addEventListener('submit', handleSubmit);
      // Clear inline pass code errors as the user types
      const passField = document.getElementById('driverPassCode');
      if (passField) {
        passField.addEventListener('input', function(){
          if (window.clearFieldError) window.clearFieldError('driverPassCode');
        });
      }
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', handleUpload);
    }

    document.querySelectorAll('[data-modal-close="driverModal"]').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    document.querySelectorAll('[data-modal-close="driverUploadModal"]').forEach(btn => {
      btn.addEventListener('click', closeUploadModal);
    });

    [driverModal, uploadModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', function(ev){
          if (ev.target === modal) {
            if (modal === driverModal) closeModal();
            if (modal === uploadModal) closeUploadModal();
          }
        });
      }
    });

    if (driverModal) {
      driverModal.addEventListener('click', function(e){
        if (e.target === driverModal) {
          closeModal();
        }
      });
    }

    document.querySelectorAll('[data-modal-close="driverModal"]').forEach(btn => {
      btn.addEventListener('click', function(){ closeModal(); });
    });

    if (statusFilter) {
      statusFilter.addEventListener('change', function(){
        currentPage = 1;
        loadDrivers(1);
      });
    }

    if (searchInput) {
      const debounce = function(fn, delay){ let t; return function(){ const args = arguments; clearTimeout(t); t = setTimeout(fn.bind(null, ...args), delay); }; };
      searchInput.addEventListener('input', debounce(function(){
        currentPage = 1;
        loadDrivers(1);
      }, 300));
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function(){
        if (statusFilter) statusFilter.value = '';
        if (searchInput) searchInput.value = '';
        currentPage = 1;
        loadDrivers(1);
      });
    }

    if (driverPagination) {
      driverPagination.addEventListener('click', function(e){
        const link = e.target.closest('a[data-page]');
        if (!link) return;
        e.preventDefault();
        const target = parseInt(link.getAttribute('data-page'), 10);
        if (!target || target === currentPage || target < 1 || target > totalPages) return;
        currentPage = target;
        loadDrivers(target);
      });
    }

    const passcodeHideTimers = new Map();

    if (driversTableBody) {
      driversTableBody.addEventListener('click', function(e){
        const editBtn = e.target.closest && e.target.closest('.driver-edit-btn');
        if (editBtn) {
          const id = editBtn.getAttribute('data-driver-id');
          if (id) startEditDriver(id);
          return;
        }

        const viewBtn = e.target.closest && e.target.closest('.driver-view-pass-btn');
        if (viewBtn) {
          const row = viewBtn.closest('tr');
          const maskEl = row && row.querySelector('.driver-passcode-mask');
          if (!maskEl) return;
          const code = (maskEl.dataset && maskEl.dataset.passcode || '').trim();
          if (!code) return;

          const driverId = row ? row.getAttribute('data-driver-id') : null;
          const isVisible = viewBtn.getAttribute('data-visible') === 'true';

          const hidePasscode = function(){
            maskEl.textContent = '••••';
            viewBtn.textContent = 'View';
            viewBtn.setAttribute('data-visible', 'false');
            if (driverId && passcodeHideTimers.has(driverId)) {
              passcodeHideTimers.delete(driverId);
            }
          };

          if (isVisible) {
            // User manually hides; cancel any pending auto-hide timer
            if (driverId && passcodeHideTimers.has(driverId)) {
              clearTimeout(passcodeHideTimers.get(driverId));
              passcodeHideTimers.delete(driverId);
            }
            hidePasscode();
          } else {
            maskEl.textContent = code;
            viewBtn.textContent = 'Hide';
            viewBtn.setAttribute('data-visible', 'true');

            // Reset any existing timer for this driver row
            if (driverId && passcodeHideTimers.has(driverId)) {
              clearTimeout(passcodeHideTimers.get(driverId));
            }

            if (driverId) {
              const timerId = setTimeout(hidePasscode, PASSCODE_AUTO_HIDE_MS);
              passcodeHideTimers.set(driverId, timerId);
            }
          }
        }
      });
    }

    // Initial load
    loadDrivers(1);
  });
})();
