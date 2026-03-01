/* dashboard.js */
const API_BASE = 'http://localhost:5000/api/v1';
const MAX_BOOKINGS = 3;

const LOGOS = ['🏢','💼','🚀','⚡','🌐','🏦','🔬','🎯','🛠','📦','🖥','🎨'];

// ── Auth guard
const token = localStorage.getItem('jf_token');
if (!token) window.location.href = 'login.html';

const user = (() => { try { return JSON.parse(localStorage.getItem('jf_user')); } catch { return null; } })();
if (user) document.getElementById('userName').textContent = user.name || user.email || 'User';

// ── State
let allBookings = [];
let pendingCancelId   = null;
let pendingCancelBtn  = null;
let pendingEditId     = null;   // booking _id
let pendingEditCompany = '';

// ── Auth helper
function logout() {
  localStorage.removeItem('jf_token');
  localStorage.removeItem('jf_user');
  window.location.href = 'login.html';
}

async function apiFetch(method, path, body = null) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
  setTimeout(() => t.className = 'toast', 3200);
}

// ── Format date  (YYYY-MM-DD → "10 May 2022", avoids timezone shift)
function formatDate(iso) {
  if (!iso) return 'TBD';
  try {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return iso; }
}

// ── Update "Book a Company" button
function updateBookButton(count) {
  const bookBtn = document.getElementById('bookMoreBtn');
  if (!bookBtn) return;
  if (count >= MAX_BOOKINGS) {
    bookBtn.classList.add('disabled');
    bookBtn.setAttribute('title', 'Maximum 3 bookings reached');
    bookBtn.removeAttribute('href');
  } else {
    bookBtn.classList.remove('disabled');
    bookBtn.setAttribute('href', 'book-company.html');
    bookBtn.removeAttribute('title');
  }
}

// ══════════════════════════════════════════
//  RENDER BOOKINGS
// ══════════════════════════════════════════
function renderBookings(bookings) {
  allBookings = bookings;
  const count = bookings.length;
  document.getElementById('statTotal').textContent  = count;
  document.getElementById('statRemain').textContent = Math.max(0, MAX_BOOKINGS - count);
  updateBookButton(count);

  if (!bookings.length) {
    document.getElementById('bookingsList').innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <h3>No bookings yet</h3>
        <p>You haven't booked any sessions. Browse companies below to get started.</p>
        <a href="book-company.html" class="btn-primary">Browse Companies</a>
      </div>`;
    return;
  }

  document.getElementById('bookingsList').innerHTML =
    `<div class="bookings-list">` +
    bookings.map((b, i) => {
      const company = b.company || {};
      const website = company.website || '';
      const websiteHref = website
        ? (website.startsWith('http') ? website : 'https://' + website) : '#';
      const safeName = (company.name || '').replace(/'/g, "\\'");

      return `
        <div class="booking-card" style="animation-delay:${i * .07}s">
          <div style="display:flex;align-items:flex-start;gap:14px;flex:1;min-width:0">
            <div class="booking-number">${i + 1}</div>
            <div style="flex:1;min-width:0">

              <!-- Company name → clickable -->
              <div class="b-company b-company-link" onclick="openDetailModal('${b._id}')"
                   title="View company details">
                ${company.name || 'Unknown Company'}
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"
                     viewBox="0 0 24 24" style="opacity:.45;flex-shrink:0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>

              <div class="b-meta">
                <!-- Date tag → clickable to edit -->
                <span class="b-tag b-tag-date" onclick="openEditModal('${b._id}', '${safeName}', '${(b.bookingDate||'').slice(0,10)}')"
                      title="Click to change date" style="cursor:pointer">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  ${formatDate(b.bookingDate)}
                  <span style="font-size:.7rem;color:var(--accent);margin-left:3px">✏️</span>
                </span>

                ${company.address ? `
                  <span class="b-tag">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${company.address}
                  </span>` : ''}
                ${company.telephone_number ? `
                  <span class="b-tag">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.88 12 19.79 19.79 0 0 1 1.79 3.38 2 2 0 0 1 3.78 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    ${company.telephone_number}
                  </span>` : ''}
                ${website ? `
                  <span class="b-tag">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <a href="${websiteHref}" target="_blank">${website}</a>
                  </span>` : ''}
              </div>
            </div>
          </div>

          <div class="b-actions">
            <button class="btn-edit-date" onclick="openEditModal('${b._id}','${safeName}','${(b.bookingDate||'').slice(0,10)}')">
              ✏️ Edit Date
            </button>
            <button class="btn-cancel"
              onclick="openCancelModal('${b._id}','${safeName}',this)">
              Cancel
            </button>
          </div>
        </div>`;
    }).join('') +
    `</div>`;
}

// ══════════════════════════════════════════
//  EDIT DATE MODAL
// ══════════════════════════════════════════
function openEditModal(bookingId, companyName, currentDate) {
  pendingEditId      = bookingId;
  pendingEditCompany = companyName;
  document.getElementById('editModalCompany').textContent = companyName;
  document.getElementById('editDateInput').value = currentDate || '2022-05-10';
  document.getElementById('editModalOverlay').classList.add('open');
}

function closeEditModal() {
  document.getElementById('editModalOverlay').classList.remove('open');
  pendingEditId = null;
}

async function confirmEdit() {
  if (!pendingEditId) return;

  const newDate = document.getElementById('editDateInput').value;
  if (!newDate) { showToast('Please select a date.', 'error'); return; }

  const [y, m, d] = newDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (dateObj < new Date(2022, 4, 10) || dateObj > new Date(2022, 4, 13)) {
    showToast('Date must be between May 10-13, 2022.', 'error');
    return;
  }

  const btn = document.getElementById('confirmEditBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    await apiFetch('PUT', `/bookings/${pendingEditId}`, { bookingDate: newDate });
    closeEditModal();
    showToast(`✅ Date updated to ${formatDate(newDate)}!`, 'success');
    loadBookings();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

document.getElementById('editModalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('editModalOverlay')) closeEditModal();
});

// ══════════════════════════════════════════
//  COMPANY DETAIL MODAL
// ══════════════════════════════════════════
function openDetailModal(bookingId) {
  const b = allBookings.find(x => x._id === bookingId);
  if (!b) return;

  const c = b.company || {};
  const idx = allBookings.indexOf(b);
  const website = c.website || '';
  const websiteHref = website
    ? (website.startsWith('http') ? website : 'https://' + website) : null;

  document.getElementById('detailIcon').textContent  = LOGOS[idx % LOGOS.length];
  document.getElementById('detailName').textContent  = c.name    || 'Unknown Company';
  document.getElementById('detailAddress').textContent = c.address || '';

  const rows = [
    c.description ? { icon: '📝', label: 'About',     val: c.description } : null,
    c.telephone_number ? { icon: '📞', label: 'Tel.',  val: c.telephone_number } : null,
    websiteHref ? { icon: '🌐', label: 'Website',
      val: `<a href="${websiteHref}" target="_blank" style="color:var(--accent);text-decoration:none">${website}</a>` } : null,
    { icon: '📅', label: 'Booked Date', val: `<strong>${formatDate(b.bookingDate)}</strong>` },
  ].filter(Boolean);

  document.getElementById('detailBody').innerHTML = rows.map(r => `
    <div style="display:flex;align-items:flex-start;gap:10px;font-size:.84rem">
      <span style="font-size:1rem;flex-shrink:0;margin-top:1px">${r.icon}</span>
      <div>
        <div style="font-size:.72rem;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:2px">${r.label}</div>
        <div style="color:var(--text);line-height:1.5">${r.val}</div>
      </div>
    </div>`).join('');

  document.getElementById('detailModalOverlay').classList.add('open');
}

function closeDetailModal() {
  document.getElementById('detailModalOverlay').classList.remove('open');
}

document.getElementById('detailModalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('detailModalOverlay')) closeDetailModal();
});

// ══════════════════════════════════════════
//  CANCEL MODAL
// ══════════════════════════════════════════
function openCancelModal(id, companyName, btn) {
  pendingCancelId  = id;
  pendingCancelBtn = btn;
  document.getElementById('cancelModalCompany').textContent = companyName;
  document.getElementById('cancelModalOverlay').classList.add('open');
}

function closeCancelModal() {
  document.getElementById('cancelModalOverlay').classList.remove('open');
  pendingCancelId  = null;
  pendingCancelBtn = null;
}

async function confirmCancel() {
  if (!pendingCancelId) return;
  const confirmBtn = document.getElementById('confirmCancelBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Cancelling…';
  try {
    await apiFetch('DELETE', `/bookings/${pendingCancelId}`);
    closeCancelModal();
    showToast('✅ Booking cancelled successfully.', 'success');
    loadBookings();
  } catch (err) {
    closeCancelModal();
    showToast(`❌ ${err.message}`, 'error');
    if (pendingCancelBtn) { pendingCancelBtn.disabled = false; pendingCancelBtn.textContent = 'Cancel'; }
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Yes, Cancel It';
  }
}

document.getElementById('cancelModalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('cancelModalOverlay')) closeCancelModal();
});

// ── Load bookings
async function loadBookings() {
  document.getElementById('bookingsList').innerHTML =
    '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>';
  try {
    const res = await apiFetch('GET', '/bookings');
    const bookings = res?.data || [];
    renderBookings(Array.isArray(bookings) ? bookings : []);
  } catch (err) {
    document.getElementById('bookingsList').innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Could not load bookings</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

loadBookings();