import { iconHtml } from '../utils/icons.js';
import { getCurrentCurrency, setCurrentCurrency } from '../utils/currency.js';

export function renderHeader(title = 'Dashboard', role = 'ADMIN') {
  const currentCurrency = getCurrentCurrency();

  return `
    <header class="app-header">
      <div class="header-breadcrumbs">
        <span>Brightloop</span>
        <span>/</span>
        <span class="active">${title}</span>
      </div>

      <div class="header-actions">
        <!-- Currency Selector -->
        <select id="currency-select" class="form-select" style="padding:4px 8px; width:auto; font-size:12px; font-weight:600;">
          <option value="INR" ${currentCurrency === 'INR' ? 'selected' : ''}>₹ INR</option>
          <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>$ USD</option>
          <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>€ EUR</option>
        </select>

        <!-- Role Pill Switcher -->
        <div class="role-pill" id="role-toggle-pill" title="Toggle role to test ADMIN / STAFF / CUSTOMER view">
          Role: ${role}
        </div>
      </div>
    </header>
  `;
}
