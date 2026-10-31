export function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('subscriptiq-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'subscriptiq-toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-badge">${type.toUpperCase()}</span>
      <span class="toast-msg">${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }
  }, duration);
}

