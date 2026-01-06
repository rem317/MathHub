// Application State
const AppState = {
    currentUser: null,
    currentPage: 'loading',
    isAuthenticated: false,
    API_BASE_URL: 'http://localhost:5000/api'
};

// DOM Elements
const pages = {
    loading: document.getElementById('loading-page'),
    login: document.getElementById('login-page'),
    signup: document.getElementById('signup-page'),
    dashboard: document.getElementById('dashboard-page')
};

// Loading Page Elements
const loadingProgress = document.getElementById('loadingProgress');
const percentageElement = document.getElementById('percentage');
const skipLoadingBtn = document.getElementById('skipLoading');

// Login Page Elements
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const switchToSignupBtn = document.getElementById('switchToSignup');

// Signup Page Elements
const signupForm = document.getElementById('signupForm');
const signupEmailInput = document.getElementById('signupEmail');
const signupUsernameInput = document.getElementById('signupUsername');
const signupPasswordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const strengthMeter = document.getElementById('strengthMeter');
const termsCheckbox = document.getElementById('terms');
const switchToLoginBtn = document.getElementById('switchToLogin');

// Dashboard Elements
const dashboardLogo = document.getElementById('dashboardLogo');
const userNameDisplay = document.getElementById('userNameDisplay');
const studentName = document.getElementById('studentName');
const userInitialElements = document.querySelectorAll('[id*="userInitial"], [id*="UserInitial"]');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateElement = document.getElementById('currentDate');

// Modal Elements
const logoutModal = document.getElementById('logoutModal');
const termsModal = document.getElementById('termsModal');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const closeTermsBtn = document.getElementById('closeTerms');
const termsLink = document.getElementById('termsLink');

// API Service
const ApiService = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('polyLearnToken');
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${AppState.API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });
        
        return await response.json();
    },
    
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async getCurrentUser() {
        return this.request('/auth/me');
    },
    
    async getDashboard() {
        return this.request('/users/dashboard');
    },
    
    async updateProgress(progressData) {
        return this.request('/users/progress', {
            method: 'PUT',
            body: JSON.stringify(progressData)
        });
    },
    
    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }
};

// Initialize Application
async function initApp() {
    console.log('PolyLearn Application Initialized');
    
    // Check if user is already logged in
    const token = localStorage.getItem('polyLearnToken');
    const savedUser = localStorage.getItem('polyLearnUser');
    
    if (token && savedUser) {
        try {
            const result = await ApiService.getCurrentUser();
            
            if (result.success) {
                AppState.currentUser = result.user;
                AppState.isAuthenticated = true;
                navigateTo('dashboard');
                return;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        
        // Clear invalid tokens
        localStorage.removeItem('polyLearnToken');
        localStorage.removeItem('polyLearnUser');
    }
    
    // Start with loading page
    navigateTo('loading');
    simulateLoading();
    setupEventListeners();
}

// Navigation Function
function navigateTo(page) {
    // Hide all pages
    Object.values(pages).forEach(p => p.classList.add('hidden'));
    
    // Show requested page
    pages[page].classList.remove('hidden');
    AppState.currentPage = page;
    
    // Update dashboard if needed
    if (page === 'dashboard' && AppState.currentUser) {
        updateDashboard();
    }
    
    console.log(`Navigated to: ${page}`);
}

// Loading Page Simulation
function simulateLoading() {
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 10 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Auto-navigate to login after loading
            setTimeout(() => navigateTo('login'), 500);
        }
        
        loadingProgress.style.width = `${progress}%`;
        percentageElement.textContent = `${Math.floor(progress)}%`;
    }, 300);
    
    skipLoadingBtn.addEventListener('click', () => {
        clearInterval(loadingInterval);
        navigateTo('login');
    });
}

// Form Validation Functions
function validateLoginForm() {
    let isValid = true;
    
    // Clear previous errors
    hideError('loginEmailError');
    hideError('loginPasswordError');
    
    if (!loginEmailInput.value.trim()) {
        showError('loginEmailError', 'Email or username is required');
        isValid = false;
    }
    
    if (!loginPasswordInput.value.trim() || loginPasswordInput.value.length < 6) {
        showError('loginPasswordError', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

function validateSignupForm() {
    let isValid = true;
    
    // Clear previous errors
    hideError('signupEmailError');
    hideError('signupUsernameError');
    hideError('signupPasswordError');
    hideError('confirmPasswordError');
    hideError('termsError');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmailInput.value.trim() || !emailRegex.test(signupEmailInput.value)) {
        showError('signupEmailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Username validation
    if (!signupUsernameInput.value.trim() || signupUsernameInput.value.length < 3) {
        showError('signupUsernameError', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    // Password validation
    if (!signupPasswordInput.value || signupPasswordInput.value.length < 8) {
        showError('signupPasswordError', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    // Confirm password
    if (signupPasswordInput.value !== confirmPasswordInput.value) {
        showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
    }
    
    // Terms agreement
    if (!termsCheckbox.checked) {
        showError('termsError', 'You must accept the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Password Strength Indicator
signupPasswordInput?.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strengthMeter) {
        strengthMeter.style.width = `${strength}%`;
        strengthMeter.style.backgroundColor = 
            strength < 50 ? '#e74c3c' : 
            strength < 75 ? '#f39c12' : '#27ae60';
    }
});

// Update Dashboard
async function updateDashboard() {
    if (!AppState.currentUser) return;
    
    try {
        const result = await ApiService.getDashboard();
        
        if (result.success) {
            const { user, progress } = result.dashboard;
            
            // Update user info
            userNameDisplay.textContent = user.full_name || user.username;
            studentName.textContent = user.full_name || user.username;
            
            // Update initials
            const initials = (user.full_name || user.username).split(' ').map(n => n[0]).join('');
            userInitialElements.forEach(el => {
                el.textContent = initials;
            });
            
            // Update progress metrics
            document.getElementById('lessonsCount').innerHTML = 
                `${progress.lessons_completed}<span class="item-unit">/${progress.total_lessons}</span>`;
            document.getElementById('exercisesCount').innerHTML = 
                `${progress.exercises_completed}<span class="item-unit">/${progress.total_exercises}</span>`;
            document.getElementById('quizScore').innerHTML = 
                `${progress.quiz_score}<span class="item-unit">points</span>`;
            document.getElementById('avgTime').innerHTML = 
                `${progress.average_time}<span class="item-unit">minutes/day</span>`;
        }
    } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        // Fallback to local user data
        if (AppState.currentUser) {
            userNameDisplay.textContent = AppState.currentUser.full_name || AppState.currentUser.username;
            studentName.textContent = AppState.currentUser.full_name || AppState.currentUser.username;
            
            const initials = (AppState.currentUser.full_name || AppState.currentUser.username).split(' ').map(n => n[0]).join('');
            userInitialElements.forEach(el => {
                el.textContent = initials;
            });
        }
    }
    
    // Update date
    const now = new Date();
    currentDateElement.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateLoginForm()) {
                const btn = this.querySelector('.btn-primary');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                btn.disabled = true;
                
                try {
                    const result = await ApiService.login(
                        loginEmailInput.value.trim(),
                        loginPasswordInput.value
                    );
                    
                    if (result.success) {
                        // Save token and user data
                        localStorage.setItem('polyLearnToken', result.token);
                        localStorage.setItem('polyLearnUser', JSON.stringify(result.user));
                        
                        AppState.currentUser = result.user;
                        AppState.isAuthenticated = true;
                        
                        navigateTo('dashboard');
                        loginForm.reset();
                    } else {
                        alert(`Login failed: ${result.message}`);
                    }
                } catch (error) {
                    alert('Network error. Please check if backend is running on http://localhost:5000');
                    console.error('Login error:', error);
                }
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // Switch to signup
    if (switchToSignupBtn) {
        switchToSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('signup');
        });
    }
    
    // Signup Form
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateSignupForm()) {
                const btn = this.querySelector('.btn-primary');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
                btn.disabled = true;
                
                const userData = {
                    username: signupUsernameInput.value.trim(),
                    email: signupEmailInput.value.trim(),
                    password: signupPasswordInput.value,
                    full_name: signupUsernameInput.value.trim()
                };
                
                try {
                    const result = await ApiService.register(userData);
                    
                    if (result.success) {
                        // Save token and user data
                        localStorage.setItem('polyLearnToken', result.token);
                        localStorage.setItem('polyLearnUser', JSON.stringify(result.user));
                        
                        AppState.currentUser = result.user;
                        AppState.isAuthenticated = true;
                        
                        navigateTo('dashboard');
                        signupForm.reset();
                        if (strengthMeter) strengthMeter.style.width = '0%';
                    } else {
                        alert(`Registration failed: ${result.message}`);
                    }
                } catch (error) {
                    alert('Network error. Please check if backend is running on http://localhost:5000');
                    console.error('Registration error:', error);
                }
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // Switch to login
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('login');
        });
    }
    
    // Logo click
    if (dashboardLogo) {
        dashboardLogo.addEventListener('click', function() {
            if (AppState.isAuthenticated) {
                navigateTo('dashboard');
            } else {
                navigateTo('login');
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutModal.classList.add('active');
        });
    }
    
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.classList.remove('active');
        });
    }
    
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async function() {
            try {
                await ApiService.logout();
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            // Clear app state
            AppState.currentUser = null;
            AppState.isAuthenticated = false;
            localStorage.removeItem('polyLearnToken');
            localStorage.removeItem('polyLearnUser');
            
            // Close modal and navigate to login
            logoutModal.classList.remove('active');
            navigateTo('login');
        });
    }
    
    // Terms modal
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.classList.add('active');
        });
    }
    
    if (closeTermsBtn) {
        closeTermsBtn.addEventListener('click', function() {
            termsModal.classList.remove('active');
        });
    }
    
    // Dashboard navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show notification for demo
            const pageName = this.querySelector('span').textContent;
            alert(`Navigating to ${pageName} page...\n\nIn a complete application, this would load the ${pageName.toLowerCase()} content.`);
        });
    });
    
    // Quick action buttons
    const continueLessonBtn = document.getElementById('continueLesson');
    const practiceExercisesBtn = document.getElementById('practiceExercises');
    const playQuizBtn = document.getElementById('playQuiz');
    const viewProgressBtn = document.getElementById('viewProgress');
    
    if (continueLessonBtn) {
        continueLessonBtn.addEventListener('click', function() {
            alert('Continuing to your last lesson...');
        });
    }
    
    if (practiceExercisesBtn) {
        practiceExercisesBtn.addEventListener('click', function() {
            alert('Loading practice exercises...');
        });
    }
    
    if (playQuizBtn) {
        playQuizBtn.addEventListener('click', function() {
            alert('Starting polynomial quiz game...');
        });
    }
    
    if (viewProgressBtn) {
        viewProgressBtn.addEventListener('click', function() {
            alert('Opening detailed progress report...');
        });
    }
    
    // Clear errors on input
    if (loginEmailInput) {
        loginEmailInput.addEventListener('input', () => hideError('loginEmailError'));
    }
    
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('input', () => hideError('loginPasswordError'));
    }
    
    if (signupEmailInput) {
        signupEmailInput.addEventListener('input', () => hideError('signupEmailError'));
    }
    
    if (signupUsernameInput) {
        signupUsernameInput.addEventListener('input', () => hideError('signupUsernameError'));
    }
    
    if (signupPasswordInput) {
        signupPasswordInput.addEventListener('input', () => hideError('signupPasswordError'));
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => hideError('confirmPasswordError'));
    }
    
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => hideError('termsError'));
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            logoutModal.classList.remove('active');
            termsModal.classList.remove('active');
        }
        
        // L key to logout from dashboard
        if (e.key === 'l' && AppState.currentPage === 'dashboard') {
            logoutBtn.click();
        }
    });
}

// Initialize the application when page loads
window.addEventListener('DOMContentLoaded', initApp);