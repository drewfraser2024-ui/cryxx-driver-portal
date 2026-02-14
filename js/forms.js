// ===== Form Handlers =====
const Forms = {
  init() {
    this.setupVacationForm();
    this.setupContactForm();
    this.setupPayrollForm();
    this.setupUniformForm();
    this.setupLoadingForm();
  },

  // --- Vacation Request ---
  setupVacationForm() {
    const form = document.getElementById('vacation-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        await DB.insert('vacation_requests', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          type: document.getElementById('vac-type').value,
          urgency: document.getElementById('vac-urgency').value,
          start_date: document.getElementById('vac-start').value,
          end_date: document.getElementById('vac-end').value,
          reason: document.getElementById('vac-reason').value,
          status: 'pending'
        });
        form.reset();
        showFormSuccess(form, 'Request submitted!');
        showToast('Vacation request submitted!', 'success');
        this.loadVacationHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadVacationHistory();
  },

  async loadVacationHistory() {
    const container = document.getElementById('vacation-history');
    try {
      const data = await DB.select('vacation_requests', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#9992;</div><p>No requests yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="history-item">
          <div class="history-item-info">
            <h4>${capitalize(item.type)} - ${formatDate(item.start_date)} to ${formatDate(item.end_date)}</h4>
            <p>${item.reason || 'No reason provided'}</p>
            <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)}</p>
          </div>
          <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
  },

  // --- Contact Owner ---
  setupContactForm() {
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        await DB.insert('contact_messages', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          category: document.getElementById('contact-category').value,
          subject: document.getElementById('contact-subject').value,
          message: document.getElementById('contact-message').value,
          priority: document.getElementById('contact-priority').value,
          status: 'pending'
        });
        form.reset();
        showFormSuccess(form, 'Message sent!');
        showToast('Message sent to owner!', 'success');
        this.loadContactHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadContactHistory();
  },

  async loadContactHistory() {
    const container = document.getElementById('contact-history');
    try {
      const data = await DB.select('contact_messages', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#9993;</div><p>No messages sent yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="history-item">
          <div class="history-item-info">
            <h4>[${capitalize(item.category)}] ${escapeHtml(item.subject)}</h4>
            <p>${escapeHtml(truncate(item.message, 100))}</p>
            <p style="font-size:0.75rem;color:var(--gray-400)">Sent ${formatDateTime(item.created_at)} | Priority: ${capitalize(item.priority)}</p>
          </div>
          <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading messages</div>';
    }
  },

  // --- Payroll Issues ---
  setupPayrollForm() {
    const form = document.getElementById('payroll-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        await DB.insert('payroll_issues', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          pay_period: document.getElementById('pay-period').value,
          issue_type: document.getElementById('pay-type').value,
          expected_amount: document.getElementById('pay-expected').value || null,
          received_amount: document.getElementById('pay-received').value || null,
          details: document.getElementById('pay-details').value,
          status: 'pending'
        });
        form.reset();
        showFormSuccess(form, 'Issue submitted!');
        showToast('Payroll issue submitted!', 'success');
        this.loadPayrollHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadPayrollHistory();
  },

  async loadPayrollHistory() {
    const container = document.getElementById('payroll-history');
    try {
      const data = await DB.select('payroll_issues', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#36;</div><p>No payroll issues submitted</p></div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="history-item">
          <div class="history-item-info">
            <h4>${capitalize(item.issue_type.replace(/_/g, ' '))} - ${escapeHtml(item.pay_period)}</h4>
            <p>${escapeHtml(truncate(item.details, 100))}</p>
            ${item.expected_amount ? `<p style="font-size:0.8rem">Expected: $${item.expected_amount} | Received: $${item.received_amount || 'N/A'}</p>` : ''}
            <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)}</p>
          </div>
          <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
  },

  // --- Uniform Request ---
  setupUniformForm() {
    const form = document.getElementById('uniform-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const checkedItems = Array.from(document.querySelectorAll('input[name="uniform-items"]:checked'))
        .map(cb => cb.value);

      if (checkedItems.length === 0) {
        showToast('Please select at least one uniform item', 'error');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        await DB.insert('uniform_requests', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          items: checkedItems.join(', '),
          shirt_size: document.getElementById('uni-shirt-size').value || null,
          pant_size: document.getElementById('uni-pant-size').value || null,
          shoe_size: document.getElementById('uni-shoe-size').value || null,
          notes: document.getElementById('uni-notes').value,
          status: 'pending'
        });
        form.reset();
        showFormSuccess(form, 'Request submitted!');
        showToast('Uniform request submitted!', 'success');
        this.loadUniformHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadUniformHistory();
  },

  async loadUniformHistory() {
    const container = document.getElementById('uniform-history');
    try {
      const data = await DB.select('uniform_requests', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128085;</div><p>No uniform requests yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="history-item">
          <div class="history-item-info">
            <h4>${escapeHtml(item.items)}</h4>
            <p>Shirt: ${item.shirt_size || 'N/A'} | Pants: ${escapeHtml(item.pant_size || 'N/A')} | Shoes: ${escapeHtml(item.shoe_size || 'N/A')}</p>
            ${item.notes ? `<p>${escapeHtml(truncate(item.notes, 80))}</p>` : ''}
            <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)}</p>
          </div>
          <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
  },

  // --- Truck Loading Suggestions ---
  setupLoadingForm() {
    const form = document.getElementById('loading-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        await DB.insert('loading_suggestions', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          truck_id: document.getElementById('load-truck').value,
          route: document.getElementById('load-route').value,
          suggestion: document.getElementById('load-suggestion').value,
          priority: document.getElementById('load-priority').value,
          status: 'pending'
        });
        form.reset();
        showFormSuccess(form, 'Suggestion submitted!');
        showToast('Loading suggestion submitted!', 'success');
        this.loadLoadingHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadLoadingHistory();
  },

  async loadLoadingHistory() {
    const container = document.getElementById('loading-history');
    try {
      const data = await DB.select('loading_suggestions', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128666;</div><p>No suggestions submitted yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="history-item">
          <div class="history-item-info">
            <h4>${escapeHtml(item.truck_id)}${item.route ? ` - ${escapeHtml(item.route)}` : ''}</h4>
            <p>${escapeHtml(truncate(item.suggestion, 100))}</p>
            <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)} | ${capitalize(item.priority)}</p>
          </div>
          <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
  },

  // Reload all histories (e.g., on login)
  reloadAll() {
    this.loadVacationHistory();
    this.loadContactHistory();
    this.loadPayrollHistory();
    this.loadUniformHistory();
    this.loadLoadingHistory();
  }
};

// ===== Dashboard Module =====
const Dashboard = {
  updateGreeting() {
    const el = document.getElementById('greeting-time');
    if (!el) return;
    const hour = new Date().getHours();
    let greeting, icon;
    if (hour < 12) {
      greeting = 'Good morning';
      icon = '&#9728;';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
      icon = '&#9788;';
    } else {
      greeting = 'Good evening';
      icon = '&#9790;';
    }
    el.innerHTML = `${icon} ${greeting}`;
  },

  async loadPendingCounts() {
    const tables = {
      vacation: 'vacation_requests',
      contact: 'contact_messages',
      payroll: 'payroll_issues',
      uniforms: 'uniform_requests',
      loading: 'loading_suggestions'
    };

    for (const [key, table] of Object.entries(tables)) {
      const badge = document.getElementById(`dash-badge-${key}`);
      if (!badge) continue;
      try {
        const data = await DB.select(table, { user_id: Auth.getUserId() });
        const pending = data.filter(item => item.status === 'pending').length;
        badge.textContent = `${pending} pending`;
        badge.classList.toggle('zero', pending === 0);
      } catch (err) {
        // Silently ignore
      }
    }
  }
};

// ===== Utility Functions =====
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');
  const icon = document.getElementById('toast-icon');
  msg.textContent = message;

  if (type === 'success') {
    icon.innerHTML = '&#10003;';
  } else if (type === 'error') {
    icon.innerHTML = '&#10007;';
  } else {
    icon.innerHTML = '&#8505;';
  }

  toast.className = 'toast show ' + type;
  setTimeout(() => {
    toast.className = 'toast hidden';
  }, 3000);
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
  } else {
    btn.classList.remove('loading');
  }
}

function showFormSuccess(form, message) {
  const card = form.closest('.card');
  if (!card) return;
  card.style.position = 'relative';

  const overlay = document.createElement('div');
  overlay.className = 'form-success-overlay';
  overlay.innerHTML = `
    <div class="check-circle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <p>${escapeHtml(message)}</p>
  `;
  card.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  }, 1500);
}
