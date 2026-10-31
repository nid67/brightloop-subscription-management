import { INITIAL_CUSTOMERS, INITIAL_PRODUCTS, INITIAL_PLANS } from './mock-data.js';

class DataService {
  constructor() {
    this.STORAGE_KEYS = {
      CUSTOMERS: 'subscriptiq_v2_customers',
      PRODUCTS: 'subscriptiq_v2_products',
      PLANS: 'subscriptiq_v2_plans'
    };

    ['subscriptiq_customers', 'subscriptiq_products', 'subscriptiq_plans'].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    this.customers = this._load(this.STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.products = this._load(this.STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.plans = this._load(this.STORAGE_KEYS.PLANS, INITIAL_PLANS);

    this.listeners = new Set();
  }

  _load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(`Error loading ${key} from storage:`, e);
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  _persist(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this._notify();
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
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
  // 1. CUSTOMER API & INTERFACES (For Team 5 & 6)
  // ==========================================

  getCustomers(options = {}) {
    let list = [...this.customers];
    const { search = '', status = '', type = '', sortBy = 'name', sortOrder = 'asc' } = options;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
      );
    }

    if (status) {
      list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    if (type) {
      list = list.filter(c => c.customerType.toLowerCase() === type.toLowerCase());
    }

    list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  getCustomerById(id) {
    return this.customers.find(c => c.id === id) || null;
  }

  createCustomer(data) {
    const id = `CUST-${String(this.customers.length + 1).padStart(3, '0')}`;
    const newCustomer = {
      id,
      name: data.name || '',
      company: data.company || data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      customerType: data.customerType || 'Enterprise',
      gstin: (data.gstin || '').toUpperCase(),
      registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      lifetimeRevenue: Number(data.lifetimeRevenue) || 0,
      outstandingBalance: Number(data.outstandingBalance) || 0,
      address: data.address || '',
      activeSubscriptions: [],
      previousSubscriptions: [],
      invoices: [],
      payments: [],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'Account',
          description: `Customer account created (${data.customerType || 'Standard'})`
        }
      ]
    };

    this.customers.unshift(newCustomer);
    this._persist(this.STORAGE_KEYS.CUSTOMERS, this.customers);
    return newCustomer;
  }

  updateCustomer(id, updates) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const existing = this.customers[idx];
    const updated = {
      ...existing,
      ...updates,
      gstin: updates.gstin ? updates.gstin.toUpperCase() : existing.gstin,
      activities: [
        {
          id: `ACT-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'Account',
          description: 'Account profile details updated'
        },
        ...(existing.activities || [])
      ]
    };

    this.customers[idx] = updated;
    this._persist(this.STORAGE_KEYS.CUSTOMERS, this.customers);
    return updated;
  }

  archiveCustomer(id) {
    const customer = this.getCustomerById(id);
    if (!customer) return false;
    const newStatus = customer.status === 'Archived' ? 'Active' : 'Archived';
    this.updateCustomer(id, { status: newStatus });
    return true;
  }

  deleteCustomer(id) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.customers.splice(idx, 1);
    this._persist(this.STORAGE_KEYS.CUSTOMERS, this.customers);
    return true;
  }

  // ==========================================
  // 2. PRODUCT & VARIANT API (For Team 2 & 6)
  // ==========================================

  getProducts(options = {}) {
    let list = [...this.products];
    const { search = '', status = '', type = '' } = options;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q))
      );
    }

    if (status) {
      list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    if (type) {
      list = list.filter(p => p.type.toLowerCase() === type.toLowerCase());
    }

    return list;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  createProduct(data) {
    const id = `PROD-${String(this.products.length + 1).padStart(3, '0')}`;
    const newProduct = {
      id,
      name: data.name || '',
      sku: (data.sku || `BL-PROD-${Date.now().toString().slice(-4)}`).toUpperCase(),
      type: data.type || 'Service / SaaS',
      salesPrice: Number(data.salesPrice) || 0,
      costPrice: Number(data.costPrice) || 0,
      description: data.description || '',
      notes: data.notes || '',
      status: data.status || 'Active',
      variants: Array.isArray(data.variants) ? data.variants : []
    };

    this.products.unshift(newProduct);
    this._persist(this.STORAGE_KEYS.PRODUCTS, this.products);
    return newProduct;
  }

  updateProduct(id, updates) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this.products[idx];
    const updated = {
      ...existing,
      ...updates,
      sku: updates.sku ? updates.sku.toUpperCase() : existing.sku,
      salesPrice: updates.salesPrice !== undefined ? Number(updates.salesPrice) : existing.salesPrice,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : existing.costPrice,
      variants: updates.variants || existing.variants
    };

    this.products[idx] = updated;
    this._persist(this.STORAGE_KEYS.PRODUCTS, this.products);
    return updated;
  }

  archiveProduct(id) {
    const product = this.getProductById(id);
    if (!product) return false;
    const newStatus = product.status === 'Archived' ? 'Active' : 'Archived';
    this.updateProduct(id, { status: newStatus });
    return true;
  }

  deleteProduct(id) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    this._persist(this.STORAGE_KEYS.PRODUCTS, this.products);
    return true;
  }

  // Variant Helpers
  calculateVariantPrice(productId, variantIds = []) {
    const product = this.getProductById(productId);
    if (!product) return 0;

    let total = product.salesPrice;
    if (Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        if (variantIds.includes(v.id)) {
          total += Number(v.additionalPrice || 0);
        }
      });
    }
    return total;
  }

  addVariantToProduct(productId, variantData) {
    const product = this.getProductById(productId);
    if (!product) return null;

    const newVariant = {
      id: `VAR-${Date.now().toString().slice(-4)}`,
      attribute: variantData.attribute || 'Feature',
      value: variantData.value || '',
      additionalPrice: Number(variantData.additionalPrice) || 0,
      skuModifier: variantData.skuModifier || ''
    };

    const variants = [...(product.variants || []), newVariant];
    return this.updateProduct(productId, { variants });
  }

  removeVariantFromProduct(productId, variantId) {
    const product = this.getProductById(productId);
    if (!product) return null;

    const variants = (product.variants || []).filter(v => v.id !== variantId);
    return this.updateProduct(productId, { variants });
  }

  // ==========================================
  // 3. PLAN API (For Team 2 & 6)
  // ==========================================

  getPlans(options = {}) {
    let list = [...this.plans];
    const { search = '', status = '', frequency = '' } = options;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.productName && p.productName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (status) {
      list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    if (frequency) {
      list = list.filter(p => p.billingFrequency.toLowerCase() === frequency.toLowerCase());
    }

    return list;
  }

  getPlanById(id) {
    return this.plans.find(p => p.id === id) || null;
  }

  createPlan(data) {
    const id = `PLAN-${String(this.plans.length + 1).padStart(3, '0')}`;
    const product = this.getProductById(data.productId);

    const newPlan = {
      id,
      name: data.name || '',
      code: (data.code || `BL-PLAN-${(data.billingFrequency || 'MO').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`).toUpperCase(),
      productId: data.productId || '',
      productName: product ? product.name : (data.productName || 'Unassigned Product'),
      description: data.description || '',
      billingFrequency: data.billingFrequency || 'Monthly',
      price: Number(data.price) || 0,
      minQuantity: Number(data.minQuantity) || 1,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || '2028-12-31',
      autoCloseGracePeriodDays: Number(data.autoCloseGracePeriodDays) || 15,
      autoCloseEnabled: data.autoCloseEnabled !== false,
      allowPause: !!data.allowPause,
      maxPauseDurationDays: Number(data.maxPauseDurationDays) || 0,
      allowEarlyClosure: data.allowEarlyClosure !== false,
      allowAutoRenewal: data.allowAutoRenewal !== false,
      status: data.status || 'Active'
    };

    this.plans.unshift(newPlan);
    this._persist(this.STORAGE_KEYS.PLANS, this.plans);
    return newPlan;
  }

  updatePlan(id, updates) {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this.plans[idx];
    let productName = existing.productName;
    if (updates.productId && updates.productId !== existing.productId) {
      const prod = this.getProductById(updates.productId);
      if (prod) productName = prod.name;
    }

    const updated = {
      ...existing,
      ...updates,
      productName,
      code: updates.code ? updates.code.toUpperCase() : existing.code,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      minQuantity: updates.minQuantity !== undefined ? Number(updates.minQuantity) : existing.minQuantity,
      autoCloseGracePeriodDays: updates.autoCloseGracePeriodDays !== undefined ? Number(updates.autoCloseGracePeriodDays) : existing.autoCloseGracePeriodDays,
      maxPauseDurationDays: updates.maxPauseDurationDays !== undefined ? Number(updates.maxPauseDurationDays) : existing.maxPauseDurationDays
    };

    this.plans[idx] = updated;
    this._persist(this.STORAGE_KEYS.PLANS, this.plans);
    return updated;
  }

  togglePlanStatus(id) {
    const plan = this.getPlanById(id);
    if (!plan) return false;
    const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
    this.updatePlan(id, { status: newStatus });
    return true;
  }

  archivePlan(id) {
    const plan = this.getPlanById(id);
    if (!plan) return false;
    const newStatus = plan.status === 'Archived' ? 'Active' : 'Archived';
    this.updatePlan(id, { status: newStatus });
    return true;
  }

  deletePlan(id) {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.plans.splice(idx, 1);
    this._persist(this.STORAGE_KEYS.PLANS, this.plans);
    return true;
  }

  resetToDefault() {
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.plans = JSON.parse(JSON.stringify(INITIAL_PLANS));
    localStorage.removeItem(this.STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(this.STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(this.STORAGE_KEYS.PLANS);
    this._notify();
  }
}

export const dataService = new DataService();

// Expose on window for easy cross-module consumption by teammates
if (typeof window !== 'undefined') {
  window.SubscriptIQ = window.SubscriptIQ || {};
  window.SubscriptIQ.CustomerProductPlanService = dataService;
}

