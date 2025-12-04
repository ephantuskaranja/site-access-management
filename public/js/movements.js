// Vehicle Movements JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let vehicles = [];
    let movements = [];
    let currentPage = 1;
    let totalPages = 1;
    let filters = {};

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

            // Add filters if they exist
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
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
                    <div class="fw-medium">${movement.vehicle?.licensePlate || 'N/A'}</div>
                    <small class="text-muted">${movement.vehicle?.make} ${movement.vehicle?.model}</small>
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
        }

        // Populate vehicle dropdown when modal is shown
        const movementRecordingModal = document.getElementById('movementRecordingModal');
        if (movementRecordingModal) {
            movementRecordingModal.addEventListener('show.bs.modal', populateActiveVehiclesDropdown);
        }

        // Filter listeners
        setupFilterListeners();
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

            vehicleSelect.innerHTML = '<option value="">Select Vehicle...</option>';
            
            const response = await makeApiRequest('/vehicles/active');
            if (response && response.data) {
                const activeVehicles = Array.isArray(response.data) ? response.data : [];
                activeVehicles.forEach(vehicle => {
                    const option = document.createElement('option');
                    option.value = vehicle.id;
                    option.textContent = `${vehicle.licensePlate} - ${vehicle.make} ${vehicle.model}`;
                    vehicleSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading active vehicles:', error);
            showAlert('Error loading vehicle list', 'danger');
        }
    }

    async function handleMovementSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const rawData = Object.fromEntries(formData.entries());

        // Validate required fields
        if (!rawData.vehicleId || !rawData.movementType || !rawData.area) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Format the data properly for the API
        const movementData = {
            vehicleId: rawData.vehicleId,
            area: rawData.area.trim(),
            movementType: rawData.movementType,
            mileage: rawData.mileage ? parseFloat(rawData.mileage) : 0,
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
            const movement = await makeApiRequest(`/vehicle-movements/${movementId}`);
            if (movement && movement.data) {
                showMovementDetailModal(movement.data);
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
            const recordedAt = new Date(movement.recordedAt);
            
            content.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <strong>Vehicle:</strong><br>
                        ${movement.vehicle?.licensePlate || 'N/A'} - ${movement.vehicle?.make} ${movement.vehicle?.model}
                    </div>
                    <div class="col-md-6">
                        <strong>Movement Type:</strong><br>
                        <span class="badge badge-${movement.movementType === 'entry' ? 'success' : 'warning'}">
                            ${movement.movementType === 'entry' ? '🟢 Entry' : '🟡 Exit'}
                        </span>
                    </div>
                    <div class="col-md-6">
                        <strong>Area/Location:</strong><br>
                        ${movement.area}
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
                        ${recordedAt.toLocaleDateString()} ${recordedAt.toLocaleTimeString()}
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