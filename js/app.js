// ===== Main App Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase
  initSupabase();

  // DOM references
  const authScreen = document.getElementById('auth-screen');
  const mainApp = document.getElementById('main-app');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');
  const logoutBtn = document.getElementById('logout-btn');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  // Create overlay for mobile
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // ===== Auth Toggle =====
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // ===== Login =====
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button[type="submit"]');

    setButtonLoading(btn, true);
    try {
      await Auth.login(email, password);
      showMainApp();
      showToast('Welcome back, ' + Auth.getUserName() + '!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // ===== Register =====
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = registerForm.querySelector('button[type="submit"]');

    setButtonLoading(btn, true);
    try {
      await Auth.register(name, email, password, 'driver');
      showMainApp();
      showToast('Account created! Welcome, ' + Auth.getUserName() + '!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // ===== Logout =====
  logoutBtn.addEventListener('click', async () => {
    await Auth.logout();
    mainApp.classList.remove('active');
    authScreen.classList.add('active');
    showToast('Signed out successfully');
  });

  // ===== Mobile Menu =====
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  // ===== Show Main App =====
  function showMainApp() {
    authScreen.classList.remove('active');
    mainApp.classList.add('active');

    // Update UI with user info
    const name = Auth.getUserName();
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('user-name').textContent = name;
    document.getElementById('dashboard-name').textContent = name.split(' ')[0];
    document.getElementById('user-avatar').textContent = initial;
    document.getElementById('mobile-avatar').textContent = initial;

    // Role badge
    const badge = document.getElementById('user-role-badge');
    if (Auth.isAdmin()) {
      badge.textContent = 'Admin';
      badge.classList.add('admin');
      document.getElementById('admin-nav').classList.remove('hidden');
    } else {
      badge.textContent = 'Driver';
      badge.classList.remove('admin');
      document.getElementById('admin-nav').classList.add('hidden');
    }

    // Initialize modules
    Router.init();
    Forms.init();
    Admin.init();
    Schedule.init();

    // Dashboard greeting and counts
    Dashboard.updateGreeting();
    Dashboard.loadPendingCounts();

    // Navigate to dashboard
    Router.navigate('dashboard');
  }

  // ===== Auto-login if session exists =====
  const hasSession = await Auth.init();
  if (hasSession) {
    showMainApp();
  }
});
