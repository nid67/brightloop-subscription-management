import { iconHtml, refreshIcons } from '../utils/icons.js';

export class Drawer {
  constructor({ title, subtitle = '', content = '', footer = '' }) {
    this.title = title;
    this.subtitle = subtitle;
    this.content = content;
    this.footer = footer;
    this.overlay = null;
  }

  open() {
    const container = document.getElementById('drawer-container') || document.body;

    this.overlay = document.createElement('div');
    this.overlay.className = 'drawer-overlay';
    this.overlay.innerHTML = `
      <div class="drawer-content">
        <div class="drawer-header">
          <div>
            <h3 class="card-title">${this.title}</h3>
            ${this.subtitle ? `<div style="font-size:12px; color:var(--text-muted);">${this.subtitle}</div>` : ''}
          </div>
          <button class="btn btn-subtle btn-sm drawer-close-btn" style="padding:4px;" aria-label="Close">
            ${iconHtml('x', { size: 16 })}
          </button>
        </div>
        <div class="drawer-body">
          ${this.content}
        </div>
        ${this.footer ? `<div style="padding:14px 20px; border-top:1px solid var(--border);">${this.footer}</div>` : ''}
      </div>
    `;

    const close = () => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.remove();
      }
    };

    this.overlay.querySelector('.drawer-close-btn').addEventListener('click', close);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) close();
    });

    container.appendChild(this.overlay);
    refreshIcons(this.overlay);
    return this.overlay;
  }

  close() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
  }
}

export function openDrawer(options) {
  const drawer = new Drawer(options);
  return drawer.open();
}
