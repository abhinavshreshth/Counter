// public/script.js

// ——————————————————————————————
// Toast for auth (login/signup)
// ——————————————————————————————
function showAuthToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => container.removeChild(toast), 300);
  }, 4000);
}

function shakeField(field) {
  field.classList.add('shake');
  setTimeout(() => field.classList.remove('shake'), 500);
}

document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form            = e.target;
  const inputField      = form.querySelector('input[name="username"]');
  const signupBtn       = form.querySelector('button[type="submit"]');
  const username        = form.username.value.trim();
  const password        = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  // 1) Client‑side checks
  if (!username || password.length < 6) {
    inputField.classList.add('shake');
    setTimeout(() => inputField.classList.remove('shake'), 400);
    showAuthToast('Choose a username and password (≥6 chars)', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showAuthToast('Passwords do not match!', 'error');
    return;
  }

  // 2) Start spinner & disable the button
  signupBtn.classList.add('button-loading');
  signupBtn.disabled = true;

  // 3) Build the full payload
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    // 4) Fire the Fetch
    const res    = await fetch('/signup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok && result.success) {
    // keep the spinner spinning for 1.5s, then redirect
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 700);
    return;  // <-- prevents falling into the else
    } else {
      // 5b) Server‑side error: shake, toast, restore button
      inputField.classList.add('shake');
      inputField.style.border = '1px solid red';
      setTimeout(() => {
        inputField.classList.remove('shake');
        inputField.style.border = '';
      }, 400);
      showAuthToast(result.message || 'Signup failed', 'error');
      signupBtn.classList.remove('button-loading');
      signupBtn.disabled = false;
    }

  } catch (err) {
    // 6) Network error: same fallback
    console.error('Signup error', err);
    inputField.classList.add('shake');
    setTimeout(() => inputField.classList.remove('shake'), 400);
    showAuthToast('Server error—please try again later.', 'error');
    signupBtn.classList.remove('button-loading');
    signupBtn.disabled = false;
  }
});

// ─── LOGIN CAPTCHA LOGIC START ─────────────────────────────────

function generateLoginCaptcha() {
  const img = document.getElementById('captchaImage');
  if (img) {
    img.src = '/captcha?' + Date.now(); // fetch fresh SVG
  }
  document.getElementById('loginCaptchaAnswer').value = '';
}
window.addEventListener('load', generateLoginCaptcha);
document.getElementById('login-refreshCaptcha')?.addEventListener('click', generateLoginCaptcha);

// LOGIN: Combined CAPTCHA + AJAX Handler (SVG-based)
// ——————————————————————————————
document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  const form     = e.target;
  const loginBtn = form.querySelector('button[type="submit"]');

  // Username/password validation
  const uname = form.username.value.trim();
  const pwd   = form.password.value;
  const captchaValue = document.getElementById('loginCaptchaAnswer').value.trim();
  console.log('🧩 Captcha value entered by user:', captchaValue);


  if (!uname || pwd.length < 6) {
    showAuthToast('Username cannot be empty and password must be at least 6 characters', 'error');
    return;
  }
  if (!captchaValue) {
    showAuthToast('Please enter the CAPTCHA', 'error');
    return;
  }

  // Start spinner
  loginBtn.classList.add('button-loading');
  loginBtn.disabled = true;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: uname,
        password: pwd,
        captcha: captchaValue
      })
    });

    const body = await res.json();

    if (res.ok && body.success) {
      console.log('✅ Login successful');
      setTimeout(() => (window.location.href = '/'), 550);
    } else {
      showAuthToast('Login failed: ' + (body.message || 'Invalid credentials'), 'error');
      shakeField(
        body.message?.toLowerCase().includes('user')
          ? document.querySelector('input[name="username"]')
          : document.querySelector('input[name="password"]')
      );
      generateLoginCaptcha();
      loginBtn.classList.remove('button-loading');
      loginBtn.disabled = false;
    }
  } catch (err) {
    showAuthToast('Login failed: ' + err.message, 'error');
    loginBtn.classList.remove('button-loading');
    loginBtn.disabled = false;
  }
});


// ——————————————————————————————
// Logout
// ——————————————————————————————
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('leftPanelWidth');
  });
}
logoutBtn?.addEventListener('click', () => {
  window.location.href = '/logout';
});

// ——————————————————————————————
// WebSocket Setup + Table Sorting
// ——————————————————————————————
const socket = io({
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
const tableBody = document.getElementById("ordersTableBody");

let activeSortColumn = null;
let activeSortState  = null;
const shownIds = new Set();
let hasClearedOnce = false;

document.addEventListener("DOMContentLoaded", () => {
  const headerCells = document.querySelectorAll(".trades-table thead th");
  headerCells.forEach((th, idx) => {
    th.addEventListener("click", () => {
      if (activeSortColumn !== idx) {
        activeSortColumn = idx;
        activeSortState = "asc";
        headerCells.forEach(c => c.classList.remove("sorted-asc","sorted-desc"));
        th.classList.add("sorted-asc");
      } else {
        activeSortState = activeSortState === "asc" ? "desc" : null;
        headerCells.forEach(c => c.classList.remove("sorted-asc","sorted-desc"));
        if (activeSortState) th.classList.add(`sorted-${activeSortState}`);
      }
      activeSortColumn !== null
        ? sortTable(activeSortColumn, activeSortState)
        : sortByTime();
    });
  });
});

function sortTable(col, order) {
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    let vA = a.children[col].innerText.trim();
    let vB = b.children[col].innerText.trim();
    let diff = 0;
    if (col === 0) {
      diff = (parseInt(a.dataset.timestamp)||0) - (parseInt(b.dataset.timestamp)||0);
    } else if ([4,5,6].includes(col)) {
      diff = (parseFloat(vA.replace(/[^\d.-]/g,""))||0)
           - (parseFloat(vB.replace(/[^\d.-]/g,""))||0);
    } else {
      diff = vA.localeCompare(vB);
    }
    return order === "asc" ? diff : -diff;
  });
  rows.forEach(r => tableBody.appendChild(r));
}

function sortByTime() {
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  rows.sort((a, b) => (parseInt(b.dataset.timestamp)||0) - (parseInt(a.dataset.timestamp)||0));
  rows.forEach(r => tableBody.appendChild(r));
}

setInterval(() => shownIds.clear(), 60000);

socket.on("connect",    () => console.log("✅ Connected to WebSocket"));
socket.on("disconnect", () => console.warn("⚠️ Disconnected from WebSocket"));

socket.on("counter", data => {
  if (!hasClearedOnce) {
    tableBody.innerHTML = "";
    hasClearedOnce = true;
  }

  const key = `${data.id}_${data.timestamp}_${data.payload.symbol}_${data.payload.side}_${data.status}`;
  if (shownIds.has(key)) return;
  shownIds.add(key);

  const row = document.createElement("tr");
  row.dataset.timestamp = data.timestamp;
  const timeStr = new Date(data.timestamp*1000).toLocaleTimeString();

  let status = data.status.toLowerCase();
  if (status === "filled") status = "complete";
  const slug = status.replace(/\s+/g,"-");

  row.innerHTML = `
    <td>${timeStr}</td>
    <td><span class="type-pill ${data.payload.side}">${data.payload.side.toUpperCase()}</span></td>
    <td>${data.payload.symbol}</td>
    <td>${data.product||"NRML"}</td>
    <td>${data.payload.quantity}</td>
    <td>₹${data.payload.price.toFixed(2)}</td>
    <td>–</td>
    <td><span class="status-pill ${slug}">${status.toUpperCase()}</span></td>
  `;
  tableBody.prepend(row);

  if (activeSortColumn !== null) {
    sortTable(activeSortColumn, activeSortState);
  } else {
    sortByTime();
  }

  while (tableBody.rows.length > 50) {
    tableBody.removeChild(tableBody.lastChild);
  }

  showOrderToast(data);
});

// ——————————————————————————————
// Toast for order events
// ——————————————————————————————
function showOrderToast({ status, payload, id }) {
  const s = status.toLowerCase();
  let title="Placed", cls="toast-orange", msg=`${payload.side.toUpperCase()} ${payload.symbol} is placed.`;

  if (s==="cancelled") { title="Cancelled"; cls="toast-blue";   msg=`${payload.symbol} order was cancelled.`; }
  else if (s==="rejected")  { title="Rejected";  cls="toast-red";    msg=`${payload.side.toUpperCase()} ${payload.symbol} was rejected.`; }
  else if (s==="filled")  { title="Complete";  cls="toast-green";  msg=`${payload.symbol} executed successfully.`; }
  else if (s==="pending")   { title="Placed";    cls="toast-orange"; msg=`${payload.side.toUpperCase()} ${payload.symbol} is pending.`; }

  const t = document.createElement("div");
  t.className = `toast ${cls}`;
  t.innerHTML = `<strong>${title}</strong>${msg}<br><small style="color:#888">#${id}</small>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.remove(),4000);
}
