import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  createIcons({ icons });

  // Navigation / View Switching
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const appLayout = document.getElementById('app');
  const authPage = document.getElementById('view-auth');

  function switchView(targetViewId) {
    if (targetViewId === 'auth') {
      appLayout.style.display = 'none';
      authPage.classList.add('active');
      return;
    }

    authPage.classList.remove('active');
    appLayout.style.display = 'flex';

    // Update active nav link
    navLinks.forEach(link => {
      if (link.dataset.view === targetViewId) {
        link.classList.add('active');
        if (breadcrumbCurrent) {
          const spanText = link.querySelector('span')?.textContent;
          breadcrumbCurrent.textContent = spanText || targetViewId;
        }
      } else {
        link.classList.remove('active');
      }
    });

    // Update active section
    viewSections.forEach(section => {
      if (section.id === `view-${targetViewId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    createIcons({ icons });
  }

  // Sidebar link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // Buttons with data-nav attribute
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      if (target) switchView(target);
    });
  });

  // Modal handlers
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) targetModal.classList.add('active');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Drawer handlers
  document.querySelectorAll('[data-drawer]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const drawerId = trigger.getAttribute('data-drawer');
      const drawer = document.getElementById(drawerId);
      const overlay = document.getElementById(`${drawerId}-overlay`);
      if (drawer) drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
    });
  });

  document.querySelectorAll('[data-close-drawer]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.drawer-panel').forEach(d => d.classList.remove('active'));
      document.querySelectorAll('.drawer-overlay').forEach(o => o.classList.remove('active'));
    });
  });

  // Role preview selector
  const roleSelect = document.getElementById('role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      const roleBadge = document.querySelector('.user-info .user-role');
      if (roleBadge) {
        if (selected === 'admin') roleBadge.textContent = 'Super Admin';
        else if (selected === 'staff') roleBadge.textContent = 'Operations Staff';
        else if (selected === 'customer') roleBadge.textContent = 'Client Subscriber';
      }
    });
  }

  // Dashboard Chart Initialization
  const dashboardCanvas = document.getElementById('dashboardRevenueChart');
  if (dashboardCanvas) {
    new Chart(dashboardCanvas, {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
          {
            label: 'Recognized MRR (₹)',
            data: [142000, 168000, 185000, 210000, 228000, 245000],
            borderColor: '#635bff',
            backgroundColor: 'rgba(99, 91, 255, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#635bff'
          },
          {
            label: 'Target (₹)',
            data: [140000, 160000, 180000, 200000, 220000, 240000],
            borderColor: '#adbdcc',
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            borderWidth: 1.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12 },
              color: '#425466',
              usePointStyle: true,
              boxWidth: 8
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' }
          },
          y: {
            grid: { color: '#f0f2f5' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#8898aa',
              callback: value => '₹ ' + (value / 1000) + 'k'
            }
          }
        }
      }
    });
  }

  // Analytics Waterfall Chart Initialization
  const analyticsCanvas = document.getElementById('analyticsChart');
  if (analyticsCanvas) {
    new Chart(analyticsCanvas, {
      type: 'bar',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'New Bookings',
            data: [35000, 42000, 48000, 52000, 58000, 64000],
            backgroundColor: '#635bff',
            borderRadius: 4
          },
          {
            label: 'Upgrades / Add-ons',
            data: [12000, 15000, 14000, 18000, 22000, 24000],
            backgroundColor: '#00d4ff',
            borderRadius: 4
          },
          {
            label: 'Churn Impact',
            data: [-4000, -3200, -5000, -2800, -3500, -4100],
            backgroundColor: '#df1b41',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12 },
              color: '#425466',
              usePointStyle: true,
              boxWidth: 8
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' }
          },
          y: {
            grid: { color: '#f0f2f5' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#8898aa',
              callback: val => '₹ ' + (val / 1000) + 'k'
            }
          }
        }
      }
    });
  }
});
