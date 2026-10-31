/**
 * Schema Structure & Data Models for Customers, Products, and Plans
 * Aligned with SubscriptIQ / Odoo Data Specifications.
 *
 * Mock data records removed — clean structure maintained for production / API integration.
 */

/**
 * @typedef {Object} Customer
 * @property {string} id - Unique customer ID (e.g. CUST-001)
 * @property {string} name - Customer / Primary contact name
 * @property {string} company - Company / Business name
 * @property {string} email - Billing email
 * @property {string} phone - Contact phone number
 * @property {string} customerType - 'Enterprise' | 'Mid-Market' | 'Startup' | 'Individual'
 * @property {string} gstin - 15-digit GSTIN tax identifier
 * @property {string} registrationDate - ISO date string (YYYY-MM-DD)
 * @property {string} status - 'Active' | 'Overdue' | 'Churned' | 'Archived'
 * @property {number} lifetimeRevenue - Total recognized customer LTV in INR
 * @property {number} outstandingBalance - Unpaid balance in INR
 * @property {string} address - Physical / Billing address
 * @property {Array} activeSubscriptions - Active subscription objects
 * @property {Array} previousSubscriptions - Closed/expired subscription objects
 * @property {Array} invoices - Billing history records
 * @property {Array} payments - Payment receipts and reconciliation records
 * @property {Array} activities - Audit log timeline items
 */
export const INITIAL_CUSTOMERS = [];

/**
 * @typedef {Object} ProductVariant
 * @property {string} id - Variant ID (e.g. VAR-101)
 * @property {string} attribute - Attribute name (e.g. 'Brand', 'Support Level')
 * @property {string} value - Attribute value (e.g. 'Odoo Connector', '24/7 SLA')
 * @property {number} additionalPrice - Surcharge amount added to base product price
 * @property {string} skuModifier - Suffix applied to SKU code (e.g. '-ODOO')
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Product ID (e.g. PROD-001)
 * @property {string} name - Product display name
 * @property {string} sku - Unique SKU code (e.g. BL-PROD-CORE)
 * @property {string} type - 'Service / SaaS' | 'Analytics Module' | 'Add-on License' | 'Integration Utility'
 * @property {number} salesPrice - Base sales catalog price in INR
 * @property {number} costPrice - Internal cost price in INR
 * @property {string} description - Commercial description
 * @property {string} notes - Internal operational notes
 * @property {string} status - 'Active' | 'Archived'
 * @property {ProductVariant[]} variants - Configured dynamic attribute variants
 */
export const INITIAL_PRODUCTS = [];

/**
 * @typedef {Object} Plan
 * @property {string} id - Plan ID (e.g. PLAN-001)
 * @property {string} name - Plan title (e.g. 'Standard Monthly Tier')
 * @property {string} code - Plan code (e.g. BL-PLAN-MONTHLY)
 * @property {string} productId - Associated product ID
 * @property {string} productName - Associated product name
 * @property {string} description - Plan description and terms
 * @property {string} billingFrequency - 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
 * @property {number} price - Recurring subscription rate in INR
 * @property {number} minQuantity - Minimum required quantity
 * @property {string} startDate - Availability start date (YYYY-MM-DD)
 * @property {string} endDate - Availability end date (YYYY-MM-DD)
 * @property {number} autoCloseGracePeriodDays - Days before auto-closing unpaid invoice
 * @property {boolean} autoCloseEnabled - Auto-close policy toggle
 * @property {boolean} allowPause - Pause permission flag
 * @property {number} maxPauseDurationDays - Maximum pause days allowed
 * @property {boolean} allowEarlyClosure - Early contract cancellation toggle
 * @property {boolean} allowAutoRenewal - Automatic renewal toggle
 * @property {string} status - 'Active' | 'Inactive' | 'Archived'
 */
export const INITIAL_PLANS = [];
