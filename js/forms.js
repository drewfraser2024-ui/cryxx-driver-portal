// ===== Form Handlers =====
const Forms = {
  init() {
    this.setupVacationForm();
    this.setupContactForm();
    this.setupPayrollForm();
    this.setupUniformForm();
    this.setupLoadingForm();
    this.setupInspectionForm();
    this.setupAccidentForm();
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

  // --- Trip Inspections ---
  setupInspectionForm() {
    const form = document.getElementById('inspection-form');
    const photoInput = document.getElementById('insp-photos');
    const previewContainer = document.getElementById('insp-preview');

    // Photo preview on file select
    photoInput.addEventListener('change', () => {
      previewContainer.innerHTML = '';
      Array.from(photoInput.files).forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.className = 'photo-preview-item';
          div.innerHTML = `<img src="${e.target.result}" alt="Preview"><button type="button" class="photo-remove-btn" data-index="${i}">&times;</button>`;
          previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });

    // Remove photo preview (note: can't modify FileList, just hides preview)
    previewContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('photo-remove-btn')) {
        e.target.closest('.photo-preview-item').remove();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        // Upload photos
        const photoUrls = [];
        const files = photoInput.files;
        for (let i = 0; i < files.length; i++) {
          const url = await uploadPhoto(files[i]);
          photoUrls.push(url);
        }

        // Collect checklist
        const checkedItems = Array.from(document.querySelectorAll('input[name="insp-checklist"]:checked'))
          .map(cb => cb.value);

        await DB.insert('trip_inspections', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          trip_type: document.getElementById('insp-type').value,
          trip_date: document.getElementById('insp-date').value,
          vehicle_id: document.getElementById('insp-vehicle').value,
          mileage: document.getElementById('insp-mileage').value || null,
          checklist: checkedItems.join(', '),
          photo_urls: photoUrls.join(','),
          notes: document.getElementById('insp-notes').value,
          status: 'pending'
        });

        form.reset();
        previewContainer.innerHTML = '';
        showFormSuccess(form, 'Inspection submitted!');
        showToast('Trip inspection submitted!', 'success');
        this.loadInspectionHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadInspectionHistory();
  },

  async loadInspectionHistory() {
    const container = document.getElementById('inspection-history');
    try {
      const data = await DB.select('trip_inspections', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128247;</div><p>No inspections submitted yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => {
        const photos = item.photo_urls ? item.photo_urls.split(',').map(url =>
          `<img src="${escapeHtml(url.trim())}" alt="Inspection photo" class="history-photo">`
        ).join('') : '';
        return `
          <div class="history-item">
            <div class="history-item-info">
              <h4>${capitalize(item.trip_type)} - ${escapeHtml(item.vehicle_id)}</h4>
              <p>Date: ${formatDate(item.trip_date)}${item.mileage ? ` | Mileage: ${escapeHtml(item.mileage)}` : ''}</p>
              ${item.checklist ? `<p style="font-size:0.8rem">Checked: ${escapeHtml(item.checklist)}</p>` : ''}
              ${item.notes ? `<p>${escapeHtml(truncate(item.notes, 100))}</p>` : ''}
              ${photos ? `<div class="photo-grid">${photos}</div>` : ''}
              <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)}</p>
            </div>
            <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
  },

  // --- Accident Reports ---
  setupAccidentForm() {
    const form = document.getElementById('accident-form');
    const photoInput = document.getElementById('acc-photos');
    const previewContainer = document.getElementById('acc-preview');
    const injuriesCheckbox = document.getElementById('acc-injuries');
    const injuriesDetailGroup = document.getElementById('acc-injuries-detail-group');

    // Toggle injuries detail
    injuriesCheckbox.addEventListener('change', () => {
      injuriesDetailGroup.classList.toggle('hidden', !injuriesCheckbox.checked);
    });

    // Photo preview on file select
    photoInput.addEventListener('change', () => {
      previewContainer.innerHTML = '';
      Array.from(photoInput.files).forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.className = 'photo-preview-item';
          div.innerHTML = `<img src="${e.target.result}" alt="Preview"><button type="button" class="photo-remove-btn" data-index="${i}">&times;</button>`;
          previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });

    previewContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('photo-remove-btn')) {
        e.target.closest('.photo-preview-item').remove();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);
      try {
        // Upload photos
        const photoUrls = [];
        const files = photoInput.files;
        for (let i = 0; i < files.length; i++) {
          const url = await uploadPhoto(files[i]);
          photoUrls.push(url);
        }

        const hasInjuries = injuriesCheckbox.checked;

        await DB.insert('accident_reports', {
          user_id: Auth.getUserId(),
          user_name: Auth.getUserName(),
          report_date: document.getElementById('acc-date').value,
          incident_time: document.getElementById('acc-time').value,
          location: document.getElementById('acc-location').value,
          vehicle_id: document.getElementById('acc-vehicle').value,
          description: document.getElementById('acc-description').value,
          injuries: hasInjuries,
          injuries_description: hasInjuries ? document.getElementById('acc-injuries-detail').value : null,
          damage_level: document.getElementById('acc-damage').value,
          photo_urls: photoUrls.join(','),
          witness_info: document.getElementById('acc-witness').value || null,
          police_report_number: document.getElementById('acc-police').value || null,
          status: 'pending'
        });

        form.reset();
        previewContainer.innerHTML = '';
        injuriesDetailGroup.classList.add('hidden');
        showFormSuccess(form, 'Report submitted!');
        showToast('Accident report submitted!', 'success');
        this.loadAccidentHistory();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
    this.loadAccidentHistory();
  },

  async loadAccidentHistory() {
    const container = document.getElementById('accident-history');
    try {
      const data = await DB.select('accident_reports', { user_id: Auth.getUserId() });
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#9888;</div><p>No reports submitted yet</p></div>';
        return;
      }
      container.innerHTML = data.map(item => {
        const photos = item.photo_urls ? item.photo_urls.split(',').map(url =>
          `<img src="${escapeHtml(url.trim())}" alt="Accident photo" class="history-photo">`
        ).join('') : '';
        return `
          <div class="history-item">
            <div class="history-item-info">
              <h4>${escapeHtml(item.location)} - ${capitalize(item.damage_level)}</h4>
              <p>Date: ${formatDate(item.report_date)} | Vehicle: ${escapeHtml(item.vehicle_id)}</p>
              <p>${escapeHtml(truncate(item.description, 100))}</p>
              ${item.injuries ? `<p style="color:var(--danger)"><strong>Injuries reported</strong></p>` : ''}
              ${photos ? `<div class="photo-grid">${photos}</div>` : ''}
              <p style="font-size:0.75rem;color:var(--gray-400)">Submitted ${formatDateTime(item.created_at)}</p>
            </div>
            <span class="status-badge status-${item.status}">${capitalize(item.status)}</span>
          </div>
        `;
      }).join('');
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
    this.loadInspectionHistory();
    this.loadAccidentHistory();
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
      loading: 'loading_suggestions',
      inspections: 'trip_inspections',
      accidents: 'accident_reports'
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
