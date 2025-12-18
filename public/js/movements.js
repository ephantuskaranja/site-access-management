// Vehicle Movements JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let vehicles = [];
    let movements = [];
    let currentPage = 1;
    let totalPages = 1;
    let filters = {};
    // Cache for active vehicles to avoid refetching on every modal open
    let activeVehiclesCache = { data: null, ts: 0 };

    // DOM Elements
    const recordMovementBtn = document.getElementById('recordMovementBtn');
    const movementsTableBody = document.getElementById('movementsTableBody');
    const movementsPagination = document.getElementById('movementsPagination');

    const movementStats = {
        total: document.getElementById('totalMovements'),
        entries: document.getElementById('entriesCount'),
        exits: document.getElementById('exitsCount'),
        onSite: document.getElementById('activeVehiclesOnSite')
    };

    // Initialize
    setTimeout(init, 500);

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
        form.querySelectorAll('.is-invalid').forEach(function(el){
            el.classList.remove('is-invalid');
        });
        // Also clear Choices wrappers
        form.querySelectorAll('.choices.is-invalid').forEach(function(el){
            el.classList.remove('is-invalid');
        });
        // Remove dynamically added feedback
        form.querySelectorAll('.invalid-feedback[data-generated="true"]').forEach(function(msg){
            try { msg.remove(); } catch(_) {}
        });
    }

    function showFieldError(field, message){
        if (!field) return;
        // Determine where to attach the error message (Choices wrapper or field itself)
        const choicesWrapper = field.closest('.choices');
        const target = choicesWrapper || field;
        // Mark invalid
        field.classList.add('is-invalid');
        if (choicesWrapper) choicesWrapper.classList.add('is-invalid');
        // Create or reuse feedback element
        let feedback = null;
        const existingId = field.id ? field.id + '-error' : '';
        if (existingId) feedback = target.parentElement?.querySelector('#' + existingId);
        if (!feedback){
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.dataset.generated = 'true';
            if (existingId) feedback.id = existingId;
            // Insert after the target element
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
            // Try focusing Choices input if present
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
            // Hide feedback if present
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
            await loadMovements();
            await loadMovementStats();
            setupEventListeners();
            updateUIBasedOnRole();
        } catch (error) {
            console.error('Error initializing movements page:', error);
            showToast('Error loading movement data', 'error');
        }
    }

    async function loadCurrentUser() {
        try {
            const response = await makeApiRequest('/auth/profile');
            if (response && response.data) {
                // Profile endpoint returns { data: { user: {...} } }
                currentUser = response.data.user || response.data; // fallback if shape changes
            } else {
                throw new Error('Failed to load user information');
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            throw new Error('Failed to load user information');
        }
    }

    async function loadVehicles() {
        try {
            const response = await makeApiRequest('/vehicles');
            if (response && response.data && response.data.vehicles) {
                vehicles = response.data.vehicles;
            } else {
                vehicles = [];
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            showToast('Error loading vehicles', 'error');
        }
    }

    async function loadMovements(page = 1) {
        try {
            
            // Build query string with filters
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            // Add filters if they exist (map UI keys to API keys)
            Object.entries(filters).forEach(([key, value]) => {
                if (!value) return;
                switch (key) {
                    case 'dateFrom':
                        queryParams.append('startDate', value);
                        break;
                    case 'dateTo':
                        queryParams.append('endDate', value);
                        break;
                    case 'vehicleSearch':
                        queryParams.append('search', value);
                        break;
                    default:
                        queryParams.append(key, value);
                }
            });

            const response = await makeApiRequest(`/vehicle-movements?${queryParams.toString()}`);
            
            if (response && response.data && response.data.movements) {
                movements = response.data.movements;
                currentPage = response.data.pagination?.currentPage || 1;
                totalPages = response.data.pagination?.totalPages || 1;
                renderMovementsTable();
                renderPagination();
                updateMovementCounts();
            } else {
                movements = [];
                renderMovementsTable();
            }
        } catch (error) {
            console.error('Error loading movements:', error);
            showToast('Error loading movements', 'error');
        }
    }

    async function loadMovementStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await makeApiRequest(`/vehicle-movements/stats?date=${today}`);
            
            if (response && response.data) {
                updateStatsDisplay(response.data);
            } else {
            }
        } catch (error) {
            console.error('Error loading movement statistics:', error);
            showToast('Error loading movement statistics', 'error');
        }
    }

    function updateStatsDisplay(stats) {
        if (movementStats.total) movementStats.total.textContent = stats.totalMovements || 0;
        if (movementStats.entries) movementStats.entries.textContent = stats.entriesCount || 0;
        if (movementStats.exits) movementStats.exits.textContent = stats.exitsCount || 0;
        if (movementStats.onSite) movementStats.onSite.textContent = stats.vehiclesOnSite || 0;
    }

    function renderMovementsTable() {
        if (!movementsTableBody) return;

        movementsTableBody.innerHTML = '';
        
        if (movements.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" class="text-center py-4 text-muted">
                    No movements found
                </td>
            `;
            movementsTableBody.appendChild(row);
            return;
        }
        
        movements.forEach(movement => {
            const row = document.createElement('tr');
            const recordedAt = new Date(movement.recordedAt);
            
            row.innerHTML = `
                <td>
                    <div class="fw-medium">${movement.vehicle?.licensePlate || 'N/A'} ${movement.source === 'external' ? '<span class="badge badge-secondary ms-1" title="External vehicle">External</span>' : ''}</div>
                    <small class="text-muted">${(movement.vehicle?.make || '')} ${(movement.vehicle?.model || '')}</small>
                </td>
                <td>
                    <span class="badge badge-${movement.movementType === 'entry' ? 'success' : 'warning'}">
                        ${movement.movementType === 'entry' ? '🟢 Entry' : '🟡 Exit'}
                    </span>
                </td>
                <td>${movement.area}</td>
                <td>${movement.destination || '-'}</td>
                <td>${movement.driverName || '-'}</td>
                <td>${movement.mileage?.toLocaleString() || '0'} km</td>
                <td>
                    <div>${recordedAt.toLocaleDateString()}</div>
                    <small class="text-muted">${recordedAt.toLocaleTimeString()}</small>
                </td>
                <td>
                    <small class="text-muted">${movement.recordedBy?.username || 'System'}</small>
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="viewMovementDetail('${movement.id}')" title="View Details">
                        👁️
                    </button>
                </td>
            `;
            movementsTableBody.appendChild(row);
        });
    }

    function renderPagination() {
        if (!movementsPagination) return;

        movementsPagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
        movementsPagination.appendChild(prevLi);

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let page = startPage; page <= endPage; page++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${page === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page})">${page}</a>`;
            movementsPagination.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
        movementsPagination.appendChild(nextLi);
    }

    function updateMovementCounts() {
        const showingFrom = document.getElementById('showingFrom');
        const showingTo = document.getElementById('showingTo');
        const totalCount = document.getElementById('totalCount');

        if (showingFrom && showingTo && totalCount) {
            const itemsPerPage = 20;
            const from = (currentPage - 1) * itemsPerPage + 1;
            const to = Math.min(currentPage * itemsPerPage, movements.length);
            
            showingFrom.textContent = from;
            showingTo.textContent = to;
            totalCount.textContent = movements.length;
        }
    }

    function setupEventListeners() {
        // Movement Recording Form
        const movementForm = document.getElementById('movementRecordingForm');
        if (movementForm) {
            movementForm.addEventListener('submit', handleMovementSubmit);
            attachFieldClearHandlers(movementForm);
        }

        // External Movement Recording Form
        const externalForm = document.getElementById('externalMovementForm');
        if (externalForm) {
            externalForm.addEventListener('submit', handleExternalMovementSubmit);
            attachFieldClearHandlers(externalForm);
        }

        // Populate vehicle dropdown when modal is shown
        const movementRecordingModal = document.getElementById('movementRecordingModal');
        if (movementRecordingModal) {
            // Clear errors immediately on show
            movementRecordingModal.addEventListener('show.bs.modal', function(){
                const form = document.getElementById('movementRecordingForm');
                clearFormErrors(form);
            });
            // Do heavier work after the modal is shown to the user
            movementRecordingModal.addEventListener('shown.bs.modal', populateActiveVehiclesDropdown);
            movementRecordingModal.addEventListener('shown.bs.modal', enhanceMovementForm);
        }

        // Enhance external modal fields when shown
        const externalModal = document.getElementById('externalMovementModal');
        if (externalModal) {
            externalModal.addEventListener('show.bs.modal', function(){
                const form = document.getElementById('externalMovementForm');
                clearFormErrors(form);
            });
            externalModal.addEventListener('shown.bs.modal', enhanceExternalMovementForm);
        }

        // Filter listeners
        setupFilterListeners();
    }

    // Enhance movement form: shared locations + toggling + prefill
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
            // Preserve placeholder; rebuild options from provided list
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
                areaInput.required = true; // server expects area
                // Restrict Area options to entry-allowed list
                setAreaOptions(fullAreaOptions.filter(o => allowedEntryAreas.has(o.label)));
                // Ensure Destination is blank for entries
                try { Array.from(destSelect.options || []).forEach(o => o.selected = false); } catch(_){ }
                destSelect.selectedIndex = -1;
                destSelect.value = '';
                if (window.ChoicesHelper) window.ChoicesHelper.refresh(destSelect);
                // Clear any active selection in Choices to show placeholder
                try { if (destSelect._choices) destSelect._choices.removeActiveItems(); } catch(_) {}
            } else if (t === 'exit') {
                destGroup.style.display = '';
                destSelect.required = true;
                areaGroup.style.display = '';
                areaInput.required = true;
                // Restore full Area options on exit
                setAreaOptions(fullAreaOptions);
            } else {
                destGroup.style.display = '';
                areaGroup.style.display = '';
                // Default to full Area options
                setAreaOptions(fullAreaOptions);
            }
        };

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

        areaInput.addEventListener('change', () => {
            if (areaInput.value && areaInput.value.trim()) {
                localStorage.setItem(lastAreaKey, areaInput.value.trim());
            }
        });

        typeEl.addEventListener('change', toggleByType);
        toggleByType();

        function hasOption(selectEl, val){
            return Array.from(selectEl.options || []).some((o) => String(o.value) === String(val));
        }
    }

    function setupFilterListeners() {
        const filterElements = [
            'movementTypeFilter',
            'dateFromFilter', 
            'dateToFilter',
            'vehicleSearchFilter',
            'areaFilter'
        ];

        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', applyFilters);
                element.addEventListener('input', debounce(applyFilters, 500));
            }
        });

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }
    }

    // External movement form enhancements (allowed entry areas, no destination field)
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

    async function handleExternalMovementSubmit(event) {
        event.preventDefault();
        const form = event.target;
        clearFormErrors(form);

        const plateEl = document.getElementById('externalVehiclePlate');
        const typeEl = document.getElementById('externalMovementType');
        const areaEl = document.getElementById('externalMovementArea');
        const driverEl = document.getElementById('externalDriverName');

        let hasError = false;
        if (!plateEl || !plateEl.value.trim()) { showFieldError(plateEl, 'License plate is required'); hasError = true; }
        if (!typeEl || !typeEl.value) { showFieldError(typeEl, 'Movement type is required'); hasError = true; }
        if (!areaEl || !areaEl.value) { showFieldError(areaEl, 'Area/Location is required'); hasError = true; }
        if (!driverEl || !driverEl.value.trim()) { showFieldError(driverEl, 'Driver name is required'); hasError = true; }
        if (hasError) { focusFirstError(form); return; }

        const payload = {
            vehiclePlate: String(plateEl.value || '').toUpperCase().replace(/\s+/g, ''),
            movementType: typeEl.value,
            area: areaEl.value,
            driverName: driverEl.value.trim()
        };

        try {
            const res = await makeApiRequest('/external-vehicle-movements', {
                method: 'POST',
                body: payload
            });
            if (res && res.success) {
                showToast('External vehicle movement recorded', 'success');
                // Redirect to show merged list
                window.location.href = '/movements?created=1';
            } else {
                showToast('Failed to record external movement', 'error');
            }
        } catch (err) {
            console.error('External movement create failed:', err);
            showToast('Error recording external movement', 'error');
        }
    }

    function applyFilters() {
        filters = {};
        
        const movementType = document.getElementById('movementTypeFilter')?.value;
        const dateFrom = document.getElementById('dateFromFilter')?.value;
        const dateTo = document.getElementById('dateToFilter')?.value;
        const vehicleSearch = document.getElementById('vehicleSearchFilter')?.value;
        const area = document.getElementById('areaFilter')?.value;

        if (movementType) filters.movementType = movementType;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        if (vehicleSearch) filters.vehicleSearch = vehicleSearch;
        if (area) filters.area = area;

        loadMovements(1); // Reset to first page when filtering
    }

    function clearFilters() {
        document.getElementById('movementTypeFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        document.getElementById('vehicleSearchFilter').value = '';
        document.getElementById('areaFilter').value = '';
        
        filters = {};
        loadMovements(1);
    }

    function updateUIBasedOnRole() {
        if (!currentUser) return;


        // Show/hide elements based on role
        const recordBtn = document.getElementById('recordMovementBtn');
        if (recordBtn) {
            if (currentUser.role === 'admin' || currentUser.role === 'security_guard') {
                recordBtn.style.display = 'inline-block';
            } else {
                recordBtn.style.display = 'none';
            }
        }

        // If redirected after a successful create with a query flag, show banner
        const params = new URLSearchParams(window.location.search);
        const successFlag = params.get('created');
        const successBanner = document.getElementById('movementSuccessBanner');
        if (successFlag === '1' && successBanner) {
            successBanner.classList.remove('d-none');

            // Auto-hide the banner after a few seconds
            setTimeout(() => {
                successBanner.classList.add('d-none');
            }, 4000);
        }
    }

    async function populateActiveVehiclesDropdown() {
        try {
            const vehicleSelect = document.getElementById('movementVehicle');
            if (!vehicleSelect) return;
            // Prevent concurrent population causing duplicates
            if (vehicleSelect.dataset.populating === 'true') return;
            vehicleSelect.dataset.populating = 'true';
            
            // Use cached list if available and recent (within 60s)
            const now = Date.now();
            let activeVehicles = null;
            if (activeVehiclesCache.data && (now - activeVehiclesCache.ts) < 60000) {
                activeVehicles = activeVehiclesCache.data;
            } else {
                const response = await makeApiRequest('/vehicles/active');
                if (response && response.data) {
                    activeVehicles = Array.isArray(response.data) ? response.data : [];
                    activeVehiclesCache = { data: activeVehicles, ts: now };
                } else {
                    activeVehicles = [];
                }
            }

            // Rebuild options only if list differs or empty
            vehicleSelect.innerHTML = '<option value="" disabled selected>Select Vehicle</option>';
            if (activeVehicles && activeVehicles.length) {
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

        // Validate required fields individually and show inline errors
        if (!rawData.vehicleId) { showFieldError(vehicleEl, 'Vehicle is required'); hasError = true; }
        if (!rawData.movementType) { showFieldError(typeEl, 'Movement type is required'); hasError = true; }
        if (!rawData.area) { showFieldError(areaEl, 'Area/Location is required'); hasError = true; }

        // Destination required on exit
        if (rawData.movementType === 'exit' && (!rawData.destination || String(rawData.destination).trim() === '')) {
            showFieldError(destEl, 'Destination is required for exits');
            hasError = true;
        }

        // Mileage checks
        if (rawData.mileage === undefined || String(rawData.mileage).trim() === '') {
            showFieldError(mileageEl, 'Mileage is required');
            hasError = true;
        }
        const mileageVal = parseFloat(rawData.mileage);
        if (!hasError && (Number.isNaN(mileageVal) || mileageVal < 0)) {
            showFieldError(mileageEl, 'Mileage must be a valid number ≥ 0');
            hasError = true;
        }

        if (hasError) {
            focusFirstError(form);
            return;
        }

        // Format the data properly for the API
        const movementData = {
            vehicleId: rawData.vehicleId,
            area: rawData.area.trim(),
            movementType: rawData.movementType,
            mileage: mileageVal,
            driverName: rawData.driverName?.trim() || 'Unknown Driver',
            // Keep the key present even if empty; server will receive null when not selected
            destination: rawData.destination ?? null,
            notes: rawData.notes?.trim() || undefined
        };

        try {
            const response = await makeApiRequest('/vehicle-movements', {
                method: 'POST',
                body: movementData
            });

            if (response) {
                showToast('Vehicle movement recorded successfully', 'success');
                // Redirect to movements list page with success flag so user can see the new record
                window.location.href = '/movements?created=1';
            }
        } catch (error) {
            console.error('Error recording movement:', error);
            showToast(error.message || 'Error recording movement', 'error');
        }
    }

    // Global functions
    window.changePage = function(page) {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            loadMovements(page);
        }
    };

    window.viewMovementDetail = async function(movementId) {
        try {
            const res = await makeApiRequest(`/vehicle-movements/${movementId}`);
            const movement = res?.data?.movement || res?.data || res;
            if (movement && (movement.id || movement.recordedAt)) {
                showMovementDetailModal(movement);
            } else {
                showToast('Movement not found', 'error');
            }
        } catch (error) {
            console.error('Error loading movement details:', error);
            showToast('Error loading movement details', 'error');
        }
    };

    function showMovementDetailModal(movement) {
        const modal = document.getElementById('movementDetailModal');
        const content = document.getElementById('movementDetailContent');
        
        if (modal && content) {
            const recordedAt = movement && movement.recordedAt ? new Date(movement.recordedAt) : null;
            
            content.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <strong>Vehicle:</strong><br>
                        ${movement.vehicle?.licensePlate || 'N/A'}${movement.vehicle ? ` - ${movement.vehicle.make || ''} ${movement.vehicle.model || ''}` : ''}
                    </div>
                    <div class="col-md-6">
                        <strong>Movement Type:</strong><br>
                        <span class="badge badge-${movement.movementType === 'entry' ? 'success' : 'warning'}">
                            ${movement.movementType === 'entry' ? '🟢 Entry' : '🟡 Exit'}
                        </span>
                    </div>
                    <div class="col-md-6">
                        <strong>Area/Location:</strong><br>
                        ${movement.area || 'N/A'}
                    </div>
                    <div class="col-md-6">
                        <strong>Destination:</strong><br>
                        ${movement.destination || 'Not specified'}
                    </div>
                    <div class="col-md-6">
                        <strong>Driver:</strong><br>
                        ${movement.driverName || 'Not specified'}
                    </div>
                    <div class="col-md-6">
                        <strong>Mileage:</strong><br>
                        ${movement.mileage?.toLocaleString() || '0'} km
                    </div>
                    <div class="col-md-6">
                        <strong>Recorded:</strong><br>
                        ${recordedAt ? recordedAt.toLocaleDateString() + ' ' + recordedAt.toLocaleTimeString() : '-'}
                    </div>
                    <div class="col-md-6">
                        <strong>Recorded By:</strong><br>
                        ${movement.recordedBy?.username || 'System'}
                    </div>
                    ${movement.notes ? `
                        <div class="col-12">
                            <strong>Notes:</strong><br>
                            ${movement.notes}
                        </div>
                    ` : ''}
                </div>
            `;
            
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showToast(message, type = 'info') {
        
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
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
});