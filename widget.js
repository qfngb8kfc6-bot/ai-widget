/* AI Widget (SaaS embed) - website_url + industry + goal
   Usage:
   <script src="https://YOUR_GH_PAGES/widget.js"></script>
   <script>
     AIWidget.init({
       apiBase:"https://ai-widget-backend.onrender.com",
       apiKey:"cust_demo_123"
     });
   </script>
*/

(function () {
  const DEFAULTS = {
    apiBase: "https://ai-widget-backend.onrender.com",
    apiKey: "cust_demo_123", // <-- replace per customer
    buttonText: "AI Recommender",
    ctaText: "✨ Why attend?",
    poweredByText: "Powered by AI Widget",
    position: "top", // "top" or "bottom"
  };

  const STATE = {
    isOpen: false,
    isLoading: false,
    lastError: "",
    results: [],
    client: "",
    branding: null,
    config: { ...DEFAULTS },
  };

  // -----------------------------
  // Styles (injected)
  // -----------------------------
  function injectStyles() {
    if (document.getElementById("aiw-styles")) return;

    const css = `
      :root {
        --aiw-shadow: 0 30px 70px rgba(0,0,0,.18);
        --aiw-shadow-soft: 0 18px 50px rgba(0,0,0,.12);
        --aiw-border: rgba(255,255,255,.28);

        /* defaults – can be overridden by backend branding */
        --aiw-pill-bg: #1e50a0;
        --aiw-pill-bg-2: #28aabe;
        --aiw-btn: #0b1020;

        --aiw-text: rgba(255,255,255,.92);
        --aiw-input-bg: rgba(245, 247, 255, .95);
        --aiw-input-text: rgba(15, 20, 30, .92);
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
        font: 700 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }

      .aiw-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        background: rgba(0,0,0,.10);
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
        min-width: 160px;
        background: var(--aiw-input-bg);
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 999px;
        padding: 14px 16px;
        font: 700 14px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--aiw-input-text);
        outline: none;
      }

      .aiw-cta {
        border: 0;
        cursor: pointer;
        border-radius: 999px;
        padding: 14px 18px;
        background: var(--aiw-btn);
        color: rgba(255,255,255,.96);
        font: 900 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
      .aiw-cta:disabled { opacity: .6; cursor: not-allowed; }

      .aiw-close {
        border: 0;
        cursor: pointer;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: rgba(255,255,255,.14);
        color: rgba(255,255,255,.92);
        font: 900 18px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        display: grid;
        place-items: center;
      }

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
        margin: 0 0 12px;
        font: 900 18px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: rgba(15,20,30,.92);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .aiw-results ul {
        margin: 0;
        padding-left: 18px;
        color: rgba(15,20,30,.85);
        font: 700 14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }

      .aiw-meta {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: rgba(15,20,30,.55);
        font: 700 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }

      .aiw-error {
        margin: 10px 0 0;
        color: #b00020;
        font: 800 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
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

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Apply branding from backend
  function applyBranding(branding) {
    if (!branding) return;

    // Update CSS variables globally
    const root = document.documentElement;

    if (branding.primary) root.style.setProperty("--aiw-btn", branding.primary);
    if (branding.grad1) root.style.setProperty("--aiw-pill-bg", branding.grad1);
    if (branding.grad2) root.style.setProperty("--aiw-pill-bg-2", branding.grad2);

    if (branding.name) {
      STATE.config.poweredByText = `Powered by ${branding.name}`;
    }
  }

  // -----------------------------
  // DOM setup
  // -----------------------------
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

  // -----------------------------
  // Render UI
  // -----------------------------
  function render() {
    ensureDOM();

    // remove existing
    const oldPill = qs("aiw-pill");
    const oldResults = qs("aiw-results");
    if (oldPill) oldPill.remove();
    if (oldResults) oldResults.remove();

    const backdrop = qs("aiw-backdrop");
    backdrop.classList.toggle("aiw-open", STATE.isOpen);

    if (!STATE.isOpen) return;

    const posClass = STATE.config.position === "bottom" ? "aiw-bottom" : "aiw-top";

    // pill
    const pill = document.createElement("div");
    pill.id = "aiw-pill";
    pill.className = `aiw-pill ${posClass}`;

    pill.innerHTML = `
      <input id="aiw-website" class="aiw-input" placeholder="Website URL" />
      <input id="aiw-industry" class="aiw-input" placeholder="Industry" />
      <input id="aiw-goal" class="aiw-input" placeholder="Goal" />

      <button id="aiw-cta" class="aiw-cta" ${STATE.isLoading ? "disabled" : ""}>
        ${STATE.isLoading ? `<span class="aiw-spinner"></span> Loading...` : `${STATE.config.ctaText}`}
      </button>

      <button id="aiw-close" class="aiw-close" aria-label="Close">×</button>
    `;

    document.body.appendChild(pill);

    // results card
    const resultsCard = document.createElement("div");
    resultsCard.id = "aiw-results";
    resultsCard.className = `aiw-results ${posClass}`;

    const listHtml =
      STATE.results && STATE.results.length
        ? `<ul>${STATE.results.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
        : `<ul><li>Fill in the fields and click “${escapeHtml(STATE.config.ctaText.replace("✨ ", ""))}”.</li></ul>`;

    const logoHtml =
      STATE.branding?.logo_url
        ? `<img src="${escapeHtml(STATE.branding.logo_url)}" style="height:22px;max-width:140px;object-fit:contain;" alt="logo" />`
        : "";

    resultsCard.innerHTML = `
      <h3>${logoHtml} Recommended services</h3>
      ${listHtml}
      ${STATE.lastError ? `<div class="aiw-error">${escapeHtml(STATE.lastError)}</div>` : ""}
      <div class="aiw-meta">
        <span>${escapeHtml(STATE.config.poweredByText)}</span>
        <span>client: ${escapeHtml(STATE.client || "unknown")}</span>
      </div>
    `;

    document.body.appendChild(resultsCard);

    // apply branding AFTER elements exist
    applyBranding(STATE.branding);

    // wire events
    qs("aiw-close").addEventListener("click", close);
    qs("aiw-cta").addEventListener("click", handleSubmit);

    pill.addEventListener("click", (e) => e.stopPropagation());
    resultsCard.addEventListener("click", (e) => e.stopPropagation());
  }

  // -----------------------------
  // Open/Close
  // -----------------------------
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
  // Submit -> API (THIS is what you couldn't find)
  // -----------------------------
  async function handleSubmit() {
    if (STATE.isLoading) return;

    const website_url = (qs("aiw-website").value || "").trim();
    const industry = (qs("aiw-industry").value || "").trim();
    const goal = (qs("aiw-goal").value || "").trim();

    if (!website_url || !industry || !goal) {
      STATE.lastError = "Please fill in Website URL, Industry, and Goal.";
      STATE.results = [];
      render
