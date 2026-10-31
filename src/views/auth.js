import { iconHtml, refreshIcons } from '../utils/icons.js';

export function renderAuthView(container, mode = 'login') {
  if (mode === 'register') {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-sidebar">
          <div class="brand-logo" style="font-size:20px;">
            <div class="brand-icon" style="width:32px; height:32px;">
              ${iconHtml('layers', { size: 18 })}
            </div>
            <span>Brightloop</span>
            <small>Software</small>
          </div>

          <div class="auth-content">
            <h2 style="font-size:28px; line-height:1.2; margin-bottom:12px;">
              Create your subscription operations workspace.
            </h2>
            <p style="color:#adb9c8; font-size:14px; line-height:1.6;">
              Manage recurring billing, product variants, tax rules, quotations, and automated revenue leakage protection in one unified platform.
            </p>
          </div>

          <div style="font-size:12px; color:#8792a2;">
            © Brightloop Software Ltd
          </div>
        </div>

        <div class="auth-form-side">
          <div class="auth-form-box">
            <h2 style="font-size:22px; font-weight:700; margin-bottom:4px;">Get started with Brightloop</h2>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px;">Create your administrator account</p>

            <form id="register-form">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" placeholder="e.g. Alexander Wright" required />
              </div>

              <div class="form-group">
                <label class="form-label">Company Name</label>
                <input type="text" class="form-input" placeholder="e.g. Brightloop Software" required />
              </div>

              <div class="form-group">
                <label class="form-label">Work Email</label>
                <input type="email" class="form-input" placeholder="name@company.com" required />
              </div>

              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="reg-pass" class="form-input" placeholder="Min 9 chars, uppercase, lowercase, special" required />
              </div>

              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input type="password" class="form-input" placeholder="Repeat password" required />
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; padding:10px; margin-top:8px;">
                Create Account
              </button>
            </form>

            <div style="margin-top:20px; font-size:13px; text-align:center; color:var(--text-muted);">
              Already have an account? <a href="#/login">Sign in here</a>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-sidebar">
          <div class="brand-logo" style="font-size:20px;">
            <div class="brand-icon" style="width:32px; height:32px;">
              ${iconHtml('layers', { size: 18 })}
            </div>
            <span>Brightloop</span>
            <small>Software</small>
          </div>

          <div class="auth-content">
            <h2 style="font-size:30px; line-height:1.2; margin-bottom:12px;">
              Subscription Operations. Simplified.<br />Revenue Intelligence. Amplified.
            </h2>
            <p style="color:#adb9c8; font-size:14px; line-height:1.6; margin-bottom:24px;">
              A centralized platform to manage product variants, subscription plans, recurring invoices, dual-tax calculations, and automated leakage detection.
            </p>

            <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:var(--radius-lg); padding:16px;">
              <div style="font-size:12px; color:#adb9c8; text-transform:uppercase; font-weight:600;">Evaluator Demo Access</div>
              <div style="font-size:13px; color:#ffffff; margin-top:4px;">
                Use the quick buttons on the right to sign in as <strong>Admin</strong>, <strong>Staff</strong>, or <strong>Customer</strong>.
              </div>
            </div>
          </div>

          <div style="font-size:12px; color:#8792a2;">
            © Brightloop Software Ltd
          </div>
        </div>

        <div class="auth-form-side">
          <div class="auth-form-box">
            <h2 style="font-size:22px; font-weight:700; margin-bottom:4px;">Sign in to Brightloop</h2>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px;">Enter your workspace credentials</p>

            <form id="login-form">
              <div class="form-group">
                <label class="form-label">Email address</label>
                <input type="email" id="login-email" class="form-input" placeholder="admin@brightloop.com" required />
              </div>

              <div class="form-group">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <label class="form-label" style="margin-bottom:0;">Password</label>
                  <a href="#/forgot-password" style="font-size:12px;">Forgot password?</a>
                </div>
                <input type="password" id="login-pass" class="form-input" placeholder="••••••••••••" required />
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:13px;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" checked /> Remember me
                </label>
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; padding:10px;">
                Sign In
              </button>
            </form>

            <div style="margin-top:20px; padding:12px; background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md);">
              <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
                Quick Evaluator Logins:
              </div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="localStorage.setItem('brightloop_role', 'ADMIN'); window.location.hash='#/dashboard';">
                  Admin
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="localStorage.setItem('brightloop_role', 'STAFF'); window.location.hash='#/dashboard';">
                  Staff
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="localStorage.setItem('brightloop_role', 'CUSTOMER'); window.location.hash='#/portal';">
                  Customer
                </button>
              </div>
            </div>

            <div style="margin-top:20px; font-size:13px; text-align:center; color:var(--text-muted);">
              Need a new workspace? <a href="#/register">Create an account</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  refreshIcons(container);

  const form = container.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.hash = '#/dashboard';
    });
  }
}
