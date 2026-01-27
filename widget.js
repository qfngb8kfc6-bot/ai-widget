/* AI Widget (SaaS embed) - website_url + industry + goal
   Usage:
   <script src="https://YOUR_GH_PAGES/widget.js"></script>
   <script>
     AIWidget.init({ apiBase:"https://ai-widget-backend.onrender.com", apiKey:"YOUR_KEY" });
   </script>
*/

console.log("✅ AIWidget loaded");

(function () {
  const DEFAULTS = {
    apiBase: "https://ai-widget-backend.onrender.com",
    apiKey: "cust_demo_123",
    buttonText: "AI Recommender",
    ctaText: "✨ Why attend?",
    poweredByText: "Powered by AI Widget",
    position: "top", // "top" or "bottom"
  };

  const STATE = {
    isOpen: false,
    isLoading: false,
    lastError: "",
    ranked: [], // [{service, score, why}]
    client: "",
    branding: null, // { name, primary, accent, logo_url }
    whyOpen: false, // ✅ expand/collapse
    config: { ...DEFAULTS },
  };

  // -----------------------------
  // Styles
  // -----------------------------
  function injectStyles() {
    if (document.getElementById("aiw-styles")) return;

    const css = `
      :root {
        --aiw-shadow: 0 30px 70px rgba(0,0,0,.18);
        --aiw-shadow-soft: 0 18px 50px rgba(0,0,0,.12);
        --aiw-border: rgba(255,255,255,.28);
        --aiw-glass: rgba(80, 120, 180, .18);
        --aiw-glass-2: rgba(100, 180, 220, .18);

        /* branding overridable */
        --aiw-pill-bg: #1e50a0;
        --aiw-pill-bg-2: #28aabe;
        --aiw-btn: #0b1020;

        --aiw-text: rgba(255,255,255,.92);
        --aiw-input-bg: rgba(245, 247, 255, .95);
        --aiw-input-text: rgba(15, 20, 30, .92);
        --aiw-btn-text: rgba(255,255,255,.96);

        --aiw-green: #22c55e; /* ✅ ring color */
        --aiw-ring-bg: rgba(0,0,0,.08);
      }

      .aiw-launcher {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 2147483647;
        border: 0;
        cursor: pointer;
        padding: 12px 16px;
        border-radius: 999px;
        background: #0b1020;
        color: #fff;
        box-shadow: var(--aiw-shadow-soft);
        font: 600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .aiw-launcher:hover { transform: translateY(-1px); }

      .aiw-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        background: radial-gradient(1000px 500px at 70% 20%, var(--aiw-glass), transparent 60%),
                    radial-gradient(900px 500px at 20% 70%, var(--aiw-glass-2), transparent 60%),
                    rgba(0,0,0,.08);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .18s ease;
      }
      .aiw-backdrop.aiw-open {
        opacity: 1;
        pointer-events: auto;
      }

      .aiw-pill {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        width: min(1080px, calc(100vw - 40px));
        border-radius: 999px;
        border: 1px solid var(--aiw-border);
        box-shadow: var(--aiw-shadow);
        background: linear-gradient(90deg, var(--aiw-pill-bg), var(--aiw-pill-bg-2));
        display: flex;
        gap: 14px;
        align-items: center;
        padding: 18px 18px;
      }
      .aiw-pill.aiw-top { top: 90px; }
      .aiw-pill.aiw-bottom { bottom: 90px; }

      .aiw-input {
        flex: 1;
        min-width: 140px;
        background: var(--aiw-input-bg);
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 999px;
        padding: 14px 16px;
        font: 600 14px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--aiw-input-text);
        outline: none;
      }
      .aiw-input::placeholder { color: rgba(15,20,30,.45); font-weight: 600; }

      .aiw-cta {
        border: 0;
        cursor: pointer;
        border-radius: 999px;
        padding: 14px 18px;
        background: var(--aiw-btn);
        color: var(--aiw-btn-text);
        font: 800 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
      .aiw-cta:disabled { opacity: .6; cursor: not-allowed; }
      .aiw-cta:hover { transform: translateY(-1px); }

      .aiw-close {
        border: 0;
        cursor: pointer;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: rgba(255,255,255,.14);
        color: var(--aiw-text);
        font: 800 18px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        display: grid;
        place-items: center;
      }
      .aiw-close:hover { background: rgba(255,255,255,.18); }

      .aiw-results {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        width: min(1080px, calc(100vw - 40px));
        border-radius: 20px;
        border: 1px solid rgba(0,0,0,.06);
        background: rgba(255,255,255,.92);
        box-shadow: var(--aiw-shadow-soft);
        padding: 18px 18px 14px;
      }
      .aiw-results.aiw-top { top: 165px; }
      .aiw-results.aiw-bottom { bottom: 165px; }

      .aiw-results h3 {
        margin: 0 0 10px;
        font: 900 18px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.92);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .aiw-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 10px 0 12px;
      }

      .aiw-toggle {
        border: 1px solid rgba(0,0,0,.10);
        background: rgba(255,255,255,.8);
        cursor: pointer;
        border-radius: 999px;
        padding: 10px 12px;
        font: 800 13px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.75);
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .aiw-toggle:hover { transform: translateY(-1px); }

      .aiw-rank {
        display: grid;
        gap: 10px;
      }
      .aiw-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        padding: 12px 12px;
        border-radius: 14px;
        background: rgba(255,255,255,.85);
        border: 1px solid rgba(0,0,0,.06);
        align-items: start;
      }
      .aiw-row-title {
        font: 900 14px/1.25 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.92);
        margin: 0 0 4px;
      }
      .aiw-row-why {
        font: 650 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.70);
        margin: 6px 0 0;
      }
      .aiw-why-collapsed { display: none; }
      .aiw-why-expanded { display: block; }

      /* ✅ Circular score ring */
      .aiw-ring {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
      }
      .aiw-ring svg {
        width: 54px;
        height: 54px;
        transform: rotate(-90deg);
      }
      .aiw-ring .bg {
        stroke: var(--aiw-ring-bg);
        stroke-width: 6;
        fill: none;
      }
      .aiw-ring .fg {
        stroke: var(--aiw-green);
        stroke-width: 6;
        fill: none;
        stroke-linecap: round;
        transition: stroke-dashoffset .35s ease;
      }
      .aiw-ring .label {
        position: absolute;
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        font: 900 13px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.92);
      }
      .aiw-ring-wrap {
        position: relative;
        width: 54px;
        height: 54px;
      }
      .aiw-ring small {
        font: 800 10px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.65);
      }

      .aiw-meta {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: rgba(15,20,30,.55);
        font: 650 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .aiw-error {
        margin: 10px 0 0;
        color: #b00020;
        font: 750 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }

      .aiw-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,.35);
        border-top-color: rgba(255,255,255,.95);
        border-radius: 999px;
        animation: aiwspin .8s linear infinite;
      }
      @keyframes aiwspin { to { transform: rotate(360deg); } }

      @media (max-width: 880px) {
        .aiw-pill {
          border-radius: 26px;
          padding: 14px;
          flex-wrap: wrap;
        }
        .aiw-input { flex: 1 1 240px; }
        .aiw-cta { flex: 1 1 220px; justify-content: center; }
      }
    `;

    const style = document.createElement("style");
    style.id = "aiw-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  function qs(id) {
    return document.getElementById(id);
  }

  function ensureDOM() {
    injectStyles();

    if (!qs("aiw-launcher")) {
      const launcher = document.createElement("button");
      launcher.id = "aiw-launcher";
      launcher.className = "aiw-launcher";
      launcher.textContent = STATE.config.buttonText;
      launcher.addEventListener("click", open);
      document.body.appendChild(launcher);
    }

    if (!qs("aiw-backdrop")) {
      const backdrop = document.createElement("div");
      backdrop.id = "aiw-backdrop";
      backdrop.className = "aiw-backdrop";
      backdrop.addEventListener("click", close);
      document.body.appendChild(backdrop);
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applyBranding(branding) {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primary) root.style.setProperty("--aiw-btn", branding.primary);
    if (branding.primary) root.style.setProperty("--aiw-pill-bg", branding.primary);
    if (branding.accent) root.style.setProperty("--aiw-pill-bg-2", branding.accent);
    if (branding.name) STATE.config.poweredByText = `Powered by ${branding.name}`;
  }

  // ✅ create ring HTML (SVG stroke dashoffset)
  function ringHTML(score) {
    const s = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 20; // radius
    const c = 2 * Math.PI * r; // circumference
    const offset = c - (s / 100) * c;

    return `
      <div class="aiw-ring">
        <div class="aiw-ring-wrap">
          <div class="label">
            <div style="display:grid;place-items:center;gap:2px;">
              <div>${s}%</div>
              <small>%</small>
            </div>
          </div>
          <svg viewBox="0 0 54 54" aria-label="score">
            <circle class="bg" cx="27" cy="27" r="${r}"></circle>
            <circle class="fg" cx="27" cy="27" r="${r}"
              stroke-dasharray="${c.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"
            ></circle>
          </svg>
        </div>
      </div>
    `;
  }

  function render() {
    ensureDOM();

    const oldPill = qs("aiw-pill");
    const oldResults = qs("aiw-results");
    if (oldPill) oldPill.remove();
    if (oldResults) oldResults.remove();

    const backdrop = qs("aiw-backdrop");
    backdrop.classList.toggle("aiw-open", STATE.isOpen);

    if (!STATE.isOpen) return;

    const posClass = STATE.config.position === "bottom" ? "aiw-bottom" : "aiw-top";

    // Pill
    const pill = document.createElement("div");
    pill.id = "aiw-pill";
    pill.className = `aiw-pill ${posClass}`;
    pill.innerHTML = `
      <input id="aiw-website" class="aiw-input" placeholder="Website URL" />
      <input id="aiw-industry" class="aiw-input" placeholder="Industry" />
      <input id="aiw-goal" class="aiw-input" placeholder="Goal" />

      <button id="aiw-cta" class="aiw-cta" ${STATE.isLoading ? "disabled" : ""}>
        ${STATE.isLoading ? `<span class="aiw-spinner"></span> Loading...` : `${escapeHtml(STATE.config.ctaText)}`}
      </button>

      <button id="aiw-close" class="aiw-close" aria-label="Close">×</button>
    `;
    document.body.appendChild(pill);

    // Results
    const resultsCard = document.createElement("div");
    resultsCard.id = "aiw-results";
    resultsCard.className = `aiw-results ${posClass}`;

    const logoHtml =
      STATE.branding?.logo_url
        ? `<img src="${escapeHtml(STATE.branding.logo_url)}" style="height:22px;max-width:140px;object-fit:contain;" alt="logo" />`
        : "";

    const toggleLabel = STATE.whyOpen ? "Hide why" : "Why these?";
    const toggleIcon = STATE.whyOpen ? "▾" : "▸";

    let bodyHtml = "";
    if (STATE.ranked && STATE.ranked.length) {
      bodyHtml = `
        <div class="aiw-toolbar">
          <button id="aiw-why-toggle" class="aiw-toggle" type="button">
            ${toggleIcon} ${toggleLabel}
          </button>
        </div>

        <div class="aiw-rank">
          ${STATE.ranked
            .map(
              (r, idx) => `
                <div class="aiw-row">
                  <div>
                    <div class="aiw-row-title">${escapeHtml(r.service)}</div>
                    <div class="${STATE.whyOpen ? "aiw-why-expanded" : "aiw-why-collapsed"}">
                      <p class="aiw-row-why">${escapeHtml(r.why || "")}</p>
                    </div>
                  </div>
                  ${ringHTML(r.score)}
                </div>
              `
            )
            .join("")}
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="aiw-rank">
          <div class="aiw-row">
            <div>
              <div class="aiw-row-title">Recommended services will appear here</div>
              <p class="aiw-row-why">Fill in the fields and click “${escapeHtml(
                STATE.config.ctaText.replace("✨ ", "")
              )}”.</p>
            </div>
            ${ringHTML(0)}
          </div>
        </div>
      `;
    }

    resultsCard.innerHTML = `
      <h3>${logoHtml} Recommended services</h3>
      ${bodyHtml}
      ${STATE.lastError ? `<div class="aiw-error">${escapeHtml(STATE.lastError)}</div>` : ""}
      <div class="aiw-meta">
        <span>${escapeHtml(STATE.config.poweredByText)}</span>
        <span>client: ${escapeHtml(STATE.client || "unknown")}</span>
      </div>
    `;

    document.body.appendChild(resultsCard);

    applyBranding(STATE.branding);

    // Events
    qs("aiw-close").addEventListener("click", close);
    pill.addEventListener("click", (e) => e.stopPropagation());
    resultsCard.addEventListener("click", (e) => e.stopPropagation());

    qs("aiw-cta").addEventListener("click", onSubmit);

    const toggle = qs("aiw-why-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        STATE.whyOpen = !STATE.whyOpen;
        render();
      });
    }
  }

  function open() {
    STATE.isOpen = true;
    STATE.lastError = "";
    render();
  }

  function close() {
    STATE.isOpen = false;
    render();
  }

  // -----------------------------
  // Submit -> API ✅ onSubmit()
  // -----------------------------
  async function onSubmit() {
    if (STATE.isLoading) return;

    const website_url = (qs("aiw-website").value || "").trim();
    const industry = (qs("aiw-industry").value || "").trim();
    const goal = (qs("aiw-goal").value || "").trim();

    if (!website_url || !industry || !goal) {
      STATE.lastError = "Please fill in Website URL, Industry, and Goal.";
      STATE.ranked = [];
      render();
      return;
    }

    STATE.isLoading = true;
    STATE.lastError = "";
    render();

    const payload = { website_url, industry, goal };

    try {
      const res = await fetch(`${STATE.config.apiBase}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${STATE.config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const msg =
          (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }

      STATE.client = data.client || "";
      STATE.branding = data.branding || null;

      // ✅ expects: ranked_services: [{service, score, why}]
      STATE.ranked = Array.isArray(data.ranked_services) ? data.ranked_services : [];
      if (!STATE.ranked.length) STATE.lastError = "No recommendations returned.";
    } catch (err) {
      STATE.ranked = [];
      STATE.lastError = err?.message || "Request failed.";
    } finally {
      STATE.isLoading = false;
      render();
    }
  }

  window.AIWidget = {
    init(config = {}) {
      STATE.config = { ...DEFAULTS, ...config };
      ensureDOM();
    },
    open,
    close,
  };

  ensureDOM();
})();
