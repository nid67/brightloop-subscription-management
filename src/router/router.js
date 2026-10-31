import { renderAuthView } from '../views/auth.js';
import { renderDashboardView } from '../views/dashboard.js';
import { renderCustomersView } from '../views/customers.js';
import { renderProductsView } from '../views/products.js';
import { renderPlansView } from '../views/plans.js';
import { renderSubscriptionsView } from '../views/subscriptions.js';
import { renderQuotationsView } from '../views/quotations.js';
import { renderInvoicesView } from '../views/invoices.js';
import { renderPaymentsView } from '../views/payments.js';
import { renderDiscountsView } from '../views/discounts.js';
import { renderTaxesView } from '../views/taxes.js';
import { renderLeakageView } from '../views/leakage.js';
import { renderAnalyticsView } from '../views/analytics.js';
import { renderAiAssistantView } from '../views/aiAssistant.js';
import { renderStaffView } from '../views/staff.js';
import { renderPortalView } from '../views/portal.js';
import { renderSettingsView } from '../views/settings.js';

const routes = {
  '': renderDashboardView,
  '/': renderDashboardView,
  '/dashboard': renderDashboardView,
  '/customers': renderCustomersView,
  '/products': renderProductsView,
  '/plans': renderPlansView,
  '/subscriptions': renderSubscriptionsView,
  '/quotations': renderQuotationsView,
  '/invoices': renderInvoicesView,
  '/payments': renderPaymentsView,
  '/discounts': renderDiscountsView,
  '/taxes': renderTaxesView,
  '/leakage': renderLeakageView,
  '/revenue-leakage': renderLeakageView,
  '/analytics': renderAnalyticsView,
  '/ai-assistant': renderAiAssistantView,
  '/staff': renderStaffView,
  '/portal': renderPortalView,
  '/settings': renderSettingsView,
  '/login': (c) => renderAuthView(c, 'login'),
  '/register': (c) => renderAuthView(c, 'register'),
  '/forgot-password': (c) => renderAuthView(c, 'login')
};

export function initRouter(containerId = 'app') {
  const container = document.getElementById(containerId);

  const resolve = () => {
    const raw = window.location.hash.slice(1);
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const viewFn = routes[path] || renderDashboardView;
    viewFn(container);
  };

  window.addEventListener('hashchange', resolve);
  window.addEventListener('currency-changed', resolve);
  resolve();
}
