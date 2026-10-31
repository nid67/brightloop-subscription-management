/**
 * Staff Management Module
 * Admin-only frontend for team directory, role assignment, status toggling,
 * invitation modals, search/filtering, and activity audit drawers.
 */

import { ROLES } from './rbac.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'subscriptiq_staff_members';

function loadStaffMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStaffMembers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
}

let staffMembers = loadStaffMembers();
let selectedStaffForAudit = null;
let selectedStaffForEdit = null;

export function renderStaffStats() {
  const totalEl = document.getElementById('staff-stat-total');
  const adminsEl = document.getElementById('staff-stat-admins');
  const staffEl = document.getElementById('staff-stat-staff');
  const inactiveEl = document.getElementById('staff-stat-inactive');

  const total = staffMembers.length;
  const admins = staffMembers.filter(s => s.role === ROLES.ADMIN && s.status === 'Active').length;
  const staff = staffMembers.filter(s => s.role === ROLES.STAFF && s.status === 'Active').length;
  const inactive = staffMembers.filter(s => s.status === 'Inactive').length;

  if (totalEl) totalEl.textContent = total;
  if (adminsEl) adminsEl.textContent = admins;
  if (staffEl) staffEl.textContent = staff;
  if (inactiveEl) inactiveEl.textContent = inactive;
}

export function renderStaffTable() {
  const tbody = document.getElementById('staff-table-body');
  if (!tbody) return;

  const searchVal = document.getElementById('staff-search-input')?.value.trim().toLowerCase() || '';
  const roleVal = document.getElementById('staff-role-filter')?.value || 'ALL';
  const statusVal = document.getElementById('staff-status-filter')?.value || 'ALL';
  const deptVal = document.getElementById('staff-dept-filter')?.value || 'ALL';

  const filtered = staffMembers.filter(member => {
    const matchesSearch = !searchVal ||
      member.name.toLowerCase().includes(searchVal) ||
      member.email.toLowerCase().includes(searchVal) ||
      member.department.toLowerCase().includes(searchVal) ||
      member.id.toLowerCase().includes(searchVal);

    const matchesRole = roleVal === 'ALL' || member.role === roleVal;
    const matchesStatus = statusVal === 'ALL' || member.status === statusVal;
    const matchesDept = deptVal === 'ALL' || member.department === deptVal;

    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <div style="font-size: 15px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">No Staff Members in Directory</div>
          <p style="font-size: 13px; max-width: 420px; margin: 0 auto 16px;">
            ${searchVal || roleVal !== 'ALL' || statusVal !== 'ALL' || deptVal !== 'ALL'
              ? 'No team members match your filter criteria. Try resetting filters.'
              : 'There are currently no staff accounts provisioned in your organization. Click below to invite team members and assign operational roles.'}
          </p>
          ${staffMembers.length === 0 ? `
            <button class="btn btn-primary btn-sm" data-modal="add-staff-modal">
              Invite First Staff Member
            </button>
          ` : ''}
        </td>
      </tr>
    `;
    renderStaffStats();
    return;
  }

  tbody.innerHTML = filtered.map(member => {
    const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
    const isAdmin = member.role === ROLES.ADMIN;
    const isActive = member.status === 'Active';

    return `
      <tr data-staff-id="${member.id}">
        <td>
          <div class="staff-user-cell">
            <div class="staff-avatar-initials ${isAdmin ? 'admin' : 'staff'}">${initials}</div>
            <div class="staff-user-info">
              <span class="staff-user-name">${member.name}</span>
              <span class="staff-user-id">${member.id}</span>
            </div>
          </div>
        </td>
        <td>
          <div>${member.email}</div>
          ${member.phone ? `<div style="font-size: 11px; color: var(--text-muted);">${member.phone}</div>` : ''}
        </td>
        <td>
          <span class="badge ${isAdmin ? 'badge-role-admin' : 'badge-role-staff'}">${member.role}</span>
        </td>
        <td>${member.department}</td>
        <td>
          <span style="font-size: 12px; color: var(--text-secondary);">${member.lastActive || '—'}</span>
        </td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">${member.status}</span>
        </td>
        <td>
          <div class="staff-action-btns">
            <button class="btn btn-secondary btn-sm btn-edit-staff" data-id="${member.id}" title="Edit Role & Permissions">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm btn-toggle-status" data-id="${member.id}" title="${isActive ? 'Suspend access' : 'Activate account'}">
              ${isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button class="icon-btn btn-audit-staff" data-id="${member.id}" title="View Activity Trail" style="width: 28px; height: 28px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderStaffStats();
  attachStaffRowListeners();
}

function attachStaffRowListeners() {
  // Toggle Status
  document.querySelectorAll('.btn-toggle-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const staff = staffMembers.find(s => s.id === id);
      if (!staff) return;

      const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
      const confirmed = confirm(`Are you sure you want to mark ${staff.name} as ${newStatus}?`);
      if (!confirmed) return;

      staff.status = newStatus;
      if (!staff.activityLog) staff.activityLog = [];
      staff.activityLog.unshift({
        action: `Account status updated to ${newStatus}`,
        time: 'Just now',
        ip: 'Admin Action'
      });

      saveStaffMembers(staffMembers);
      renderStaffTable();
      showToast('Staff Status Updated', `${staff.name} is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    });
  });

  // Edit Staff Modal
  document.querySelectorAll('.btn-edit-staff').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const staff = staffMembers.find(s => s.id === id);
      if (!staff) return;

      selectedStaffForEdit = staff;

      const modal = document.getElementById('edit-staff-modal');
      const nameInput = document.getElementById('edit-staff-name');
      const emailInput = document.getElementById('edit-staff-email');
      const roleSelect = document.getElementById('edit-staff-role');
      const deptSelect = document.getElementById('edit-staff-dept');
      const statusSelect = document.getElementById('edit-staff-status');

      if (nameInput) nameInput.value = staff.name;
      if (emailInput) emailInput.value = staff.email;
      if (roleSelect) roleSelect.value = staff.role;
      if (deptSelect) deptSelect.value = staff.department;
      if (statusSelect) statusSelect.value = staff.status;

      if (modal) modal.classList.add('active');
    });
  });

  // Audit Activity Drawer
  document.querySelectorAll('.btn-audit-staff').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const staff = staffMembers.find(s => s.id === id);
      if (!staff) return;

      selectedStaffForAudit = staff;
      openStaffAuditDrawer(staff);
    });
  });
}

function openStaffAuditDrawer(staff) {
  const drawer = document.getElementById('staff-audit-drawer');
  const overlay = document.getElementById('staff-audit-drawer-overlay');
  const nameEl = document.getElementById('audit-drawer-name');
  const roleEl = document.getElementById('audit-drawer-role');
  const timelineEl = document.getElementById('audit-drawer-timeline');

  if (nameEl) nameEl.textContent = staff.name;
  if (roleEl) roleEl.textContent = `${staff.role} • ${staff.department} ${staff.joinedDate ? '• Joined ' + staff.joinedDate : ''}`;

  if (timelineEl) {
    if (!staff.activityLog || staff.activityLog.length === 0) {
      timelineEl.innerHTML = `
        <div style="font-size: 13px; color: var(--text-muted); padding: 20px 0;">
          No recorded activity events for this team member yet.
        </div>
      `;
    } else {
      timelineEl.innerHTML = staff.activityLog.map(log => `
        <div class="staff-audit-item">
          <div class="staff-audit-dot"></div>
          <div class="staff-audit-title">${log.action}</div>
          <div class="staff-audit-meta">${log.time} &bull; ${log.ip}</div>
        </div>
      `).join('');
    }
  }

  if (drawer) drawer.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

export function initStaff() {
  staffMembers = loadStaffMembers();

  // 1. Initial Render
  renderStaffTable();

  // 2. Search & Filter Handlers
  const searchInput = document.getElementById('staff-search-input');
  const roleFilter = document.getElementById('staff-role-filter');
  const statusFilter = document.getElementById('staff-status-filter');
  const deptFilter = document.getElementById('staff-dept-filter');
  const resetBtn = document.getElementById('staff-reset-filters');

  if (searchInput) searchInput.addEventListener('input', renderStaffTable);
  if (roleFilter) roleFilter.addEventListener('change', renderStaffTable);
  if (statusFilter) statusFilter.addEventListener('change', renderStaffTable);
  if (deptFilter) deptFilter.addEventListener('change', renderStaffTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (roleFilter) roleFilter.value = 'ALL';
      if (statusFilter) statusFilter.value = 'ALL';
      if (deptFilter) deptFilter.value = 'ALL';
      renderStaffTable();
    });
  }

  // 3. Add / Invite Staff Form
  const addForm = document.getElementById('add-staff-form');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('add-staff-name')?.value.trim();
      const email = document.getElementById('add-staff-email')?.value.trim();
      const role = document.getElementById('add-staff-role')?.value || ROLES.STAFF;
      const dept = document.getElementById('add-staff-dept')?.value || 'Operations';
      const phone = document.getElementById('add-staff-phone')?.value.trim() || '';

      if (!name || !email) {
        alert('Please fill out both Staff Name and Work Email.');
        return;
      }

      const newStaff = {
        id: `USR-STF-${(staffMembers.length + 1).toString().padStart(3, '0')}`,
        name: name,
        email: email,
        phone: phone,
        role: role,
        department: dept,
        status: 'Active',
        lastActive: 'Just invited',
        joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        activityLog: [
          { action: 'Account created and invitation dispatched', time: 'Just now', ip: 'Admin Action' }
        ]
      };

      staffMembers.unshift(newStaff);
      saveStaffMembers(staffMembers);
      renderStaffTable();

      const modal = document.getElementById('add-staff-modal');
      if (modal) modal.classList.remove('active');
      addForm.reset();

      showToast('Staff Member Invited', `${name} has been added to ${dept} with ${role} permissions.`, 'success');
    });
  }

  // 4. Save Edit Staff Form
  const editForm = document.getElementById('edit-staff-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedStaffForEdit) return;

      const role = document.getElementById('edit-staff-role')?.value;
      const dept = document.getElementById('edit-staff-dept')?.value;
      const status = document.getElementById('edit-staff-status')?.value;

      selectedStaffForEdit.role = role;
      selectedStaffForEdit.department = dept;
      selectedStaffForEdit.status = status;
      if (!selectedStaffForEdit.activityLog) selectedStaffForEdit.activityLog = [];
      selectedStaffForEdit.activityLog.unshift({
        action: `Profile updated by Admin: Role=${role}, Dept=${dept}, Status=${status}`,
        time: 'Just now',
        ip: 'Admin Action'
      });

      saveStaffMembers(staffMembers);
      renderStaffTable();

      const modal = document.getElementById('edit-staff-modal');
      if (modal) modal.classList.remove('active');

      showToast('Staff Profile Updated', `Changes for ${selectedStaffForEdit.name} saved successfully.`, 'success');
    });
  }
}
