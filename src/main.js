import { initRouter } from './router/router.js';
import { setCurrentCurrency } from './utils/currency.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter('app');

  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'currency-select') {
      setCurrentCurrency(e.target.value);
    }
  });
});
