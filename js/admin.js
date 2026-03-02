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
      const [driverCount, vacCount, contactCount, payrollCount, uniformCount, loadingCount, inspCount, accCount] = await Promise.all([
        DB.count('profiles', { role: 'driver' }),
        DB.count('vacation_requests'),
        DB.count('contact_messages'),
        DB.count('payroll_issues'),
        DB.count('uniform_requests'),
        DB.count('loading_suggestions'),
        DB.count('trip_inspections'),
        DB.count('accident_reports')
      ]);

      document.getElementById('stat-drivers').textContent = driverCount;
      document.getElementById('stat-vacation').textContent = vacCount;
      document.getElementById('stat-contact').textContent = contactCount;
      document.getElementById('stat-payroll').textContent = payrollCount;
      document.getElementById('stat-uniforms').textContent = uniformCount;
      document.getElementById('stat-loading').textContent = loadingCount;
      document.getElementById('stat-inspections').textContent = inspCount;
      document.getElementById('stat-accidents').textContent = accCount;
    } catch (err) {
      console.error('Error loading admin stats:', err);
    }

    // Load current tab content
    this.loadTabContent(this.currentTab);
  },

  async loadTabContent(tab) {
    const container = document.getElementById('admin-content');
    container.innerHTML = '<p class="empty-state">Loading...</p>';

    // Special handling for drivers tab
    if (tab === 'drivers') {
      this.loadDriversTab(container);
      return;
    }

    const tableMap = {
      vacation: 'vacation_requests',
      contact: 'contact_messages',
      payroll: 'payroll_issues',
      uniforms: 'uniform_requests',
      loading: 'loading_suggestions',
      inspections: 'trip_inspections',
      accidents: 'accident_reports'
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

    const tableMap = {
      vacation: 'vacation_requests',
      contact: 'contact_messages',
      payroll: 'payroll_issues',
      uniforms: 'uniform_requests',
      loading: 'loading_suggestions',
      inspections: 'trip_inspections',
      accidents: 'accident_reports'
    };
    const tableName = tableMap[tab];
    const deleteHtml = `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteRecord('${tableName}', '${item.id}', this)" title="Delete">&#128465; Delete</button>`;

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
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
                <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
              ` : ''}
              ${deleteHtml}
            </div>
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
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Mark Read</button>
              ` : ''}
              ${deleteHtml}
            </div>
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
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
                <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
              ` : ''}
              ${deleteHtml}
            </div>
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
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
                <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
              ` : ''}
              ${deleteHtml}
            </div>
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
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Acknowledge</button>
              ` : ''}
              ${deleteHtml}
            </div>
          </div>
        `;

      case 'inspections':
        const inspPhotos = item.photo_urls ? item.photo_urls.split(',').map(url =>
          `<img src="${escapeHtml(url.trim())}" alt="Inspection photo" class="admin-photo">`
        ).join('') : '';
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${capitalize(item.trip_type)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Date:</strong> ${formatDate(item.trip_date)} | <strong>Vehicle:</strong> ${escapeHtml(item.vehicle_id)}</p>
              ${item.mileage ? `<p><strong>Mileage:</strong> ${escapeHtml(item.mileage)}</p>` : ''}
              ${item.checklist ? `<p><strong>Checklist:</strong> ${escapeHtml(item.checklist)}</p>` : ''}
              ${item.notes ? `<p><strong>Notes:</strong> ${escapeHtml(item.notes)}</p>` : ''}
              ${inspPhotos ? `<div class="photo-grid">${inspPhotos}</div>` : ''}
              <p>${statusHtml}</p>
            </div>
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
                <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
              ` : ''}
              ${deleteHtml}
            </div>
          </div>
        `;

      case 'accidents':
        const accPhotos = item.photo_urls ? item.photo_urls.split(',').map(url =>
          `<img src="${escapeHtml(url.trim())}" alt="Accident photo" class="admin-photo">`
        ).join('') : '';
        return `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${escapeHtml(item.user_name)} - ${escapeHtml(item.location)}</h4>
              <span class="meta">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="admin-item-body">
              <p><strong>Date:</strong> ${formatDate(item.report_date)} | <strong>Time:</strong> ${item.incident_time}</p>
              <p><strong>Vehicle:</strong> ${escapeHtml(item.vehicle_id)} | <strong>Damage:</strong> ${capitalize(item.damage_level)}</p>
              <p>${escapeHtml(item.description)}</p>
              ${item.injuries ? `<p style="color:var(--danger)"><strong>Injuries:</strong> ${escapeHtml(item.injuries_description || 'Yes')}</p>` : '<p><strong>Injuries:</strong> None</p>'}
              ${item.witness_info ? `<p><strong>Witnesses:</strong> ${escapeHtml(item.witness_info)}</p>` : ''}
              ${item.police_report_number ? `<p><strong>Police Report #:</strong> ${escapeHtml(item.police_report_number)}</p>` : ''}
              ${accPhotos ? `<div class="photo-grid">${accPhotos}</div>` : ''}
              <p>${statusHtml}</p>
            </div>
            <div class="admin-item-actions">
              ${item.status === 'pending' ? `
                <button class="btn btn-success btn-sm admin-action-btn" data-id="${item.id}" data-action="approved">Approve</button>
                <button class="btn btn-danger btn-sm admin-action-btn" data-id="${item.id}" data-action="denied">Deny</button>
              ` : ''}
              ${deleteHtml}
            </div>
          </div>
        `;

      default:
        return '';
    }
  },

  // ===== Driver Management =====
  async loadDriversTab(container) {
    container.innerHTML = `
      <div style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">&#128100; Add New Driver</h3>
        <form id="add-driver-form" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:0.75rem;align-items:end">
          <div class="form-group" style="margin:0">
            <label for="new-driver-name">Full Name</label>
            <input type="text" id="new-driver-name" placeholder="John Smith" required>
          </div>
          <div class="form-group" style="margin:0">
            <label for="new-driver-email">Email</label>
            <input type="email" id="new-driver-email" placeholder="john@email.com" required>
          </div>
          <div class="form-group" style="margin:0">
            <label for="new-driver-password">Temp Password</label>
            <input type="text" id="new-driver-password" placeholder="Min 6 characters" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-sm" style="height:40px;white-space:nowrap">+ Add Driver</button>
        </form>
      </div>
      <h3 style="margin-bottom:0.75rem">All Drivers</h3>
      <div id="drivers-list"><p class="empty-state">Loading drivers...</p></div>
    `;

    // Setup form handler
    document.getElementById('add-driver-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const name = document.getElementById('new-driver-name').value.trim();
      const email = document.getElementById('new-driver-email').value.trim();
      const password = document.getElementById('new-driver-password').value;

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      setButtonLoading(btn, true);
      try {
        await DB.rpc('create_driver', {
          driver_name: name,
          driver_email: email,
          driver_password: password
        });
        showToast(`Driver "${name}" created successfully!`, 'success');
        e.target.reset();
        this.loadDriversList();
        this.loadDashboard();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });

    this.loadDriversList();
  },

  async loadDriversList() {
    const listContainer = document.getElementById('drivers-list');
    if (!listContainer) return;
    try {
      const drivers = await DB.select('profiles');
      if (drivers.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No drivers yet</p>';
        return;
      }
      listContainer.innerHTML = drivers.map(d => `
        <div class="admin-item">
          <div class="admin-item-header">
            <h4>${escapeHtml(d.name)}</h4>
            <span class="meta">${formatDateTime(d.created_at)}</span>
          </div>
          <div class="admin-item-body">
            <p><strong>Email:</strong> ${escapeHtml(d.email)}</p>
            <p><strong>Role:</strong> <span class="status-badge ${d.role === 'admin' ? 'status-approved' : 'status-pending'}">${capitalize(d.role)}</span></p>
          </div>
          ${d.role !== 'admin' ? `
            <div class="admin-item-actions">
              <button class="btn btn-danger btn-sm delete-btn" onclick="deleteRecord('profiles', '${d.id}', this)" title="Remove driver">&#128465; Remove</button>
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (err) {
      listContainer.innerHTML = '<p class="empty-state">Error loading drivers</p>';
    }
  }
};
