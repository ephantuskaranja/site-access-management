// Basic client-side auth handling for login page
(function(){
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const toggleBtns = document.querySelectorAll('[data-toggle-password]');
  
  // Fallback for required asterisk if :has() not supported
  try {
    const supportsHas = CSS && CSS.supports && CSS.supports('selector(:has(*))');
    if (true) { // use JS approach universally to avoid duplicate stars
      const addAsterisk = (input) => {
        if (!input || !input.required) return;
        // Find an associated label: same .form-group label or label[for=id]
        let label = null;
        const group = input.closest && input.closest('.form-group');
        if (group) label = group.querySelector('label.form-label');
        if (!label && input.id) label = document.querySelector(`label[for="${input.id}"]`);
        if (!label) return;
        // If label already has a literal '*' in its text, wrap it for consistent red color
        const hasStarText = /\*/.test(label.textContent || '');
        if (hasStarText && !label.querySelector('.required-star')) {
          try {
            label.innerHTML = (label.innerHTML || '').replace(/\*/,'<span class="required-star">*</span>');
          } catch(_) { /* ignore */ }
        }
        if (!hasStarText && !label.classList.contains('required')) {
          label.classList.add('required');
        }
      };
      document.querySelectorAll('input[required], select[required], textarea[required]').forEach(addAsterisk);
      const mo = new MutationObserver(() => {
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(addAsterisk);
      });
      mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['required'] });
    }
  } catch (_) { /* ignore */ }

  function showError(msg){
    if (!errorEl) return;
    errorEl.textContent = msg || 'Login failed. Please try again.';
    errorEl.style.display = 'block';
  }

  if (form){
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok){
          const data = await res.json().catch(()=>({message:'Invalid response'}));
          showError(data?.message || 'Invalid credentials');
          return;
        }
        const data = await res.json();
        // Store tokens for subsequent requests
        if (data?.token) localStorage.setItem('accessToken', data.token);
        if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch(err){
        showError('Network error. Please try again.');
      }
    });
  }

  // Password visibility toggles
  if (toggleBtns && toggleBtns.length) {
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.textContent = isHidden ? '🙈' : '👁';
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      });
    });
  }
})();
// Site Access Management System - Frontend JavaScript

class SiteAccessApp {
  constructor() {
    // Clean up any corrupted localStorage from previous debugging
    this.cleanupLocalStorage();

    // Read tokens with fallback to legacy keys
    this.token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');
    this.user = null;
    this.apiBase = '/api';
    this.idleTimeoutMs = (window.APP_CONFIG && window.APP_CONFIG.idleTimeoutMs) || (15 * 60 * 1000);
    this._idleTimer = null;
    this._lastActivity = Date.now();

    this.init();
  }

  normalizePhone(value) {
    // Kenyan-only normalization → E.164: +2547XXXXXXXX or +2541XXXXXXXX
    if (value == null) return '';
    const raw = String(value).trim();
    const digits = raw.replace(/\D/g, '');

    // If already 254XXXXXXXXX (12 digits) convert to +254XXXXXXXXX
    if (digits.length === 12 && digits.startsWith('254')) {
      const n = digits.slice(3);
      if (/^[71]\d{8}$/.test(n)) return `+254${n}`;
    }

    // Local 07XXXXXXXX or 01XXXXXXXX (10 digits)
    if (digits.length === 10 && digits.startsWith('0')) {
      const n = digits.slice(1);
      if (/^[71]\d{8}$/.test(n)) return `+254${n}`;
    }

    // 9-digit national without 0 (e.g., 7XXXXXXXX or 1XXXXXXXX)
    if (digits.length === 9 && /^[71]/.test(digits)) {
      return `+254${digits}`;
    }

    // If input already includes +254 format
    if (raw.startsWith('+254')) {
      const n = digits.slice(3);
      if (/^[71]\d{8}$/.test(n)) return `+254${n}`;
    }

    // Fallback return cleaned digits with plus if present originally
    return raw.startsWith('+') ? `+${digits}` : digits;
  }

  isValidKenyanPhone(value) {
    const normalized = this.normalizePhone(value || '');
    return /^\+254(?:7|1)\d{8}$/.test(normalized);
  }

  attachPhoneValidation(inputEl) {
    if (!inputEl) return;
    const showError = () => {
      this.showInlineError(inputEl, 'Kenyan number only. Use 07XXXXXXXX or +2547XXXXXXXX.');
      try { if (typeof inputEl.setCustomValidity === 'function') inputEl.setCustomValidity('Invalid phone number'); } catch(_) {}
    };
    const clearError = () => {
      this.clearFieldError(inputEl.id || inputEl.name);
      try { if (typeof inputEl.setCustomValidity === 'function') inputEl.setCustomValidity(''); } catch(_) {}
    };
    const validate = () => {
      const v = inputEl.value || '';
      if (!v.trim()) { clearError(); return; }
      if (this.isValidKenyanPhone(v)) { clearError(); } else { showError(); }
    };
    const debouncedValidate = this.debounce(validate, 200);
    inputEl.addEventListener('input', debouncedValidate);
    inputEl.addEventListener('change', validate);
    inputEl.addEventListener('blur', () => {
      const normalized = this.normalizePhone(inputEl.value || '');
      if (/^\+254(?:7|1)\d{8}$/.test(normalized)) {
        inputEl.value = normalized;
        clearError();
      } else {
        validate();
      }
    });
  }

  showFieldError(inputIdOrName, message) {
    let input = document.getElementById(inputIdOrName);
    if (!input) input = document.querySelector(`[name="${inputIdOrName}"]`);
    if (!input) return;
    // Prefer native validity UI where available
    if (typeof input.setCustomValidity === 'function') {
      input.setCustomValidity(message || 'Invalid value');
      if (typeof input.reportValidity === 'function' && !input.hidden) {
        input.reportValidity();
      }
    }
    // Add visual flag
    input.classList.add('is-invalid');
    let feedback = input.nextElementSibling;
    if (!feedback || !feedback.classList || !feedback.classList.contains('invalid-feedback')) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      input.parentNode.insertBefore(feedback, input.nextSibling);
    }
    feedback.textContent = message || 'Invalid value';
  }

  clearFieldError(inputIdOrName) {
    let input = document.getElementById(inputIdOrName);
    if (!input) input = document.querySelector(`[name="${inputIdOrName}"]`);
    if (!input) return;
    input.classList.remove('is-invalid');
    if (typeof input.setCustomValidity === 'function') {
      input.setCustomValidity('');
    }
    const feedback = input.nextElementSibling;
    if (feedback && feedback.classList && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = '';
    }
  }

  cleanupLocalStorage() {
    // Remove the debugging artifacts that were accidentally stored as localStorage keys
    const badKeys = ['setItem', 'removeItem', 'clear'];
    badKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  async init() {
    // Check if user is logged in
    if (this.token) {
      try {
        await this.loadUserProfile();
        this.showLoggedInState();
        
        // Initialize page-specific functionality based on current page
        this.initializeCurrentPage();
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Still show logged in state but with degraded functionality
        this.showLoggedInState();
      }
    } else {
      this.showLoggedOutState();
    }

    // Setup event listeners
    this.setupEventListeners();

    // Setup idle logout if logged in
    if (this.token) {
      this.setupIdleLogout();
    }
  }

  initializeCurrentPage() {
    // Detect current page from URL path and initialize appropriate functionality
    const path = window.location.pathname;
    
    if (path === '/dashboard') {
      this.loadDashboard();
    } else if (path === '/visitors') {
      this.loadVisitorManagement();
    } else if (path === '/users') {
      this.loadUserManagement();
    }
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }

    // Navigation - removed client-side handling to allow normal server-side navigation
    // The navigation links will work normally with href attributes

    // Modal handling
    this.setupModalHandlers();
  }

  setupIdleLogout() {
    const resetTimer = () => {
      this._lastActivity = Date.now();
      if (this._idleTimer) {
        clearTimeout(this._idleTimer);
      }
      this._idleTimer = setTimeout(() => {
        try {
          // Best-effort logout call; ignore response
          if (this.token) {
            fetch(`${this.apiBase}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } })
              .catch(() => {});
          }
        } finally {
          this.showWarning && this.showWarning('You were logged out due to inactivity.');
          this.logout();
        }
      }, this.idleTimeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
  }

  setupModalHandlers() {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });

    // Close modal with close button
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });
  }

  async makeRequest(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.apiBase}${url}`, config);

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry request with new token
          config.headers.Authorization = `Bearer ${this.token}`;
          return await fetch(`${this.apiBase}${url}`, config);
        } else {
          this.logout();
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.apiBase}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;

        localStorage.setItem('access_token', this.token);
        localStorage.setItem('refresh_token', this.refreshToken);

        return true;
      } else {
        const errorData = await response.json();
        console.error('Token refresh failed with error:', errorData);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  async handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError');

    // Clear previous errors
    errorDiv.style.display = 'none';

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        this.user = data.data.user;

        if (!this.token || !this.refreshToken) {
          console.error('WARNING: Missing tokens in login response!');
        }

        localStorage.setItem('access_token', this.token);
        localStorage.setItem('refresh_token', this.refreshToken);

        this.showSuccess('Login successful! Redirecting...');

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        this.showError(errorDiv, data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError(errorDiv, 'Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }

  async loadUserProfile() {
    const response = await this.makeRequest('/auth/profile');
    if (response.ok) {
      const data = await response.json();
      this.user = data.data.user; // Fixed: access nested user object
      this.updateUserInterface();
    } else {
      throw new Error('Failed to load user profile');
    }
  }

  updateUserInterface() {
    if (!this.user) return;

    // Set user role on body for CSS styling
    document.body.setAttribute('data-user-role', this.user.role);

    // Update user info in header
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) {
      userNameElement.textContent = `${this.user.firstName} ${this.user.lastName}`;
    }
    
    if (userRoleElement) {
      userRoleElement.textContent = this.formatRole(this.user.role);
    }
    
    if (userAvatarElement) {
      userAvatarElement.textContent = this.user.firstName.charAt(0) + this.user.lastName.charAt(0);
    }
    // Show/hide navigation based on role
    this.updateNavigationForRole();
  }

  updateNavigationForRole() {
    const role = this.user?.role;
    const navItems = document.querySelectorAll('[data-role]');
    
    navItems.forEach(item => {
      const requiredRoles = item.dataset.role.split(',');
      if (requiredRoles.includes(role) || requiredRoles.includes('all')) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  formatRole(role) {
    const roleMap = {
      'admin': 'Administrator',
      'security_guard': 'Security Guard',
      'receptionist': 'Receptionist'
    };
    return roleMap[role] || role;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    window.location.href = '/';
  }

  showLoggedInState() {
    const authElements = document.querySelectorAll('[data-auth="logged-out"]');
    const mainElements = document.querySelectorAll('[data-auth="logged-in"]');
    
    authElements.forEach(el => el.style.display = 'none');
    mainElements.forEach(el => el.style.display = '');
    
    // Update navigation based on user role if user is loaded
    if (this.user) {
      this.updateNavigationForRole();
    }
  }

  showLoggedOutState() {
    const authElements = document.querySelectorAll('[data-auth="logged-out"]');
    const mainElements = document.querySelectorAll('[data-auth="logged-in"]');
    
    authElements.forEach(el => el.style.display = '');
    mainElements.forEach(el => el.style.display = 'none');
  }

  handleNavigation(e) {
    // Don't prevent default - let the browser handle normal navigation
    // The server will serve the appropriate EJS template
    const href = e.target.getAttribute('href');
    if (href) {
      window.location.href = href;
    }
  }

  async loadPage(page) {
    const content = document.getElementById('mainContent');
    if (!content) return;

    try {
      const response = await fetch(`/views/${page}.html`);
      if (response.ok) {
        content.innerHTML = await response.text();
        this.updateActiveNavigation(page);
        
        // Load page-specific functionality
        switch (page) {
          case 'dashboard':
            this.loadDashboard();
            break;
          case 'users':
            this.loadUserManagement();
            break;
          case 'visitors':
            this.loadVisitorManagement();
            break;
        }
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      content.innerHTML = '<div class="alert alert-danger">Failed to load page content.</div>';
    }
  }

  updateActiveNavigation(activePage) {
    document.querySelectorAll('.nav a').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${activePage}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  async loadDashboard() {
    // Load dashboard statistics based on user role
    try {
      const promises = [];
      let stats = {};

      if (this.user && this.user.role === 'admin') {
        // Admin dashboard: Show user statistics and visitor overview
        promises.push(this.makeRequest('/auth/users'));
        promises.push(this.makeRequest('/visitors?limit=1000'));
        // Company vehicle stats (admin should see)
        promises.push(this.makeRequest('/vehicle-movements/stats'));

        const [usersResponse, visitorsResponse, vehicleStatsResponse] = await Promise.all(promises);

        // Process user statistics
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          stats.totalUsers = userData.data?.length || 0;
          stats.activeUsers = userData.data?.filter(u => u.status === 'active').length || 0;
        } else {
          stats.totalUsers = 'Error';
          stats.activeUsers = 'Error';
        }

        // Process visitor statistics
        if (visitorsResponse.ok) {
          const visitorData = await visitorsResponse.json();
          const visitors = visitorData.data?.visitors || [];
          this.calculateVisitorStats(visitors, stats);
        } else {
          stats.totalVisitors = 'Error';
          stats.activeVisitors = 'Error';
        }

        // Process vehicle movement stats
        if (vehicleStatsResponse && vehicleStatsResponse.ok) {
          const vData = await vehicleStatsResponse.json();
          const vStats = vData?.data || {};
          stats.vehiclesOnSite = vStats.vehiclesOnSite ?? 0;
          stats.vehiclesOnMainSite = vStats.vehiclesOnMainSite ?? 0;
          this.renderVehiclesOnSiteByArea(vStats.vehiclesOnSiteByArea || {});
        } else {
          stats.vehiclesOnSite = 'Error';
          stats.vehiclesOnMainSite = 'Error';
          this.renderVehiclesOnSiteByArea(null);
        }

      } else if (this.user && this.user.role === 'security_guard') {
        // Security guard dashboard: Show visitor management and security-focused data
        promises.push(this.makeRequest('/visitors?limit=1000'));
        // Company vehicle stats (guard should see)
        promises.push(this.makeRequest('/vehicle-movements/stats'));

        const [visitorsResponse, vehicleStatsResponse] = await Promise.all(promises);
        
        if (visitorsResponse.ok) {
          const visitorData = await visitorsResponse.json();
          const visitors = visitorData.data?.visitors || [];
          
          // Calculate guard-relevant statistics
          this.calculateGuardStats(visitors, stats);
        } else {
          stats.todayVisitors = 'Error';
          stats.currentlyOnSite = 'Error';
          stats.pendingCheckouts = 'Error';
          stats.recentActivity = 'Error';
        }

        // Process vehicle movement stats
        if (vehicleStatsResponse && vehicleStatsResponse.ok) {
          const vData = await vehicleStatsResponse.json();
          const vStats = vData?.data || {};
          stats.vehiclesOnSite = vStats.vehiclesOnSite ?? 0;
          stats.vehiclesOnMainSite = vStats.vehiclesOnMainSite ?? 0;
          this.renderVehiclesOnSiteByArea(vStats.vehiclesOnSiteByArea || {});
        } else {
          stats.vehiclesOnSite = 'Error';
          stats.vehiclesOnMainSite = 'Error';
          this.renderVehiclesOnSiteByArea(null);
        }
        
      } else if (this.user && this.user.role === 'receptionist') {
        // Receptionist dashboard: Show visitor check-in/check-out focused data
        promises.push(this.makeRequest('/visitors?limit=1000'));
        
        const [visitorsResponse] = await Promise.all(promises);
        
        if (visitorsResponse.ok) {
          const visitorData = await visitorsResponse.json();
          const visitors = visitorData.data?.visitors || [];
          
          // Calculate receptionist-relevant statistics
          this.calculateReceptionistStats(visitors, stats);
        } else {
          stats.receptionistTodayVisitors = 'Error';
          stats.receptionistActiveVisitors = 'Error';
          stats.receptionistPendingVisitors = 'Error';
        }
        
      } else {
        // Visitor or other roles: Limited dashboard
        stats.todayVisitors = 'N/A';
        stats.currentlyOnSite = 'N/A';
      }
      
      // Update dashboard with calculated stats
      this.updateDashboardStats(stats);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.updateDashboardStats({
        totalUsers: 'Error',
        activeUsers: 'Error',
        todayVisitors: 'Error',
        currentlyOnSite: 'Error',
        vehiclesOnSite: 'Error',
        vehiclesOnMainSite: 'Error'
      });
      this.renderVehiclesOnSiteByArea(null);
    }
  }

  renderVehiclesOnSiteByArea(areaMap) {
    const container = document.getElementById('vehiclesOnSiteByAreaList');
    if (!container) return;

    if (!areaMap || typeof areaMap !== 'object') {
      container.textContent = 'Unavailable';
      container.classList.add('text-muted');
      return;
    }

    const entries = Object.entries(areaMap);
    if (!entries.length) {
      container.textContent = 'No company vehicles on-site';
      container.classList.add('text-muted');
      return;
    }

    // Sort by count desc, then by name
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    const list = document.createElement('ul');
    list.className = 'list-unstyled mb-0';
    entries.forEach(([name, count]) => {
      const li = document.createElement('li');
      li.className = 'd-flex justify-content-between align-items-center py-1';
      const label = document.createElement('span');
      label.textContent = name;
      const badge = document.createElement('span');
      badge.className = 'badge badge-info';
      badge.textContent = String(count);
      li.appendChild(label);
      li.appendChild(badge);
      list.appendChild(li);
    });

    container.classList.remove('text-muted');
    container.innerHTML = '';
    container.appendChild(list);
  }

  calculateVisitorStats(visitors, stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayVisitors = visitors.filter(visitor => {
      const visitDate = new Date(visitor.createdAt);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    });
    
    const activeVisitors = visitors.filter(visitor => 
      visitor.status === 'checked_in'
    );
    
    stats.totalVisitors = todayVisitors.length;
    stats.activeVisitors = activeVisitors.length;
  }

  calculateGuardStats(visitors, stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    // Today's visitors
    const todayVisitors = visitors.filter(visitor => {
      const visitDate = new Date(visitor.createdAt);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    });
    
    // Currently on-site (checked in but not checked out)
    const currentlyOnSite = visitors.filter(visitor => 
      visitor.status === 'checked_in'
    );
    
    // Visitors who have been on-site for more than expected duration (potential security concern)
    const longStayVisitors = currentlyOnSite.filter(visitor => {
      const checkInTime = new Date(visitor.checkInTime);
      const hoursOnSite = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return hoursOnSite > 4; // Flag visitors on-site for more than 4 hours
    });
    
    // Recent activity (last hour)
    const recentActivity = visitors.filter(visitor => {
      const activityTime = new Date(visitor.updatedAt || visitor.createdAt);
      return activityTime >= oneHourAgo;
    });
    
    stats.todayVisitors = todayVisitors.length;
    stats.currentlyOnSite = currentlyOnSite.length;
    stats.pendingCheckouts = longStayVisitors.length;
    stats.recentActivity = recentActivity.length;
  }

  calculateReceptionistStats(visitors, stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's visitors (all visitors created today)
    const todayVisitors = visitors.filter(visitor => {
      const visitDate = new Date(visitor.createdAt);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    });
    
    // Active visitors (currently checked in)
    const activeVisitors = visitors.filter(visitor => 
      visitor.status === 'checked_in'
    );
    
    // Pending visitors (approved but not yet checked in)
    const pendingVisitors = visitors.filter(visitor => 
      visitor.status === 'approved'
    );
    
    stats.receptionistTodayVisitors = todayVisitors.length;
    stats.receptionistActiveVisitors = activeVisitors.length;
    stats.receptionistPendingVisitors = pendingVisitors.length;
  }

  updateDashboardStats(stats) {
    Object.keys(stats).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = stats[key];
      }
    });
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  showSuccess(message) {
    this.showAlert(message, 'success');
  }

  showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    } else {
      this.showAlert(message, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  // Visitor Management Functions
  async loadVisitorManagement() {
    try {
      // Load visitor statistics
      await this.loadVisitorStats();
      
      // Warm up employees cache for host name display
      if (!this._employeesByEmail) {
        this._employeesByEmail = new Map();
        try { await this._ensureEmployeesCache(); } catch(_) {}
      }

      // Load visitors table
      await this.loadVisitors();
      
      // Set up event listeners for visitor forms
      this.setupVisitorEventListeners();
      
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      const expectedDateInput = document.getElementById('expectedDate');
      if (expectedDateInput) {
        expectedDateInput.value = today;
      }
      
    } catch (error) {
      console.error('Error loading visitor management:', error);
      this.showAlert('Error loading visitor management', 'danger');
    }
  }

  async loadVisitorStats() {
    try {
      // For now, set placeholder values - you can implement actual stats API later
      document.getElementById('todayVisitors').textContent = '0';
      document.getElementById('checkedInVisitors').textContent = '0';  
      document.getElementById('pendingApprovals').textContent = '0';
      document.getElementById('monthlyVisitors').textContent = '0';
    } catch (error) {
      console.error('Error loading visitor stats:', error);
    }
  }

  async loadEmployees() {
    try {
      const response = await this.makeRequest('/employees');
      const result = await response.json();
      
      const hostEmployeeSelect = document.getElementById('hostEmployee');
      if (!hostEmployeeSelect) return;

      // Prevent concurrent population causing duplicates
      if (hostEmployeeSelect.dataset.populating === 'true') return;
      hostEmployeeSelect.dataset.populating = 'true';

      if (response.ok && result.success) {
        // Clear existing options with disabled placeholder
        hostEmployeeSelect.innerHTML = '<option value="" disabled selected>Select Host Employee</option>';
        
        // Add employee options
        const seen = new Set();
        const frag = document.createDocumentFragment();
        result.data.employees.forEach(employee => {
          if (!employee || !employee.id || seen.has(employee.id)) return;
          seen.add(employee.id);
          const option = document.createElement('option');
          option.value = String(employee.id);
          const dept = employee.department || '';
          option.textContent = dept ? `${employee.firstName} ${employee.lastName || ''} (${dept})` : `${employee.firstName} ${employee.lastName || ''}`;
          option.setAttribute('data-email', employee.email);
          option.setAttribute('data-department', dept);
          try {
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim().toLowerCase();
            option.setAttribute('data-name', fullName);
          } catch(_) {}
          frag.appendChild(option);
        });
        hostEmployeeSelect.appendChild(frag);
        // Update employeesByEmail and employeesById caches
        try {
          this._employeesByEmail = this._employeesByEmail || new Map();
          this._employeesById = this._employeesById || new Map();
          this._employeeIdByEmail = this._employeeIdByEmail || new Map();
          result.data.employees.forEach(emp => {
            if (emp && emp.email) {
              const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
              this._employeesByEmail.set(String(emp.email).toLowerCase(), fullName);
              if (emp.id) this._employeeIdByEmail.set(String(emp.email).toLowerCase(), String(emp.id));
            }
            if (emp && emp.id) {
              const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
              this._employeesById.set(String(emp.id), fullName);
            }
          });
        } catch(_) {}
        // Refresh Choices if enabled
        if (window.ChoicesHelper) {
          window.ChoicesHelper.refresh(hostEmployeeSelect);
        }
      } else {
        hostEmployeeSelect.innerHTML = '<option value="">Error loading employees</option>';
        console.error('Failed to load employees:', result.message);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      const hostEmployeeSelect = document.getElementById('hostEmployee');
      if (hostEmployeeSelect) {
        hostEmployeeSelect.innerHTML = '<option value="">Error loading employees</option>';
      }
    } finally {
      const sel = document.getElementById('hostEmployee');
      if (sel) delete sel.dataset.populating;
    }
  }

  async _ensureEmployeesCache() {
    try {
      const response = await this.makeRequest('/employees');
      const result = await response.json();
      if (response.ok && result && result.data && Array.isArray(result.data.employees)) {
        const map = this._employeesByEmail || new Map();
        const idMap = this._employeesById || new Map();
        result.data.employees.forEach(emp => {
          if (emp && emp.email) {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            map.set(String(emp.email).toLowerCase(), fullName);
          }
          if (emp && emp.id) {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            idMap.set(String(emp.id), fullName);
          }
        });
        this._employeesByEmail = map;
        this._employeesById = idMap;
      }
    } catch(_) {}
  }

  async loadVisitors(page = 1, search = '', status = '', purpose = '', date = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status', status);  
      if (purpose) params.append('visitPurpose', purpose);
      if (date) {
        // Use both startDate and endDate for single date filter
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
        
        params.append('startDate', startOfDay.toISOString());
        params.append('endDate', endOfDay.toISOString());
      }

      const response = await this.makeRequest(`/visitors?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        this.displayVisitors(data.data.visitors);
        this.displayPagination(data.data.pagination);
        this.updateVisitorStats(data.data.visitors);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to load visitors');
      }
    } catch (error) {
      console.error('Error loading visitors:', error);
      const tbody = document.getElementById('visitorsTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading visitors</td></tr>';
      }
    }
  }

  displayVisitors(visitors) {
    const tbody = document.getElementById('visitorsTableBody');
    const countEl = document.getElementById('totalVisitorsCount');
    
    if (!tbody) return;

    // Update visitor count
    if (countEl) {
      countEl.textContent = visitors ? visitors.length : 0;
    }

    if (!visitors || visitors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 3rem; color: var(--text-secondary);">No visitors found</td></tr>';
      return;
    }

    const hostNameFor = (v) => {
      // Prefer server-provided display name when available
      if (v && v.hostDisplayName && String(v.hostDisplayName).trim()) {
        return v.hostDisplayName;
      }
      const value = v?.hostEmployee || '';
      const looksEmail = /@/.test(String(value));
      if (looksEmail && this._employeesByEmail && this._employeesByEmail.size) {
        const name = this._employeesByEmail.get(String(value).toLowerCase());
        if (name && name.trim()) return name;
      }
      // Fallback: map by employee ID
      if (this._employeesById && this._employeesById.size) {
        const nameById = this._employeesById.get(String(value));
        if (nameById && nameById.trim()) return nameById;
      }
      return value;
    };

    const role = this.user?.role;
    // Prioritize checked-in and not-confirmed for receptionists
    let list = Array.isArray(visitors) ? [...visitors] : [];
    if (role === 'receptionist') {
      list.sort((a, b) => {
        const aPri = (a.status === 'checked_in' && !a.receptionConfirmedAt) ? 1 : 0;
        const bPri = (b.status === 'checked_in' && !b.receptionConfirmedAt) ? 1 : 0;
        if (aPri !== bPri) return bPri - aPri; // prioritize checked_in & not confirmed
        const aCreated = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated; // tie-breaker: newest first (matches admin)
      });
    }
    tbody.innerHTML = list.map(visitor => `
      <tr style="border-left: 3px solid ${this.getStatusBorderColor(visitor.status)};">
        <td style="font-weight: 500;">
          <div>${visitor.firstName} ${visitor.lastName || ''}</div>
        </td>
        <td>
          <code style="background: var(--light-color); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8125rem;">
            ${visitor.visitorCardNumber || 'N/A'}
          </code>
        </td>
        <td>
          <div style="font-weight: 500;">${visitor.company || 'N/A'}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${hostNameFor(visitor)}</div>
          <small class="text-muted">${visitor.hostDepartment || ''}</small>
        </td>
        <td>
          <span class="badge badge-info">${this.formatPurpose(visitor.visitPurpose)}</span>
        </td>
        <td>
          <span class="badge badge-${this.getStatusColor(visitor.status)}">${this.formatStatus(visitor.status)}</span>
          ${visitor.receptionConfirmedAt ? '<span class="badge badge-success" style="margin-left:4px;" title="Reception has confirmed attendance">Confirmed</span>' : ''}
        </td>
        <td>
          <div style="font-size: 0.8125rem;">
            ${visitor.actualCheckIn ? this.formatDateTime(visitor.actualCheckIn) : '<span class="text-muted">Not checked in</span>'}
          </div>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-view" data-visitor-id="${visitor.id}" style="font-size: 0.75rem;">
              👁️ View
            </button>
            ${(role !== 'receptionist') && visitor.status !== 'checked_in' && visitor.status !== 'checked_out' ? `
            <button class="btn btn-outline-secondary btn-edit" data-visitor-id="${visitor.id}" style="font-size: 0.75rem;">
              ✏️ Edit
            </button>` : ''}
            ${((role === 'admin' || role === 'receptionist') && visitor.status === 'checked_in' && !visitor.receptionConfirmedAt) ? `
            <button class="btn btn-primary btn-actions" data-visitor-id="${visitor.id}" style="font-size: 0.75rem;">
              ✅ Confirm
            </button>` : ''}
            ${(role !== 'receptionist') && visitor.status === 'approved' ? 
              `<button class="btn btn-success btn-checkin" data-visitor-id="${visitor.id}" style="font-size: 0.75rem;">
                ✅ Check In
              </button>` : 
              (role !== 'receptionist') && visitor.status === 'checked_in' ? 
              `<button class="btn btn-warning btn-checkout" data-visitor-id="${visitor.id}" style="font-size: 0.75rem;">
                🚪 Check Out
              </button>` : 
              ''
            }
          </div>
        </td>
      </tr>
    `).join('');
  }

  displayPagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl || !pagination) return;

    let paginationHTML = '';
    
    // Previous button
    if (pagination.hasPrev) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.page - 1}">Previous</a></li>`;
    }
    
    // Page numbers (show up to 5 pages)
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const active = i === pagination.page ? 'active' : '';
      paginationHTML += `<li class="page-item ${active}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    
    // Next button
    if (pagination.hasNext) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.page + 1}">Next</a></li>`;
    }
    
    paginationEl.innerHTML = paginationHTML;
  }

  updateVisitorStats(visitors) {
    const today = new Date().toDateString();
    const todayVisitors = visitors.filter(v => new Date(v.expectedDate).toDateString() === today);
    const checkedIn = visitors.filter(v => v.status === 'checked_in');
    const pending = visitors.filter(v => v.status === 'pending');

    document.getElementById('todayVisitors').textContent = todayVisitors.length;
    document.getElementById('checkedInVisitors').textContent = checkedIn.length;
    document.getElementById('pendingApprovals').textContent = pending.length;
  }

  setupVisitorEventListeners() {
    // Add visitor form submission
    const addVisitorForm = document.getElementById('addVisitorForm');
    if (addVisitorForm) {
      // Attach field clear handlers to hide errors on input/change
      this.attachFieldClearHandlers(addVisitorForm);
      addVisitorForm.addEventListener('submit', this.handleAddVisitor.bind(this));
    }

    // Modal handling
    const registerVisitorBtn = document.getElementById('registerVisitorBtn');
    if (registerVisitorBtn) {
      registerVisitorBtn.addEventListener('click', async () => {
        // Pre-fill current date and time since registration happens at entrance
        const now = new Date();
        
        // Format date as YYYY-MM-DD for date input
        const currentDate = now.toISOString().split('T')[0];
        const expectedDateInput = document.getElementById('expectedDate');
        if (expectedDateInput) {
          expectedDateInput.value = currentDate;
        }
        
        // Format time as HH:MM for time input
        const currentTime = now.toTimeString().slice(0, 5);
        const expectedTimeInput = document.getElementById('expectedTime');
        if (expectedTimeInput) {
          expectedTimeInput.value = currentTime;
        }

        // Load employees for the dropdown
        await this.loadEmployees();

        // Clear inline errors when opening the modal
        const form = document.getElementById('addVisitorForm');
        this.clearFormErrors(form);

        // Ensure add mode UI
        this._editingVisitorId = null;
        const titleEl = document.getElementById('addVisitorModalTitle');
        const submitEl = document.getElementById('addVisitorSubmitBtn');
        const autoGrp = document.getElementById('autoApproveGroup');
        if (titleEl) titleEl.textContent = 'Register New Visitor';
        if (submitEl) submitEl.textContent = 'Register Visitor';
        if (autoGrp) autoGrp.style.display = '';
        
        this.showModal('addVisitorModal');
      });
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', this.clearFilters.bind(this));
    }

    // Modal close buttons
    document.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal-close');
        hideModal(modalId);
      });
    });

    // Clear specific inline error on host change (legacy helper retained)
    const hostEmployeeEl = document.getElementById('hostEmployee');
    if (hostEmployeeEl) {
      hostEmployeeEl.addEventListener('change', () => {
        const hostEmployeeErrorEl = document.getElementById('hostEmployeeError');
        if (hostEmployeeErrorEl) hostEmployeeErrorEl.style.display = 'none';
      });
    }
    // Event delegation for table buttons
    const visitorsTable = document.getElementById('visitorsTable');
    if (visitorsTable) {
      visitorsTable.addEventListener('click', (e) => {
        const visitorId = e.target.getAttribute('data-visitor-id');
        if (!visitorId) return;

        if (e.target.classList.contains('btn-view')) {
          this.viewVisitor(visitorId);
        } else 
        if (e.target.classList.contains('btn-edit')) {
          const role = this.user?.role;
          if (role === 'receptionist') {
            this.showAlert('Receptionists cannot edit visitors', 'warning');
            return;
          }
          this.editVisitor(visitorId);
        } else 
        if (e.target.classList.contains('btn-actions')) {
          this.showVisitorActions(visitorId);
        } else if (e.target.classList.contains('btn-approve')) {
          this.approveVisitor(visitorId);
        } else if (e.target.classList.contains('btn-checkin')) {
          this.checkInVisitor(visitorId);
        } else if (e.target.classList.contains('btn-checkout')) {
          this.checkOutVisitor(visitorId);
        } else if (e.target.classList.contains('btn-qr')) {
          this.viewQRCode(visitorId);
        }
      });
    }

    // Pagination event listener
    document.addEventListener('click', (e) => {
      if (e.target.matches('#pagination .page-link')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        if (page) {
          this.loadVisitors(parseInt(page));
        }
      }
    });

    // Search and filter event listeners
    const searchInput = document.getElementById('searchVisitors');
    const statusFilter = document.getElementById('statusFilter');
    const purposeFilter = document.getElementById('purposeFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (purposeFilter) {
      purposeFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', () => this.applyFilters());
    }
  }

  async viewVisitor(visitorId) {
    try {
      const response = await this.makeRequest(`/visitors/${visitorId}`);
      const result = await response.json();
      const visitor = result?.data?.visitor || result?.data || result;
      if (!visitor || !visitor.id) {
        this.showAlert('Visitor not found', 'warning');
        return;
      }
      this.populateVisitorDetailsModal(visitor);
      const modal = document.getElementById('visitorDetailsModal');
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    } catch (error) {
      console.error('Error loading visitor details:', error);
      this.showAlert('Error loading visitor details', 'danger');
    }
  }

  populateVisitorDetailsModal(visitor) {
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? '-';
    };
    setText('detailVisitorName', `${visitor.firstName} ${visitor.lastName || ''}`);
    setText('detailBadgeNumber', visitor.visitorCardNumber || 'N/A');
    setText('detailFromLocation', visitor.visitorFromLocation || 'N/A');
    setText('detailIdNumber', visitor.idNumber || 'N/A');
    setText('detailEmail', visitor.email || 'N/A');
    setText('detailPhone', visitor.phone || 'N/A');
    setText('detailCompany', visitor.company || 'N/A');
    setText('detailVehicleNumber', visitor.vehicleNumber || 'N/A');
    // Map host email to full name if available
    let hostDisplay = visitor.hostDisplayName || visitor.hostEmployee || 'N/A';
    if (hostDisplay && /@/.test(String(hostDisplay)) && this._employeesByEmail && this._employeesByEmail.size) {
      const mapped = this._employeesByEmail.get(String(hostDisplay).toLowerCase());
      if (mapped && mapped.trim()) hostDisplay = mapped;
    } else if (this._employeesById && this._employeesById.size) {
      const mappedById = this._employeesById.get(String(hostDisplay));
      if (mappedById && mappedById.trim()) hostDisplay = mappedById;
    }
    setText('detailHostEmployee', hostDisplay || 'N/A');
    setText('detailHostDepartment', visitor.hostDepartment || 'N/A');
    setText('detailVisitPurpose', this.formatPurpose(visitor.visitPurpose));
    setText('detailExpectedDate', visitor.expectedDate ? new Date(visitor.expectedDate).toLocaleDateString() : 'N/A');
    setText('detailExpectedTime', visitor.expectedTime || 'N/A');
    setText('detailCheckIn', visitor.actualCheckIn ? this.formatDateTime(visitor.actualCheckIn) : 'Not checked in');
    setText('detailCheckOut', visitor.actualCheckOut ? this.formatDateTime(visitor.actualCheckOut) : 'Not checked out');
    setText('detailStatus', this.formatStatus(visitor.status));
    setText('detailNotes', visitor.notes || '');
  }

  async editVisitor(visitorId) {
    try {
      // Fetch visitor details
      const response = await this.makeRequest(`/visitors/${visitorId}`);
      const result = await response.json();
      const visitor = result?.data?.visitor || result?.data || result;
      if (!visitor || !visitor.id) { this.showAlert('Visitor not found', 'warning'); return; }

      // Load employees for select
      await this.loadEmployees();

      // Prefill add form fields for edit mode
      const form = document.getElementById('addVisitorForm');
      if (!form) return;
      this.clearFormErrors(form);

      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
      const setSelectValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value ?? '';
        try {
          if (el._choices && value != null && value !== '') {
            el._choices.setChoiceByValue(String(value));
          } else if (window.ChoicesHelper) {
            window.ChoicesHelper.refresh(el);
          }
        } catch (_) {
          if (window.ChoicesHelper) window.ChoicesHelper.refresh(el);
        }
      };
      setVal('firstName', visitor.firstName || '');
      setVal('lastName', visitor.lastName || '');
      setVal('phone', visitor.phone || '');
      setVal('visitorCardNumber', visitor.visitorCardNumber || '');
      setVal('idNumber', visitor.idNumber || '');
      setVal('company', visitor.company || '');
      setVal('vehicleNumber', visitor.vehicleNumber || '');
      setVal('notes', visitor.notes || '');
      // Purpose and host department (Choices-enhanced selects)
      setSelectValue('visitPurpose', visitor.visitPurpose || '');
      setSelectValue('hostDepartment', visitor.hostDepartment || '');
      // Host employee select: deterministically resolve stored value (email/id) to option value
      const hostSel = document.getElementById('hostEmployee');
      // Debug: use console.log to ensure visibility in devtools default level
      console.log('[editVisitor] host selection', {
        hostDisplayName: visitor.hostDisplayName,
        hostEmployee: visitor.hostEmployee
      });
      if (hostSel) {
        let selected = '';
        const opts = Array.from(hostSel.options || []);
        const stored = visitor.hostEmployee || '';
        const norm = (s) => String(s || '')
          .toLowerCase()
          .replace(/\bnull\b|\bundefined\b/g, '') // strip literal null/undefined tokens
          .replace(/\s*\([^)]*\)\s*$/, '') // remove trailing (Dept)
          .replace(/\s+/g, ' ') // collapse whitespace
          .trim();

        // 0) Fast path: email -> id via cache built in loadEmployees
        if (/@/.test(String(stored)) && this._employeeIdByEmail && this._employeeIdByEmail.size) {
          const idFromEmail = this._employeeIdByEmail.get(String(stored).toLowerCase());
          if (idFromEmail) selected = String(idFromEmail);
        }

        // 1) If stored looks like an email, match option by data-email
        if (/@/.test(String(stored))) {
          const emailLower = String(stored).toLowerCase();
          const byEmail = opts.find(o => String(o.getAttribute('data-email') || '').toLowerCase() === emailLower);
          if (byEmail) selected = byEmail.value;
          // If still not found, try local-part heuristic (e.g., 'acaptano') against data-name
          if (!selected) {
            const local = emailLower.split('@')[0];
            const byLocal = opts.find(o => {
              const dn = norm(o.getAttribute('data-name'));
              return dn.startsWith(local) || dn.split(' ').includes(local);
            });
            if (byLocal) selected = byLocal.value;
          }
        }

        // 2) If still not found, and stored is an id, match by value
        if (!selected && String(stored).trim()) {
          const byId = opts.find(o => o.value === String(stored));
          if (byId) selected = byId.value;
        }

        // 3) Fallback: use hostDisplayName to match either visible text or data-name
        if (!selected && String(visitor.hostDisplayName || '').trim()) {
          const target = norm(visitor.hostDisplayName);
          let byText = opts.find(o => norm(o.textContent) === target);
          if (!byText) {
            byText = opts.find(o => norm(o.getAttribute('data-name')) === target);
          }
          if (byText) selected = byText.value;
        }

        // Log the resolved selection for clarity
        console.log('[editVisitor] resolved hostEmployee', { stored, selected });
        setSelectValue('hostEmployee', selected || '');
      }

      // Toggle UI for edit
      this._editingVisitorId = visitor.id;
      const titleEl = document.getElementById('addVisitorModalTitle');
      const submitEl = document.getElementById('addVisitorSubmitBtn');
      const autoGrp = document.getElementById('autoApproveGroup');
      if (titleEl) titleEl.textContent = 'Edit Visitor';
      if (submitEl) submitEl.textContent = 'Save Changes';
      if (autoGrp) autoGrp.style.display = 'none';

      this.showModal('addVisitorModal');
    } catch (err) {
      console.error('Error opening edit modal:', err);
      this.showAlert('Error loading visitor for edit', 'danger');
    }
  }

  async handleAddVisitor(e) {
    e.preventDefault();
    
    const form = e.target;
    this.clearFormErrors(form);
    // Ensure required values for hidden/Choices-managed fields
    const hostEmployeeEl = document.getElementById('hostEmployee');
    const hostDepartmentEl = document.getElementById('hostDepartment');
    const expectedDateEl = document.getElementById('expectedDate');
    const expectedTimeEl = document.getElementById('expectedTime');
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const phoneEl = document.getElementById('phone');
    const idNumberEl = document.getElementById('idNumber');
    const emailEl = document.getElementById('email');
    const visitPurposeEl = document.getElementById('visitPurpose');

    // Set defaults for hidden date/time if empty
    const now = new Date();
    if (expectedDateEl && !expectedDateEl.value) {
      expectedDateEl.value = now.toISOString().split('T')[0];
    }
    if (expectedTimeEl && !expectedTimeEl.value) {
      expectedTimeEl.value = now.toTimeString().slice(0, 5);
    }
    // Inline validations (Choices-friendly)
    let hasError = false;
    const requireNonEmpty = (el, msg) => { if (!el || !String(el.value).trim()) { this.showInlineError(el, msg); hasError = true; } };
    requireNonEmpty(firstNameEl, 'First name is required');
    requireNonEmpty(lastNameEl, 'Last name is required');
    requireNonEmpty(phoneEl, 'Phone number is required');
    requireNonEmpty(idNumberEl, 'ID/Passport number is required');
    requireNonEmpty(hostEmployeeEl, 'Please select a host employee');
    requireNonEmpty(hostDepartmentEl, 'Please select a host department');
    requireNonEmpty(visitPurposeEl, 'Please select a purpose of visit');

    // Format checks
    const phoneRegex = /^[\+]?\d{7,16}$/; // simple digit-based check with optional +
    if (phoneEl && String(phoneEl.value).trim() && !phoneRegex.test(String(phoneEl.value).trim())) {
      this.showInlineError(phoneEl, 'Invalid phone format. Use digits, optional leading +.');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailEl && String(emailEl.value).trim() && !emailRegex.test(String(emailEl.value).trim())) {
      this.showInlineError(emailEl, 'Please provide a valid email address.');
      hasError = true;
    }
    if (hasError) { this.focusFirstError(form); return; }
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Convert FormData to regular object
    const visitorData = {};
    for (let [key, value] of formData.entries()) {
      if (key !== 'photo') {
        visitorData[key] = value;
      }
    }

    // Handle auto-approve checkbox
    const autoApprove = formData.get('autoApprove');
    visitorData.autoApprove = !!autoApprove; // Convert to boolean
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = this._editingVisitorId ? 'Saving...' : 'Registering...';

      let response;
      if (this._editingVisitorId) {
        // In edit mode, do PUT update
        // Do not send autoApprove flag on edit
        const { autoApprove, ...payload } = visitorData;
        response = await this.makeRequest(`/visitors/${this._editingVisitorId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Create mode
        response = await this.makeRequest('/visitors', {
          method: 'POST',
          body: JSON.stringify(visitorData)
        });
      }

      const result = await response.json();
      
      if (response.ok) {
        this.showAlert(this._editingVisitorId ? 'Visitor updated successfully!' : 'Visitor registered successfully!', 'success');
        form.reset();
        this.clearFormErrors(form);
        hideModal('addVisitorModal');
        this._editingVisitorId = null;
        const titleEl = document.getElementById('addVisitorModalTitle');
        const submitEl = document.getElementById('addVisitorSubmitBtn');
        const autoGrp = document.getElementById('autoApproveGroup');
        if (titleEl) titleEl.textContent = 'Register New Visitor';
        if (submitEl) submitEl.textContent = 'Register Visitor';
        if (autoGrp) autoGrp.style.display = '';
        this.loadVisitors(); // Refresh the visitors list
      } else {
        this.showAlert(result.message || 'Failed to register visitor', 'danger');
      }
    } catch (error) {
      console.error('Error registering visitor:', error);
      this.showAlert(this._editingVisitorId ? 'Error updating visitor' : 'Error registering visitor', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this._editingVisitorId ? 'Save Changes' : 'Register Visitor';
    }
  }

  // Inline validation helpers (Choices-friendly)
  clearFormErrors(form){
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.choices.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback[data-generated="true"]').forEach(msg => { try { msg.remove(); } catch(_){} });
    // Hide legacy host employee error if present
    const hostEmployeeErrorEl = document.getElementById('hostEmployeeError');
    if (hostEmployeeErrorEl) hostEmployeeErrorEl.style.display = 'none';
  }

  showInlineError(field, message){
    if (!field) return;
    const wrapper = field.closest('.choices');
    const target = wrapper || field;
    field.classList.add('is-invalid');
    if (wrapper) wrapper.classList.add('is-invalid');
    let feedback = null;
    const id = field.id ? field.id + '-error' : '';
    if (id) feedback = target.parentElement?.querySelector('#' + id);
    // Try to reuse an existing adjacent invalid-feedback if no id-specific feedback
    if (!feedback) {
      const next = target.nextElementSibling;
      if (next && next.classList && next.classList.contains('invalid-feedback')) {
        feedback = next;
      }
    }
    // As a fallback, reuse any existing invalid-feedback within the same parent
    if (!feedback) {
      const siblings = Array.from(target.parentElement ? target.parentElement.children : []);
      feedback = siblings.find(el => el && el.classList && el.classList.contains('invalid-feedback')) || null;
    }
    // Create only if none found
    if (!feedback){
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      feedback.dataset.generated = 'true';
      if (id) feedback.id = id;
      if (target.nextSibling) target.parentElement.insertBefore(feedback, target.nextSibling);
      else target.parentElement.appendChild(feedback);
    }
    feedback.textContent = message || 'Invalid value';
    feedback.style.display = 'block';
  }

  focusFirstError(form){
    const first = form.querySelector('.choices.is-invalid, .is-invalid');
    if (first){
      const input = first.classList.contains('choices') ? first.querySelector('input') : first;
      if (input && typeof input.focus === 'function') input.focus({ preventScroll: false });
      try { (input || first).scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(_) {}
    }
  }

  attachFieldClearHandlers(form){
    if (!form) return;
    const clear = (el) => {
      if (!el) return;
      const wrapper = el.closest('.choices');
      el.classList.remove('is-invalid');
      if (wrapper) wrapper.classList.remove('is-invalid');
      const fb = (wrapper || el).parentElement?.querySelector('#' + (el.id || '') + '-error');
      if (fb) fb.style.display = 'none';
    };
    form.querySelectorAll('input, select, textarea').forEach(ctrl => {
      ctrl.addEventListener('input', (e) => clear(e.target));
      ctrl.addEventListener('change', (e) => clear(e.target));
    });
  }

  applyFilters() {
    const search = document.getElementById('searchVisitors')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const purpose = document.getElementById('purposeFilter')?.value || '';
    const date = document.getElementById('dateFilter')?.value || '';
    
    this.loadVisitors(1, search, status, purpose, date);
  }

  clearFilters() {
    // Clear all filter inputs
    const searchInput = document.getElementById('searchVisitors');
    const statusFilter = document.getElementById('statusFilter');
    const purposeFilter = document.getElementById('purposeFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (purposeFilter) purposeFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    // Reload visitors with no filters
    this.loadVisitors();
  }

  async checkInVisitor(visitorId) {
    try {
      const response = await this.makeRequest(`/visitors/${visitorId}/checkin`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showAlert('Visitor checked in successfully!', 'success');
        this.loadVisitors();
      } else {
        this.showAlert(result.message || 'Failed to check in visitor', 'danger');
      }
    } catch (error) {
      console.error('Error checking in visitor:', error);
      this.showAlert('Error checking in visitor', 'danger');
    }
  }

  async checkOutVisitor(visitorId) {
    try {
      const response = await this.makeRequest(`/visitors/${visitorId}/checkout`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showAlert('Visitor checked out successfully!', 'success');
        this.loadVisitors();
      } else {
        this.showAlert(result.message || 'Failed to check out visitor', 'danger');
      }
    } catch (error) {
      console.error('Error checking out visitor:', error);
      this.showAlert('Error checking out visitor', 'danger');
    }
  }

  showVisitorActions(visitorId) {
    const modal = document.getElementById('visitorActionsModal');
    const content = document.getElementById('visitorActionsContent');
    if (!modal || !content) return;

    // Build action UI lazily by fetching visitor
    this.makeRequest(`/visitors/${visitorId}`)
      .then(res => res.json())
      .then(data => {
        const visitor = data?.data?.visitor || data?.data || data;
        if (!visitor || !visitor.id) { this.showAlert('Visitor not found', 'warning'); return; }

        const role = this.user?.role;
        const canConfirm = (role === 'admin' || role === 'receptionist') && visitor.status === 'checked_in' && !visitor.receptionConfirmedAt;

        if (visitor.receptionConfirmedAt) {
          content.innerHTML = '<div class="text-muted">Reception has already confirmed attendance.</div>';
        } else if (canConfirm) {
          content.innerHTML = `<div class="d-flex gap-2 flex-wrap"><button class="btn btn-success" data-action="confirm" data-visitor-id="${visitor.id}">✅ Confirm at Reception</button></div>`;
          const btn = content.querySelector('button[data-action="confirm"]');
          if (btn) {
            btn.addEventListener('click', async () => {
              try {
                const resp = await this.makeRequest(`/visitors/${visitor.id}/confirm`, { method: 'POST' });
                const result = await resp.json();
                if (resp.ok) {
                  this.showAlert('Visitor confirmed at reception', 'success');
                  this.loadVisitors();
                  hideModal('visitorActionsModal');
                } else {
                  this.showAlert(result.message || 'Failed to confirm visitor', 'danger');
                }
              } catch (e) {
                console.error('Confirm error', e);
                this.showAlert('Error confirming visitor', 'danger');
              }
            });
          }
        } else {
          content.innerHTML = '<div class="text-muted">No actions available</div>';
        }

        this.showModal('visitorActionsModal');
      })
      .catch(() => this.showAlert('Error loading actions', 'danger'));
  }

  // Utility functions for visitor management
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'checked_in': 'Checked In',
      'checked_out': 'Checked Out'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status) {
    const colorMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'checked_in': 'primary',
      'checked_out': 'secondary'
    };
    return colorMap[status] || 'secondary';
  }

  getStatusBorderColor(status) {
    const colorMap = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'checked_in': '#3b82f6',
      'checked_out': '#64748b'
    };
    return colorMap[status] || '#64748b';
  }

  getStatusBorderColor(status) {
    const colorMap = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'checked_in': '#3b82f6',
      'checked_out': '#64748b'
    };
    return colorMap[status] || '#64748b';
  }

  formatPurpose(purpose) {
    const purposeMap = {
      'meeting': 'Meeting',
      'delivery': 'Delivery',
      'pig_delivery': 'Pig Delivery',
      'pig_order': 'Pig Order',
      'maintenance': 'Maintenance',
      'contract_works': 'Contract Works',
      'shop': 'Shop',
      'payment_collection': 'Payment Collection',
      'interview': 'Interview',
      'other': 'Other'
    };
    return purposeMap[purpose] || purpose;
  }

  formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // If less than 24 hours ago, show relative time
    if (diffHours < 24) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else {
        return `${Math.floor(diffHours)}h ago`;
      }
    }
    
    // Otherwise show formatted date and time
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // User Management Functions
  async loadUserManagement() {
    try {
      // Only load user management if user is admin
      if (this.user && this.user.role === 'admin') {
        // Load users data
        await this.loadUsers();
        
        // Set up event listeners for user forms
        this.setupUserEventListeners();
        
      } else {
        // Redirect non-admin users away from user management
        window.location.href = '/dashboard';
        return;
      }
      
    } catch (error) {
      console.error('Error loading user management:', error);
      this.showAlert('Error loading user management', 'danger');
    }
  }

  async loadUsers() {
    try {
      const response = await this.makeRequest('/auth/users');
      
      if (response.ok) {
        const data = await response.json();
        this.displayUsers(data.data || []);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      const tbody = document.getElementById('usersTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading users</td></tr>';
      }
    }
  }

  displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td><span class="badge badge-${this.getRoleColor(user.role)}">${this.formatRole(user.role)}</span></td>
        <td><span class="badge badge-${user.status === 'active' ? 'success' : 'secondary'}">${user.status}</span></td>
        <td>
          <div class="btn-group btn-group-sm">
            ${this.user && this.user.role === 'admin' ? `
              <button class="btn btn-primary btn-sm" data-user-id="${user.id}" data-action="edit">Edit</button>
              <button class="btn btn-secondary btn-sm" data-user-id="${user.id}" data-action="reset-password">Reset Password</button>
              <button class="btn btn-${user.status === 'active' ? 'warning' : 'success'} btn-sm" data-user-id="${user.id}" data-action="toggle-status">
                ${user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            ` : `<span class="text-muted">No actions</span>`}
          </div>
        </td>
      </tr>
    `).join('');
  }

  getRoleColor(role) {
    const colorMap = {
      'admin': 'primary',
      'security_guard': 'info',
      'receptionist': 'success',
      'employee': 'secondary'
    };
    return colorMap[role] || 'secondary';
  }

  setupUserEventListeners() {
    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.showModal('addUserModal'));
    } else {
      console.warn('Add user button not found');
    }

    // Add user form submission
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => {
        this.handleAddUser(e);
      });
      // Clear field errors as user edits
      this.attachFieldClearHandlers(addUserForm);
      // Live phone validation for add form
      const addPhone = addUserForm.querySelector('input[name="phone"]');
      this.attachPhoneValidation(addPhone);
    } else {
      console.warn('Add user form not found');
    }

    // Edit user form submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
      editUserForm.addEventListener('submit', (e) => {
        this.handleEditUser(e);
      });
      // Clear field errors as user edits
      this.attachFieldClearHandlers(editUserForm);
      // Live phone validation for edit form
      const editPhone = document.getElementById('editPhone');
      this.attachPhoneValidation(editPhone);
    } else {
      console.warn('Edit user form not found');
    }

    // Modal close buttons
    document.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal-close');
        this.closeModal(modalId);
      });
    });

    // User table actions - using event delegation
    const usersTable = document.getElementById('usersTable');
    if (usersTable) {
      usersTable.addEventListener('click', (e) => {
        if (!this.user || this.user.role !== 'admin') {
          // Block all user actions for non-admins
          this.showAlert('Only administrators can perform user actions.', 'warning');
          return;
        }
        const userId = e.target.getAttribute('data-user-id');
        const action = e.target.getAttribute('data-action');
        
        if (!userId || !action) return;

        if (action === 'edit') {
          this.editUser(userId);
        } else if (action === 'reset-password') {
          this.resetUserPassword(userId);
        } else if (action === 'toggle-status') {
          this.toggleUserStatus(userId);
        }
      });
    }
  }

  async handleAddUser(e) {
    // Force refresh token state from localStorage
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const userData = {
      firstName: (formData.get('firstName') || '').toString().trim(),
      lastName: (formData.get('lastName') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: this.normalizePhone((formData.get('phone') || '').toString()),
      role: (formData.get('role') || '').toString().trim(),
      password: (formData.get('password') || '').toString(),
      status: (formData.get('status') || 'active').toString().trim() || 'active'
    };

    // Add optional fields if provided
    const employeeId = formData.get('employeeId');
    if (employeeId && employeeId.toString().trim()) {
      userData.employeeId = employeeId.toString().trim();
    }

    const department = formData.get('department');
    if (department && department.toString().trim()) {
      userData.department = department.toString().trim();
    }

    // Validate required fields
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || !userData.role || !userData.password) {
      this.showAlert('Please fill in all required fields', 'danger');
      return;
    }
    // Basic client-side validations to reduce 400 errors
    const validRoles = ['admin', 'security_guard', 'receptionist', 'employee'];
    if (!validRoles.includes(userData.role)) {
      this.showAlert('Invalid role selected. Choose a valid role.', 'danger');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      this.showFieldError('email', 'Please provide a valid email address.');
      return;
    }
    // Kenyan-only: normalized to +2547XXXXXXXX or +2541XXXXXXXX
    const phoneRegex = /^\+254(?:7|1)\d{8}$/;
    if (!phoneRegex.test(userData.phone)) {
      this.showFieldError('phone', 'Kenyan number only. Use 07XXXXXXXX or +2547XXXXXXXX.');
      return;
    }
    this.clearFieldError('phone');
    if (userData.password.length < 8) {
      this.showFieldError('password', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      // First, let's check if our token works by testing a simple authenticated endpoint
      const profileTest = await this.makeRequest('/auth/profile');
      
      if (!profileTest.ok) {
        const profileError = await profileTest.json();
        console.error('Profile test failed:', profileError);
        
        if (this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (!refreshed) {
            this.logout();
            return;
          }
        } else {
          this.logout();
          return;
        }
      }
      
      // Test if we can access the users endpoint first (which also requires admin)
      const testResponse = await this.makeRequest('/auth/users');
      
      if (!testResponse.ok) {
        console.error('Admin access test failed - this might explain the register failure');
        const testError = await testResponse.json();
        console.error('Admin test error:', testError);
        
        if (testResponse.status === 401) {
          this.logout();
          return;
        } else if (testResponse.status === 403) {
          this.showAlert('You must be an administrator to create users', 'danger');
          return;
        }
      }
      
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        this.showAlert('User created successfully!', 'success');
        this.closeModal('addUserModal');
        form.reset();
        // Reload the users list
        await this.loadUsers();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('User creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Show detailed validation errors if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          console.error('Validation errors:', errorData.errors);
          const errorMessages = errorData.errors.map(err => `${err.field}: ${err.message}`).join('; ');
          this.showAlert(`Validation failed: ${errorMessages}`, 'danger');
        } else if (response.status === 401) {
          this.logout();
        } else if (response.status === 403) {
          this.showAlert('Access denied. Administrator privileges required.', 'danger');
        } else {
          this.showAlert(errorData.message || 'Failed to create user', 'danger');
        }
        
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.message.includes('Authentication failed')) {
        this.showAlert('Your session has expired. Please login again.', 'warning');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        this.showAlert(`Error creating user: ${error.message}`, 'danger');
      }
    }
  }

  async editUser(userId) {
    try {
      // Get user details from the API
      const response = await this.makeRequest(`/auth/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const user = data.data;
        
        // Populate the edit form with user data
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editFirstName').value = user.firstName || '';
        document.getElementById('editLastName').value = user.lastName || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editRole').value = user.role || '';
        document.getElementById('editEmployeeId').value = user.employeeId || '';
        document.getElementById('editDepartment').value = user.department || '';
        document.getElementById('editStatus').value = user.status || '';
        
        // Show the edit modal
        this.showModal('editUserModal');
      } else {
        console.error('Failed to fetch user details');
        this.showAlert('Failed to load user details', 'danger');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      this.showAlert('Error loading user details', 'danger');
    }
  }

  async handleEditUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    // Get the submit button by its form attribute since it's outside the form
    const submitBtn = document.querySelector('button[form="editUserForm"][type="submit"]');
    
    const userData = {
      firstName: (formData.get('firstName') || '').toString().trim(),
      lastName: (formData.get('lastName') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: this.normalizePhone((formData.get('phone') || '').toString()),
      role: (formData.get('role') || '').toString().trim(),
      employeeId: (formData.get('employeeId') ?? '').toString().trim(),
      department: (formData.get('department') ?? '').toString().trim(),
      status: (formData.get('status') || '').toString().trim()
    };
    
    const userId = formData.get('userId');

    // Validate required fields
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || !userData.role) {
      this.showAlert('Please fill in all required fields', 'danger');
      return;
    }
    // Email and phone validations similar to add-user
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      this.showFieldError('editEmail', 'Please provide a valid email address.');
      // Fallback to name selector within edit form
      this.showFieldError('email', 'Please provide a valid email address.');
      return;
    }
    const phoneRegex = /^\+254(?:7|1)\d{8}$/;
    if (!phoneRegex.test(userData.phone)) {
      this.showFieldError('editPhone', 'Kenyan number only. Use 07XXXXXXXX or +2547XXXXXXXX.');
      this.showFieldError('phone', 'Kenyan number only. Use 07XXXXXXXX or +2547XXXXXXXX.');
      return;
    }
    this.clearFieldError('editPhone');
    this.clearFieldError('phone');

    // Optional field cleanup: if empty strings, remove to avoid backend type validation errors
    if (!userData.employeeId) delete userData.employeeId;
    if (userData.department === '') delete userData.department;
    if (!userData.status) delete userData.status;

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }
      
      const response = await this.makeRequest(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        this.showAlert('User updated successfully!', 'success');
        this.closeModal('editUserModal');
        form.reset();
        // Reload the users list
        await this.loadUsers();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('User update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Show detailed validation errors if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          console.error('Validation errors:', errorData.errors);
          const errorMessages = errorData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          this.showAlert(`Validation failed: ${errorMessages}`, 'danger');
        } else {
          this.showAlert(errorData.message || 'Failed to update user', 'danger');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      this.showAlert('Error updating user', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update User';
      }
    }
  }

  async toggleUserStatus(userId) {
    try {
      // Get current user data to determine current status
      const response = await this.makeRequest(`/auth/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const user = data.data;
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = user.status === 'active' ? 'deactivate' : 'activate';
        
        // Confirm the action
        if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
          
          // Only send fields that have valid values (not null, undefined, or empty string)
          const updateData = {
            status: newStatus
          };
          
          // Only include fields with actual values
          if (user.firstName && user.firstName.trim()) {
            updateData.firstName = user.firstName.trim();
          }
          if (user.lastName && user.lastName.trim()) {
            updateData.lastName = user.lastName.trim();
          }
          if (user.email && user.email.trim()) {
            updateData.email = user.email.trim();
          }
          if (user.phone && user.phone.trim()) {
            updateData.phone = user.phone.trim();
          }
          if (user.role && user.role.trim()) {
            updateData.role = user.role.trim();
          }
          if (user.employeeId && user.employeeId.trim()) {
            updateData.employeeId = user.employeeId.trim();
          }
          if (user.department && user.department.trim()) {
            updateData.department = user.department.trim();
          }
          
          const updateResponse = await this.makeRequest(`/auth/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            this.showAlert(`User ${action}d successfully!`, 'success');
            // Reload the users list
            await this.loadUsers();
          } else {
            const errorData = await updateResponse.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Detailed error response:', errorData);
            
            // Show detailed validation errors if available
            if (errorData.errors && Array.isArray(errorData.errors)) {
              console.error('Validation errors:', errorData.errors);
              const errorMessages = errorData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
              this.showAlert(`Validation failed: ${errorMessages}`, 'danger');
            } else {
              this.showAlert(errorData.message || `Failed to ${action} user`, 'danger');
            }
          }
        }
      } else {
        console.error('Failed to fetch user details for status toggle');
        this.showAlert('Failed to load user details', 'danger');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      this.showAlert('Error updating user status', 'danger');
    }
  }

  async resetUserPassword(userId) {
    try {
      // Get user details first
      const response = await this.makeRequest(`/auth/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const user = data.data;
        
        // Confirm the action
        if (confirm(`Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? A new temporary password will be generated.`)) {
          
          const resetResponse = await this.makeRequest(`/auth/users/${userId}/reset-password`, {
            method: 'POST'
          });

          if (resetResponse.ok) {
            const result = await resetResponse.json();
            const newPassword = result.data?.newPassword;
            
            if (newPassword) {
              alert(`Password reset successful! New temporary password for ${user.firstName} ${user.lastName}: ${newPassword}\n\nPlease provide this password to the user and advise them to change it upon first login.`);
            } else {
              this.showAlert('Password reset successful! The user will receive instructions to set a new password.', 'success');
            }
          } else {
            const errorData = await resetResponse.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Password reset failed:', errorData);
            this.showAlert(errorData.message || 'Failed to reset password', 'danger');
          }
        }
      } else {
        console.error('Failed to fetch user details for password reset');
        this.showAlert('Failed to load user details', 'danger');
      }
    } catch (error) {
      console.error('Error resetting user password:', error);
      this.showAlert('Error resetting password', 'danger');
    }
  }

  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'checked_in': 'Checked In',
      'checked_out': 'Checked Out'
    };
    return statusMap[status] || status;
  }

  debounce(func, wait) {
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.siteAccessApp = new SiteAccessApp();
});

// Utility functions
window.formatDate = function(dateString) {
  return new Date(dateString).toLocaleDateString();
};

window.formatTime = function(dateString) {
  return new Date(dateString).toLocaleTimeString();
};

window.formatDateTime = function(dateString) {
  return new Date(dateString).toLocaleString();
};

window.showModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
};

window.hideModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Reset the visitor form when closing the add visitor modal
    if (modalId === 'addVisitorModal') {
      const form = document.getElementById('addVisitorForm');
      if (form) {
        form.reset();
      }
    }
  }
};

window.clearFilters = function() {
  document.getElementById('searchVisitors').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('purposeFilter').value = '';
  document.getElementById('dateFilter').value = '';
  
  if (window.siteAccessApp && window.siteAccessApp.loadVisitors) {
    window.siteAccessApp.loadVisitors();
  }
};