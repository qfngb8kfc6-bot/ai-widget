(() => {
  // =========================
  // SaaS embed config
  // =========================
  const scriptEl = document.currentScript || [...document.scripts].slice(-1)[0];

  const API_BASE =
    (scriptEl && scriptEl.getAttribute("data-api-base")) ||
    "https://ai-widget-backend.onrender.com";

  const API_KEY =
    (scriptEl && scriptEl.getAttribute("data-api-key")) ||
    "demo-key-123";

  const CLIENT_ID =
    (scriptEl && scriptEl.getAttribute("data-client")) ||
    "demo";

  const POSITION =
    (scriptEl && scriptEl.getAttribute("data-position")) ||
    "top"; // "top" or "bottom"

  // Prevent double-mount if script included twice
  if (window.__AI_RECOMMENDER_WIDGET_MOUNTED__) return;
  window.__AI_RECOMMENDER_WIDGET_MOUNTED__ = true;

  // =========================
  // Styles (glass pill bar like your reference)
  // =========================
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --aiw-shadow: 0 22px 60px rgba(0,0,0,.18);
      --aiw-glass: rgba(255,255,255,.16);
      --aiw-glass-2: rgba(255,255,255,.22);
      --aiw-stroke: rgba(255,255,255,.28);
      --aiw-text: rgba(255,255,255,.92);
      --aiw-muted: rgba(255,255,255,.68);
      --aiw-input-bg: rgba(255,255,255,.92);
      --aiw-input-stroke: rgba(0,0,0,.06);
      --aiw-btn: rgba(10, 18, 82, .92);
      --aiw-btn-hover: rgba(10, 18, 82, 1);
      --aiw-btn-text: rgba(255,255,255,.96);
      --aiw-radius: 999px;
      --aiw-font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }

    /* container */
    .aiw-host {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      width: min(1180px, calc(100vw - 28px));
      font-family: var(--aiw-font);
      pointer-events: none; /* only the bar should be clickable */
    }
    .aiw-host.aiw-top { top: 18px; }
    .aiw-host.aiw-bottom { bottom: 18px; }

    /* the pill bar */
    .aiw-bar {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--aiw-radius);
      background: linear-gradient(90deg, rgba(47, 54, 158, .94), rgba(30, 125, 150, .94));
      box-shadow: var(--aiw-shadow);
      border: 1px solid rgba(255,255,255,.12);
      position: relative;
      overflow: hidden;
    }

    /* subtle glass overlay */
    .aiw-bar::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(1200px 240px at 10% 50%, rgba(255,255,255,.22), transparent 55%),
                  radial-gradient(900px 240px at 90% 50%, rgba(255,255,255,.18), transparent 58%);
      pointer-events: none;
      opacity: .85;
    }

    .aiw-inner {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      min-width: 0;
    }

    .aiw-label {
      color: var(--aiw-text);
      font-weight: 600;
      font-size: 22px;
      white-space: nowrap;
      opacity: .95;
    }

    .aiw-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--aiw-glass);
      border: 1px solid var(--aiw-stroke);
      border-radius: var(--aiw-radius);
      padding: 10px 12px;
      min-width: 0;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .aiw-field {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--aiw-input-bg);
      border: 1px solid var(--aiw-input-stroke);
      border-radius: var(--aiw-radius);
      padding: 10px 12px;
      min-width: 0;
      height: 44px;
    }

    .aiw-icon {
      width: 20px;
      height: 20px;
      flex: 0 0 auto;
      opacity: .75;
    }

    .aiw-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 15px;
      width: 100%;
      min-width: 120px;
      color: rgba(10, 14, 28, .92);
    }
    .aiw-input::placeholder {
      color: rgba(10, 14, 28, .45);
    }

    .aiw-arrow {
      color: var(--aiw-text);
      opacity: .9;
      font-size: 22px;
      font-weight: 700;
      margin: 0 2px;
      user-select: none;
      white-space: nowrap;
    }

    .aiw-btn {
      border: none;
      outline: none;
      height: 46px;
      padding: 0 18px;
      border-radius: var(--aiw-radius);
      background: var(--aiw-btn);
      color: var(--aiw-btn-text);
      font-weight: 700;
      font-size: 16px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 10px 26px rgba(0,0,0,.18);
    }
    .aiw-btn:hover { background: var(--aiw-btn-hover); }
    .aiw-btn:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .aiw-btn-sparkle {
      font-size: 18px;
      line-height: 0;
    }

    .aiw-close {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 38px;
      height: 38px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.22);
      background: rgba(255,255,255,.14);
      color: rgba(255,255,255,.92);
      cursor: pointer;
      display: grid;
      place-items: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .aiw-close:hover { background: rgba(255,255,255,.20); }

    .aiw-result {
      position: relative;
      margin-top: 10px;
      width: 100%;
      display: none;
      pointer-events: auto;
    }

    .aiw-result-card {
      border-radius: 20px;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(0,0,0,.06);
      box-shadow: 0 18px 50px rgba(0,0,0,.16);
      padding: 14px 16px;
      color: rgba(10, 14, 28, .92);
    }

    .aiw-result-title {
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 8px;
      opacity: .9;
    }

    .aiw-list {
      margin: 0;
      padding-left: 18px;
    }

    .aiw-meta {
      margin-top: 10px;
      font-size: 12px;
      color: rgba(10, 14, 28, .55);
      display: flex;
      gap: 10px;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .aiw-err {
      margin-top: 8px;
      font-size: 13px;
      color: rgba(180, 20, 40, .95);
      display: none;
    }

    /* responsive: stack fields on small screens */
    @media (max-width: 980px) {
      .aiw-inner { flex-wrap: wrap; }
      .aiw-label { font-size: 18px; }
      .aiw-close { right: 10px; }
      .aiw-btn { width: 100%; justify-content: center; }
      .aiw-arrow { display: none; }
    }
  `;
  document.head.appendChild(style);

  // =========================
  // UI mount
  // =========================
  const host = document.createElement("div");
  host.className = `aiw-host ${POSITION === "bottom" ? "aiw-bottom" : "aiw-top"}`;

  host.innerHTML = `
    <div class="aiw-bar" role="dialog" aria-label="AI Service Recommender">
      <div class="aiw-inner">
        <div class="aiw-label">I work at</div>

        <div class="aiw-field" style="flex: 1.1; min-width: 210px;">
          ${iconGlobe()}
          <input class="aiw-input" name="website_url" placeholder="website url" />
        </div>

        <div class="aiw-field" style="flex: 1; min-width: 190px;">
          ${iconBuilding()}
          <input class="aiw-input" name="company_name" placeholder="Company name" />
        </div>

        <div class="aiw-label">as a</div>

        <div class="aiw-field" style="flex: 1; min-width: 170px;">
          ${iconBriefcase()}
          <input class="aiw-input" name="job_title" placeholder="Job title" />
        </div>

        <div class="aiw-field" style="flex: 1; min-width: 170px;">
          ${iconTag()}
          <input class="aiw-input" name="industry" placeholder="Industry" />
        </div>

        <div class="aiw-field" style="flex: 1; min-width: 170px;">
          ${iconTarget()}
          <input class="aiw-input" name="goal" placeholder="Goal" />
        </div>

        <div class="aiw-arrow">→</div>

        <button class="aiw-btn" type="button">
          <span class="aiw-btn-sparkle">✨</span>
          Why attend?
        </button>
      </div>

      <button class="aiw-close" type="button" aria-label="Close">✕</button>
    </div>

    <div class="aiw-result">
      <div class="aiw-result-card">
        <div class="aiw-result-title">Recommended services</div>
        <ul class="aiw-list"></ul>
        <div class="aiw-err"></div>
        <div class="aiw-meta">
          <span>client: <strong class="aiw-client"></strong></span>
          <span>powered by: <strong>AI Recommender</strong></span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  // Elements
  const closeBtn = host.querySelector(".aiw-close");
  const btn = host.querySelector(".aiw-btn");
  const resultWrap = host.querySelector(".aiw-result");
  const listEl = host.querySelector(".aiw-list");
  const errEl = host.querySelector(".aiw-err");
  host.querySelector(".aiw-client").textContent = CLIENT_ID;

  const getValue = (name) =>
    (host.querySelector(`input[name="${name}"]`)?.value || "").trim();

  function setLoading(isLoading) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? `<span class="aiw-btn-sparkle">⏳</span> Loading…`
      : `<span class="aiw-btn-sparkle">✨</span> Why attend?`;
  }

  function showError(msg) {
    errEl.style.display = "block";
    errEl.textContent = msg;
  }

  function clearError() {
    errEl.style.display = "none";
    errEl.textContent = "";
  }

  function showResults(items) {
    listEl.innerHTML = "";
    (items || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      listEl.appendChild(li);
    });
    resultWrap.style.display = "block";
  }

  async function callApi() {
    clearError();
    setLoading(true);

    const payload = {
      // backend expects these keys (keep as-is if your backend uses these)
      company_name: getValue("company_name"),
      industry: getValue("industry"),
      company_size: "n/a", // not collected in this pill UI
      goal: getValue("goal"),

      // extra fields (safe to send even if backend ignores)
      website_url: getValue("website_url"),
      job_title: getValue("job_title"),
      client_id: CLIENT_ID,
    };

    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error (${res.status}): ${text || res.statusText}`);
      }

      const data = await res.json();
      const services = data.recommended_services || data.services || [];
      showResults(services);
    } catch (e) {
      showError(e.message || "Request failed");
      resultWrap.style.display = "block";
      listEl.innerHTML = "";
    } finally {
      setLoading(false);
    }
  }

  // Events
  btn.addEventListener("click", callApi);

  closeBtn.addEventListener("click", () => {
    host.remove();
    window.__AI_RECOMMENDER_WIDGET_MOUNTED__ = false;
  });

  // =========================
  // Inline SVG icons
  // =========================
  function iconBase(pathD) {
    return `
      <svg class="aiw-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="${pathD}" stroke="rgba(10,14,28,.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  function iconBuilding() {
    return iconBase("M4 20V6.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V20M8 8.5h2M8 12h2M8 15.5h2M14 10h6v10h-6V10Z");
  }
  function iconBriefcase() {
    return iconBase("M9 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M4 9h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z");
  }
  function iconGlobe() {
    return iconBase("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12 9.5 21 12 21ZM3.5 12h17");
  }
  function iconTag() {
    return iconBase("M20 13l-7 7-10-10V4h6l11 9ZM7.5 7.5h.01");
  }
  function iconTarget() {
    return iconBase("M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 2v3");
  }
})();
