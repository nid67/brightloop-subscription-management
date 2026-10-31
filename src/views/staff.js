import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderStaffView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const staff = api.getStaff();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('staff', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Staff Management', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Staff Members & Role Permissions</h1>
              <p class="page-subtitle">Manage internal access levels (ADMIN and STAFF) for subscription and billing operations</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-invite-staff">
                ${iconHtml('plus', { size: 16 })} Invite Staff Member
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <span style="font-weight:600; font-size:14px;">Team Directory (${staff.length})</span>
            </div>

            <div>
              ${staff.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('user-check', { size: 24 })}</div>
                  <div class="empty-title">No staff members assigned</div>
                  <div class="empty-desc">Invite colleagues to manage customer subscriptions, quotations, and invoice operations.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-staff">
                    ${iconHtml('plus', { size: 14 })} Invite First Staff Member
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Department</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${staff.map(s => `
                      <tr>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.email}</td>
                        <td>
                          <span class="badge ${s.role === 'ADMIN' ? 'badge-info' : 'badge-neutral'}">
                            ${s.role}
                          </span>
                        </td>
                        <td>${s.department}</td>
                        <td><span class="badge badge-success">${s.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const openInviteModal = () => {
    new Modal({
      title: 'Invite Staff Member',
      size: 'lg',
      content: `
        <form id="invite-staff-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="staff-name" class="form-input" placeholder="e.g. Priya Sharma" required />
          </div>

          <div class="form-group">
            <label class="form-label">Work Email *</label>
            <input type="email" id="staff-email" class="form-input" placeholder="priya@brightloop.com" required />
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Role</label>
              <select id="staff-role" class="form-select">
                <option value="STAFF" selected>STAFF (Operations & Billing)</option>
                <option value="ADMIN">ADMIN (Full Operations & Settings)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <input type="text" id="staff-dept" class="form-input" placeholder="Billing Operations" value="Billing Operations" />
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-staff">Send Invite</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-staff');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.querySelector('#staff-name').value.trim();
        const email = document.querySelector('#staff-email').value.trim();
        const role = document.querySelector('#staff-role').value;
        const department = document.querySelector('#staff-dept').value.trim();

        if (!name || !email) {
          notification.error('Validation Error', 'Please enter staff name and email.');
          return;
        }

        api.inviteStaff({ name, email, role, department });
        notification.success('Staff Invited', `Invitation sent to ${email}`);
        document.querySelector('.modal-backdrop').remove();
        renderStaffView(container);
      });
    }
  };

  const inviteBtn = container.querySelector('#btn-invite-staff');
  const emptyBtn = container.querySelector('#btn-empty-staff');
  if (inviteBtn) inviteBtn.addEventListener('click', openInviteModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openInviteModal);
}
