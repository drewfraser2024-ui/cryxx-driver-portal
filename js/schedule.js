// ===== Schedule Module =====
const Schedule = {
  currentWeekStart: null,

  init() {
    // Set current week (Monday start)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    this.currentWeekStart = new Date(today.setDate(diff));
    this.currentWeekStart.setHours(0, 0, 0, 0);

    // Navigation
    document.getElementById('schedule-prev').addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
      this.render();
    });

    document.getElementById('schedule-next').addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.render();
    });

    // Admin schedule form
    if (Auth.isAdmin()) {
      document.getElementById('admin-schedule-controls').classList.remove('hidden');
      this.loadDriverList();

      document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await DB.insert('schedule_entries', {
            driver_id: document.getElementById('sched-driver').value,
            driver_name: document.getElementById('sched-driver').selectedOptions[0].text,
            date: document.getElementById('sched-date').value,
            start_time: document.getElementById('sched-start').value,
            end_time: document.getElementById('sched-end').value,
            route: document.getElementById('sched-route').value
          });
          document.getElementById('schedule-form').reset();
          showToast('Schedule entry added!', 'success');
          this.render();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
      });
    }
  },

  async loadDriverList() {
    const select = document.getElementById('sched-driver');
    try {
      const drivers = await DB.select('profiles', { role: 'driver' });
      drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error('Error loading driver list:', err);
    }
  },

  async render() {
    const grid = document.getElementById('schedule-grid');
    const label = document.getElementById('schedule-week-label');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update week label
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    label.textContent = `Week of ${this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Fetch schedule entries for this week
    let entries = [];
    try {
      const allEntries = await DB.select('schedule_entries');
      const weekStartStr = this.dateToStr(this.currentWeekStart);
      const weekEndStr = this.dateToStr(weekEnd);

      entries = allEntries.filter(e => {
        return e.date >= weekStartStr && e.date <= weekEndStr;
      });

      // If not admin, only show own entries
      if (!Auth.isAdmin()) {
        entries = entries.filter(e => e.driver_id === Auth.getUserId());
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    }

    // Build grid
    grid.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = this.dateToStr(date);
      const isToday = date.getTime() === today.getTime();
      const dayEntries = entries.filter(e => e.date === dateStr);

      const dayEl = document.createElement('div');
      dayEl.className = 'schedule-day';
      dayEl.innerHTML = `
        <div class="schedule-day-header ${isToday ? 'today' : ''}">
          ${days[i]}<br>${date.getDate()}
        </div>
        <div class="schedule-day-content">
          ${dayEntries.length > 0 ? dayEntries.map(e => `
            <div class="schedule-entry">
              <div class="time">${this.formatTime(e.start_time)} - ${this.formatTime(e.end_time)}</div>
              ${e.route ? `<div class="route">${escapeHtml(e.route)}</div>` : ''}
              ${Auth.isAdmin() ? `<div class="route">${escapeHtml(e.driver_name)}</div>` : ''}
            </div>
          `).join('') : '<p style="font-size:0.75rem;color:var(--gray-400);text-align:center;padding:0.5rem">No shifts</p>'}
        </div>
      `;
      grid.appendChild(dayEl);
    }
  },

  dateToStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
};
