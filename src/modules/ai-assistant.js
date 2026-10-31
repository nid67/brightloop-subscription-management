/**
 * Module 06 — AI Finance Assistant
 * Route: #view-ai-assistant
 *
 * Frontend-only chat interface. Responses are hardcoded demo replies.
 * Wire up the sendMessage() handler to a real LLM endpoint when available.
 */

import { createIcons, icons } from 'lucide';

// ─── Demo Response Map ────────────────────────────────────────────────────────

const DEMO_RESPONSES = {
  mrr: {
    triggers: ['mrr', 'monthly recurring revenue', 'current mrr', 'arr', 'annual recurring'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">📊 Revenue Overview — October 2026</div>
        <table class="aifi-data-table">
          <thead><tr><th>Metric</th><th>Value</th><th>vs Last Month</th></tr></thead>
          <tbody>
            <tr><td>Monthly Recurring Revenue (MRR)</td><td class="mono-text">₹2,45,000</td><td class="badge badge-success">+12.4%</td></tr>
            <tr><td>Annual Recurring Revenue (ARR)</td><td class="mono-text">₹29,40,000</td><td class="badge badge-success">+12.4%</td></tr>
            <tr><td>Revenue Collected (MTD)</td><td class="mono-text">₹2,18,500</td><td class="badge badge-success">+8.1%</td></tr>
            <tr><td>Outstanding Revenue</td><td class="mono-text">₹26,500</td><td class="badge badge-warning">+3.2%</td></tr>
            <tr><td>Net Revenue Growth</td><td class="mono-text">+₹27,200</td><td class="badge badge-success">↑ Growing</td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">MRR = Sum of all active subscription amounts normalized to a monthly period. ARR = MRR × 12.</p>
      </div>
    `
  },
  renewals: {
    triggers: ['renewal', 'renewing', 'due for renewal', 'upcoming renewal', 'expire'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">🔄 Subscriptions Due for Renewal (Next 30 Days)</div>
        <table class="aifi-data-table">
          <thead><tr><th>Subscription ID</th><th>Customer</th><th>Plan</th><th>Renewal Date</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td class="mono-text">SUB-2026-012</td><td>Infosys Ltd</td><td>Enterprise Annual</td><td>Nov 03, 2026</td><td class="mono-text">₹48,000</td></tr>
            <tr><td class="mono-text">SUB-2026-019</td><td>Tata Consultancy</td><td>Professional Annual</td><td>Nov 08, 2026</td><td class="mono-text">₹24,000</td></tr>
            <tr><td class="mono-text">SUB-2026-024</td><td>Wipro Solutions</td><td>Starter Monthly</td><td>Nov 01, 2026</td><td class="mono-text">₹3,500</td></tr>
            <tr><td class="mono-text">SUB-2026-031</td><td>HCL Technologies</td><td>Professional Monthly</td><td>Nov 05, 2026</td><td class="mono-text">₹8,200</td></tr>
            <tr><td class="mono-text">SUB-2026-037</td><td>Mahindra Comviva</td><td>Enterprise Annual</td><td>Nov 14, 2026</td><td class="mono-text">₹48,000</td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">Total renewal value at risk: <strong>₹1,31,700</strong>. All customers have been notified via email.</p>
      </div>
    `
  },
  overdue: {
    triggers: ['overdue', 'overdue invoice', 'unpaid', 'past due', 'outstanding invoice'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">⚠️ Overdue Invoices</div>
        <table class="aifi-data-table">
          <thead><tr><th>Invoice ID</th><th>Customer</th><th>Amount</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
          <tbody>
            <tr><td class="mono-text">INV-2026-089</td><td>Zensar Technologies</td><td class="mono-text">₹12,000</td><td>Oct 10, 2026</td><td><span class="badge badge-danger">21 days</span></td></tr>
            <tr><td class="mono-text">INV-2026-094</td><td>Mphasis Ltd</td><td class="mono-text">₹8,500</td><td>Oct 18, 2026</td><td><span class="badge badge-danger">13 days</span></td></tr>
            <tr><td class="mono-text">INV-2026-101</td><td>Hexaware Tech</td><td class="mono-text">₹6,000</td><td>Oct 25, 2026</td><td><span class="badge badge-warning">6 days</span></td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">Total overdue: <strong>₹26,500</strong>. Consider sending payment reminders or escalating via the Payments module.</p>
      </div>
    `
  },
  products: {
    triggers: ['product', 'revenue by product', 'most revenue', 'top product', 'best performing'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">📦 Products by Revenue — October 2026</div>
        <table class="aifi-data-table">
          <thead><tr><th>Rank</th><th>Product</th><th>Subscriptions</th><th>MRR</th><th>% of Total</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>SubscriptIQ Enterprise Suite</td><td>28</td><td class="mono-text">₹1,34,400</td><td><div class="aifi-bar"><div style="width:55%;background:#635bff"></div></div> 55%</td></tr>
            <tr><td>2</td><td>SubscriptIQ Professional</td><td>41</td><td class="mono-text">₹73,800</td><td><div class="aifi-bar"><div style="width:30%;background:#00d4ff"></div></div> 30%</td></tr>
            <tr><td>3</td><td>SubscriptIQ Starter</td><td>52</td><td class="mono-text">₹36,400</td><td><div class="aifi-bar"><div style="width:15%;background:#0fa968"></div></div> 15%</td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">Enterprise Suite drives 55% of MRR despite having fewer subscriptions — consider upselling Professional users.</p>
      </div>
    `
  },
  leakage: {
    triggers: ['leakage', 'revenue leakage', 'leaking', 'missing invoice', 'anomaly', 'discrepancy'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">🔍 Possible Revenue Leakage — Top Issues</div>
        <table class="aifi-data-table">
          <thead><tr><th>Issue</th><th>Severity</th><th>Est. Impact</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>3 active subscriptions missing invoices for October</td><td><span class="badge badge-danger">Critical</span></td><td class="mono-text">₹15,600</td><td>Open</td></tr>
            <tr><td>Discount "SAVE20" applied past expiry date on 2 invoices</td><td><span class="badge badge-warning">High</span></td><td class="mono-text">₹4,800</td><td>Open</td></tr>
            <tr><td>Failed payment reconciliation — 1 transaction unmatched</td><td><span class="badge badge-warning">High</span></td><td class="mono-text">₹8,200</td><td>Under Review</td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">Total estimated leakage: <strong>₹28,600</strong>. Visit the <em>Revenue Leakage</em> workspace for full details and resolution actions.</p>
      </div>
    `
  },
  summary: {
    triggers: ['summary', 'summarize', 'this month', 'monthly summary', 'revenue summary', 'october'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">📋 Revenue Summary — October 2026</div>
        <div class="aifi-summary-grid">
          <div class="aifi-summary-item"><span>MRR</span><strong>₹2,45,000</strong></div>
          <div class="aifi-summary-item"><span>Collected</span><strong>₹2,18,500</strong></div>
          <div class="aifi-summary-item"><span>Outstanding</span><strong>₹26,500</strong></div>
          <div class="aifi-summary-item"><span>New Subs</span><strong>12</strong></div>
          <div class="aifi-summary-item"><span>Churned</span><strong>3</strong></div>
          <div class="aifi-summary-item"><span>Renewals</span><strong>18</strong></div>
          <div class="aifi-summary-item"><span>Active Subs</span><strong>121</strong></div>
          <div class="aifi-summary-item"><span>Growth</span><strong style="color:#0fa968">+12.4%</strong></div>
        </div>
        <p class="aifi-response-note">Collection rate: 89.2%. Revenue leakage risk: ₹28,600 (11.7% of outstanding). Net churn impact: -₹14,250 MRR.</p>
      </div>
    `
  },
  health: {
    triggers: ['health', 'subscription health', 'at risk', 'churn risk', 'paused'],
    reply: `
      <div class="aifi-response-card">
        <div class="aifi-response-title">💊 Subscription Health Snapshot</div>
        <table class="aifi-data-table">
          <thead><tr><th>Status</th><th>Count</th><th>MRR at Risk</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-success">Healthy</span></td><td>89</td><td class="mono-text">—</td></tr>
            <tr><td><span class="badge badge-info">Approaching Renewal</span></td><td>14</td><td class="mono-text">₹64,400</td></tr>
            <tr><td><span class="badge badge-warning">At Risk</span></td><td>8</td><td class="mono-text">₹38,200</td></tr>
            <tr><td><span class="badge badge-secondary">Paused</span></td><td>5</td><td class="mono-text">₹22,500</td></tr>
            <tr><td><span class="badge badge-danger">Failed Renewal</span></td><td>5</td><td class="mono-text">₹26,800</td></tr>
          </tbody>
        </table>
        <p class="aifi-response-note">18 subscriptions require immediate attention. Visit <em>Subscription Health</em> for full details.</p>
      </div>
    `
  }
};

const FALLBACK_REPLY = `
  <div class="aifi-response-card">
    <div class="aifi-response-title">🤖 SubscriptIQ AI Assistant</div>
    <p>I can help you with financial insights about your subscription business. Try asking:</p>
    <ul class="aifi-suggestion-list">
      <li>What is our current MRR?</li>
      <li>Which subscriptions are due for renewal?</li>
      <li>Show overdue invoices</li>
      <li>Which products generate the most revenue?</li>
      <li>Identify possible revenue leakage</li>
      <li>Summarize this month's revenue</li>
    </ul>
    <p class="aifi-response-note">This is a frontend demo. Connect to a live AI API for real-time analysis.</p>
  </div>
`;

// ─── Message ID counter ───────────────────────────────────────────────────────
let _msgId = 0;
const nextId = () => ++_msgId;

// ─── Resolve response ─────────────────────────────────────────────────────────
function resolveResponse(query) {
  const q = query.toLowerCase().trim();
  for (const key of Object.keys(DEMO_RESPONSES)) {
    const entry = DEMO_RESPONSES[key];
    if (entry.triggers.some(t => q.includes(t))) {
      return entry.reply;
    }
  }
  return FALLBACK_REPLY;
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'What is our current MRR?',
  'Which subscriptions are due for renewal?',
  'Show overdue invoices',
  'Which products generate the most revenue?',
  'Identify possible revenue leakage',
  'Summarize this month\'s revenue',
  'What is our subscription health?',
];

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initAIAssistant() {
  const container = document.getElementById('view-ai-assistant');
  if (!container) return;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">AI Finance Assistant</h1>
        <p class="view-subtitle">Ask questions about your subscription revenue, health and performance.</p>
      </div>
      <span class="badge badge-warning" style="height:fit-content">Demo Mode — No live AI connected</span>
    </div>

    <div class="aifi-layout">

      <!-- ── Chat Panel ── -->
      <div class="aifi-chat-panel">
        <div class="aifi-chat-header">
          <div class="aifi-avatar">
            <i data-lucide="sparkles"></i>
          </div>
          <div>
            <div class="aifi-header-name">SubscriptIQ AI</div>
            <div class="aifi-header-status">
              <span class="aifi-status-dot"></span>
              Demo mode active
            </div>
          </div>
          <button class="btn btn-secondary aifi-clear-btn" id="aifi-clear-btn" title="Clear chat">
            <i data-lucide="trash-2"></i>
            Clear
          </button>
        </div>

        <div class="aifi-messages" id="aifi-messages">
          <!-- Welcome message -->
          <div class="aifi-message assistant" id="msg-0">
            <div class="aifi-msg-avatar"><i data-lucide="sparkles"></i></div>
            <div class="aifi-msg-body">
              <div class="aifi-msg-bubble">
                <div class="aifi-response-card">
                  <div class="aifi-response-title">👋 Hello! I'm your SubscriptIQ AI Finance Assistant.</div>
                  <p>I can answer questions about your subscription business performance. Click a suggestion below or type your own question.</p>
                  <ul class="aifi-suggestion-list">
                    <li>What is our current MRR?</li>
                    <li>Which subscriptions are due for renewal?</li>
                    <li>Show overdue invoices</li>
                  </ul>
                  <p class="aifi-response-note">⚠️ This is a demo interface. Responses are pre-built until connected to a live AI service.</p>
                </div>
              </div>
              <div class="aifi-msg-time">Just now</div>
            </div>
          </div>
        </div>

        <!-- Typing indicator (hidden by default) -->
        <div class="aifi-typing" id="aifi-typing" style="display:none">
          <div class="aifi-msg-avatar"><i data-lucide="sparkles"></i></div>
          <div class="aifi-typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="aifi-input-area">
          <div class="aifi-input-row">
            <textarea
              id="aifi-input"
              class="aifi-textarea"
              placeholder="Ask about MRR, renewals, overdue invoices, revenue leakage…"
              rows="1"
              maxlength="500"
            ></textarea>
            <button class="btn btn-primary aifi-send-btn" id="aifi-send-btn">
              <i data-lucide="send"></i>
            </button>
          </div>
          <div class="aifi-input-footer">
            <span class="aifi-char-count" id="aifi-char-count">0 / 500</span>
            <span class="aifi-disclaimer">Demo responses only — connect an AI API for live analysis</span>
          </div>
        </div>
      </div>

      <!-- ── Sidebar ── -->
      <div class="aifi-sidebar">

        <!-- Suggested Prompts -->
        <div class="card" style="padding:16px">
          <div class="aifi-sidebar-title">
            <i data-lucide="zap"></i>
            Suggested Questions
          </div>
          <div class="aifi-prompts" id="aifi-prompts">
            ${SUGGESTED_PROMPTS.map(p => `
              <button class="aifi-prompt-btn" data-prompt="${p.replace(/"/g, '&quot;')}">${p}</button>
            `).join('')}
          </div>
        </div>

        <!-- Live Context -->
        <div class="card" style="padding:16px;margin-top:12px">
          <div class="aifi-sidebar-title">
            <i data-lucide="bar-chart-2"></i>
            Live Context (Demo)
          </div>
          <div class="aifi-context-grid">
            <div class="aifi-context-item">
              <span class="aifi-context-label">MRR</span>
              <span class="aifi-context-value mono-text">₹2,45,000</span>
            </div>
            <div class="aifi-context-item">
              <span class="aifi-context-label">ARR</span>
              <span class="aifi-context-value mono-text">₹29,40,000</span>
            </div>
            <div class="aifi-context-item">
              <span class="aifi-context-label">Active Subs</span>
              <span class="aifi-context-value">121</span>
            </div>
            <div class="aifi-context-item">
              <span class="aifi-context-label">Overdue</span>
              <span class="aifi-context-value" style="color:var(--danger)">₹26,500</span>
            </div>
            <div class="aifi-context-item">
              <span class="aifi-context-label">Leakage Risk</span>
              <span class="aifi-context-value" style="color:var(--warning)">₹28,600</span>
            </div>
            <div class="aifi-context-item">
              <span class="aifi-context-label">Growth</span>
              <span class="aifi-context-value" style="color:var(--success)">+12.4%</span>
            </div>
          </div>
        </div>

        <!-- Conversation History -->
        <div class="card" style="padding:16px;margin-top:12px">
          <div class="aifi-sidebar-title">
            <i data-lucide="message-square"></i>
            This Session
          </div>
          <div id="aifi-history-list" class="aifi-history-list">
            <div class="aifi-history-empty">No questions asked yet</div>
          </div>
        </div>

      </div>
    </div>
  `;

  createIcons({ icons });

  // ── Wire up interactions ──────────────────────────────────────────────────

  const messagesEl = document.getElementById('aifi-messages');
  const inputEl    = document.getElementById('aifi-input');
  const sendBtn    = document.getElementById('aifi-send-btn');
  const typingEl   = document.getElementById('aifi-typing');
  const charCount  = document.getElementById('aifi-char-count');
  const clearBtn   = document.getElementById('aifi-clear-btn');
  const historyEl  = document.getElementById('aifi-history-list');

  let isProcessing = false;
  const sessionQuestions = [];

  // Auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    charCount.textContent = `${inputEl.value.length} / 500`;
  });

  // Send on Enter (Shift+Enter = newline)
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Suggested prompt buttons
  document.getElementById('aifi-prompts').addEventListener('click', (e) => {
    const btn = e.target.closest('.aifi-prompt-btn');
    if (!btn) return;
    inputEl.value = btn.dataset.prompt;
    charCount.textContent = `${inputEl.value.length} / 500`;
    inputEl.dispatchEvent(new Event('input'));
    sendMessage();
  });

  // Clear chat
  clearBtn.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    sessionQuestions.length = 0;
    historyEl.innerHTML = '<div class="aifi-history-empty">No questions asked yet</div>';
    appendAssistantMessage(`
      <div class="aifi-response-card">
        <div class="aifi-response-title">🗑️ Chat cleared</div>
        <p>Ask me anything about your subscription business!</p>
      </div>
    `);
  });

  // ── Send ─────────────────────────────────────────────────────────────────

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isProcessing) return;

    isProcessing = true;
    sendBtn.disabled = true;

    // Append user message
    appendUserMessage(text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    charCount.textContent = '0 / 500';

    // Add to session history
    sessionQuestions.push(text);
    updateHistory(text);

    // Show typing indicator
    typingEl.style.display = 'flex';
    scrollToBottom();

    // Simulate 1.5s AI thinking delay
    setTimeout(() => {
      typingEl.style.display = 'none';
      const response = resolveResponse(text);
      appendAssistantMessage(response);
      isProcessing = false;
      sendBtn.disabled = false;
    }, 1500);
  }

  function appendUserMessage(text) {
    const id = nextId();
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'aifi-message user';
    div.id = `msg-${id}`;
    div.innerHTML = `
      <div class="aifi-msg-body">
        <div class="aifi-msg-bubble">${escapeHtml(text)}</div>
        <div class="aifi-msg-time">${time}</div>
      </div>
      <div class="aifi-msg-avatar user-avatar"><i data-lucide="user"></i></div>
    `;
    messagesEl.appendChild(div);
    createIcons({ icons });
    scrollToBottom();
  }

  function appendAssistantMessage(html) {
    const id = nextId();
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'aifi-message assistant';
    div.id = `msg-${id}`;
    div.innerHTML = `
      <div class="aifi-msg-avatar"><i data-lucide="sparkles"></i></div>
      <div class="aifi-msg-body">
        <div class="aifi-msg-bubble">${html}</div>
        <div class="aifi-msg-time">${time}</div>
      </div>
    `;
    messagesEl.appendChild(div);
    createIcons({ icons });
    scrollToBottom();
  }

  function updateHistory(question) {
    const empty = historyEl.querySelector('.aifi-history-empty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'aifi-history-item';
    item.title = question;
    item.textContent = question.length > 40 ? question.slice(0, 40) + '…' : question;
    item.addEventListener('click', () => {
      inputEl.value = question;
      charCount.textContent = `${question.length} / 500`;
      inputEl.focus();
    });
    // Prepend so newest is on top
    historyEl.insertBefore(item, historyEl.firstChild);
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }
}
