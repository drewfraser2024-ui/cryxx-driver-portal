// ===== Admin Dashboard Module =====
const Admin = {
  currentTab: 'vacation',

  init() {
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.loadTabContent(this.currentTab);
      });
    });
  },

  async loadDashboard() {
    // Load counts
    try {
      const [vacCount, contactCount, payrollCount, uniformCount, loadingCount] = await Promise.all([
        DB.count('vacation_requests'),
        DB.count('contact_messages'),
        DB.count('payroll_issues'),
        DB.count('uniform_requests'),
        DB.count('loading_suggestions')
      ]);

      document.getElementById('stat-vacation').textContent = vacCount;
      document.getElementById('stat-contact').textContent = contactCount;
      document.getElementById('stat-payroll').textContent = payrollCount;
      document.getElementById('stat-uniforms').textContent = uniformCount;
      document.getElementById('stat-loading').textContent = loadingCount;
    } catch (err) {
      console.error('Error loading admin stats:', err);
    }

    // Load current tab content
    this.loadTabContent(this.currentTab);
  },

  async loadTabContent(tab) {
    const container = document.getElementById('admin-content');
    container.innerHTML = '<p class="empty-state">Loading...</p>';

    const tableMap = {
      vacation: 'vacation_requests',
      contact: 'contact_messages',
      payroll: 'payroll_issues',
      uniforms: 'uniform_requests',
      loading: 'loading_suggestions'
    };

    try {
      const data = await DB.select(tableMap[tab]);

      if (data.length === 0) {
        container.innerHTML = '<p class="empty-state">No submissions yet</p>';
        return;
      }

      container.innerHTML = data.map(item => this.renderAdminItem(tab, item)).join('');

      // Attach action button handlers
      container.querySelectorAll('.admin-action-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          const table = tableMap[tab];
          try {
            await DB.update(table, id, { status: action });
            showToast(`Item marked as ${action}`, 'success');
            this.loadDashboard();
          } catch (err) {
            showToast('Error updating: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      container.innerHTML = '<p class="empty-state">Error loading data</p>';
    }
  },

  renderAdminItem(tab, item) {
    const statusHtml = `<span class="status-badge status-${item.status}">${capitalize(item.status)}</span>`;

    const actionsHtml = `
      <div class="admin-item-actions">
        <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
        <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
      </div>
    `;

    switch (tab) {
      case 'vacation':
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${capitalize(item.type)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Dates:</strong> ${formatDate(item.start_date)} to ${formatDate(item.end_date)}</p>
              <p><strong>Urgency:</strong> ${capitalize(item.urgency)}</p>
              ${item.reason ? `<p><strong>Reason:</strong> ${escapeHtml(item.reason)}</p>` : ''}
              <p>${statusHtml}</p>
            </div>
            ${item.status === 'pending' ? actionsHtml : ''}
          </div>
        `;

      case 'contact':
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${escapeHtml(item.subject)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Category:</strong> ${capitalize(item.category)} | <strong>Priority:</strong> ${capitalize(item.priority)}</p>
              <p>${escapeHtml(item.message)}</p>
              <p>${statusHtml}</p>
            </div>
            ${item.status === 'pending' ? `
              <div class="admin-item-actions">
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Mark Read</button>
              </div>
            ` : ''}
          </div>
        `;

      case 'payroll':
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${capitalize(item.issue_type.replace(/_/g, ' '))}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Pay Period:</strong> ${escapeHtml(item.pay_period)}</p>
              ${item.expected_amount ? `<p><strong>Expected:</strong> $${item.expected_amount} | <strong>Received:</strong> $${item.received_amount || 'N/A'}</p>` : ''}
              <p>${escapeHtml(item.details)}</p>
              <p>${statusHtml}</p>
            </div>
            ${item.status === 'pending' ? actionsHtml : ''}
          </div>
        `;

      case 'uniforms':
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Items:</strong> ${escapeHtml(item.items)}</p>
              <p><strong>Sizes:</strong> Shirt: ${item.shirt_size || 'N/A'} | Pants: ${escapeHtml(item.pant_size || 'N/A')} | Shoes: ${escapeHtml(item.shoe_size || 'N/A')}</p>
              ${item.notes ? `<p><strong>Notes:</strong> ${escapeHtml(item.notes)}</p>` : ''}
              <p>${statusHtml}</p>
            </div>
            ${item.status === 'pending' ? actionsHtml : ''}
          </div>
        `;

      case 'loading':
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${escapeHtml(item.truck_id)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              ${item.route ? `<p><strong>Route:</strong> ${escapeHtml(item.route)}</p>` : ''}
              <p><strong>Priority:</strong> ${capitalize(item.priority)}</p>
              <p>${escapeHtml(item.suggestion)}</p>
              <p>${statusHtml}</p>
            </div>
            ${item.status === 'pending' ? `
              <div class="admin-item-actions">
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Acknowledge</button>
              </div>
            ` : ''}
          </div>
        `;

      default:
        return '';
    }
  }
};
