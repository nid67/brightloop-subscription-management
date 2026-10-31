/**
 * SubscriptIQ - Module 04 Business Logic & Payment/Discount Service
 * Manages Payment Records, Invoice Allocation, Reconciliation,
 * and Admin Discount Rules with Multi-Condition Frontend Validation.
 */

import { INITIAL_PAYMENTS, INITIAL_DISCOUNTS } from './payment-data.js';

class PaymentService {
  constructor() {
    this.payments = [...INITIAL_PAYMENTS];
    this.discounts = [...INITIAL_DISCOUNTS];
    this.listeners = [];

    // Publish interfaces globally for Teammate 3 (Invoices), Teammate 6 (Analytics), and Teammate 2 (Subscriptions)
    this.publishGlobalInterfaces();
  }

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
        console.error('PaymentService listener error:', err);
      }
    });
  }

  // --- INVOICE ACCESS (Integration with Teammate 3) ---
  getInvoices() {
    if (window.SubscriptIQ_Invoices && typeof window.SubscriptIQ_Invoices.getInvoices === 'function') {
      return window.SubscriptIQ_Invoices.getInvoices();
    }
    return [];
  }

  getInvoiceById(invoiceId) {
    if (window.SubscriptIQ_Invoices && typeof window.SubscriptIQ_Invoices.getInvoiceById === 'function') {
      return window.SubscriptIQ_Invoices.getInvoiceById(invoiceId);
    }
    return null;
  }

  // --- PAYMENT OPERATIONS ---
  getPayments(filters = {}) {
    let result = [...this.payments];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(p => p.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.method && filters.method !== 'all') {
      result = result.filter(p => p.method.toLowerCase() === filters.method.toLowerCase());
    }

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(p =>
        p.reference.toLowerCase().includes(term) ||
        p.customerName.toLowerCase().includes(term) ||
        (p.invoiceId && p.invoiceId.toLowerCase().includes(term)) ||
        (p.channelDetails && p.channelDetails.toLowerCase().includes(term))
      );
    }

    // Sort order
    if (filters.sortBy) {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (filters.sortBy === 'date') return dir * (new Date(a.date) - new Date(b.date));
        if (filters.sortBy === 'amount') return dir * (a.amount - b.amount);
        if (filters.sortBy === 'ref') return dir * a.reference.localeCompare(b.reference);
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    return result;
  }

  getPaymentById(id) {
    return this.payments.find(p => p.id === id || p.reference === id) || null;
  }

  getPaymentTotals() {
    const successfulPayments = this.payments.filter(p => p.status === 'Successful');
    const totalCollected = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = this.payments.filter(p => p.status === 'Pending');
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const failedPayments = this.payments.filter(p => p.status === 'Failed');
    const totalFailed = failedPayments.reduce((sum, p) => sum + p.amount, 0);

    const unallocatedAmount = this.payments
      .filter(p => p.status === 'Successful')
      .reduce((sum, p) => sum + (p.unallocatedAmount || 0), 0);

    const reconciledCount = this.payments.filter(p => p.reconciliationStatus === 'Reconciled').length;
    const reconciliationRate = this.payments.length > 0
      ? Math.round((reconciledCount / this.payments.length) * 100)
      : 100;

    return {
      totalCollected,
      totalPending,
      pendingCount: pendingPayments.length,
      totalFailed,
      failedCount: failedPayments.length,
      unallocatedAmount,
      totalPaymentsCount: this.payments.length,
      reconciliationRate
    };
  }

  recordPayment(formData) {
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be a positive number greater than ₹ 0.00.');
    }

    let customerName = formData.customerName || 'Customer Client';
    let customerEmail = formData.customerEmail || '';
    let invoice = null;
    let allocatedAmount = 0;
    let unallocatedAmount = amount;
    let reconciliationStatus = 'Unallocated Credit';
    const allocations = [];

    // If an invoice is selected, perform strict balance validation
    if (formData.invoiceId && formData.invoiceId !== 'unallocated') {
      invoice = this.getInvoiceById(formData.invoiceId);
      if (!invoice) {
        throw new Error(`Selected invoice ${formData.invoiceId} was not found.`);
      }

      if (invoice.status === 'Cancelled') {
        throw new Error(`Cannot record payment against cancelled invoice ${invoice.invoiceNumber}.`);
      }

      const permittedOutstanding = invoice.outstandingBalance !== undefined ? invoice.outstandingBalance : (invoice.grandTotal - (invoice.paidAmount || 0));

      if (amount > permittedOutstanding) {
        throw new Error(`Payment amount (₹ ${amount.toLocaleString('en-IN')}) exceeds the permitted outstanding balance of ₹ ${permittedOutstanding.toLocaleString('en-IN')}. Overpayment is blocked.`);
      }

      customerName = invoice.customerName;
      customerEmail = invoice.customerEmail || customerEmail;
      allocatedAmount = amount;
      unallocatedAmount = 0;
      reconciliationStatus = 'Reconciled';

      allocations.push({
        allocationId: `ALC-${Date.now().toString().slice(-5)}`,
        invoiceNumber: invoice.invoiceNumber,
        allocatedAmount: amount,
        allocationDate: formData.date || new Date().toISOString().slice(0, 10)
      });
    }

    const nextSeq = this.payments.length + 1;
    const paymentId = `PAY-2026-${String(nextSeq).padStart(3, '0')}`;
    const reference = formData.reference && formData.reference.trim()
      ? formData.reference.trim()
      : `PAY-${(formData.method || 'TXN').toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-5)}`;

    const newPayment = {
      id: paymentId,
      reference,
      invoiceId: invoice ? invoice.invoiceNumber : null,
      customerId: invoice ? invoice.customerId : 'CUST-GEN',
      customerName,
      customerEmail,
      method: formData.method || 'Bank transfer',
      channelDetails: formData.channelDetails || `${formData.method} Remittance (Ref: ${reference})`,
      amount,
      allocatedAmount,
      unallocatedAmount,
      date: formData.date || new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: formData.status || 'Successful',
      reconciliationStatus,
      notes: formData.notes || 'Recorded via SubscriptIQ Payment Operations Workspace.',
      allocations
    };

    this.payments.unshift(newPayment);

    // Synchronize with Teammate 3 (Invoice Service)
    if (invoice && window.SubscriptIQ_Invoices && typeof window.SubscriptIQ_Invoices.recordPayment === 'function') {
      try {
        window.SubscriptIQ_Invoices.recordPayment(invoice.invoiceNumber, {
          paymentId: reference,
          amount,
          method: newPayment.method,
          reference: newPayment.reference,
          date: newPayment.date
        });
      } catch (err) {
        console.warn('Syncing payment with invoice service encountered a note:', err.message);
      }
    }

    this.notify('PAYMENT_RECORDED', newPayment);
    return newPayment;
  }

  refundPayment(paymentId, reason = 'Customer requested refund') {
    const payment = this.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'Refunded') throw new Error('Payment is already refunded.');

    payment.status = 'Refunded';
    payment.notes = `${payment.notes || ''} [Refunded on ${new Date().toLocaleDateString()}: ${reason}]`;
    payment.reconciliationStatus = 'Refund Settled';

    this.notify('PAYMENT_REFUNDED', payment);
    return payment;
  }

  // --- DISCOUNT OPERATIONS ---
  getDiscounts(filters = {}) {
    let result = [...this.discounts];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(d => d.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter(d => d.type.toLowerCase().includes(filters.type.toLowerCase()));
    }

    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        d.applicableProducts.toLowerCase().includes(term)
      );
    }

    return result;
  }

  getDiscountById(id) {
    return this.discounts.find(d => d.id === id) || null;
  }

  getDiscountByCode(code) {
    if (!code) return null;
    return this.discounts.find(d => d.code.toUpperCase() === code.trim().toUpperCase()) || null;
  }

  createDiscount(data) {
    const code = data.code ? data.code.trim().toUpperCase() : `CODE-${Date.now().toString().slice(-4)}`;

    // Verify unique code
    if (this.discounts.some(d => d.code === code)) {
      throw new Error(`Discount coupon code "${code}" already exists.`);
    }

    const value = Number(data.value);
    if (isNaN(value) || value <= 0) {
      throw new Error('Discount value must be a positive number.');
    }

    const nextId = `DISC-${String(this.discounts.length + 1).padStart(3, '0')}`;
    const newDiscount = {
      id: nextId,
      name: data.name,
      code,
      type: data.type || 'Percentage',
      value,
      minPurchase: Number(data.minPurchase) || 0,
      minQuantity: Number(data.minQuantity) || 1,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      endDate: data.endDate || '2027-12-31',
      usageLimit: Number(data.usageLimit) || 100,
      usageCount: 0,
      applicableProducts: data.applicableProducts || 'All Cloud Subscriptions & Services',
      applicablePlans: data.applicablePlans || 'All Plans',
      subscriptionWide: data.subscriptionWide !== false,
      status: data.status || 'Active',
      description: data.description || 'Configured via SubscriptIQ Discount Administration'
    };

    this.discounts.push(newDiscount);
    this.notify('DISCOUNT_CREATED', newDiscount);
    return newDiscount;
  }

  updateDiscount(id, updates) {
    const disc = this.getDiscountById(id);
    if (!disc) throw new Error('Discount not found');

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
      const existing = this.discounts.find(d => d.id !== id && d.code === updates.code);
      if (existing) throw new Error(`Discount coupon code "${updates.code}" is already in use.`);
    }

    Object.assign(disc, updates);
    this.notify('DISCOUNT_UPDATED', disc);
    return disc;
  }

  toggleDiscountStatus(id) {
    const disc = this.getDiscountById(id);
    if (!disc) throw new Error('Discount not found');
    disc.status = disc.status === 'Active' ? 'Inactive' : 'Active';
    this.notify('DISCOUNT_TOGGLED', disc);
    return disc;
  }

  // --- DISCOUNT VALIDATION ENGINE (Frontend Rule Evaluator) ---
  validateDiscount(code, context = {}) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, state: 'invalid', message: 'Please enter a promotional coupon code.' };
    }

    const discount = this.getDiscountByCode(cleanCode);
    if (!discount) {
      return { valid: false, state: 'invalid', message: `Coupon code "${cleanCode}" does not exist in the active directory.` };
    }

    if (discount.status !== 'Active') {
      return { valid: false, state: 'inactive', message: `Coupon code "${cleanCode}" is currently deactivated.` };
    }

    // Date validity check
    const today = new Date().toISOString().slice(0, 10);
    if (today > discount.endDate) {
      return {
        valid: false,
        state: 'expired',
        message: `Coupon code "${cleanCode}" expired on ${discount.endDate}.`,
        discount
      };
    }

    if (today < discount.startDate) {
      return {
        valid: false,
        state: 'future',
        message: `Coupon code "${cleanCode}" is not yet active (valid from ${discount.startDate}).`,
        discount
      };
    }

    // Usage limit check
    if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
      return {
        valid: false,
        state: 'limit_reached',
        message: `Coupon code "${cleanCode}" has reached its maximum redemption cap of ${discount.usageLimit} uses.`,
        discount
      };
    }

    // Minimum purchase amount check
    const subtotal = Number(context.subtotal || 0);
    if (discount.minPurchase > 0 && subtotal < discount.minPurchase) {
      return {
        valid: false,
        state: 'min_purchase_not_met',
        message: `Minimum order amount of ₹ ${discount.minPurchase.toLocaleString('en-IN')} is required to apply "${cleanCode}". Current: ₹ ${subtotal.toLocaleString('en-IN')}.`,
        discount
      };
    }

    // Product eligibility check
    if (context.product && discount.applicableProducts !== 'All Cloud Subscriptions & Services') {
      const match = discount.applicableProducts.toLowerCase().includes(context.product.toLowerCase());
      if (!match) {
        return {
          valid: false,
          state: 'product_not_eligible',
          message: `Coupon code "${cleanCode}" is restricted to "${discount.applicableProducts}". Not applicable for "${context.product}".`,
          discount
        };
      }
    }

    // Calculation
    let computedDiscount = 0;
    if (discount.type.toLowerCase().includes('percentage')) {
      computedDiscount = Math.round((subtotal * (discount.value / 100)) * 100) / 100;
    } else {
      computedDiscount = Math.min(subtotal, discount.value);
    }
    const finalPayable = Math.max(0, subtotal - computedDiscount);

    return {
      valid: true,
      state: 'valid',
      message: `Coupon "${cleanCode}" applied successfully! You save ₹ ${computedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      discount,
      computedDiscount,
      finalPayable
    };
  }

  // --- PUBLISH GLOBAL APIS FOR TEAMMATES ---
  publishGlobalInterfaces() {
    window.SubscriptIQ_Payments = {
      getPayments: (f) => this.getPayments(f),
      getPaymentById: (id) => this.getPaymentById(id),
      getPaymentTotals: () => this.getPaymentTotals(),
      recordPayment: (data) => this.recordPayment(data),
      refundPayment: (id, r) => this.refundPayment(id, r),
      onPaymentUpdate: (cb) => this.subscribe(cb)
    };

    window.SubscriptIQ_Discounts = {
      getDiscounts: (f) => this.getDiscounts(f),
      getDiscountByCode: (code) => this.getDiscountByCode(code),
      validateDiscount: (code, ctx) => this.validateDiscount(code, ctx),
      createDiscount: (data) => this.createDiscount(data),
      updateDiscount: (id, u) => this.updateDiscount(id, u),
      toggleStatus: (id) => this.toggleDiscountStatus(id)
    };
  }
}

export const paymentService = new PaymentService();
