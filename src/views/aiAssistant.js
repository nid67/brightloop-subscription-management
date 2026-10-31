import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { notification } from '../services/notification.js';

export function renderAiAssistantView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('ai-assistant', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Subscription Health & AI Finance', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Subscription Health & Financial Intelligence</h1>
              <p class="page-subtitle">Real-time health scores, renewal risk predictions, and financial explanations</p>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px;">
            <!-- Health Score Breakdown -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Contract Health Metrics</span>
              </div>
              <div class="card-body">
                <div style="text-align:center; padding:16px 0;">
                  <div style="font-size:42px; font-weight:800; color:#056654;">92<span style="font-size:20px; color:var(--text-muted);">/100</span></div>
                  <div style="font-size:13px; font-weight:600; color:var(--text-main); margin-top:4px;">Strong Portfolio Health</div>
                  <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">
                    Churn risk is low based on active product usage and on-time invoice settlements.
                  </p>
                </div>

                <div style="border-top:1px solid var(--border-light); padding-top:16px; font-size:13px; display:flex; flex-direction:column; gap:10px;">
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Renewal Likelihood:</span>
                    <strong style="color:var(--success-text);">94% (High)</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Billing Compliance:</span>
                    <strong>99.98%</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Average Account LTV:</span>
                    <strong>₹2,45,000</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Finance Assistant Workspace -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">AI Finance Assistant</span>
                <span class="badge badge-info">Connected</span>
              </div>
              <div class="card-body" style="display:flex; flex-direction:column; min-height:360px;">
                <div id="chat-messages" style="flex:1; overflow-y:auto; padding:8px 0; display:flex; flex-direction:column; gap:12px;">
                  <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; font-size:13.5px; line-height:1.5;">
                    <strong style="color:var(--primary);">${iconHtml('sparkles', { size: 14 })} Brightloop Finance AI:</strong><br />
                    I can assist you with MRR variance analysis, revenue leakage audit explanations, renewal volume forecasting, and discount optimization. Select a prompt below or type your question.
                  </div>
                </div>

                <div style="display:flex; gap:6px; flex-wrap:wrap; margin:12px 0;">
                  <button class="btn btn-secondary btn-sm prompt-pill" data-prompt="Analyze this month's revenue leakage risks">
                    Analyze revenue leaks
                  </button>
                  <button class="btn btn-secondary btn-sm prompt-pill" data-prompt="Forecast subscription renewals for next month">
                    Forecast renewals
                  </button>
                  <button class="btn btn-secondary btn-sm prompt-pill" data-prompt="Explain MRR growth and customer retention">
                    Explain MRR growth
                  </button>
                </div>

                <div style="display:flex; gap:8px;">
                  <input type="text" id="ai-input" class="form-input" placeholder="Ask a financial question regarding subscriptions, billing, or taxes..." />
                  <button class="btn btn-primary" id="btn-ai-send">
                    ${iconHtml('send', { size: 15 })} Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const chatMessages = container.querySelector('#chat-messages');
  const aiInput = container.querySelector('#ai-input');
  const aiSendBtn = container.querySelector('#btn-ai-send');

  const addMessage = (role, text) => {
    const msg = document.createElement('div');
    msg.style.cssText = role === 'user'
      ? 'background:var(--primary); color:#ffffff; padding:10px 14px; border-radius:6px; align-self:flex-end; max-width:80%; font-size:13.5px;'
      : 'background:#f8fafc; border:1px solid var(--border); border-radius:6px; padding:12px; font-size:13.5px; line-height:1.5; align-self:flex-start; max-width:90%;';

    msg.innerHTML = role === 'user' ? text : `<strong style="color:var(--primary);">AI Analysis:</strong><br />${text}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const handleSend = () => {
    const text = aiInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    aiInput.value = '';

    setTimeout(() => {
      addMessage('assistant', `Based on Brightloop's active telemetry, MRR is stable at baseline with 0 overdue dunning blocks. Revenue Leakage Sentinel reports all billing schedules in compliance.`);
    }, 400);
  };

  if (aiSendBtn) aiSendBtn.addEventListener('click', handleSend);
  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  const pills = container.querySelectorAll('.prompt-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      aiInput.value = pill.getAttribute('data-prompt');
      handleSend();
    });
  });
}
