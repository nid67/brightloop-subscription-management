import { INITIAL_QUOTATIONS, INITIAL_SUBSCRIPTIONS } from './mock-data.js';
import { dataService as cppService } from '../customer-product-plan/data-service.js';

class QuoteSubscriptionService {
  constructor() {
    this.STORAGE_KEYS = {
      QUOTATIONS: 'subscriptiq_v2_quotations',
      SUBSCRIPTIONS: 'subscriptiq_v2_subscriptions'
    };

    ['subscriptiq_quotations', 'subscriptiq_subscriptions'].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    this.quotations = this._load(this.STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    this.subscriptions = this._load(this.STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);

    this.listeners = new Set();
  }

  _load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(`Error loading ${key}:`, e);
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  _persist(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this._notify();
    } catch (e) {
      console.warn(`Error persisting ${key}:`, e);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (err) { console.error(err); }
    });
  }

  // ==========================================
  // 1. QUOTATION METHODS
  // ==========================================

  getQuotations(options = {}) {
    let list = [...this.quotations];
    const { search = '', status = '', customerId = '' } = options;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(item =>
        (item.quoteNumber && item.quoteNumber.toLowerCase().includes(q)) ||
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.planName && item.planName.toLowerCase().includes(q))
      );
    }

    if (status) {
      list = list.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }

    if (customerId) {
      list = list.filter(item => item.customerId === customerId);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getQuotationById(id) {
    return this.quotations.find(q => q.id === id || q.quoteNumber === id) || null;
  }

  createQuotation(data) {
    const nextNum = 100 + this.quotations.length + 1;
    const quoteNumber = `QT-2026-${nextNum}`;

    // Look up customer
    const customer = cppService.getCustomerById(data.customerId);
    const product = cppService.getProductById(data.productId);
    const plan = cppService.getPlanById(data.planId);

    const quantity = Math.max(1, Number(data.quantity) || 1);
    const basePrice = plan ? Number(plan.price) : (product ? Number(product.salesPrice) : 0);

    // Compute variant surcharges
    let variantSurchargePerUnit = 0;
    const selectedVariants = [];
    if (product && Array.isArray(product.variants) && Array.isArray(data.variantIds)) {
      product.variants.forEach(v => {
        if (data.variantIds.includes(v.id)) {
          selectedVariants.push(v);
          variantSurchargePerUnit += Number(v.additionalPrice || 0);
        }
      });
    }

    const unitPrice = basePrice + variantSurchargePerUnit;
    const subtotal = unitPrice * quantity;
    const taxRate = 18; // Standard India Dual GST (9% CGST + 9% SGST)
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newQuote = {
      id: quoteNumber,
      quoteNumber,
      customerId: data.customerId || '',
      customerName: customer ? customer.name : (data.customerName || 'Unknown Customer'),
      customerEmail: customer ? customer.email : '',
      customerCompany: customer ? (customer.company || customer.name) : '',
      productId: data.productId || '',
      productName: product ? product.name : (data.productName || 'Custom Product'),
      planId: data.planId || '',
      planName: plan ? plan.name : (data.planName || 'Standard Tier'),
      billingFrequency: data.billingFrequency || (plan ? plan.billingFrequency : 'Monthly'),
      quantity,
      basePrice,
      selectedVariants,
      variantSurchargePerUnit,
      unitPrice,
      subtotal,
      taxRate,
      taxAmount,
      total,
      validUntil: data.validUntil || defaultExpiry,
      createdAt: todayStr,
      status: data.status || 'Draft',
      convertedSubscriptionId: null,
      notes: data.notes || '',
      history: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Created',
          details: `Quotation ${quoteNumber} drafted with total ₹${total.toLocaleString('en-IN')}`
        }
      ]
    };

    this.quotations.unshift(newQuote);
    this._persist(this.STORAGE_KEYS.QUOTATIONS, this.quotations);
    return newQuote;
  }

  updateQuotation(id, updates) {
    const idx = this.quotations.findIndex(q => q.id === id);
    if (idx === -1) return null;

    const existing = this.quotations[idx];

    // Recalculate financial fields if pricing/quantity changed
    let quantity = updates.quantity !== undefined ? Number(updates.quantity) : existing.quantity;
    let basePrice = updates.basePrice !== undefined ? Number(updates.basePrice) : existing.basePrice;
    let variantSurchargePerUnit = updates.variantSurchargePerUnit !== undefined ? Number(updates.variantSurchargePerUnit) : existing.variantSurchargePerUnit;
    let unitPrice = basePrice + variantSurchargePerUnit;
    let subtotal = unitPrice * quantity;
    let taxRate = 18;
    let taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    let total = Number((subtotal + taxAmount).toFixed(2));

    const updated = {
      ...existing,
      ...updates,
      quantity,
      basePrice,
      variantSurchargePerUnit,
      unitPrice,
      subtotal,
      taxAmount,
      total,
      history: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Updated',
          details: 'Quotation parameters modified'
        },
        ...(existing.history || [])
      ]
    };

    this.quotations[idx] = updated;
    this._persist(this.STORAGE_KEYS.QUOTATIONS, this.quotations);
    return updated;
  }

  setQuotationStatus(id, newStatus, reason = '') {
    const quote = this.getQuotationById(id);
    if (!quote) return null;

    const historyItem = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: `Status: ${newStatus}`,
      details: reason || `Quotation status marked as ${newStatus}`
    };

    return this.updateQuotation(id, {
      status: newStatus,
      history: [historyItem, ...(quote.history || [])]
    });
  }

  // ==========================================
  // 2. CONVERT QUOTATION TO SUBSCRIPTION
  // ==========================================

  convertQuotationToSubscription(quotationId) {
    const quote = this.getQuotationById(quotationId);
    if (!quote) {
      throw new Error('Quotation not found.');
    }

    if (quote.convertedSubscriptionId) {
      const existingSub = this.getSubscriptionById(quote.convertedSubscriptionId);
      if (existingSub) {
        throw new Error(`Quotation has already been converted into subscription ${quote.convertedSubscriptionId}. Duplicate prevented.`);
      }
    }

    if (quote.status !== 'Accepted') {
      throw new Error(`Only Accepted quotations can be converted to subscriptions. Current status is "${quote.status}".`);
    }

    // Generate Subscription Number
    const nextSubNum = String(this.subscriptions.length + 1).padStart(3, '0');
    const subNumber = `SUB-2026-${nextSubNum}`;

    const startDate = new Date().toISOString().split('T')[0];
    const nextBillingDate = this.calculateNextBillingDate(startDate, quote.billingFrequency);

    const newSub = {
      id: subNumber,
      subscriptionNumber: subNumber,
      quotationId: quote.id,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerCompany: quote.customerCompany,
      productId: quote.productId,
      productName: quote.productName,
      planId: quote.planId,
      planName: quote.planName,
      billingFrequency: quote.billingFrequency,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      recurringAmount: quote.total, // recurring total including GST
      taxRate: quote.taxRate,
      status: 'Active',
      startDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: nextBillingDate,
      nextBillingDate,
      autoRenew: true,
      trialEndDate: null,
      cancellationReason: null,
      pauseResumeDate: null,
      selectedVariants: quote.selectedVariants || [],
      lines: [
        {
          description: `${quote.planName} - ${quote.productName}`,
          quantity: quote.quantity,
          unitPrice: quote.unitPrice,
          amount: quote.subtotal
        }
      ],
      history: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Activated',
          details: `Provisioned from Accepted Quotation ${quote.quoteNumber}`
        },
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Billing Scheduled',
          details: `First renewal invoice scheduled on ${nextBillingDate}`
        }
      ]
    };

    // Update Quotation to record link
    this.updateQuotation(quote.id, {
      convertedSubscriptionId: subNumber,
      history: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Converted',
          details: `Provisioned subscription ${subNumber}`
        },
        ...(quote.history || [])
      ]
    });

    // Save Subscription
    this.subscriptions.unshift(newSub);
    this._persist(this.STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);

    // Also link to customer profile in Module 01 if customer exists
    const customer = cppService.getCustomerById(quote.customerId);
    if (customer) {
      const activeSubs = customer.activeSubscriptions || [];
      activeSubs.unshift({
        id: subNumber,
        planName: quote.planName,
        cadence: quote.billingFrequency,
        amount: quote.total,
        status: 'Active',
        renewalDate: nextBillingDate
      });
      cppService.updateCustomer(customer.id, {
        activeSubscriptions: activeSubs
      });
    }

    return newSub;
  }

  calculateNextBillingDate(startDateStr, frequency) {
    const d = new Date(startDateStr);
    switch ((frequency || '').toLowerCase()) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d.toISOString().split('T')[0];
  }

  // ==========================================
  // 3. SUBSCRIPTION LIFECYCLE METHODS
  // ==========================================

  getSubscriptions(options = {}) {
    let list = [...this.subscriptions];
    const { search = '', status = '', frequency = '', customerId = '' } = options;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.subscriptionNumber && s.subscriptionNumber.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.planName && s.planName.toLowerCase().includes(q)) ||
        (s.productName && s.productName.toLowerCase().includes(q))
      );
    }

    if (status) {
      list = list.filter(s => s.status.toLowerCase() === status.toLowerCase());
    }

    if (frequency) {
      list = list.filter(s => s.billingFrequency.toLowerCase() === frequency.toLowerCase());
    }

    if (customerId) {
      list = list.filter(s => s.customerId === customerId);
    }

    return list.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  getSubscriptionById(id) {
    return this.subscriptions.find(s => s.id === id || s.subscriptionNumber === id) || null;
  }

  updateSubscriptionStatus(id, newStatus, reason = '', extra = {}) {
    const sub = this.getSubscriptionById(id);
    if (!sub) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const historyItem = {
      date: now,
      action: `Status: ${newStatus}`,
      details: reason || `Subscription transitioned to ${newStatus}`
    };

    const updates = {
      status: newStatus,
      ...extra,
      history: [historyItem, ...(sub.history || [])]
    };

    const idx = this.subscriptions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.subscriptions[idx] = { ...sub, ...updates };
      this._persist(this.STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);
      return this.subscriptions[idx];
    }
    return null;
  }

  pauseSubscription(id, resumeDate = '') {
    return this.updateSubscriptionStatus(id, 'Paused', `Subscription paused until ${resumeDate || 'further notice'}`, {
      pauseResumeDate: resumeDate
    });
  }

  resumeSubscription(id) {
    return this.updateSubscriptionStatus(id, 'Active', 'Subscription resumed to active status', {
      pauseResumeDate: null
    });
  }

  cancelSubscription(id, reason = '') {
    return this.updateSubscriptionStatus(id, 'Cancelled', `Subscription cancelled: ${reason || 'Subscriber request'}`, {
      cancellationReason: reason || 'Cancelled by operator',
      autoRenew: false
    });
  }

  renewSubscription(id) {
    const sub = this.getSubscriptionById(id);
    if (!sub) return null;

    const nextDate = this.calculateNextBillingDate(sub.nextBillingDate, sub.billingFrequency);
    return this.updateSubscriptionStatus(id, 'Active', `Subscription manually renewed. Next cycle due on ${nextDate}`, {
      currentPeriodStart: sub.nextBillingDate,
      currentPeriodEnd: nextDate,
      nextBillingDate: nextDate
    });
  }

  // Exposed interface for Recurring Invoicing module
  getSubscriptionsDueForBilling(currentDateStr = new Date().toISOString().split('T')[0]) {
    return this.subscriptions.filter(s => 
      (s.status === 'Active' || s.status === 'Trial') &&
      s.nextBillingDate <= currentDateStr
    );
  }
}

export const quoteSubService = new QuoteSubscriptionService();

// Expose on window for Recurring Billing and Finance teammates
if (typeof window !== 'undefined') {
  window.SubscriptIQ = window.SubscriptIQ || {};
  window.SubscriptIQ.QuoteSubscriptionService = quoteSubService;
}

