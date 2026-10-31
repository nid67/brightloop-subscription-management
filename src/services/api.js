// Brightloop Software API client

const STORAGE_KEY = 'brightloop_store_v1';

// Clean initial empty database structure
const DEFAULT_EMPTY_STATE = {
  customers: [],
  products: [],
  plans: [],
  subscriptions: [],
  quotations: [],
  invoices: [],
  discounts: [],
  taxes: [],
  payments: [],
  leakageAnomalies: [],
  staff: []
};

class ApiService {
  constructor() {
    this.data = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read from local storage, starting with empty store:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EMPTY_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('brightloop-data-changed'));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  clearAllData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_EMPTY_STATE));
    this.saveState();
  }

  // ---------------------------------------------------------------------------
  // 1. FINANCIAL KPIS & REVENUE CALCULATIONS
  // ---------------------------------------------------------------------------
  getKPIs() {
    const activeSubs = this.data.subscriptions.filter(s => s.status === 'Active');
    let mrr = 0;
    activeSubs.forEach(s => {
      const amt = Number(s.totalAmount) || 0;
      if (s.billingFrequency === 'Yearly') mrr += Math.round(amt / 12);
      else if (s.billingFrequency === 'Weekly') mrr += Math.round(amt * 4.33);
      else if (s.billingFrequency === 'Daily') mrr += Math.round(amt * 30);
      else mrr += amt;
    });

    const arr = mrr * 12;
    const paidInvoices = this.data.invoices.filter(i => i.status === 'Paid');
    const revenueCollected = paidInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || Number(i.totalAmount) || 0), 0);
    const outstandingInvoices = this.data.invoices.filter(i => i.status === 'Confirmed' || i.status === 'Overdue');
    const outstandingRevenue = outstandingInvoices.reduce((sum, i) => sum + ((Number(i.totalAmount) || 0) - (Number(i.paidAmount) || 0)), 0);
    const overdueCount = this.data.invoices.filter(i => i.status === 'Overdue').length;

    return {
      mrr: { value: mrr, change: 0, trend: 'neutral' },
      arr: { value: arr, change: 0, trend: 'neutral' },
      activeSubscriptions: { value: activeSubs.length, change: 0, trend: 'neutral' },
      totalCustomers: { value: this.data.customers.length, change: 0, trend: 'neutral' },
      revenueCollected: { value: revenueCollected, change: 0, trend: 'neutral' },
      outstandingRevenue: { value: outstandingRevenue, change: 0, trend: 'neutral' },
      overdueInvoices: { value: overdueCount, change: 0, trend: 'neutral' }
    };
  }

  // ---------------------------------------------------------------------------
  // 2. CUSTOMERS
  // ---------------------------------------------------------------------------
  getCustomers(query = {}) {
    // TODO: Teammate hook: const res = await fetch('/api/v1/customers');
    let list = [...this.data.customers];
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.email && c.email.toLowerCase().includes(q)));
    }
    return list;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c.id === id);
  }

  createCustomer(payload) {
    // TODO: Teammate hook: const res = await fetch('/api/v1/customers', { method: 'POST', body: JSON.stringify(payload) });
    const newCustomer = {
      id: `cust_${Date.now()}`,
      name: payload.name || '',
      company: payload.company || payload.name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      tier: payload.tier || 'Enterprise',
      taxId: payload.taxId || '',
      billingAddress: payload.billingAddress || '',
      paymentTerms: payload.paymentTerms || 'Net 30',
      currency: payload.currency || 'INR',
      status: 'Active',
      createdAt: new Date().toISOString(),
      lifetimeValue: 0,
      balance: 0
    };
    this.data.customers.unshift(newCustomer);
    this.saveState();
    return newCustomer;
  }

  // ---------------------------------------------------------------------------
  // 3. PRODUCTS & VARIANTS
  // ---------------------------------------------------------------------------
  getProducts() {
    // TODO: Teammate hook: const res = await fetch('/api/v1/products');
    return [...this.data.products];
  }

  createProduct(payload) {
    // TODO: Teammate hook: POST /api/v1/products
    const newProduct = {
      id: `prod_${Date.now()}`,
      name: payload.name,
      type: payload.type || 'Recurring Service',
      basePrice: Number(payload.basePrice) || 0,
      costPrice: Number(payload.costPrice) || 0,
      description: payload.description || '',
      active: true,
      variants: payload.variants || []
    };
    this.data.products.unshift(newProduct);
    this.saveState();
    return newProduct;
  }

  // ---------------------------------------------------------------------------
  // 4. PLANS
  // ---------------------------------------------------------------------------
  getPlans() {
    // TODO: Teammate hook: GET /api/v1/plans
    return [...this.data.plans];
  }

  createPlan(payload) {
    // TODO: Teammate hook: POST /api/v1/plans
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: payload.name,
      billingFrequency: payload.billingFrequency || 'Monthly',
      minQuantity: Number(payload.minQuantity) || 1,
      basePrice: Number(payload.basePrice) || 0,
      description: payload.description || '',
      availabilityStart: payload.availabilityStart || new Date().toISOString().split('T')[0],
      availabilityEnd: payload.availabilityEnd || '',
      autoClose: !!payload.autoClose,
      allowPause: !!payload.allowPause,
      allowEarlyClosure: !!payload.allowEarlyClosure,
      allowRenewal: payload.allowRenewal !== undefined ? !!payload.allowRenewal : true,
      active: true
    };
    this.data.plans.unshift(newPlan);
    this.saveState();
    return newPlan;
  }

  // ---------------------------------------------------------------------------
  // 5. SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  getSubscriptions(query = {}) {
    // TODO: Teammate hook: GET /api/v1/subscriptions
    let list = [...this.data.subscriptions];
    if (query.status) list = list.filter(s => s.status === query.status);
    return list;
  }

  getSubscriptionById(id) {
    return this.data.subscriptions.find(s => s.id === id);
  }

  createSubscription(payload) {
    // TODO: Teammate hook: POST /api/v1/subscriptions
    const count = this.data.subscriptions.length + 1;
    const newSub = {
      id: `sub_${Date.now()}`,
      subscriptionNumber: `SUB-2026-${String(count).padStart(3, '0')}`,
      customerId: payload.customerId,
      customerName: payload.customerName || 'Customer',
      planId: payload.planId,
      planName: payload.planName || 'Standard Plan',
      status: payload.status || 'Draft',
      billingFrequency: payload.billingFrequency || 'Monthly',
      startDate: payload.startDate || new Date().toISOString().split('T')[0],
      expiryDate: payload.expiryDate || '',
      nextBillingDate: payload.nextBillingDate || payload.startDate,
      items: payload.items || [],
      subtotal: Number(payload.subtotal) || 0,
      taxAmount: Number(payload.taxAmount) || 0,
      discountAmount: Number(payload.discountAmount) || 0,
      totalAmount: Number(payload.totalAmount) || 0,
      autoRenew: payload.autoRenew !== undefined ? !!payload.autoRenew : true,
      healthScore: 90,
      createdAt: new Date().toISOString()
    };
    this.data.subscriptions.unshift(newSub);
    this.saveState();
    return newSub;
  }

  updateSubscriptionStatus(id, newStatus) {
    const sub = this.getSubscriptionById(id);
    if (sub) {
      sub.status = newStatus;
      this.saveState();
      return sub;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. QUOTATIONS
  // ---------------------------------------------------------------------------
  getQuotations() {
    // TODO: Teammate hook: GET /api/v1/quotations
    return [...this.data.quotations];
  }

  createQuotation(payload) {
    // TODO: Teammate hook: POST /api/v1/quotations
    const count = this.data.quotations.length + 1;
    const newQt = {
      id: `qt_${Date.now()}`,
      quotationNumber: `QT-2026-${String(count).padStart(3, '0')}`,
      customerId: payload.customerId,
      customerName: payload.customerName || '',
      planName: payload.planName || '',
      validUntil: payload.validUntil || '',
      status: 'Sent',
      subtotal: Number(payload.subtotal) || 0,
      taxAmount: Number(payload.taxAmount) || 0,
      totalAmount: Number(payload.totalAmount) || 0,
      items: payload.items || [],
      createdAt: new Date().toISOString()
    };
    this.data.quotations.unshift(newQt);
    this.saveState();
    return newQt;
  }

  convertQuotationToSubscription(id) {
    const qt = this.data.quotations.find(q => q.id === id);
    if (!qt) throw new Error('Quotation not found');

    const sub = this.createSubscription({
      customerId: qt.customerId,
      customerName: qt.customerName,
      planName: qt.planName,
      status: 'Confirmed',
      subtotal: qt.subtotal,
      taxAmount: qt.taxAmount,
      totalAmount: qt.totalAmount,
      items: qt.items
    });

    qt.status = 'Converted';
    this.saveState();
    return sub;
  }

  // ---------------------------------------------------------------------------
  // 7. INVOICES
  // ---------------------------------------------------------------------------
  getInvoices(query = {}) {
    // TODO: Teammate hook: GET /api/v1/invoices
    let list = [...this.data.invoices];
    if (query.status) list = list.filter(i => i.status === query.status);
    return list;
  }

  getInvoiceById(id) {
    return this.data.invoices.find(i => i.id === id);
  }

  generateInvoice(payload) {
    // TODO: Teammate hook: POST /api/v1/invoices
    const count = this.data.invoices.length + 1;
    const newInv = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-2026-${String(count).padStart(3, '0')}`,
      subscriptionId: payload.subscriptionId || null,
      customerId: payload.customerId,
      customerName: payload.customerName,
      invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
      status: payload.status || 'Confirmed',
      subtotal: Number(payload.subtotal) || 0,
      taxAmount: Number(payload.taxAmount) || 0,
      discountAmount: Number(payload.discountAmount) || 0,
      totalAmount: Number(payload.totalAmount) || 0,
      paidAmount: 0,
      items: payload.items || []
    };
    this.data.invoices.unshift(newInv);
    this.saveState();
    return newInv;
  }

  // ---------------------------------------------------------------------------
  // 8. DISCOUNTS & TAXES
  // ---------------------------------------------------------------------------
  getDiscounts() {
    // TODO: Teammate hook: GET /api/v1/discounts
    return [...this.data.discounts];
  }

  createDiscount(payload) {
    // TODO: Teammate hook: POST /api/v1/discounts
    const newDisc = {
      id: `disc_${Date.now()}`,
      code: (payload.code || '').toUpperCase(),
      name: payload.name || '',
      type: payload.type || 'Percentage',
      value: Number(payload.value) || 0,
      minPurchaseAmount: Number(payload.minPurchaseAmount) || 0,
      minQuantity: Number(payload.minQuantity) || 1,
      startDate: payload.startDate || '',
      endDate: payload.endDate || '',
      usageLimit: Number(payload.usageLimit) || 100,
      usageCount: 0,
      scope: payload.scope || 'Subscription-Wide',
      active: true
    };
    this.data.discounts.unshift(newDisc);
    this.saveState();
    return newDisc;
  }

  getTaxes() {
    // TODO: Teammate hook: GET /api/v1/taxes
    return [...this.data.taxes];
  }

  createTax(payload) {
    // TODO: Teammate hook: POST /api/v1/taxes
    const newTax = {
      id: `tax_${Date.now()}`,
      name: payload.name || '',
      percentage: Number(payload.percentage) || 0,
      type: payload.type || 'Exclusive',
      description: payload.description || '',
      effectiveStart: payload.effectiveStart || '',
      effectiveEnd: payload.effectiveEnd || '',
      active: true
    };
    this.data.taxes.unshift(newTax);
    this.saveState();
    return newTax;
  }

  // ---------------------------------------------------------------------------
  // 9. PAYMENTS
  // ---------------------------------------------------------------------------
  getPayments() {
    // TODO: Teammate hook: GET /api/v1/payments
    return [...this.data.payments];
  }

  recordPayment(payload) {
    // TODO: Teammate hook: POST /api/v1/payments
    const count = this.data.payments.length + 1;
    const newPay = {
      id: `pay_${Date.now()}`,
      paymentNumber: `PAY-2026-${String(count).padStart(3, '0')}`,
      invoiceId: payload.invoiceId || null,
      invoiceNumber: payload.invoiceNumber || '',
      customerId: payload.customerId || '',
      customerName: payload.customerName || '',
      amount: Number(payload.amount) || 0,
      method: payload.method || 'Bank Transfer',
      referenceNumber: payload.referenceNumber || '',
      paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
      status: 'Successful',
      reconciliationStatus: 'Reconciled',
      notes: payload.notes || ''
    };
    this.data.payments.unshift(newPay);

    // If an invoice was targeted, mark invoice as Paid
    if (payload.invoiceId) {
      const inv = this.getInvoiceById(payload.invoiceId);
      if (inv) {
        inv.paidAmount = (inv.paidAmount || 0) + newPay.amount;
        if (inv.paidAmount >= inv.totalAmount) {
          inv.status = 'Paid';
        }
      }
    }

    this.saveState();
    return newPay;
  }

  // ---------------------------------------------------------------------------
  // 10. REVENUE LEAKAGE SENTINEL
  // ---------------------------------------------------------------------------
  getLeakageAnomalies() {
    // TODO: Teammate hook: GET /api/v1/revenue-leakage/anomalies
    return [...this.data.leakageAnomalies];
  }

  resolveLeakageAnomaly(id) {
    const anom = this.data.leakageAnomalies.find(a => a.id === id);
    if (anom) {
      anom.resolved = true;
      this.saveState();
      return anom;
    }
  }

  // ---------------------------------------------------------------------------
  // 11. STAFF MANAGEMENT
  // ---------------------------------------------------------------------------
  getStaff() {
    // TODO: Teammate hook: GET /api/v1/staff
    return [...this.data.staff];
  }

  inviteStaff(payload) {
    // TODO: Teammate hook: POST /api/v1/staff/invite
    const newStaff = {
      id: `stf_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role || 'STAFF',
      department: payload.department || 'Billing Operations',
      status: 'Active',
      lastLogin: 'Never'
    };
    this.data.staff.unshift(newStaff);
    this.saveState();
    return newStaff;
  }
}

export const api = new ApiService();
