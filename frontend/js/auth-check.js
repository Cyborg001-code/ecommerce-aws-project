// Check if user is logged in and update header
function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem('user'));
  const header = document.querySelector('header nav');
  
  if (user) {
    // User is logged in
    const authLinks = `
      <span style="color: var(--primary); font-weight: 600;">
        Hello, ${user.name}!
      </span>
      <a href="#" onclick="logout()">Logout</a>
    `;
    
    // Add to navigation
    if (!header.querySelector('.auth-links')) {
      const div = document.createElement('div');
      div.className = 'auth-links';
      div.innerHTML = authLinks;
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.alignItems = 'center';
      header.appendChild(div);
    }
  } else {
    // User not logged in
    const authLinks = `
      <a href="login.html">Login / Register</a>
    `;
    
    if (!header.querySelector('.auth-links')) {
      const div = document.createElement('div');
      div.className = 'auth-links';
      div.innerHTML = authLinks;
      header.appendChild(div);
    }
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    window.location.href = 'index.html';
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);