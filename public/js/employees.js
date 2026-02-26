// Employee Management JavaScript
// Handles listing, creating, editing, and bulk uploading employees

(function(){
  document.addEventListener('DOMContentLoaded', async function(){
    const apiBase = '/api';
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');

    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const uploadEmployeesBtn = document.getElementById('uploadEmployeesBtn');
    const employeeModal = document.getElementById('employeeModal');
    const employeeModalTitle = document.getElementById('employeeModalTitle');
    const employeeForm = document.getElementById('employeeForm');
    const employeesTableBody = document.getElementById('employeesTableBody');
    const paginationEl = document.getElementById('employeesPagination');
    const statusFilter = document.getElementById('employeeStatusFilter');
    const searchInput = document.getElementById('employeeSearchInput');
    const departmentFilter = document.getElementById('employeeDepartmentFilter');
    const clearFiltersBtn = document.getElementById('clearEmployeeFilters');
    const employeeAlert = document.getElementById('employeeAlert');
    const uploadModal = document.getElementById('employeeUploadModal');
    const uploadForm = document.getElementById('employeeUploadForm');
    const uploadInput = document.getElementById('employeeUploadInput');

    if (!employeesTableBody) return; // Not on employees page

    async function ensureAdminAccess() {
      return new Promise(resolve => {
        const check = (tries) => {
          const role = (window.siteAccessApp && window.siteAccessApp.user && window.siteAccessApp.user.role) || null;
          if (role) {
            if (role !== 'admin') {
              window.location.href = '/dashboard';
              resolve(false);
              return;
            }
            resolve(true);
            return;
          }
          if (tries >= 50) { // ~5s
            resolve(true); // fail open to avoid blocking admins if profile fails
            return;
          }
          setTimeout(() => check(tries + 1), 100);
        };
        check(0);
      });
    }

    const allowed = await ensureAdminAccess();
    if (!allowed) return;

    let employees = [];
    let currentPage = 1;
    const pageSize = 5;
    const uploadErrorBox = document.getElementById('employeeUploadError');

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderInlineAlert(message, type) {
      if (!employeeAlert) return false;
      employeeAlert.textContent = message;
      employeeAlert.classList.remove('d-none', 'alert-info', 'alert-success', 'alert-warning', 'alert-danger');
      const cls = type === 'danger' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : type === 'success' ? 'alert-success' : 'alert-info';
      employeeAlert.classList.add('alert', cls);
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
          // Likely expired/invalid session: force re-auth
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

    function openModal(modal) {
      if (!modal) return;
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.style.overflow = '';
      const form = modal.querySelector('form');
      if (form) form.reset();
      const hiddenId = modal.querySelector('input[type="hidden"]');
      if (hiddenId) hiddenId.value = '';
      if (uploadErrorBox && modal.contains(uploadErrorBox)) {
        uploadErrorBox.classList.add('d-none');
        uploadErrorBox.innerHTML = '';
      }
    }

    function fmtDate(dt) {
      if (!dt) return '-';
      const date = new Date(dt);
      return date.toLocaleString();
    }

    function renderPagination(totalItems) {
      if (!paginationEl) return;

      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      let html = '';

      const addPage = (page, label, disabled, active) => {
        const cls = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        html += `<li class="${cls}"><a class="page-link" href="#" data-page="${page}">${label}</a></li>`;
      };

      addPage(currentPage - 1, 'Previous', currentPage === 1, false);

      const windowSize = 2;
      const start = Math.max(1, currentPage - windowSize);
      const end = Math.min(totalPages, currentPage + windowSize);
      for (let i = start; i <= end; i++) {
        addPage(i, i, false, i === currentPage);
      }

      addPage(currentPage + 1, 'Next', currentPage === totalPages, false);

      paginationEl.innerHTML = html;
    }

    function populateTable() {
      if (!employeesTableBody) return;
      if (!employees.length) {
        employeesTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-3 text-muted">No employees found</td></tr>';
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      const search = (searchInput && searchInput.value || '').toLowerCase().trim();
      const status = (statusFilter && statusFilter.value || '').toLowerCase();
      const dept = (departmentFilter && departmentFilter.value || '').toLowerCase().trim();

      const filtered = employees.filter(emp => {
        const matchesSearch = !search || [emp.firstName, emp.lastName, emp.email, emp.employeeId].some(v => (v || '').toLowerCase().includes(search));
        const matchesStatus = !status || (status === 'active' ? emp.isActive : !emp.isActive);
        const matchesDept = !dept || (emp.department || '').toLowerCase().includes(dept);
        return matchesSearch && matchesStatus && matchesDept;
      });

      if (!filtered.length) {
        employeesTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-3 text-muted">No matching employees</td></tr>';
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      renderPagination(filtered.length);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const startIdx = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIdx, startIdx + pageSize);

      employeesTableBody.innerHTML = pageItems.map(emp => {
        const statusBadge = emp.isActive ? 'success' : 'secondary';
        return `
          <tr data-employee-id="${emp.id || ''}">
            <td>${emp.employeeId || '-'}</td>
            <td>${emp.firstName || ''} ${emp.lastName || ''}</td>
            <td>${emp.email || '-'}</td>
            <td>${emp.phone || '-'}</td>
            <td>${emp.department || '-'}</td>
            <td>${emp.position || '-'}</td>
            <td><span class="badge badge-${statusBadge}">${emp.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${fmtDate(emp.createdAt)}</td>
            <td class="text-nowrap">
              <button class="btn btn-outline-primary btn-sm employee-edit-btn" data-role="admin" data-employee-id="${emp.id}">Edit</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    async function loadEmployees() {
      try {
        const res = await makeRequest('/employees?includeInactive=true', { method: 'GET' });
        employees = res && res.data && res.data.employees ? res.data.employees : [];
        populateTable();
      } catch (e) {
        console.error('Error loading employees', e);
        showAlert(e.message || 'Error loading employees', 'danger');
        employeesTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-3 text-muted">Error loading employees</td></tr>';
      }
    }

    function startAddEmployee() {
      if (!employeeForm) return;
      employeeForm.reset();
      const idField = document.getElementById('employeeId');
      if (idField) idField.value = '';
      const activeField = document.getElementById('empIsActive');
      if (activeField) activeField.checked = true;
      if (employeeModalTitle) employeeModalTitle.textContent = 'Add Employee';
      openModal(employeeModal);
    }

    function startEditEmployee(id) {
      const row = employeesTableBody.querySelector('tr[data-employee-id="' + id + '"]');
      if (!row || !employeeForm) return;

      const emp = employees.find(e => e.id === id);
      if (!emp) return;

      const idField = document.getElementById('employeeId');
      const emailField = document.getElementById('empEmail');
      const firstNameField = document.getElementById('empFirstName');
      const lastNameField = document.getElementById('empLastName');
      const phoneField = document.getElementById('empPhone');
      const departmentField = document.getElementById('empDepartment');
      const positionField = document.getElementById('empPosition');
      const activeField = document.getElementById('empIsActive');

      if (idField) idField.value = emp.id || '';
      if (emailField) emailField.value = emp.email || '';
      if (firstNameField) firstNameField.value = emp.firstName || '';
      if (lastNameField) lastNameField.value = emp.lastName || '';
      if (phoneField) phoneField.value = emp.phone || '';
      if (departmentField) departmentField.value = emp.department || '';
      if (positionField) positionField.value = emp.position || '';
      if (activeField) activeField.checked = !!emp.isActive;

      if (employeeModalTitle) employeeModalTitle.textContent = 'Edit Employee';
      openModal(employeeModal);
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!employeeForm) return;

      const idField = document.getElementById('employeeId');
      const emailField = document.getElementById('empEmail');
      const firstNameField = document.getElementById('empFirstName');
      const lastNameField = document.getElementById('empLastName');
      const phoneField = document.getElementById('empPhone');
      const departmentField = document.getElementById('empDepartment');
      const positionField = document.getElementById('empPosition');
      const activeField = document.getElementById('empIsActive');

      const payload = {
        email: (emailField && emailField.value || '').trim(),
        firstName: (firstNameField && firstNameField.value || '').trim(),
        lastName: (lastNameField && lastNameField.value || '').trim(),
        phone: (phoneField && phoneField.value || '').trim(),
        department: (departmentField && departmentField.value || '').trim(),
        position: (positionField && positionField.value || '').trim(),
        isActive: activeField ? !!activeField.checked : true,
      };

      if (!payload.firstName || !payload.lastName || !payload.email || !payload.department) {
        showAlert('First name, last name, email, and department are required', 'danger');
        return;
      }

      const id = idField && idField.value ? idField.value : null;
      const method = id ? 'PUT' : 'POST';
      const path = id ? ('/employees/' + encodeURIComponent(id)) : '/employees';

      try {
        await makeRequest(path, {
          method,
          body: JSON.stringify(payload)
        });
        showAlert('Employee saved successfully', 'success');
        closeModal(employeeModal);
        await loadEmployees();
      } catch (err) {
        console.error('Error saving employee', err);
        showAlert(err.message || 'Error saving employee', 'danger');
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
        uploadErrorBox.innerHTML = '';
      }

      const file = uploadInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await makeRequest('/employees/bulk-upload', {
          method: 'POST',
          body: formData,
        });
        // Duplicate-only handled in makeRequest: it returns { duplicateOnly: true }
        const duplicateOnly = res && res.duplicateOnly;
        const imported = res && res.data ? (res.data.imported || 0) : 0;
        const updated = res && res.data ? (res.data.updated || 0) : 0;
        const skipped = res && res.data ? (res.data.skipped || 0) : 0;
        const errors = res && res.data ? res.data.errors : [];
        const messages = res && res.data ? res.data.messages : [];

        const summary = res && res.message
          ? res.message
          : `Imported ${imported} employee${imported === 1 ? '' : 's'}, updated ${updated}${skipped ? `, skipped ${skipped}` : ''}`;

        showAlert(summary, duplicateOnly ? 'success' : 'success');
        if (messages && messages.length) {
          console.info('Upload info:', messages);
        }
        if (errors && errors.length) {
          console.warn('Upload warnings:', errors);
        }
        closeModal(uploadModal);
        if (uploadInput) uploadInput.value = '';
        await loadEmployees();
        return;
      } catch (err) {
        if (!(err && err.status === 400 && err.message && err.message.toLowerCase().includes('duplicates'))) {
          console.error('Error uploading employees', err);
        }
        const details = Array.isArray(err && err.details) ? err.details : null;
        if (uploadErrorBox) {
          let html = escapeHtml(err.message || 'Error uploading employees');
          if (details && details.length) {
            html += '<ul class="mb-0 mt-2">';
            details.slice(0, 10).forEach((d) => {
              html += '<li>' + escapeHtml(d) + '</li>';
            });
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
          // Still close modal and refresh list to reflect any updates
          closeModal(uploadModal);
          if (uploadInput) uploadInput.value = '';
          await loadEmployees();
          return;
        }

        showAlert(err.message || 'Error uploading employees', 'danger');
      }
    }

    // Event bindings
    if (addEmployeeBtn) {
      addEmployeeBtn.addEventListener('click', startAddEmployee);
    }

    if (uploadEmployeesBtn) {
      uploadEmployeesBtn.addEventListener('click', function(){ openModal(uploadModal); });
    }

    if (employeeForm) {
      employeeForm.addEventListener('submit', handleSubmit);
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', handleUpload);
    }

    document.querySelectorAll('[data-modal-close="employeeModal"]').forEach(btn => {
      btn.addEventListener('click', function(){ closeModal(employeeModal); });
    });

    document.querySelectorAll('[data-modal-close="employeeUploadModal"]').forEach(btn => {
      btn.addEventListener('click', function(){ closeModal(uploadModal); });
    });

    [employeeModal, uploadModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', function(ev){
          if (ev.target === modal) closeModal(modal);
        });
      }
    });

    if (statusFilter) {
      statusFilter.addEventListener('change', populateTable);
    }

    if (departmentFilter) {
      const handler = () => populateTable();
      departmentFilter.addEventListener('change', handler);
      departmentFilter.addEventListener('input', handler);
    }

    if (searchInput) {
      const debounce = function(fn, delay){ let t; return function(){ const args = arguments; clearTimeout(t); t = setTimeout(fn.bind(null, ...args), delay); }; };
      searchInput.addEventListener('input', debounce(populateTable, 300));
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function(){
        if (statusFilter) statusFilter.value = '';
        if (searchInput) searchInput.value = '';
        if (departmentFilter) departmentFilter.value = '';
        populateTable();
      });
    }

    if (employeesTableBody) {
      employeesTableBody.addEventListener('click', function(e){
        const editBtn = e.target.closest && e.target.closest('.employee-edit-btn');
        if (editBtn) {
          const id = editBtn.getAttribute('data-employee-id');
          if (id) startEditEmployee(id);
        }
      });
    }

    if (paginationEl) {
      paginationEl.addEventListener('click', function(e){
        const link = e.target.closest && e.target.closest('a[data-page]');
        if (!link) return;
        e.preventDefault();
        const page = parseInt(link.getAttribute('data-page'), 10);
        if (isNaN(page)) return;
        currentPage = Math.max(1, page);
        populateTable();
      });
    }

    // Initial load
    loadEmployees();
  });
})();
