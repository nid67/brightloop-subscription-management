import { iconHtml, refreshIcons } from '../utils/icons.js';

class NotificationService {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:999; display:flex; flex-direction:column; gap:8px;';
      document.body.appendChild(this.container);
    }
  }

  show(title, message = '', type = 'info') {
    this.init();

    const toast = document.createElement('div');
    toast.style.cssText = 'background:#ffffff; border:1px solid var(--border); border-radius:6px; padding:12px 16px; box-shadow:var(--shadow-md); display:flex; align-items:center; gap:10px; min-width:280px; font-size:13px;';

    let color = 'var(--primary)';
    if (type === 'success') color = 'var(--success-text)';
    if (type === 'error') color = 'var(--danger)';

    toast.innerHTML = `
      <div style="color:${color}; display:flex; align-items:center;">
        ${iconHtml(type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info', { size: 18 })}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600; color:var(--text-main);">${title}</div>
        ${message ? `<div style="color:var(--text-muted); font-size:12px; margin-top:2px;">${message}</div>` : ''}
      </div>
    `;

    this.container.appendChild(toast);
    refreshIcons(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  success(title, message) {
    this.show(title, message, 'success');
  }

  error(title, message) {
    this.show(title, message, 'error');
  }

  info(title, message) {
    this.show(title, message, 'info');
  }
}

export const notification = new NotificationService();
