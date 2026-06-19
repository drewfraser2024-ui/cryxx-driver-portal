// ===== Employee Handbook Module =====
const Handbook = {
  initialized: false,

  // Bump this when the handbook text changes so drivers can be asked to re-sign.
  VERSION: '1.5',

  // Single source of truth for the handbook body (used on the auth screen and the handbook page).
  contentHTML() {
    return `
      <div class="handbook-doc">
        <p class="handbook-intro">Welcome to <strong>CRYXX Solutions and Associates Inc.</strong> This handbook
        outlines the standards, expectations, and policies that every driver agrees to follow. Please read it
        carefully &mdash; by signing, you confirm that you understand and agree to abide by these terms.</p>

        <h3>1. Code of Conduct</h3>
        <p>All drivers represent CRYXX Solutions on the road and with customers. You are expected to act
        professionally, honestly, and respectfully at all times. Harassment, discrimination, theft, dishonesty,
        or any unlawful behavior will not be tolerated and may result in immediate termination.</p>

        <h3>2. Safety &amp; Compliance</h3>
        <ul>
          <li>Obey all federal, state, and local traffic laws at all times.</li>
          <li>Always wear your seat belt and require passengers to do the same.</li>
          <li>No use of handheld mobile devices while operating a vehicle.</li>
          <li>Complete required pre-trip and post-trip inspections before and after every route.</li>
          <li>Report any unsafe vehicle condition immediately and do not operate an unsafe vehicle.</li>
        </ul>

        <h3>3. Hours of Service</h3>
        <p>Drivers must comply with all applicable Hours of Service (HOS) regulations. Accurate logging of
        driving time, breaks, and rest periods is mandatory. Falsifying logs is grounds for termination.</p>

        <h3>4. Drug &amp; Alcohol Policy</h3>
        <p>CRYXX Solutions maintains a strict zero-tolerance policy. Operating a company vehicle under the
        influence of alcohol, illegal drugs, or any impairing substance is strictly prohibited. Drivers are
        subject to pre-employment, random, and post-incident testing as permitted by law.</p>

        <h3>5. Vehicle Care &amp; Loading</h3>
        <p>You are responsible for the cleanliness, fuel level, and general care of your assigned vehicle.
        Loads must be secured and distributed safely. Report mechanical issues, damage, or accidents promptly
        through the appropriate sections of this portal.</p>

        <h3>6. Uniform &amp; Appearance</h3>
        <p>Drivers must wear the approved CRYXX uniform and maintain a clean, professional appearance while on
        duty. Upon starting employment, every employee is issued an initial uniform allotment of three (3) pairs
        of pants or shorts and three (3) shirts at no cost. Additional or replacement items can be requested
        through the Uniform Request section of this portal.</p>

        <h3>7. Attendance, Time Off &amp; Paid Leave</h3>
        <p>Reliable attendance is essential. Time-off and vacation requests must be submitted in advance through
        the Days Off / Vacation section.</p>
        <p>A &ldquo;no-call/no-show&rdquo; occurs when an employee fails to report for a scheduled shift without
        notifying management in advance. No-call/no-show incidents are subject to the following progressive
        disciplinary action:</p>
        <ul>
          <li><strong>First occurrence:</strong> verbal warning.</li>
          <li><strong>Second occurrence:</strong> one (1) day suspension.</li>
          <li><strong>Third occurrence:</strong> three (3) day suspension.</li>
          <li><strong>Fourth occurrence:</strong> termination of employment.</li>
        </ul>
        <p>Paid leave is provided on an annual basis as follows:</p>
        <ul>
          <li><strong>Drivers</strong> receive five (5) paid sick days and two (2) personal days per year.</li>
          <li><strong>Managers</strong> receive seven (7) paid sick days and seven (7) personal days per year.</li>
          <li><strong>Paid vacation:</strong> after completing two (2) years of continuous service, employees
          become eligible for one (1) week of paid vacation, compensated at a flat rate of $350&ndash;$500.</li>
        </ul>

        <h3>8. Peak Season</h3>
        <p>Several weeks throughout the year are designated as &ldquo;peak&rdquo; periods. A peak period is any
        time of predicted high delivery volume. Our primary peak season extends from the Friday after
        Thanksgiving (&ldquo;Cyber Monday&rdquo; weekend) through the second Saturday in January; this end date
        may flex depending on volume forecasts. Team members will be notified well in advance of peak scheduling
        and are expected to report to work on all designated days. Team members are compensated accordingly for
        the additional days worked during peak.</p>
        <p>During peak season, all team members are required to observe the following:</p>
        <ul>
          <li><strong>Six-day work weeks are mandatory.</strong> You will be scheduled to work six (6) days each
          week throughout peak.</li>
          <li><strong>Report to work on time</strong>, between 7:00 a.m. and 8:00 a.m. (tentative) on your scheduled days.</li>
          <li><strong>Extended hours of service.</strong> Routes will run later into the evening. As this period
          falls in winter, team members should expect to complete deliveries after dark.</li>
          <li><strong>No time off will be approved during peak season.</strong> Due to extremely high volumes and
          our customers' reliance on your commitment, no time-off requests will be granted during November or
          December. Taking unauthorized time off during peak may result in termination.</li>
          <li><strong>Seasonal status.</strong> During peak, all team members work as seasonal employees.
          Following the season, managers will hold a performance discussion with each team member in the new year
          to determine eligibility for full-time employment based on performance.</li>
        </ul>

        <h3>9. Resignation &amp; Final Pay</h3>
        <p>Employees who intend to leave the company must submit written notice of resignation at least two (2)
        weeks in advance. Failure to provide the required two weeks' notice will result in forfeiture of your
        final paycheck, to the extent permitted by applicable law.</p>

        <h3>10. Reporting Procedures</h3>
        <p>Accidents, injuries, safety concerns, payroll discrepancies, and other issues must be reported
        promptly using the relevant sections of this portal. All workplace injuries must be reported no later
        than twenty-four (24) hours after the incident occurs. Honest and timely reporting protects you, your
        coworkers, and the company.</p>

        <h3>11. Acknowledgment</h3>
        <p>By signing this handbook, you acknowledge that you have read, understood, and agree to comply with all
        policies described above. You understand that this handbook may be updated and that continued employment
        is contingent on adherence to current policies. This handbook is not an employment contract and does not
        guarantee employment for any specific period.</p>
      </div>
    `;
  },

  init() {
    this.renderContent();
    if (this.initialized) {
      this.loadStatus();
      return;
    }
    this.initialized = true;

    const signBtn = document.getElementById('handbook-sign-btn');
    const agreeCheckbox = document.getElementById('handbook-agree');
    if (signBtn && agreeCheckbox) {
      agreeCheckbox.addEventListener('change', () => {
        signBtn.disabled = !agreeCheckbox.checked;
      });
      signBtn.addEventListener('click', async () => {
        if (!agreeCheckbox.checked) return;
        setButtonLoading(signBtn, true);
        signBtn.disabled = true;
        try {
          await this.recordAcknowledgment();
          showToast('Handbook signed. Thank you!', 'success');
          await this.loadStatus();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
          signBtn.disabled = false;
        } finally {
          setButtonLoading(signBtn, false);
        }
      });
    }

    this.loadStatus();
  },

  // Inject the handbook body into the page and the registration preview.
  renderContent() {
    const html = this.contentHTML();
    const pageEl = document.getElementById('handbook-content');
    if (pageEl) pageEl.innerHTML = html;
    const regEl = document.getElementById('reg-handbook-content');
    if (regEl && !regEl.dataset.rendered) {
      regEl.innerHTML = html;
      regEl.dataset.rendered = 'true';
    }
  },

  // Record that the current user has signed the handbook (idempotent-ish; ignores duplicates).
  async recordAcknowledgment() {
    return DB.insert('handbook_acknowledgments', {
      user_id: Auth.getUserId(),
      user_name: Auth.getUserName(),
      version: this.VERSION
    });
  },

  // Show whether the current user has already signed; otherwise show the sign-now prompt.
  async loadStatus() {
    const statusEl = document.getElementById('handbook-status');
    const signCard = document.getElementById('handbook-sign-card');
    if (!statusEl) return;

    try {
      const records = await DB.select('handbook_acknowledgments', { user_id: Auth.getUserId() });
      const signed = records.find(r => r.version === this.VERSION) || records[0];

      if (signed) {
        statusEl.innerHTML = `
          <div class="handbook-signed">
            <span class="handbook-check">&#10003;</span>
            <div>
              <strong>Signed</strong>
              <p>Acknowledged by ${escapeHtml(signed.user_name)} on ${formatDateTime(signed.signed_at || signed.created_at)} (v${escapeHtml(signed.version || this.VERSION)})</p>
            </div>
          </div>
        `;
        statusEl.classList.remove('hidden');
        if (signCard) signCard.classList.add('hidden');
      } else {
        statusEl.innerHTML = `
          <div class="handbook-unsigned">
            <span class="handbook-warn">&#9888;</span>
            <div>
              <strong>Not yet signed</strong>
              <p>Please review the handbook below and sign to confirm your agreement.</p>
            </div>
          </div>
        `;
        statusEl.classList.remove('hidden');
        if (signCard) {
          signCard.classList.remove('hidden');
          const agreeCheckbox = document.getElementById('handbook-agree');
          const signBtn = document.getElementById('handbook-sign-btn');
          if (agreeCheckbox) agreeCheckbox.checked = false;
          if (signBtn) signBtn.disabled = true;
        }
      }
    } catch (err) {
      statusEl.innerHTML = '<div class="empty-state">Unable to load signature status</div>';
      statusEl.classList.remove('hidden');
    }
  }
};
