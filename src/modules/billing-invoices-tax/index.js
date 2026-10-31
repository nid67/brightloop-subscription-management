/**
 * SubscriptIQ - Module 03 Main Entrypoint
 * Recurring Billing Operations, Invoices Management & Dual-GST Tax Rules
 */

import { InvoicesViewController } from './invoices.js';
import { BillingViewController } from './billing.js';
import { TaxesViewController } from './taxes.js';
import { ToastService, InvoiceModalService } from './invoice-modal.js';
import { invoiceService } from './invoice-service.js';

export function initBillingInvoicesTaxModule() {
  const toastService = new ToastService();
  const modalService = new InvoiceModalService(toastService);

  // Hook global quick viewer for external modules
  window.SubscriptIQ_Invoices.view = (id) => {
    modalService.openInvoiceDrawer(id);
  };
  window.SubscriptIQ_Invoices.print = (id) => {
    modalService.openPrintModal(id);
  };

  // 1. Mount Invoices & Billing Operations Workspace in #view-invoices
  const invoicesSection = document.getElementById('view-invoices');
  if (invoicesSection) {
    invoicesSection.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Recurring Invoices & Billing Operations</h2>
          <p>Automated subscription billing cycles, GST-compliant tax invoicing, and strict duplicate billing prevention</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-gstr1">
            <i data-lucide="download"></i> Export GSTR-1
          </button>
          <button class="btn btn-primary btn-sm" id="btn-quick-printable-sample">
            <i data-lucide="file-text"></i> Sample Tax Invoice
          </button>
        </div>
      </div>

      <!-- Navigation Tabs: Invoices Registry vs Billing Operations Workspace -->
      <div class="inv-nav-tabs">
        <button class="inv-tab-btn active" id="tab-btn-invoices" data-inv-tab="invoices">
          <i data-lucide="receipt"></i>
          <span>Invoices Registry</span>
          <span class="inv-tab-badge" id="badge-inv-count">0</span>
        </button>
        <button class="inv-tab-btn" id="tab-btn-billing" data-inv-tab="billing">
          <i data-lucide="refresh-cw"></i>
          <span>Recurring Billing Operations</span>
          <span class="inv-tab-badge" id="badge-bill-count">0</span>
        </button>
      </div>

      <!-- Tab 1: Invoices Registry Panel -->
      <div id="panel-invoices-registry" class="inv-tab-panel">
        <div id="inv-invoices-mount"></div>
      </div>

      <!-- Tab 2: Billing Operations Workspace Panel -->
      <div id="panel-billing-workspace" class="inv-tab-panel" style="display: none;">
        <div id="inv-billing-mount"></div>
      </div>
    `;

    // Initialize sub-controllers
    const invoicesMount = document.getElementById('inv-invoices-mount');
    const billingMount = document.getElementById('inv-billing-mount');

    const invoicesController = new InvoicesViewController(invoicesMount, toastService, modalService);
    invoicesController.init();

    const billingController = new BillingViewController(billingMount, toastService, modalService);
    billingController.init();

    // Tab Switching Logic
    const tabBtns = invoicesSection.querySelectorAll('.inv-tab-btn');
    const panelInvoices = document.getElementById('panel-invoices-registry');
    const panelBilling = document.getElementById('panel-billing-workspace');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-inv-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (targetTab === 'invoices') {
          panelInvoices.style.display = 'block';
          panelBilling.style.display = 'none';
          invoicesController.render();
        } else {
          panelInvoices.style.display = 'none';
          panelBilling.style.display = 'block';
          billingController.render();
        }

        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Sample Tax Invoice click
    const sampleBtn = document.getElementById('btn-quick-printable-sample');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        if (invoiceService.invoices.length > 0) {
          modalService.openPrintModal(invoiceService.invoices[0].id);
        } else {
          toastService.show('info', 'No Invoices Yet', 'No invoices have been generated yet. Please generate an invoice from an active subscription to preview the printable GST tax invoice sheet.');
        }
      });
    }

    // Export GSTR-1 click
    const exportBtn = document.getElementById('btn-export-gstr1');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const invoices = invoiceService.getInvoices();
        if (invoices.length === 0) {
          toastService.show('info', 'GSTR-1 Export', 'No invoice transactions recorded yet for GSTR-1 filing export.');
          return;
        }

        const csvRows = [
          ['GSTIN of Receiver', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount']
        ];

        invoices.forEach(inv => {
          csvRows.push([
            inv.customerGstin || 'URP',
            inv.customerName,
            inv.invoiceNumber,
            inv.invoiceDate,
            inv.grandTotal,
            inv.placeOfSupply,
            'N',
            '100',
            inv.cgstRate > 0 ? (inv.cgstRate + inv.sgstRate) : inv.igstRate,
            inv.subtotal,
            '0.00'
          ]);
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `GSTR1_SubscriptIQ_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toastService.show('success', 'GSTR-1 Export Generated', 'Government GST compliance CSV (B2B Table 4A) has been downloaded.');
      });
    }
  }

  // 2. Mount Taxes View in #view-taxes
  const taxesSection = document.getElementById('view-taxes');
  if (taxesSection) {
    const taxesController = new TaxesViewController(taxesSection, toastService, modalService);
    taxesController.init();
  }

  // Update badges dynamically
  invoiceService.subscribe(() => {
    const invCount = document.getElementById('badge-inv-count');
    const billCount = document.getElementById('badge-bill-count');
    if (invCount) invCount.textContent = invoiceService.invoices.length;
    if (billCount) billCount.textContent = invoiceService.billingOperations.length;
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
