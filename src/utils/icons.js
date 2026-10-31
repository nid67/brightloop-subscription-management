import { createIcons, icons } from 'lucide';

export function refreshIcons(root = document) {
  try {
    createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        'stroke-width': 2,
        class: 'lucide-icon'
      }
    });
  } catch (err) {
    // ignore icon creation errors
  }
}

export function iconHtml(name, { size = 18, className = '', style = '' } = {}) {
  return `<i data-lucide="${name}" class="${className}" style="width:${size}px;height:${size}px;vertical-align:middle;${style}"></i>`;
}
