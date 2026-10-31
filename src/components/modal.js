import { iconHtml, refreshIcons } from '../utils/icons.js';

export class Modal {
  constructor({ title, content, footer = '', size = 'md' }) {
    this.title = title;
    this.content = content;
    this.footer = footer;
    this.size = size;
    this.overlay = null;
  }

  open() {
    const container = document.getElementById('modal-container') || document.body;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-dialog" style="${this.size === 'lg' ? 'max-width:720px;' : ''}">
        <div class="modal-header">
          <h3 class="card-title">${this.title}</h3>
          <button class="btn btn-subtle btn-sm modal-close-btn" style="padding:4px;" aria-label="Close">
            ${iconHtml('x', { size: 16 })}
          </button>
        </div>
        <div class="modal-body">
          ${this.content}
        </div>
        ${this.footer ? `<div class="modal-footer">${this.footer}</div>` : ''}
      </div>
    `;

    const close = () => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.remove();
      }
    };

    this.overlay.querySelector('.modal-close-btn').addEventListener('click', close);
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

export function openModal(options) {
  const modal = new Modal(options);
  return modal.open();
}
