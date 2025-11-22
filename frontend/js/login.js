// Login Page Logic

function showLogin() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('register-section').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }
  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        const response = await API.login(email, password);
        
        saveUser(response.user, response.token);
        showToast('Login successful!', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        showToast(error.message || 'Login failed', 'error');
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }
  
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirm = document.getElementById('register-confirm').value;
      
      if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
      }
      
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      
      try {
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        const response = await API.register(name, email, password);
        
        saveUser(response.user, response.token);
        showToast('Account created successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});