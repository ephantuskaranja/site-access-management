// Driver Management JavaScript
// Handles listing, creating, and updating drivers

(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const apiBase = '/api';
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');

    const addDriverBtn = document.getElementById('addDriverBtn');
    const driverModal = document.getElementById('driverModal');
    const driverForm = document.getElementById('driverForm');
    const driverModalTitle = document.getElementById('driverModalTitle');
    const driversTableBody = document.getElementById('driversTableBody');
    const statusFilter = document.getElementById('driverStatusFilter');
    const searchInput = document.getElementById('driverSearchInput');
    const clearFiltersBtn = document.getElementById('clearDriverFilters');

    if (!driversTableBody) return; // Not on drivers page

    function showAlert(message, type) {
      if (window.showAlert) {
        window.showAlert(message, type || 'info');
        return;
      }
      console[type === 'danger' ? 'error' : 'log'](message);
    }

    async function makeRequest(path, options) {
      const headers = Object.assign({
        'Content-Type': 'application/json',
      }, options && options.headers);

      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const resp = await fetch(apiBase + path, Object.assign({}, options, { headers }));
      if (!resp.ok) {
        let msg = 'Request failed';
        try {
          const json = await resp.json();
          msg = json && (json.message || json.error) || msg;
        } catch(_) {}
        throw new Error(msg);
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

    function populateTable(drivers) {
      if (!driversTableBody) return;

      if (!drivers || !drivers.length) {
        driversTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No drivers found</td></tr>';
        return;
      }

      const search = (searchInput && searchInput.value || '').toLowerCase().trim();

      const filtered = drivers.filter(d => {
        if (!search) return true;
        return String(d.name || '').toLowerCase().includes(search);
      });

      if (!filtered.length) {
        driversTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No matching drivers</td></tr>';
        return;
      }

      driversTableBody.innerHTML = filtered.map(d => {
        const created = d.createdAt ? new Date(d.createdAt) : null;
        const updated = d.updatedAt ? new Date(d.updatedAt) : null;
        const fmt = dt => dt ? dt.toLocaleString() : '-';
        const statusBadge = d.status === 'active' ? 'success' : 'secondary';
        return `
          <tr data-driver-id="${d.id}">
            <td>${d.name || '-'}</td>
            <td><span class="badge badge-${statusBadge}">${d.status}</span></td>
            <td>${d.passCode || '****'}</td>
            <td>${fmt(created)}</td>
            <td>${fmt(updated)}</td>
            <td>
              <button class="btn btn-outline-primary btn-sm driver-edit-btn" data-driver-id="${d.id}">Edit</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    async function loadDrivers() {
      try {
        const status = statusFilter ? statusFilter.value : '';
        const qs = status ? ('?status=' + encodeURIComponent(status)) : '';
        const res = await makeRequest('/drivers' + qs, { method: 'GET' });
        const drivers = res && res.data && res.data.drivers ? res.data.drivers : [];
        populateTable(drivers);
      } catch (e) {
        console.error('Error loading drivers', e);
        showAlert(e.message || 'Error loading drivers', 'danger');
        driversTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Error loading drivers</td></tr>';
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
        passField.value = passCell.textContent.trim() === '****' ? '' : passCell.textContent.trim();
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

    // Event bindings
    if (addDriverBtn) {
      addDriverBtn.addEventListener('click', startAddDriver);
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
      statusFilter.addEventListener('change', loadDrivers);
    }

    if (searchInput) {
      const debounce = function(fn, delay){ let t; return function(){ const args = arguments; clearTimeout(t); t = setTimeout(fn.bind(null, ...args), delay); }; };
      searchInput.addEventListener('input', debounce(loadDrivers, 300));
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function(){
        if (statusFilter) statusFilter.value = '';
        if (searchInput) searchInput.value = '';
        loadDrivers();
      });
    }

    if (driversTableBody) {
      driversTableBody.addEventListener('click', function(e){
        const btn = e.target.closest && e.target.closest('.driver-edit-btn');
        if (!btn) return;
        const id = btn.getAttribute('data-driver-id');
        if (id) startEditDriver(id);
      });
    }

    // Initial load
    loadDrivers();
  });
})();
