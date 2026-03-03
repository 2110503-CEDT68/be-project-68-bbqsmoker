/* register.js */
const API_BASE = 'http://localhost:5000/api/v1';

// Already logged in → skip to dashboard
if (localStorage.getItem('jf_token')) {
  window.location.href = 'dashboard.html';
}

// ── Toggle password visibility
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.querySelector('svg').style.opacity = inp.type === 'text' ? '.4' : '1';
}

// ── Password strength indicator
function checkStrength(val) {
  const bars = ['bar1', 'bar2', 'bar3'].map(id => document.getElementById(id));
  bars.forEach(b => b.className = 'pw-bar');
  if (!val) return;
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  const cls = ['weak', 'medium', 'strong'];
  for (let i = 0; i < score; i++) bars[i].classList.add(cls[score - 1]);
}

// ── Show error box
function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
}

// ── Clear field errors on input
document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('error'));
});

// ── Submit
document.getElementById('regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('errorBox').style.display = 'none';

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  // Validate required fields
  let hasEmpty = false;
  ['name', 'email', 'phone', 'password', 'confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); hasEmpty = true; }
    else el.classList.remove('error');
  });
  if (hasEmpty) { showError('Please fill in all fields.'); return; }
  if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
  if (password !== confirm) {
    document.getElementById('confirm').classList.add('error');
    showError('Passwords do not match.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg> Creating...`;

  try {
    // POST /api/v1/auth/register
    // Body: { name, telephone_number, email, password }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, telephone_number: phone, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.message || 'Registration failed');

    // Save token if returned immediately
    if (data.token) {
      localStorage.setItem('jf_token', data.token);
      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${data.token}` },
        });
        const me = await meRes.json();
        if (me.data) localStorage.setItem('jf_user', JSON.stringify(me.data));
      } catch (_) { /* non-critical */ }
    }

    // Show success state
    document.getElementById('regForm').style.display       = 'none';
    document.getElementById('formHeader').style.display    = 'none';
    document.getElementById('successState').style.display  = 'block';

    // Auto-redirect to dashboard after 2s
    if (data.token) {
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    }

  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.innerHTML = `Register Now
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>`;
  }
});