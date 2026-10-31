/**
 * Schema Structure & Data Models for Quotations and Subscriptions
 * Aligned with SubscriptIQ / Odoo Data Specifications.
 *
 * Mock data records removed — clean structure maintained for production / API integration.
 */

/**
 * @typedef {Object} QuotationHistory
 * @property {string} date - Timestamp string (YYYY-MM-DD HH:mm)
 * @property {string} action - Event action name (e.g. 'Created', 'Sent', 'Accepted')
 * @property {string} details - Detailed description of the transition
 */

/**
 * @typedef {Object} Quotation
 * @property {string} id - Unique quote ID / number (e.g. QT-2026-101)
 * @property {string} quoteNumber - Human-readable quotation identifier
 * @property {string} customerId - Target customer ID
 * @property {string} customerName - Target customer name
 * @property {string} customerEmail - Customer billing email
 * @property {string} customerCompany - Customer legal company name
 * @property {string} productId - Selected product ID
 * @property {string} productName - Selected product name
 * @property {string} planId - Selected subscription plan ID
 * @property {string} planName - Selected subscription plan name
 * @property {string} billingFrequency - 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
 * @property {number} quantity - Quantity of licenses / seats
 * @property {number} basePrice - Base rate per unit in INR
 * @property {Array} selectedVariants - Selected dynamic add-on attributes
 * @property {number} variantSurchargePerUnit - Surcharge per unit in INR
 * @property {number} unitPrice - Effective unit price (base + surcharge) in INR
 * @property {number} subtotal - Pre-tax subtotal in INR
 * @property {number} taxRate - Tax percentage (standard 18% Dual GST)
 * @property {number} taxAmount - Calculated tax amount in INR
 * @property {number} total - Grand total in INR
 * @property {string} validUntil - Expiration date (YYYY-MM-DD)
 * @property {string} createdAt - Date created (YYYY-MM-DD)
 * @property {string} status - 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'
 * @property {string|null} convertedSubscriptionId - Linked subscription ID when converted
 * @property {string} notes - Commercial terms / proposal notes
 * @property {QuotationHistory[]} history - Audit log of quotation stages
 */
export const INITIAL_QUOTATIONS = [];

/**
 * @typedef {Object} SubscriptionLine
 * @property {string} description - Component description
 * @property {number} quantity - Unit count
 * @property {number} unitPrice - Unit rate in INR
 * @property {number} amount - Total amount in INR
 */

/**
 * @typedef {Object} SubscriptionHistory
 * @property {string} date - Timestamp string (YYYY-MM-DD HH:mm)
 * @property {string} action - Action name (e.g. 'Activated', 'Paused', 'Billing Scheduled')
 * @property {string} details - Log description
 */

/**
 * @typedef {Object} Subscription
 * @property {string} id - Unique subscription ID (e.g. SUB-2026-001)
 * @property {string} subscriptionNumber - Human-readable subscription identifier
 * @property {string|null} quotationId - Source quotation ID (if converted)
 * @property {string} customerId - Subscriber customer ID
 * @property {string} customerName - Subscriber customer name
 * @property {string} customerEmail - Subscriber email
 * @property {string} customerCompany - Company name
 * @property {string} productId - Primary product ID
 * @property {string} productName - Primary product name
 * @property {string} planId - Assigned pricing plan ID
 * @property {string} planName - Assigned pricing plan name
 * @property {string} billingFrequency - 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
 * @property {number} quantity - Quantity of units / seats
 * @property {number} unitPrice - Unit rate in INR
 * @property {number} recurringAmount - Recurring renewal total (inc. GST) in INR
 * @property {number} taxRate - Tax percentage (18%)
 * @property {string} status - 'Pending' | 'Trial' | 'Active' | 'Paused' | 'Cancelled' | 'Expired'
 * @property {string} startDate - Start date (YYYY-MM-DD)
 * @property {string} currentPeriodStart - Current billing cycle start (YYYY-MM-DD)
 * @property {string} currentPeriodEnd - Current billing cycle end (YYYY-MM-DD)
 * @property {string} nextBillingDate - Next scheduled renewal invoice date (YYYY-MM-DD)
 * @property {boolean} autoRenew - Auto-renewal toggle
 * @property {string|null} trialEndDate - Trial period end date (if trial status)
 * @property {string|null} cancellationReason - Recorded cancellation reason
 * @property {string|null} pauseResumeDate - Scheduled resumption date if paused
 * @property {Array} selectedVariants - Configured dynamic variants
 * @property {SubscriptionLine[]} lines - Line items for invoice generation
 * @property {SubscriptionHistory[]} history - Complete lifecycle audit trail
 */
export const INITIAL_SUBSCRIPTIONS = [];
