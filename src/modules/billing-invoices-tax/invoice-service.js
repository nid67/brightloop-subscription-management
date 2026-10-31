/**
 * SubscriptIQ - Module 03 Business Logic & Service Store
 * Handles Invoices, Recurring Billing Operations, and Tax Rules with Idempotency Guards
 */

import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TAX_RULES,
  INITIAL_INVOICES,
  INITIAL_BILLING_OPERATIONS
} from './invoice-data.js';

class InvoiceService {
  constructor() {
    this.customers = [...INITIAL_CUSTOMERS];
    this.products = [...INITIAL_PRODUCTS];
    this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
    this.taxRules = [...INITIAL_TAX_RULES];
    this.invoices = [...INITIAL_INVOICES];
    this.billingOperations = [...INITIAL_BILLING_OPERATIONS];
    this.listeners = [];

    // Expose APIs on window for Teammate 4 (Payments) & Teammate 6 (Analytics)
    this.publishGlobalInterfaces();
  }

  // --- PUB/SUB FOR REACTIVE UPDATES ---
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.listeners.forEach(cb => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    });
  }

  // --- SUPPLIER METADATA (B2B Tax Compliance) ---
  getSupplierDetails() {
    return {
      companyName: 'SubscriptIQ Technologies Pvt Ltd',
      tradeName: 'SubscriptIQ Cloud Solutions',
      gstin: '29AABCU9603R1ZM',
      pan: 'AABCU9603R',
      lutNumber: 'ARN-AD2903240019283',
      address: 'Tower 4, Embassy Tech Village, Outer Ring Road, Devarabisanahalli, Bengaluru, Karnataka 560103, India',
      state: 'Karnataka',
      stateCode: '29',
      cin: 'U72200KA2024PTC189201',
      hsnSacCode: '998313 (Information Technology Software Services)',
      email: 'finance@subscriptiq.io',
      phone: '+91 (080) 4122-8900',
      bankDetails: {
        accountName: 'SubscriptIQ Technologies Pvt Ltd',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200088921102',
        ifscCode: 'HDFC0000240',
        branch: 'Koramangala, Bengaluru'
      }
    };
  }

  // --- TAX CALCULATION ENGINE ---
  calculateTaxForCustomer(subtotal, customer) {
    if (!customer) {
      return {
        taxType: 'Intra-State GST (CGST 9% + SGST 9%)',
        cgstRate: 9.0,
        cgstAmount: subtotal * 0.09,
        sgstRate: 9.0,
        sgstAmount: subtotal * 0.09,
        igstRate: 0.0,
        igstAmount: 0.0,
        totalTax: subtotal * 0.18
      };
    }

    const isOverseas = customer.stateCode === '00' || (customer.state && customer.state.toLowerCase().includes('usa')) || (customer.gstin && customer.gstin.includes('EXPORT'));
    if (isOverseas) {
      return {
        taxType: 'Zero-Rated (Export under LUT Bond)',
        cgstRate: 0.0,
        cgstAmount: 0.0,
        sgstRate: 0.0,
        sgstAmount: 0.0,
        igstRate: 0.0,
        igstAmount: 0.0,
        totalTax: 0.0
      };
    }

    const isIntraState = customer.stateCode === '29' || (customer.state && customer.state.toLowerCase().includes('karnataka'));
    if (isIntraState) {
      const cgst = subtotal * 0.09;
      const sgst = subtotal * 0.09;
      return {
        taxType: 'Intra-State GST (CGST 9% + SGST 9%)',
        cgstRate: 9.0,
        cgstAmount: Math.round(cgst * 100) / 100,
        sgstRate: 9.0,
        sgstAmount: Math.round(sgst * 100) / 100,
        igstRate: 0.0,
        igstAmount: 0.0,
        totalTax: Math.round((cgst + sgst) * 100) / 100
      };
    }

    // Inter-State (IGST 18%)
    const igst = subtotal * 0.18;
    return {
      taxType: 'Inter-State IGST (18%)',
      cgstRate: 0.0,
      cgstAmount: 0.0,
      sgstRate: 0.0,
      sgstAmount: 0.0,
      igstRate: 18.0,
      igstAmount: Math.round(igst * 100) / 100,
      totalTax: Math.round(igst * 100) / 100
    };
  }

  // --- IDEMPOTENCY & DUPLICATE BILLING GUARD ---
  checkDuplicateInvoice(subscriptionId, billingPeriod) {
    const existing = this.invoices.find(inv => {
      if (inv.status === 'Cancelled') return false;
      return inv.subscriptionId === subscriptionId && inv.billingPeriod === billingPeriod;
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingInvoice: existing,
        reason: `An active invoice (${existing.invoiceNumber}) already exists for subscription ${subscriptionId} and period "${billingPeriod}". Duplicate invoice creation blocked by Idempotency Guard.`
      };
    }

    return { isDuplicate: false };
  }

  // --- INVOICES API ---
  getInvoices(filters = {}) {
    let result = [...this.invoices];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(inv => inv.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(term)) ||
        inv.subscriptionId.toLowerCase().includes(term)
      );
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'this_month') {
        const curMonth = now.toISOString().slice(0, 7);
        result = result.filter(inv => inv.invoiceDate && inv.invoiceDate.startsWith(curMonth));
      } else if (filters.dateRange === 'last_month') {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = d.toISOString().slice(0, 7);
        result = result.filter(inv => inv.invoiceDate && inv.invoiceDate.startsWith(prevMonth));
      }
    }

    // Sort order
    if (filters.sortBy) {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (filters.sortBy === 'date') return dir * (new Date(a.invoiceDate) - new Date(b.invoiceDate));
        if (filters.sortBy === 'amount') return dir * (a.grandTotal - b.grandTotal);
        if (filters.sortBy === 'number') return dir * a.invoiceNumber.localeCompare(b.invoiceNumber);
        return 0;
      });
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0));
    }

    return result;
  }

  getSubscriptions() {
    if (window.SubscriptIQ_Subscriptions && typeof window.SubscriptIQ_Subscriptions.getSubscriptions === 'function') {
      return window.SubscriptIQ_Subscriptions.getSubscriptions();
    }
    return this.subscriptions;
  }

  getCustomers() {
    if (window.SubscriptIQ_Customers && typeof window.SubscriptIQ_Customers.getCustomers === 'function') {
      return window.SubscriptIQ_Customers.getCustomers();
    }
    return this.customers;
  }

  getInvoiceById(id) {
    return this.invoices.find(inv => inv.id === id || inv.invoiceNumber === id) || null;
  }

  generateInvoiceFromSubscription(subscriptionId, customPeriod = null) {
    const allSubs = this.getSubscriptions();
    const sub = allSubs.find(s => s.id === subscriptionId);
    if (!sub) {
      throw new Error(`Subscription with ID ${subscriptionId} not found.`);
    }

    const allCustomers = this.getCustomers();
    const customer = allCustomers.find(c => c.id === sub.customerId) || {
      id: sub.customerId,
      name: sub.customerName,
      state: 'Karnataka',
      stateCode: '29',
      gstin: '29AABCS0000A1Z1',
      address: 'Bengaluru, Karnataka'
    };

    const period = customPeriod || `${sub.currentPeriodStart} to ${sub.currentPeriodEnd}`;

    // Enforce Idempotency
    const dupCheck = this.checkDuplicateInvoice(subscriptionId, period);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.reason);
    }

    // Calculate subtotal from subscription items
    let subtotal = 0;
    const lines = (sub.items || []).map((item, idx) => {
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      return {
        id: `LINE-${Date.now()}-${idx}`,
        description: item.description,
        sac: item.sac || '998313',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        discount: 0,
        taxableValue: itemTotal,
        taxRate: 18.0
      };
    });

    if (lines.length === 0) {
      subtotal = sub.baseAmount || 10000;
      lines.push({
        id: `LINE-${Date.now()}-0`,
        description: `${sub.planName} (${period})`,
        sac: '998313',
        quantity: 1,
        unitPrice: subtotal,
        discount: 0,
        taxableValue: subtotal,
        taxRate: 18.0
      });
    }

    const taxCalc = this.calculateTaxForCustomer(subtotal, customer);
    const grandTotal = Math.round((subtotal + taxCalc.totalTax) * 100) / 100;

    // Generate Invoice Number
    const nextSeq = this.invoices.length + 1;
    const padded = String(nextSeq).padStart(3, '0');
    const invoiceNum = `BL-INV-2026-${padded}`;

    const todayStr = new Date().toISOString().slice(0, 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const newInvoice = {
      id: invoiceNum,
      invoiceNumber: invoiceNum,
      subscriptionId: sub.id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerGstin: customer.gstin,
      customerAddress: customer.address,
      placeOfSupply: `${customer.state} (${customer.stateCode})`,
      billingPeriod: period,
      invoiceDate: todayStr,
      dueDate: dueDateStr,
      frequency: sub.frequency || 'Monthly',
      status: 'Confirmed',
      subtotal,
      discountAmount: 0.0,
      discountCode: null,
      taxType: taxCalc.taxType,
      cgstRate: taxCalc.cgstRate,
      cgstAmount: taxCalc.cgstAmount,
      sgstRate: taxCalc.sgstRate,
      sgstAmount: taxCalc.sgstAmount,
      igstRate: taxCalc.igstRate,
      igstAmount: taxCalc.igstAmount,
      totalTax: taxCalc.totalTax,
      grandTotal,
      paidAmount: 0.0,
      outstandingBalance: grandTotal,
      paymentStatus: 'Confirmed',
      sentAt: null,
      confirmedAt: new Date().toLocaleString(),
      idempotencyKey: `${sub.id}-${period}`,
      lines,
      payments: []
    };

    this.invoices.unshift(newInvoice);

    // Update or add corresponding billing operation
    const op = this.billingOperations.find(b => b.subscriptionId === sub.id && b.status === 'Upcoming');
    if (op) {
      op.status = 'Completed';
      op.invoiceId = invoiceNum;
      op.lastAttempt = new Date().toLocaleString();
    }

    this.notify('INVOICE_GENERATED', newInvoice);
    return newInvoice;
  }

  confirmInvoice(invoiceId) {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice not found');
    if (inv.status === 'Cancelled') throw new Error('Cannot confirm a cancelled invoice.');
    inv.status = 'Confirmed';
    inv.paymentStatus = 'Confirmed';
    inv.confirmedAt = new Date().toLocaleString();
    this.notify('INVOICE_CONFIRMED', inv);
    return inv;
  }

  cancelInvoice(invoiceId, reason = 'Administrative cancellation') {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice not found');
    inv.status = 'Cancelled';
    inv.paymentStatus = 'Cancelled';
    inv.outstandingBalance = 0.0;
    inv.cancellationReason = reason;
    inv.cancelledAt = new Date().toLocaleString();
    this.notify('INVOICE_CANCELLED', inv);
    return inv;
  }

  sendInvoice(invoiceId) {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice not found');
    inv.sentAt = new Date().toLocaleString();
    this.notify('INVOICE_SENT', inv);
    return inv;
  }

  recordPayment(invoiceId, paymentData) {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const paymentAmount = Number(paymentData.amount || 0);
    inv.paidAmount = Math.min(inv.grandTotal, (inv.paidAmount || 0) + paymentAmount);
    inv.outstandingBalance = Math.max(0, inv.grandTotal - inv.paidAmount);

    if (inv.outstandingBalance === 0) {
      inv.status = 'Paid';
      inv.paymentStatus = 'Paid';
    } else {
      inv.status = 'Partially paid';
      inv.paymentStatus = 'Partially paid';
    }

    inv.payments = inv.payments || [];
    inv.payments.push({
      paymentId: paymentData.paymentId || `PAY-${Date.now()}`,
      date: paymentData.date || new Date().toISOString().slice(0, 10),
      method: paymentData.method || 'Online Payment Gateway',
      reference: paymentData.reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: paymentAmount,
      status: 'Settled'
    });

    this.notify('INVOICE_PAID', inv);
    return inv;
  }

  getInvoiceTotals() {
    const recognized = this.invoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const paid = this.invoices
      .reduce((sum, i) => sum + (i.paidAmount || 0), 0);

    const overdue = this.invoices
      .filter(i => i.status === 'Overdue')
      .reduce((sum, i) => sum + i.outstandingBalance, 0);

    const outstanding = this.invoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (i.outstandingBalance || 0), 0);

    return {
      recognized,
      paid,
      overdue,
      outstanding,
      count: this.invoices.length,
      overdueCount: this.invoices.filter(i => i.status === 'Overdue').length
    };
  }

  // --- RECURRING BILLING OPERATIONS API ---
  getBillingOperations(filters = {}) {
    let result = [...this.billingOperations];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(op => op.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.frequency && filters.frequency !== 'all') {
      result = result.filter(op => op.frequency.toLowerCase() === filters.frequency.toLowerCase());
    }

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(op =>
        op.id.toLowerCase().includes(term) ||
        op.subscriptionId.toLowerCase().includes(term) ||
        op.customerName.toLowerCase().includes(term)
      );
    }

    return result;
  }

  retryBillingOperation(opId) {
    const op = this.billingOperations.find(b => b.id === opId);
    if (!op) throw new Error('Billing operation not found');

    op.retryCount = (op.retryCount || 0) + 1;
    op.lastAttempt = new Date().toLocaleString();

    // Auto generate invoice for the subscription if not duplicate
    try {
      const invoice = this.generateInvoiceFromSubscription(op.subscriptionId, op.billingPeriod);
      op.status = 'Completed';
      op.invoiceId = invoice.invoiceNumber;
      op.exceptionReason = null;
    } catch (err) {
      // If invoice already exists, link it
      const dup = this.checkDuplicateInvoice(op.subscriptionId, op.billingPeriod);
      if (dup.isDuplicate && dup.existingInvoice) {
        op.status = 'Completed';
        op.invoiceId = dup.existingInvoice.invoiceNumber;
        op.exceptionReason = null;
      } else {
        op.status = 'Failed';
        op.exceptionReason = `Retry attempt #${op.retryCount} failed: ${err.message}`;
      }
    }

    this.notify('BILLING_RETRY', op);
    return op;
  }

  triggerBillingCycle() {
    let generatedCount = 0;
    const upcomingOps = this.billingOperations.filter(b => b.status === 'Upcoming');

    upcomingOps.forEach(op => {
      try {
        const inv = this.generateInvoiceFromSubscription(op.subscriptionId, op.billingPeriod);
        op.status = 'Completed';
        op.invoiceId = inv.invoiceNumber;
        op.lastAttempt = new Date().toLocaleString();
        generatedCount++;
      } catch (err) {
        // If duplicate or error, log
        console.warn(`Billing cycle skip for ${op.id}:`, err.message);
      }
    });

    this.notify('BILLING_CYCLE_TRIGGERED', { count: generatedCount });
    return { generatedCount, remaining: this.billingOperations.filter(b => b.status === 'Upcoming').length };
  }

  getSubscriptionBillingHistory(subscriptionId) {
    const invoices = this.invoices.filter(i => i.subscriptionId === subscriptionId);
    const operations = this.billingOperations.filter(b => b.subscriptionId === subscriptionId);
    return { subscriptionId, invoices, operations };
  }

  getBillingStats() {
    return {
      total: this.billingOperations.length,
      upcoming: this.billingOperations.filter(b => b.status === 'Upcoming').length,
      completed: this.billingOperations.filter(b => b.status === 'Completed').length,
      failed: this.billingOperations.filter(b => b.status === 'Failed').length,
      totalAmountDue: this.billingOperations
        .filter(b => b.status === 'Upcoming')
        .reduce((sum, b) => sum + (b.amountDue || 0), 0)
    };
  }

  // --- TAX MANAGEMENT API ---
  getTaxRules(filters = {}) {
    let result = [...this.taxRules];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        t.scope.toLowerCase().includes(term)
      );
    }

    return result;
  }

  createTaxRule(ruleData) {
    const rate = Number(ruleData.rate || 0);
    let cgst = 0, sgst = 0, igst = 0;

    if (ruleData.type && ruleData.type.includes('Dual')) {
      cgst = rate / 2;
      sgst = rate / 2;
    } else if (ruleData.type && ruleData.type.includes('IGST')) {
      igst = rate;
    }

    const nextId = `TAX-${String(this.taxRules.length + 1).padStart(3, '0')}`;
    const newRule = {
      id: nextId,
      name: ruleData.name,
      rate,
      type: ruleData.type || 'Dual-GST (CGST 9% + SGST 9%)',
      scope: ruleData.scope || 'Domestic Intra-state',
      stateCode: ruleData.stateCode || '29',
      cgstRate: cgst,
      sgstRate: sgst,
      igstRate: igst,
      applicableProducts: ruleData.applicableProducts || 'All Cloud Subscriptions & Services',
      startDate: ruleData.startDate || new Date().toISOString().slice(0, 10),
      endDate: ruleData.endDate || '2028-12-31',
      status: ruleData.status || 'Active',
      description: ruleData.description || 'Configured via SubscriptIQ Tax Administration'
    };

    this.taxRules.push(newRule);
    this.notify('TAX_RULE_CREATED', newRule);
    return newRule;
  }

  updateTaxRule(id, updates) {
    const rule = this.taxRules.find(t => t.id === id);
    if (!rule) throw new Error('Tax rule not found');

    Object.assign(rule, updates);
    if (updates.rate !== undefined) {
      const r = Number(updates.rate);
      if (rule.type.includes('Dual')) {
        rule.cgstRate = r / 2;
        rule.sgstRate = r / 2;
        rule.igstRate = 0;
      } else if (rule.type.includes('IGST')) {
        rule.cgstRate = 0;
        rule.sgstRate = 0;
        rule.igstRate = r;
      }
    }

    this.notify('TAX_RULE_UPDATED', rule);
    return rule;
  }

  toggleTaxRuleStatus(id) {
    const rule = this.taxRules.find(t => t.id === id);
    if (!rule) throw new Error('Tax rule not found');
    rule.status = rule.status === 'Active' ? 'Inactive' : 'Active';
    this.notify('TAX_RULE_TOGGLED', rule);
    return rule;
  }

  // --- PUBLISH GLOBAL INTERFACES FOR TEAMMATES ---
  publishGlobalInterfaces() {
    // Teammate 4 (Payments) consumption
    window.SubscriptIQ_Invoices = {
      getInvoices: (f) => this.getInvoices(f),
      getInvoiceById: (id) => this.getInvoiceById(id),
      getOutstandingBalances: () => this.getInvoiceTotals().outstanding,
      getInvoiceTotals: () => this.getInvoiceTotals(),
      recordPayment: (id, p) => this.recordPayment(id, p),
      confirmInvoice: (id) => this.confirmInvoice(id),
      cancelInvoice: (id, r) => this.cancelInvoice(id, r),
      generateFromSubscription: (subId, period) => this.generateInvoiceFromSubscription(subId, period),
      onInvoiceUpdated: (cb) => this.subscribe(cb)
    };

    // Teammate 6 (Analytics) consumption
    window.SubscriptIQ_Billing = {
      getBillingOperations: (f) => this.getBillingOperations(f),
      getBillingStats: () => this.getBillingStats(),
      retryBilling: (id) => this.retryBillingOperation(id),
      triggerBillingCycle: () => this.triggerBillingCycle(),
      getSubscriptionBillingHistory: (id) => this.getSubscriptionBillingHistory(id)
    };

    // Shared Tax Engine
    window.SubscriptIQ_Taxes = {
      getTaxRules: (f) => this.getTaxRules(f),
      calculateTax: (amt, cust) => this.calculateTaxForCustomer(amt, cust),
      createTaxRule: (r) => this.createTaxRule(r),
      toggleStatus: (id) => this.toggleTaxRuleStatus(id)
    };
  }
}

export const invoiceService = new InvoiceService();
