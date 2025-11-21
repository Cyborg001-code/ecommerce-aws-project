// Authentication Functions

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Check if logged in
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Save user after login
function saveUser(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
  localStorage.setItem('loginTime', Date.now().toString());
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    showToast('Logged out successfully', 'success');
    window.location.href = 'index.html';
  }
}

// Check session validity (24 hour timeout)
function checkSession() {
  const user = getCurrentUser();
  if (!user) return;
  
  const loginTime = localStorage.getItem('loginTime');
  if (loginTime) {
    const hours = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
    if (hours > 24) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('loginTime');
      showToast('Session expired. Please login again.', 'warning');
      if (window.location.pathname !== '/login.html') {
        window.location.href = 'login.html';
      }
    }
  }
}

// Update header with user info
function updateAuthUI() {
  const user = getCurrentUser();
  const nav = document.querySelector('header nav');
  
  if (!nav) return;
  
  // Remove existing auth links
  const existing = document.querySelector('.auth-links');
  if (existing) existing.remove();
  
  const authDiv = document.createElement('div');
  authDiv.className = 'auth-links';
  authDiv.style.display = 'flex';
  authDiv.style.gap = '10px';
  authDiv.style.alignItems = 'center';
  
  if (user) {
    // User is logged in
    authDiv.innerHTML = `
      <span style="color: var(--primary, #6366f1); font-weight: 600;">
        Hello, ${user.name}!
      </span>
      ${user.is_admin ? '<a href="admin.html" style="color: #ef4444; font-weight: 700;">Admin Panel</a>' : ''}
      <a href="#" onclick="logout(); return false;">Logout</a>
    `;
  } else {
    // Not logged in
    authDiv.innerHTML = '<a href="login.html">Login / Register</a>';
  }
  
  nav.appendChild(authDiv);
}

// Require login for protected pages
function requireLogin() {
  if (!isLoggedIn()) {
    showToast('Please login first', 'warning');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Require admin access
function requireAdmin() {
  const user = getCurrentUser();
  if (!user || !user.is_admin) {
    showToast('Access denied! Admin privileges required.', 'error');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  updateAuthUI();
});