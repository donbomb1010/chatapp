import { AuthModule } from './auth.js'; // ensures auth module loaded (it auto-inits)
import { FriendsModule } from './friends.js';
import { ChatModule } from './chat.js';

// UI helpers: theme + tabs + logout
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const darkModeStyle = document.getElementById('dark-mode-style');

  themeToggle.addEventListener('click', () => {
    if (darkModeStyle.disabled) {
      darkModeStyle.disabled = false;
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      localStorage.setItem('darkMode', 'enabled');
    } else {
      darkModeStyle.disabled = true;
      document.body.classList.remove('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      localStorage.setItem('darkMode', 'disabled');
    }
  });

  if (localStorage.getItem('darkMode') === 'enabled') {
    darkModeStyle.disabled = false;
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // tabs switching
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      const tabId = this.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // logout button click handler
  document.getElementById('logout-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('auth:requestSignOut'));
  });
});
