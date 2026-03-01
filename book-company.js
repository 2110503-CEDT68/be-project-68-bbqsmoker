/* book-company.js */
const API_BASE = 'http://localhost:5000/api/v1';
const MAX_BOOKINGS = 3;

// ── Auth guard
const token = localStorage.getItem('jf_token');
if (!token) window.location.href = 'login.html';

// ── Set username in nav
const user = (() => { try { return JSON.parse(localStorage.getItem('jf_user')); } catch { return null; } })();
if (user) document.getElementById('userName').textContent = user.name || user.email || 'User';

// ── State
const LOGOS = ['🏢','💼','🚀','⚡','🌐','🏦','🔬','🎯','🛠','📦','🖥','🎨'];
let allCompanies     = [];
let bookedCompanyIds = new Set();   // Set of company IDs that are booked
let bookingMap       = {};          // companyId → { bookingId, bookingDate }
let pendingCompany   = null;
let editMode         = false;       // true = editing existing booking date

// ── Auth helpers
function logout() {
  localStorage.removeItem('jf_token');
  localStorage.removeItem('jf_user');
  window.location.href = 'login.html';
}

async function apiFetch(method, path, body = null) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (res.status === 401) { logout(); return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.msg || 'Request failed');
  return data;
}

// ── Toast
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3500);
}

// ── Load companies + existing bookings
async function loadData() {
  try {
    const [companiesRes, bookingsRes] = await Promise.allSettled([
      apiFetch('GET', '/companies'),
      apiFetch('GET', '/bookings'),
    ]);

    if (companiesRes.status === 'fulfilled') {
      allCompanies = companiesRes.value?.data || [];
    }

    if (bookingsRes.status === 'fulfilled') {
      const bookings = bookingsRes.value?.data || [];
      bookedCompanyIds = new Set();
      bookingMap = {};
      bookings.forEach(b => {
        const cid = String(b.company?._id || b.company?.id || '');
        if (cid) {
          bookedCompanyIds.add(cid);
          bookingMap[cid] = {
            bookingId:   b._id || b.id,
            bookingDate: (b.bookingDate || '').slice(0, 10), // YYYY-MM-DD
          };
        }
      });
    }

    document.getElementById('subtext').textContent =
      `${allCompanies.length} companies participating in this Jobfair.`;

    renderCompanies(allCompanies);

  } catch (err) {
    document.getElementById('companiesGrid').innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Could not load companies</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// ── Render company cards
function renderCompanies(list) {
  const isFull = bookedCompanyIds.size >= MAX_BOOKINGS;

  if (!list.length) {
    document.getElementById('companiesGrid').innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No companies found</h3>
        <p>Try a different search term.</p>
      </div>`;
    return;
  }

  document.getElementById('companiesGrid').innerHTML = list.map((c, i) => {
    const id       = String(c._id || c.id);
    const isBooked = bookedCompanyIds.has(id);
    const website  = c.website || '';
    const websiteHref = website
      ? (website.startsWith('http') ? website : 'https://' + website)
      : '#';

    // Footer button logic
    let footerBtn;
    if (isBooked) {
      const info = bookingMap[id] || {};
      const dateLabel = info.bookingDate
        ? new Date(...info.bookingDate.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
        : '';
      footerBtn = `
        <div style="display:flex;align-items:center;gap:8px;margin-top:auto;width:100%;justify-content:space-between;padding-top:4px;border-top:1px solid var(--border)">
          <span class="btn-booked">✓ Booked${dateLabel ? ' · ' + dateLabel : ''}</span>
          <button class="btn-edit" onclick="openEditModal('${id}')">✏️ Edit Date</button>
        </div>`;
    } else if (isFull) {
      footerBtn = `
        <div class="company-footer">
          <span class="btn-limit">Booking limit reached</span>
        </div>`;
    } else {
      footerBtn = `
        <div class="company-footer">
          <button class="btn-book" onclick="openModal('${id}')">Book Now</button>
        </div>`;
    }

    return `
      <div class="company-card ${isBooked ? 'is-booked' : ''}" style="animation-delay:${i * .04}s">
        <div class="company-top">
          <div class="company-logo">${LOGOS[i % LOGOS.length]}</div>
          <div>
            <div class="company-name">${c.name}</div>
            <div class="company-sub">${c.address || ''}</div>
          </div>
        </div>

        ${c.description ? `<p class="company-desc">${c.description.length > 110 ? c.description.slice(0, 110) + '...' : c.description}</p>` : ''}

        <div class="company-contacts">
          ${c.telephone_number ? `
            <div class="c-contact">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.88 12 19.79 19.79 0 0 1 1.79 3.38 2 2 0 0 1 3.78 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              ${c.telephone_number}
            </div>` : ''}
          ${website ? `
            <div class="c-contact">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <a href="${websiteHref}" target="_blank">${website}</a>
            </div>` : ''}
        </div>

        ${footerBtn}
      </div>`;
  }).join('');
}

// ── Search filter
function filterCompanies() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = !q ? allCompanies : allCompanies.filter(c =>
    (c.name        || '').toLowerCase().includes(q) ||
    (c.description || '').toLowerCase().includes(q) ||
    (c.address     || '').toLowerCase().includes(q)
  );
  renderCompanies(filtered);
}

// ── Open NEW booking modal
function openModal(companyId) {
  const c = allCompanies.find(x => String(x._id || x.id) === String(companyId));
  if (!c) return;

  // Extra guard: ถ้าจองครบแล้ว ไม่ให้เปิด modal
  if (bookedCompanyIds.size >= MAX_BOOKINGS) {
    showToast('You have reached the 3-booking limit.', 'error');
    return;
  }

  editMode = false;
  pendingCompany = c;

  document.getElementById('mCompany').textContent = c.name             || '--';
  document.getElementById('mAddress').textContent = c.address          || '--';
  document.getElementById('mWebsite').textContent = c.website          || '--';
  document.getElementById('mTel').textContent     = c.telephone_number || '--';
  document.getElementById('bookingDateInput').value = '2022-05-10';

  // Modal title
  document.querySelector('#modalOverlay .modal h3').textContent = 'Confirm Booking';
  document.querySelector('#modalOverlay .modal-sub').textContent = 'Choose your interview date below.';
  document.getElementById('confirmBtn').textContent = 'Confirm Booking';

  document.getElementById('modalOverlay').classList.add('open');
}

// ── Open EDIT date modal
function openEditModal(companyId) {
  const c = allCompanies.find(x => String(x._id || x.id) === String(companyId));
  if (!c) return;

  editMode = true;
  pendingCompany = c;

  const info = bookingMap[String(companyId)] || {};

  document.getElementById('mCompany').textContent = c.name             || '--';
  document.getElementById('mAddress').textContent = c.address          || '--';
  document.getElementById('mWebsite').textContent = c.website          || '--';
  document.getElementById('mTel').textContent     = c.telephone_number || '--';
  document.getElementById('bookingDateInput').value = info.bookingDate || '2022-05-10';

  // Modal title
  document.querySelector('#modalOverlay .modal h3').textContent = 'Edit Booking Date';
  document.querySelector('#modalOverlay .modal-sub').textContent = 'Update your preferred interview date.';
  document.getElementById('confirmBtn').textContent = 'Save Changes';

  document.getElementById('modalOverlay').classList.add('open');
}

// ── Close booking modal
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  pendingCompany = null;
  editMode = false;
}

// Close on backdrop click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ── Confirm booking (new or edit)
async function confirmBooking() {
  if (!pendingCompany) return;

  const bookingDate = document.getElementById('bookingDateInput').value;
  if (!bookingDate) { showToast('Please select a booking date.', 'error'); return; }

  // Validate date range
  const [y, m, d] = bookingDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const minDate = new Date(2022, 4, 10);
  const maxDate = new Date(2022, 4, 13);
  if (dateObj < minDate || dateObj > maxDate) {
    showToast('Date must be between May 10-13, 2022.', 'error');
    return;
  }

  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.textContent = editMode ? 'Saving...' : 'Booking...';

  try {
    const companyId = String(pendingCompany._id || pendingCompany.id);

    if (editMode) {
      // ── PUT /api/v1/bookings/:bookingId  (update date)
      const info = bookingMap[companyId];
      if (!info?.bookingId) throw new Error('Booking record not found.');
      await apiFetch('PUT', `/bookings/${info.bookingId}`, { bookingDate });
      bookingMap[companyId].bookingDate = bookingDate;
      showToast(`Updated booking for ${pendingCompany.name} to ${bookingDate}!`, 'success');
    } else {
      // ── POST /api/v1/companies/:companyId/bookings  (new booking)
      const result = await apiFetch('POST', `/companies/${companyId}/bookings`, { bookingDate });
      const newBookingId = result?.data?._id || result?.data?.id || null;
      bookedCompanyIds.add(companyId);
      bookingMap[companyId] = { bookingId: newBookingId, bookingDate };
      showToast(`Booked ${pendingCompany.name} on ${bookingDate} successfully!`, 'success');
    }

    closeModal();
    renderCompanies(allCompanies);

  } catch (err) {
    const msg = err.message || '';
    // Catch limit errors from server (fallback safety net)
    if (!editMode && (msg.includes('already made 3') || msg.toLowerCase().includes('limit') || msg.includes('3 bookings'))) {
      showToast('You have reached the 3-booking limit.', 'error');
      closeModal();
      renderCompanies(allCompanies);
    } else {
      showToast(msg || 'Something went wrong.', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = editMode ? 'Save Changes' : 'Confirm Booking';
  }
}

// ── Init
loadData();