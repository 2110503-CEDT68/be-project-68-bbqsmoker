/* login.js */
const API_BASE = 'http://localhost:5000/api/v1';

// Already logged in → skip to dashboard
if (localStorage.getItem('jf_token')) {
  window.location.href = 'dashboard.html';
}

function togglePw() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  document.getElementById('eyeIcon').style.opacity = inp.type === 'text' ? '.4' : '1';
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('loginBtn');

  document.getElementById('errorBox').style.display = 'none';

  if (!email || !password) {
    showError('Please fill in all fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    // POST /api/v1/auth/login → { success: true, token }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.msg || data.message || 'Invalid credentials');
    }

    localStorage.setItem('jf_token', data.token);

    // GET /api/v1/auth/me → { success: true, data: { _id, name, email, role, ... } }
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${data.token}` },
    });
    const me = await meRes.json();
    if (me.success && me.data) {
      localStorage.setItem('jf_user', JSON.stringify(me.data));
    }

    window.location.href = 'dashboard.html';

  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.innerHTML = `Sign In
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>`;
  }
});