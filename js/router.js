// ===== SPA Router =====
const Router = {
  currentPage: 'dashboard',

  init() {
    // Nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigate(page);
      });
    });

    // Dashboard card clicks
    document.querySelectorAll('.dash-card[data-goto]').forEach(card => {
      card.addEventListener('click', () => {
        this.navigate(card.dataset.goto);
      });
    });
  },

  navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    this.currentPage = page;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('active');

    // Trigger page-specific load
    if (page === 'admin' && Auth.isAdmin()) {
      Admin.loadDashboard();
    }
    if (page === 'schedule') {
      Schedule.render();
    }
  }
};
