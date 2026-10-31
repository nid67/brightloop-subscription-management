/**
 * SubscriptIQ - Module 04 Main Entrypoint
 * Payments Management & Promotional Discount Rule Administration
 */

import { PaymentsViewController } from './payments.js';
import { DiscountsViewController } from './discounts.js';
import { PaymentModalService } from './payment-modal.js';
import { ToastService } from '../billing-invoices-tax/invoice-modal.js';
import { paymentService } from './payment-service.js';

export function initPaymentsDiscountsModule() {
  const toastService = new ToastService();
  const modalService = new PaymentModalService(toastService);

  // Expose modal trigger for external teammates (e.g., Module 03 Invoices "Record Payment" button)
  window.SubscriptIQ_Payments.openRecordModal = (invoiceId = null) => {
    modalService.openRecordPaymentModal(invoiceId);
  };
  window.SubscriptIQ_Payments.openDetailsDrawer = (paymentId) => {
    modalService.openPaymentDrawer(paymentId);
  };

  // 1. Mount Payments View into #view-payments
  const paymentsSection = document.getElementById('view-payments');
  if (paymentsSection) {
    const paymentsController = new PaymentsViewController(paymentsSection, toastService, modalService);
    paymentsController.init();
  }

  // 2. Mount Discounts View into #view-discounts
  const discountsSection = document.getElementById('view-discounts');
  if (discountsSection) {
    const discountsController = new DiscountsViewController(discountsSection, toastService, modalService);
    discountsController.init();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
