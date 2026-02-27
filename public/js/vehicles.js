// Vehicle Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let vehicles = [];
    let vehiclePage = 1;
    const VEHICLE_PAGE_SIZE = 5;
    let vehicleTotalPages = 1;
    let vehicleTotalCount = 0;

    // DOM Elements
    const registerVehicleBtn = document.getElementById('registerVehicleBtn');
    const recordMovementBtn = document.getElementById('recordMovementBtn');
    const vehicleTableBody = document.getElementById('vehiclesTableBody'); // Note: plural 'vehicles'

    const vehicleStats = {
        total: document.getElementById('totalVehicles'),
        active: document.getElementById('activeVehicles'),
        onSite: document.getElementById('onSiteVehicles'),
        offSite: document.getElementById('offSiteVehicles'),
        maintenance: document.getElementById('maintenanceVehicles'),
        inactive: document.getElementById('inactiveVehicles')
    };

    const vehiclePagination = document.getElementById('vehiclePagination');
    const vehiclePageInfo = document.getElementById('vehiclePageInfo');

    // Initialize when main app is ready or after timeout
    
    function checkAndInit() {
        if (window.siteAccessApp && window.siteAccessApp.user) {
            init();
        } else {
            init();
        }
    }
    
    // Wait for main app or timeout after 1 second
    setTimeout(checkAndInit, 1000);

    // Utility function for showing alerts
    function showAlert(message, type = 'info') {
        // Use main app's alert function if available
        if (window.siteAccessApp && window.siteAccessApp.showAlert) {
            window.siteAccessApp.showAlert(message, type);
            return;
        }
        
        // Fallback alert implementation
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            margin: 10px 0;
            padding: 15px;
            border: 1px solid transparent;
            border-radius: 4px;
            position: relative;
            z-index: 1000;
        `;
        alertDiv.textContent = message;
        
        // Apply color styles based on type
        const styles = {
            success: { background: '#d4edda', color: '#155724', border: '#c3e6cb' },
            danger: { background: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { background: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            info: { background: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };
        
        const style = styles[type] || styles.info;
        alertDiv.style.backgroundColor = style.background;
        alertDiv.style.color = style.color;
        alertDiv.style.borderColor = style.border;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // API helper function
    async function makeApiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const url = `/api${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const finalOptions = {
            method: 'GET',
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        // Only stringify the body if it's not already a string and it's a POST/PUT/PATCH request
        if (finalOptions.body && finalOptions.method !== 'GET' && typeof finalOptions.body !== 'string') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }

        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    function clearFormErrors(form){
        if (!form) return;
        form.querySelectorAll('.is-invalid').forEach(function(el){ el.classList.remove('is-invalid'); });
        form.querySelectorAll('.choices.is-invalid').forEach(function(el){ el.classList.remove('is-invalid'); });
        form.querySelectorAll('.invalid-feedback[data-generated="true"]').forEach(function(msg){ try{ msg.remove(); }catch(_){} });
    }

    function showFieldError(field, message){
        if (!field) return;
        const choicesWrapper = field.closest('.choices');
        const target = choicesWrapper || field;
        field.classList.add('is-invalid');
        if (choicesWrapper) choicesWrapper.classList.add('is-invalid');
        let feedback = null;
        const existingId = field.id ? field.id + '-error' : '';
        if (existingId) feedback = target.parentElement?.querySelector('#' + existingId);
        if (!feedback){
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.dataset.generated = 'true';
            if (existingId) feedback.id = existingId;
            if (target.nextSibling) {
                target.parentElement.insertBefore(feedback, target.nextSibling);
            } else {
                target.parentElement.appendChild(feedback);
            }
        }
        feedback.textContent = message;
        feedback.style.display = 'block';
    }

    function focusFirstError(form){
        const first = form.querySelector('.is-invalid');
        if (first){
            const choicesInput = first.classList.contains('choices') ? first.querySelector('input') : first.closest('.choices')?.querySelector('input');
            (choicesInput || first).focus({ preventScroll: false });
            try { (choicesInput || first).scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(_) {}
        }
    }

    function attachFieldClearHandlers(form){
        if (!form) return;
        const clearHandler = function(e){
            const el = e.target;
            if (!el) return;
            const choicesWrapper = el.closest('.choices');
            el.classList.remove('is-invalid');
            if (choicesWrapper) choicesWrapper.classList.remove('is-invalid');
            const fb = (choicesWrapper || el).parentElement?.querySelector('#' + (el.id || '') + '-error');
            if (fb) fb.style.display = 'none';
        };
        form.querySelectorAll('input, select, textarea').forEach(function(ctrl){
            ctrl.addEventListener('input', clearHandler);
            ctrl.addEventListener('change', clearHandler);
        });
    }

    async function init() {
        try {
            await loadCurrentUser();
            await loadVehicles();
            await loadVehicleStats();
            setupEventListeners();
            updateUIBasedOnRole();
        } catch (error) {
            console.error('Error initializing vehicles page:', error);
            showAlert('Error loading vehicle data', 'danger');
        }
    }

    async function loadCurrentUser() {
        try {
            
            // First, try to get user from global app if available
            if (window.siteAccessApp && window.siteAccessApp.user) {
                currentUser = window.siteAccessApp.user;
                return;
            }
            
            // Fallback to loading from API
            const response = await makeApiRequest('/auth/profile');
            if (response && response.data) {
                currentUser = response.data;
            } else {
                throw new Error('Failed to load user information');
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            throw new Error('Failed to load user information');
        }
    }

    async function loadVehicles(page) {
        try {
            // Build query from filters if present
            const status = document.getElementById('vehicleStatusFilter')?.value || '';
            const type = document.getElementById('vehicleTypeFilter')?.value || '';
            const search = document.getElementById('vehicleSearchInput')?.value || '';
            const targetPage = page || vehiclePage || 1;
            const params = new URLSearchParams({ page: String(targetPage), limit: String(VEHICLE_PAGE_SIZE) });
            if (status) params.append('status', status);
            if (type) params.append('type', type);
            if (search) params.append('search', search);
            const response = await makeApiRequest(`/vehicles?${params.toString()}`);
            if (response && response.data && response.data.vehicles) {
                vehicles = response.data.vehicles;
                const pagination = response.data.pagination || {};
                vehiclePage = pagination.page || targetPage;
                vehicleTotalPages = pagination.pages || 1;
                vehicleTotalCount = typeof pagination.total === 'number' ? pagination.total : vehicles.length;
                renderVehiclesTable();
                updateVehiclePageInfo(vehicles.length);
                renderVehiclePagination();
            } else {
                vehicles = [];
                renderVehiclesTable();
                updateVehiclePageInfo(0);
                renderVehiclePagination();
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            showAlert('Error loading vehicles', 'danger');
            vehicleTotalCount = 0;
            vehicleTotalPages = 1;
            updateVehiclePageInfo(0);
            renderVehiclePagination();
        }
    }

    async function loadVehicleStats() {
        try {
            const response = await makeApiRequest('/vehicles/stats');
            if (response && response.data) {
                updateStatsDisplay(response.data);
            } else {
            }
        } catch (error) {
            console.error('Error loading vehicle statistics:', error);
            showAlert('Error loading vehicle statistics', 'danger');
        }
    }

    function updateStatsDisplay(stats) {
        if (vehicleStats.total) vehicleStats.total.textContent = stats.totalVehicles || 0;
        if (vehicleStats.active) vehicleStats.active.textContent = stats.activeVehicles || 0;
        if (vehicleStats.onSite) vehicleStats.onSite.textContent = stats.vehiclesOnSite || 0;
        if (vehicleStats.offSite) vehicleStats.offSite.textContent = stats.vehiclesOffSite || 0;
        if (vehicleStats.maintenance) vehicleStats.maintenance.textContent = stats.maintenanceVehicles || 0;
        if (vehicleStats.inactive) vehicleStats.inactive.textContent = stats.inactiveVehicles || 0;
    }

    function renderVehiclesTable() {
        if (!vehicleTableBody) return;

        vehicleTableBody.innerHTML = '';
        
        vehicles.forEach(vehicle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="fw-medium">${vehicle.licensePlate}</div>
                    <small class="text-muted">${vehicle.make} ${vehicle.model}</small>
                </td>
                <td>${vehicle.type}</td>
                <td>
                    <span class="badge badge-${getStatusBadgeClass(vehicle.status)}">${vehicle.status}</span>
                </td>
                <td>${vehicle.department || '-'}</td>
                <!--<td>Destination handled per movement</td>-->
                <td>${vehicle.assignedDriver || '-'}</td>
                <td>${vehicle.currentMileage?.toLocaleString() || '0'} km</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm vehicle-action-btn" data-action="view" data-vehicle-id="${vehicle.id}" title="View Details">
                            👁️
                        </button>
                        ${currentUser?.role === 'admin' ? `
                            <button class="btn btn-outline-warning btn-sm vehicle-action-btn" data-action="edit" data-vehicle-id="${vehicle.id}" title="Edit">
                                ✏️
                            </button>
                            <button class="btn btn-outline-danger btn-sm vehicle-action-btn" data-action="delete" data-vehicle-id="${vehicle.id}" title="Delete">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            vehicleTableBody.appendChild(row);
        });
    }

    function updateVehiclePageInfo(countOnPage) {
        if (!vehiclePageInfo) return;
        if (!vehicleTotalCount) {
            vehiclePageInfo.textContent = 'Showing 0 of 0 vehicles';
            return;
        }
        const from = (vehiclePage - 1) * VEHICLE_PAGE_SIZE + 1;
        const to = Math.min(from + countOnPage - 1, vehicleTotalCount);
        vehiclePageInfo.textContent = `Showing ${from}-${to} of ${vehicleTotalCount} vehicles`;
    }

    function renderVehiclePagination() {
        if (!vehiclePagination) return;
        vehiclePagination.innerHTML = '';

        if (vehicleTotalPages <= 1) return;

        const addItem = (page, label, disabled, active) => {
            const li = document.createElement('li');
            li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-vehicle-page="${page}">${label}</a>`;
            vehiclePagination.appendChild(li);
        };

        addItem(vehiclePage - 1, 'Previous', vehiclePage === 1, false);

        const start = Math.max(1, vehiclePage - 2);
        const end = Math.min(vehicleTotalPages, vehiclePage + 2);
        for (let p = start; p <= end; p += 1) {
            addItem(p, p, false, p === vehiclePage);
        }

        addItem(vehiclePage + 1, 'Next', vehiclePage === vehicleTotalPages, false);
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'active': 'success',
            'inactive': 'secondary',
            'maintenance': 'warning',
            'retired': 'danger'
        };
        return classes[status] || 'secondary';
    }

    function setupEventListeners() {
                // Vehicle filters
                const statusFilter = document.getElementById('vehicleStatusFilter');
                const typeFilter = document.getElementById('vehicleTypeFilter');
                const searchInput = document.getElementById('vehicleSearchInput');
                const clearBtn = document.getElementById('clearVehicleFilters');

                if (statusFilter) {
                    statusFilter.addEventListener('change', () => { vehiclePage = 1; loadVehicles(1); });
                }
                if (typeFilter) {
                    typeFilter.addEventListener('change', () => { vehiclePage = 1; loadVehicles(1); });
                }
                if (searchInput) {
                    const debounce = (fn, delay) => {
                        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), delay); };
                    };
                    searchInput.addEventListener('input', debounce(() => { vehiclePage = 1; loadVehicles(1); }, 300));
                }
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        if (statusFilter) statusFilter.value = '';
                        if (typeFilter) typeFilter.value = '';
                        if (searchInput) searchInput.value = '';
                        vehiclePage = 1;
                        loadVehicles(1);
                    });
                }

                if (vehiclePagination) {
                    vehiclePagination.addEventListener('click', (e) => {
                        const link = e.target.closest('a[data-vehicle-page]');
                        if (!link) return;
                        e.preventDefault();
                        const target = parseInt(link.getAttribute('data-vehicle-page'), 10);
                        if (!target || target === vehiclePage || target < 1 || target > vehicleTotalPages) return;
                        vehiclePage = target;
                        loadVehicles(vehiclePage);
                    });
                }
        // Register Vehicle Button
        if (registerVehicleBtn) {
            registerVehicleBtn.addEventListener('click', showRegisterVehicleModal);
        }

        // Record Movement Button
        if (recordMovementBtn) {
            recordMovementBtn.addEventListener('click', showRecordMovementModal);
        }

        // Record External Movement Button
        const recordExternalMovementBtn = document.getElementById('recordExternalMovementBtn');
        if (recordExternalMovementBtn) {
            recordExternalMovementBtn.addEventListener('click', showExternalMovementModal);
        }

        // Vehicle Registration Form
        const vehicleForm = document.getElementById('vehicleRegistrationForm');
        if (vehicleForm) {
            vehicleForm.addEventListener('submit', handleVehicleSubmit);
        }

        // Movement Recording Form
        const movementForm = document.getElementById('movementRecordingForm');
        if (movementForm) {
            movementForm.addEventListener('submit', handleMovementSubmit);
            attachFieldClearHandlers(movementForm);
        }

        // External Movement Recording Form
        const externalMovementForm = document.getElementById('externalMovementForm');
        if (externalMovementForm) {
            externalMovementForm.addEventListener('submit', handleExternalMovementSubmit);
            attachFieldClearHandlers(externalMovementForm);
        }

        // Vehicle Edit Form
        const editVehicleForm = document.getElementById('vehicleEditForm');
        if (editVehicleForm) {
            editVehicleForm.addEventListener('submit', handleVehicleEdit);
        }

        // Modal close buttons - updated for custom modal system
        document.querySelectorAll('[data-modal-close]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-modal-close');
                closeModal(modalId);
            });
        });

        // Modal backdrop click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });

        // Edit Vehicle from Details button
        const editFromDetailsBtn = document.getElementById('editVehicleFromDetailsBtn');
        if (editFromDetailsBtn) {
            editFromDetailsBtn.addEventListener('click', editVehicleFromDetails);
        }

        // Vehicle action buttons (using event delegation)
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('vehicle-action-btn') || 
                e.target.closest('.vehicle-action-btn')) {
                
                const button = e.target.classList.contains('vehicle-action-btn') ? 
                              e.target : e.target.closest('.vehicle-action-btn');
                
                const action = button.getAttribute('data-action');
                const vehicleId = button.getAttribute('data-vehicle-id');
                
                if (vehicleId) {
                    switch (action) {
                        case 'view':
                            viewVehicle(vehicleId);
                            break;
                        case 'edit':
                            editVehicle(vehicleId);
                            break;
                        case 'delete':
                            deleteVehicle(vehicleId);
                            break;
                    }
                }
            }
        });
    }

    function updateUIBasedOnRole() {
        if (!currentUser) return;

        // Show/hide elements based on role
        const adminElements = document.querySelectorAll('[data-role="admin"]');
        adminElements.forEach(el => {
            if (currentUser.role === 'admin') {
                el.style.display = ''; // Show for admin
            } else {
                el.style.display = 'none'; // Hide for non-admin
            }
        });
    }

    function showRegisterVehicleModal() {
        const modal = document.getElementById('vehicleRegistrationModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function showRecordMovementModal() {
        // Populate vehicle dropdown with active vehicles only
        populateActiveVehiclesDropdown();

        // Populate drivers dropdown
        populateDriversDropdown();

        const modal = document.getElementById('movementRecordingModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            const form = document.getElementById('movementRecordingForm');
            clearFormErrors(form);
            enhanceMovementForm();
        }
    }

    function showExternalMovementModal() {
        const modal = document.getElementById('externalMovementModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            const form = document.getElementById('externalMovementForm');
            clearFormErrors(form);
            enhanceExternalMovementForm();
        }
    }

    async function populateActiveVehiclesDropdown() {
        try {
            const vehicleSelect = document.getElementById('movementVehicle');
            if (!vehicleSelect) return;
            // Prevent concurrent population causing duplicates
            if (vehicleSelect.dataset.populating === 'true') return;
            vehicleSelect.dataset.populating = 'true';

            vehicleSelect.innerHTML = '<option value="" disabled selected>Select Vehicle</option>';
            
            const response = await makeApiRequest('/vehicles/active');
            if (response && response.data) {
                const activeVehicles = Array.isArray(response.data) ? response.data : [];
                const seen = new Set();
                const frag = document.createDocumentFragment();
                activeVehicles.forEach(vehicle => {
                    if (!vehicle || !vehicle.id || seen.has(vehicle.id)) return;
                    seen.add(vehicle.id);
                    const option = document.createElement('option');
                    option.value = String(vehicle.id);
                    option.textContent = `${vehicle.licensePlate} - ${vehicle.make} ${vehicle.model}`;
                    frag.appendChild(option);
                });
                vehicleSelect.appendChild(frag);
                if (window.ChoicesHelper) {
                    window.ChoicesHelper.refresh(vehicleSelect);
                }
            }
        } catch (error) {
            console.error('Error loading active vehicles:', error);
            showAlert('Error loading vehicle list', 'danger');
        } finally {
            const vehicleSelect = document.getElementById('movementVehicle');
            if (vehicleSelect) delete vehicleSelect.dataset.populating;
        }
    }

    async function populateDriversDropdown() {
        try {
            const driverSelect = document.getElementById('movementDriver');
            if (!driverSelect) return;
            if (driverSelect.dataset.populating === 'true') return;
            driverSelect.dataset.populating = 'true';

            driverSelect.innerHTML = '<option value="" disabled selected>Select Driver</option>';

            const response = await makeApiRequest('/drivers?status=active');
            const drivers = response && response.data && Array.isArray(response.data.drivers)
                ? response.data.drivers
                : [];

            if (drivers.length) {
                const frag = document.createDocumentFragment();
                drivers.forEach(driver => {
                    if (!driver || !driver.id) return;
                    const option = document.createElement('option');
                    option.value = String(driver.id);
                    option.textContent = driver.name || 'Unnamed Driver';
                    frag.appendChild(option);
                });
                driverSelect.appendChild(frag);
                if (window.ChoicesHelper) {
                    window.ChoicesHelper.refresh(driverSelect);
                }
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
            showAlert('Error loading drivers list', 'danger');
        } finally {
            const driverSelect = document.getElementById('movementDriver');
            if (driverSelect) delete driverSelect.dataset.populating;
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    async function handleVehicleSubmit(event) {
        event.preventDefault();
        
    const formData = new FormData(event.target);
    const vehicleData = Object.fromEntries(formData.entries());

    // Destination is not part of vehicle registration anymore

        try {
            const response = await makeApiRequest('/vehicles', {
                method: 'POST',
                body: vehicleData
            });

            if (response) {
                showAlert(`Vehicle ${vehicleData.licensePlate} registered successfully!`, 'success');
                closeModal('vehicleRegistrationModal');
                event.target.reset();
                await loadVehicles();
                await loadVehicleStats();
            }
        } catch (error) {
            console.error('Error registering vehicle:', error);
            showAlert(error.message || 'Failed to register vehicle', 'danger');
        }
    }

    async function handleMovementSubmit(event) {
        event.preventDefault();
        const form = event.target;
        clearFormErrors(form);
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());

        let hasError = false;
        const vehicleEl = document.getElementById('movementVehicle');
        const typeEl = document.getElementById('movementType');
        const areaEl = document.getElementById('movementArea');
        const destEl = document.getElementById('movementDestination');
        const mileageEl = document.getElementById('movementMileage');
        const driverEl = document.getElementById('movementDriver');
        const passCodeEl = document.getElementById('movementDriverPassCode');

        if (!rawData.vehicleId) { showFieldError(vehicleEl, 'Vehicle is required'); hasError = true; }
        if (!rawData.movementType) { showFieldError(typeEl, 'Movement type is required'); hasError = true; }
        if (!rawData.area) { showFieldError(areaEl, 'Area/Location is required'); hasError = true; }
        if (!rawData.driverId) { showFieldError(driverEl, 'Driver is required'); hasError = true; }

        // Read the driver pass code directly from the input element so the
        // visible field can be decoupled from the API field name
        const passRaw = (passCodeEl && typeof passCodeEl.value === 'string'
            ? passCodeEl.value
            : (rawData.driverPassCode || '')
        ).toString().trim();
        if (!passRaw || passRaw.length !== 4 || !/^[0-9]{4}$/.test(passRaw)) {
            showFieldError(passCodeEl, '4-digit driver pass code is required');
            hasError = true;
        }
        if (rawData.movementType === 'exit' && (!rawData.destination || String(rawData.destination).trim() === '')) {
            showFieldError(destEl, 'Destination is required for exits'); hasError = true;
        }
        if (rawData.mileage === undefined || String(rawData.mileage).trim() === '') {
            showFieldError(mileageEl, 'Mileage is required'); hasError = true;
        }
        const mileageVal = parseFloat(rawData.mileage);
        if (!hasError && (Number.isNaN(mileageVal) || mileageVal < 0)) {
            showFieldError(mileageEl, 'Mileage must be a valid number ≥ 0'); hasError = true;
        }
        if (hasError){
            focusFirstError(form);
            return;
        }

        // Format the data properly for the API
        const movementData = {
            vehicleId: rawData.vehicleId,
            driverId: rawData.driverId,
            // Explicitly send the API field name expected by the backend
            driverPassCode: passRaw,
            area: rawData.area.trim(),
            movementType: rawData.movementType,
            mileage: mileageVal,
            // Use nullish coalescing so empty string is preserved and the key is present
            destination: rawData.destination ?? null,
            notes: rawData.notes?.trim() || undefined
        };

        try {
            const response = await makeApiRequest('/vehicle-movements', {
                method: 'POST',
                body: movementData
            });

            if (response) {
                showAlert('Vehicle movement recorded successfully!', 'success');
                // Redirect to movements list page with success flag so user can see the new record
                window.location.href = '/movements?created=1';
            }
        } catch (error) {
            console.error('Error recording movement:', error);
            showAlert(error.message || 'Failed to record vehicle movement', 'danger');
        }
    }

    async function handleExternalMovementSubmit(event) {
        event.preventDefault();
        const form = event.target;
        clearFormErrors(form);
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());

        let hasError = false;
        const plateEl = document.getElementById('externalVehiclePlate');
        const typeEl = document.getElementById('externalMovementType');
        const areaEl = document.getElementById('externalMovementArea');
        const driverEl = document.getElementById('externalDriverName');
        const notesEl = document.getElementById('externalNotes');

        if (!rawData.vehiclePlate || String(rawData.vehiclePlate).trim() === '') { showFieldError(plateEl, 'License plate is required'); hasError = true; }
        if (!rawData.movementType) { showFieldError(typeEl, 'Movement type is required'); hasError = true; }
        if (!rawData.area) { showFieldError(areaEl, 'Area/Location is required'); hasError = true; }
        if (!rawData.driverName || String(rawData.driverName).trim() === '') { showFieldError(driverEl, 'Driver name is required'); hasError = true; }
        if (hasError){
            focusFirstError(form);
            return;
        }

        const movementData = {
            vehiclePlate: String(rawData.vehiclePlate).trim(),
            area: String(rawData.area).trim(),
            movementType: rawData.movementType,
            driverName: String(rawData.driverName).trim(),
            notes: notesEl && String(notesEl.value || '').trim() ? String(notesEl.value).trim() : undefined
        };

        try {
            const response = await makeApiRequest('/external-vehicle-movements', {
                method: 'POST',
                body: movementData
            });

            if (response) {
                showAlert('External vehicle movement recorded successfully!', 'success');
                window.location.href = '/movements?created=1';
            }
        } catch (error) {
            console.error('Error recording external movement:', error);
            showAlert(error.message || 'Failed to record external vehicle movement', 'danger');
        }
    }

    // Enhance movement form with shared locations + toggling
    function enhanceMovementForm() {
        const typeEl = document.getElementById('movementType');
        const areaGroup = document.getElementById('movementAreaGroup');
        const destGroup = document.getElementById('movementDestinationGroup');
        const areaInput = document.getElementById('movementArea');
        const destSelect = document.getElementById('movementDestination');
        if (!typeEl || !areaGroup || !destGroup || !areaInput || !destSelect) return;

        // Capture original area options for dynamic filtering between Entry and Exit
        const originalAreaOptions = Array.from(areaInput.options || []).map(o => ({
            value: String(o.value),
            label: (o.textContent || '').trim(),
            selected: o.selected,
            disabled: o.disabled
        }));
        const placeholderArea = originalAreaOptions.find(o => o.value === '');
        const fullAreaOptions = originalAreaOptions.filter(o => o.value !== '');
        const allowedEntryAreas = new Set([
            'South Site',
            'Northsite',
            'Choice Meats',
            'Kasarani',
            'Uplands',
            'Kinangop',
            'Eldoret'
        ]);

        function setAreaOptions(list) {
            while (areaInput.firstChild) areaInput.removeChild(areaInput.firstChild);
            if (placeholderArea) {
                const ph = document.createElement('option');
                ph.value = '';
                ph.textContent = placeholderArea.label || 'Select Area/Location';
                ph.disabled = true;
                ph.selected = true;
                areaInput.appendChild(ph);
            }
            const frag = document.createDocumentFragment();
            list.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                frag.appendChild(o);
            });
            areaInput.appendChild(frag);
            areaInput.value = '';
            if (window.ChoicesHelper) window.ChoicesHelper.refresh(areaInput);
        }

        const lastAreaKey = 'last_movement_area';
        const toggleByType = () => {
            const t = typeEl.value;
            if (t === 'entry') {
                destGroup.style.display = 'none';
                destSelect.required = false;
                areaGroup.style.display = '';
                areaInput.required = true; // backend requires area
                // Restrict Area options to entry-allowed list
                setAreaOptions(fullAreaOptions.filter(o => allowedEntryAreas.has(o.label)));
                // Ensure Destination is blank for entries
                try { Array.from(destSelect.options || []).forEach(o => o.selected = false); } catch(_){ }
                destSelect.selectedIndex = -1;
                destSelect.value = '';
                if (window.ChoicesHelper) window.ChoicesHelper.refresh(destSelect);
                try { if (destSelect._choices) destSelect._choices.removeActiveItems(); } catch(_) {}
            } else if (t === 'exit') {
                destGroup.style.display = '';
                destSelect.required = true;
                areaGroup.style.display = '';
                areaInput.required = true; // keep required for server
                // Restore full Area options on exit
                setAreaOptions(fullAreaOptions);
            } else {
                // default
                destGroup.style.display = '';
                areaGroup.style.display = '';
                setAreaOptions(fullAreaOptions);
            }
        };

        // Prefill area on exit when empty
        destSelect.addEventListener('change', () => {
            const t = typeEl.value;
            if (t === 'exit' && areaInput && !areaInput.value.trim()) {
                const saved = localStorage.getItem(lastAreaKey);
                if (saved && hasOption(areaInput, saved)) {
                    areaInput.value = saved;
                    if (window.ChoicesHelper) window.ChoicesHelper.refresh(areaInput);
                }
            }
        });

        // Persist last area
        areaInput.addEventListener('change', () => {
            if (areaInput.value && areaInput.value.trim()) {
                localStorage.setItem(lastAreaKey, areaInput.value.trim());
            }
        });

        typeEl.addEventListener('change', toggleByType);
        // Initialize once
        toggleByType();

        function hasOption(selectEl, val){
            return Array.from(selectEl.options || []).some((o) => String(o.value) === String(val));
        }
    }

    function enhanceExternalMovementForm() {
        const typeEl = document.getElementById('externalMovementType');
        const areaGroup = document.getElementById('externalMovementAreaGroup');
        const areaInput = document.getElementById('externalMovementArea');
        const plateInput = document.getElementById('externalVehiclePlate');
        if (!typeEl || !areaGroup || !areaInput) return;

        const originalAreaOptions = Array.from(areaInput.options || []).map(o => ({
            value: String(o.value),
            label: (o.textContent || '').trim(),
            selected: o.selected,
            disabled: o.disabled
        }));
        const placeholderArea = originalAreaOptions.find(o => o.value === '');
        const fullAreaOptions = originalAreaOptions.filter(o => o.value !== '');
        const allowedEntryAreas = new Set([
            'South Site',
            'Northsite',
            'Choice Meats',
            'Kasarani',
            'Uplands',
            'Kinangop',
            'Eldoret'
        ]);

        function setAreaOptions(list) {
            while (areaInput.firstChild) areaInput.removeChild(areaInput.firstChild);
            if (placeholderArea) {
                const ph = document.createElement('option');
                ph.value = '';
                ph.textContent = placeholderArea.label || 'Select Area/Location';
                ph.disabled = true;
                ph.selected = true;
                areaInput.appendChild(ph);
            }
            const frag = document.createDocumentFragment();
            list.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                frag.appendChild(o);
            });
            areaInput.appendChild(frag);
            areaInput.value = '';
            if (window.ChoicesHelper) window.ChoicesHelper.refresh(areaInput);
        }

        const toggleByType = () => {
            const t = typeEl.value;
            areaGroup.style.display = '';
            areaInput.required = true;
            if (t === 'entry') {
                setAreaOptions(fullAreaOptions.filter(o => allowedEntryAreas.has(o.label)));
            } else {
                setAreaOptions(fullAreaOptions);
            }
        };

        typeEl.addEventListener('change', toggleByType);
        toggleByType();

        // Auto-format plate: uppercase, remove spaces
        if (plateInput) {
            const formatPlate = () => {
                const raw = String(plateInput.value || '');
                const formatted = raw.toUpperCase().replace(/\s+/g, '');
                if (plateInput.value !== formatted) {
                    plateInput.value = formatted;
                }
            };
            plateInput.addEventListener('input', formatPlate);
            plateInput.addEventListener('blur', formatPlate);
        }
    }

    // Global functions for table actions
    async function viewVehicle(vehicleId) {
        try {
            const response = await makeApiRequest(`/vehicles/${vehicleId}`);
            const vehicleData = response.data?.vehicle || response.vehicle || response.data || response;
            
            if (vehicleData && vehicleData.id) {
                populateDetailsModal(vehicleData);
                const modal = document.getElementById('vehicleDetailsModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                showToast('Vehicle data not found', 'error');
            }
        } catch (error) {
            console.error('Error viewing vehicle:', error);
            showToast('Error loading vehicle details', 'error');
        }
    };

    async function editVehicle(vehicleId) {
        try {
            const response = await makeApiRequest(`/vehicles/${vehicleId}`);
            const vehicleData = response.data?.vehicle || response.vehicle || response.data || response;
            
            if (vehicleData && vehicleData.id) {
                populateEditForm(vehicleData);
                const modal = document.getElementById('vehicleEditModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                showToast('Vehicle data not found', 'error');
            }
        } catch (error) {
            console.error('Error loading vehicle for edit:', error);
            showToast('Error loading vehicle details', 'error');
        }
    }

    async function deleteVehicle(vehicleId) {
        try {
            // First, get vehicle details for confirmation
            const response = await makeApiRequest(`/vehicles/${vehicleId}`);
            
            // Extract vehicle data from the nested response structure
            const vehicleData = response.data?.vehicle || response.vehicle || response.data || response;
            
            if (!vehicleData || !vehicleData.id) {
                showAlert('Vehicle not found', 'danger');
                return;
            }

            // Show a more detailed confirmation
            const confirmMessage = `Are you sure you want to delete this vehicle?\n\nLicense Plate: ${vehicleData.licensePlate}\nMake: ${vehicleData.make}\nModel: ${vehicleData.model}\n\nThis action cannot be undone.`;
            
            if (!confirm(confirmMessage)) return;

            const deleteResponse = await makeApiRequest(`/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });

            if (deleteResponse) {
                showAlert(`Vehicle ${vehicleData.licensePlate} deleted successfully`, 'success');
                await loadVehicles();
                await loadVehicleStats();
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showAlert(error.message || 'Failed to delete vehicle', 'danger');
        }
    }

    function populateEditForm(vehicle) {
        const form = document.getElementById('vehicleEditForm');
        if (!form) return;

        // Get all form elements
        const elements = {
            editVehicleId: document.getElementById('editVehicleId'),
            editLicensePlate: document.getElementById('editLicensePlate'),
            editMake: document.getElementById('editMake'),
            editModel: document.getElementById('editModel'),
            editYear: document.getElementById('editYear'),
            editColor: document.getElementById('editColor'),
            editVehicleType: document.getElementById('editVehicleType'),
            editDepartment: document.getElementById('editDepartment'),
            // editDestination removed: destination is per-movement
            editAssignedDriver: document.getElementById('editAssignedDriver'),
            editMileage: document.getElementById('editMileage'),
            editVehicleStatus: document.getElementById('editVehicleStatus')
        };

        form.dataset.vehicleId = vehicle.id;
        if (elements.editVehicleId) elements.editVehicleId.value = vehicle.id || '';
        if (elements.editLicensePlate) elements.editLicensePlate.value = vehicle.licensePlate || '';
        if (elements.editMake) elements.editMake.value = vehicle.make || '';
        if (elements.editModel) elements.editModel.value = vehicle.model || '';
        if (elements.editYear) elements.editYear.value = vehicle.year || '';
        if (elements.editColor) elements.editColor.value = vehicle.color || '';
        if (elements.editVehicleType) elements.editVehicleType.value = vehicle.type || '';
        if (elements.editDepartment) elements.editDepartment.value = vehicle.department || '';
    // Destination removed
        if (elements.editAssignedDriver) elements.editAssignedDriver.value = vehicle.assignedDriver || '';
        if (elements.editMileage) elements.editMileage.value = vehicle.currentMileage || vehicle.mileage || '';
        if (elements.editVehicleStatus) elements.editVehicleStatus.value = vehicle.status || '';
    }

    async function handleVehicleEdit(event) {
        event.preventDefault();
        
        const vehicleId = event.target.dataset.vehicleId;
        const formData = new FormData(event.target);
        const vehicleData = Object.fromEntries(formData.entries());

        try {
            const response = await makeApiRequest(`/vehicles/${vehicleId}`, {
                method: 'PUT',
                body: JSON.stringify(vehicleData)
            });

            if (response) {
                showAlert(`Vehicle ${vehicleData.licensePlate} updated successfully!`, 'success');
                closeModal('vehicleEditModal');
                await loadVehicles();
                await loadVehicleStats();
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            showAlert(error.message || 'Failed to update vehicle', 'danger');
        }
    }

    function populateDetailsModal(vehicle) {
        // Populate basic vehicle information
        const elements = {
            licensePlate: document.getElementById('detailLicensePlate'),
            make: document.getElementById('detailMake'),
            model: document.getElementById('detailModel'),
            year: document.getElementById('detailYear'),
            color: document.getElementById('detailColor'),
            type: document.getElementById('detailType'),
            department: document.getElementById('detailDepartment'),
            assignedDriver: document.getElementById('detailAssignedDriver'),
            mileage: document.getElementById('detailMileage'),
            status: document.getElementById('detailStatus'),
            createdAt: document.getElementById('detailCreatedAt'),
            updatedAt: document.getElementById('detailUpdatedAt')
        };
        
        // Populate basic vehicle information
        if (elements.licensePlate) elements.licensePlate.textContent = vehicle.licensePlate || '-';
        if (elements.make) elements.make.textContent = vehicle.make || '-';
        if (elements.model) elements.model.textContent = vehicle.model || '-';
        if (elements.year) elements.year.textContent = vehicle.year || '-';
        if (elements.color) elements.color.textContent = vehicle.color || '-';
        if (elements.type) elements.type.textContent = vehicle.type ? vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1) : '-';
        if (elements.department) elements.department.textContent = vehicle.department || 'Not assigned';
    // Destination is recorded per movement now; not shown here
        if (elements.assignedDriver) elements.assignedDriver.textContent = vehicle.assignedDriver || 'Not assigned';
        if (elements.mileage) elements.mileage.textContent = (vehicle.currentMileage ?? vehicle.mileage) ? `${vehicle.currentMileage ?? vehicle.mileage} km` : 'Not recorded';
        
        // Format and display status with badge
        if (elements.status) {
            if (vehicle.status) {
                const statusClass = `status-${vehicle.status}`;
                elements.status.innerHTML = `<span class="status-badge ${statusClass}">${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</span>`;
            } else {
                elements.status.textContent = 'Active';
            }
        }
        
        // Format dates
        if (elements.createdAt) {
            if (vehicle.createdAt) {
                elements.createdAt.textContent = new Date(vehicle.createdAt).toLocaleDateString();
            } else {
                elements.createdAt.textContent = '-';
            }
        }
        
        if (elements.updatedAt) {
            if (vehicle.updatedAt) {
                elements.updatedAt.textContent = new Date(vehicle.updatedAt).toLocaleDateString();
            } else {
                elements.updatedAt.textContent = '-';
            }
        }
        
        // Store vehicle ID for edit button
        window.currentViewingVehicleId = vehicle.id;
    }

    function editVehicleFromDetails() {
        if (window.currentViewingVehicleId) {
            closeModal('vehicleDetailsModal');
            editVehicle(window.currentViewingVehicleId);
        }
    }

    function showToast(message, type = 'info') {
        // Simple console-based toast implementation
        
        // Create a simple visual toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
});