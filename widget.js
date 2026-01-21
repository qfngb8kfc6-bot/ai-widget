// --- CONFIG ---
const API_BASE = "https://ai-widget-backend.onrender.com";
const API_KEY = "client_acme_8f2k93";

// --- Inject UI ---
(function () {
  // Create root container
  const root = document.createElement("div");
  root.id = "ai-pill-widget-root";
  document.body.appendChild(root);

  // Styles (pill look)
  const style = document.createElement("style");
  style.textContent = `
    #ai-pill-widget-root{
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 999999;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    .ai-pill-wrap{
      position: relative;
      width: min(980px, calc(100vw - 24px));
    }

    /* Dropdown results panel */
    .ai-results{
      position: absolute;
      left: 0;
      right: 0;
      bottom: 76px;
      border-radius: 16px;
      overflow: hidden;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      display: none;
    }

    .ai-results-header{
      display:flex;
      justify-content: space-between;
      align-items:center;
      padding: 14px 16px;
      color: #fff;
      font-weight: 600;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    .ai-results-body{
      padding: 12px 16px 16px;
      color: rgba(255,255,255,0.92);
      font-size: 14px;
      line-height: 1.35;
    }

    .ai-results-body ul{
      margin: 10px 0 0 18px;
    }

    .ai-chip{
      display:inline-flex;
      align-items:center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.9);
      font-size: 12px;
    }

    /* The pill itself */
    .ai-pill{
      display:flex;
      align-items:center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(100,80,255,0.25), rgba(0,180,255,0.18));
      border: 1px solid rgba(255,255,255,0.18);
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.95);
    }

    .ai-pill .ai-label{
      font-size: 18px;
      font-weight: 600;
      white-space: nowrap;
      color: rgba(255,255,255,0.92);
    }

    .ai-input{
      display:flex;
      align-items:center;
      gap: 10px;
      background: rgba(255,255,255,0.92);
      border-radius: 999px;
      padding: 10px 14px;
      min-width: 220px;
      flex: 1;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .ai-input svg{
      width: 18px;
      height: 18px;
      opacity: 0.65;
      flex: 0 0 auto;
    }

    .ai-input input{
      border: none;
      outline: none;
      width: 100%;
      font-size: 15px;
      background: transparent;
      color: #1b1b1b;
    }

    .ai-divider{
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.25);
      flex: 0 0 auto;
      display:none;
    }

    .ai-cta{
      display:inline-flex;
      align-items:center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      background: rgba(25,25,65,0.95);
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      white-space: nowrap;
      transition: transform .08s ease, opacity .2s ease;
    }

    .ai-cta:hover{ opacity: 0.95; }
    .ai-cta:active{ transform: scale(0.98); }
    .ai-cta[disabled]{ opacity: 0.6; cursor: not-allowed; }

    .ai-close{
      position:absolute;
      right: -10px;
      top: -10px;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      cursor: pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      color: #0c0c0c;
      font-size: 18px;
      line-height: 1;
    }

    .ai-mini{
      display:flex;
      gap: 10px;
      align-items:center;
      margin-top: 10px;
      justify-content:flex-end;
    }

    .ai-error{
      color: #ffb4b4;
      font-size: 13px;
      margin-top: 8px;
      display:none;
    }

    @media (max-width: 720px){
      .ai-pill { flex-wrap: wrap; border-radius: 24px; }
      .ai-pill .ai-label { width: 100%; }
      .ai-input { min-width: 0; width: 100%; }
      .ai-cta { width: 100%; justify-content:center; }
      .ai-results{ bottom: 150px; }
      .ai-close{ right: 6px; top: -46px; }
    }
  `;
  document.head.appendChild(style);

  // Icons (simple inline SVG)
  const iconBuilding = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" stroke="currentColor" stroke-width="1.6"/>
      <path d="M8 6h4M8 10h4M8 14h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M16 20v-8a2 2 0 0 1 2-2h2v10" stroke="currentColor" stroke-width="1.6"/>
    </svg>
  `;

  const iconBriefcase = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.6"/>
      <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" stroke="currentColor" stroke-width="1.6"/>
      <path d="M4 12c2.5 2 5.5 3 8 3s5.5-1 8-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `;

  // Build the pill + results
  root.innerHTML = `
    <div class="ai-pill-wrap">
      <button class="ai-close" title="Close">×</button>

      <div class="ai-results" id="aiResults">
        <div class="ai-results-header">
          <div>AI Recommendations</div>
          <span class="ai-chip" id="aiClientTag">client: demo</span>
        </div>
        <div class="ai-results-body" id="aiResultsBody">
          <div>Fill in the fields and click <b>Why attend?</b></div>
        </div>
      </div>

      <div class="ai-pill">
        <div class="ai-label">I work at</div>

        <div class="ai-input">
          ${iconBuilding}
          <input id="aiCompany" placeholder="Company name" />
        </div>

        <div class="ai-label">as a</div>

        <div class="ai-input">
          ${iconBriefcase}
          <input id="aiJob" placeholder="Job title" />
        </div>

        <button class="ai-cta" id="aiGo">
          ✨ Why attend?
        </button>
      </div>

      <div class="ai-error" id="aiError"></div>
    </div>
  `;

  // Hook up behavior
  const closeBtn = root.querySelector(".ai-close");
  const resultsEl = root.querySelector("#aiResults");
  const resultsBody = root.querySelector("#aiResultsBody");
  const clientTag = root.querySelector("#aiClientTag");
  const errorEl = root.querySelector("#aiError");

  const companyInput = root.querySelector("#aiCompany");
  const jobInput = root.querySelector("#aiJob");
  const goBtn = root.querySelector("#aiGo");

  function showError(msg) {
    errorEl.style.display = "block";
    errorEl.textContent = msg;
  }
  function clearError() {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  function showResults(html) {
    resultsBody.innerHTML = html;
    resultsEl.style.display = "block";
  }

  closeBtn.addEventListener("click", () => root.remove());

  // Click CTA => call API
  goBtn.addEventListener("click", async () => {
    clearError();

    const company = companyInput.value.trim();
    const job = jobInput.value.trim();

    if (!company || !job) {
      showError("Please enter both company name and job title.");
      return;
    }

    goBtn.disabled = true;
    goBtn.textContent = "✨ Thinking...";

    try {
      // Map to your backend fields (you can change mapping)
      const payload = {
        company_name: company,
        industry: "event",
        company_size: "unknown",
        goal: job
      };

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}): ${text}`);
      }

      const data = await res.json();
      const services = data.recommended_services || [];

      clientTag.textContent = `client: ${data.client || "unknown"}`;

      showResults(`
        <div><b>Based on:</b> ${company} — ${job}</div>
        <ul>
          ${services.map(s => `<li>${s}</li>`).join("")}
        </ul>
        <div class="ai-mini">
          <span class="ai-chip">Powered by AI Widget</span>
        </div>
      `);
    } catch (err) {
      showError(err.message || "Failed to fetch recommendations.");
    } finally {
      goBtn.disabled = false;
      goBtn.textContent = "✨ Why attend?";
    }
  });
})();
