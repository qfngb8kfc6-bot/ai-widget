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
    apiKey: "cust_demo_123", // <-- change to your real customer key
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
    branding: null, // { name, logo_url, primary, grad1, grad2 }
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
        --aiw-glass: rgba(80, 120, 180, .18);
        --aiw-glass-2: rgba(100, 180, 220, .18);

        /* these are the ones branding changes */
        --aiw-pill-bg: #1e50a0;
        --aiw-pill-bg-2: #28aabe;
        --aiw-btn: #0b1020;

        --aiw-text: rgba(255,255,255,.92);
        --aiw-input-bg: rgba(245, 247, 255, .95);
        --aiw-input-text: rgba(15, 20, 30, .92);
        --aiw-btn-text: rgba(255,255,255,.96);
        --aiw-muted: rgba(255,255,255,.70);
      }

      /* Floating launcher button */
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

      /* Backdrop glass overlay */
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

      /* Pill container */
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

      /* Results card */
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
      }
      .aiw-results ul {
        margin: 0;
        padding-left: 18px;
        color: rgba(15,20,30,.85);
        font: 600 14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .aiw-meta {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: rgba(15,20,30,.55);
        font: 600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .aiw-error {
        margin: 10px 0 0;
        color: #b00020;
        font: 700 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }

      /* Spinner */
      .aiw-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,.35);
        border-top-color: rgba(255,255,255,.95);
        border-radius: 999px;
        animation: aiwspin .8s linear infinite;
      }
      @keyframes aiwspin { to { transform: rotate(360deg); } }

      /* Mobile stacking */
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
  // DOM helpers
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
      backdrop.addEventListener("click", close); // click outside closes
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

  // Apply branding by changing CSS variables
  function applyBranding(branding) {
    if (!branding) return;

    const pill = qs("aiw-pill");
    const results = qs("aiw-results");
    const target = pill || results || document.documentElement;

    if (branding.primary) target.style.setProperty("--aiw-btn", branding.primary);
    if (branding.grad1) target.style.setProperty("--aiw-pill-bg", branding.grad1);
    if (branding.grad2) target.style.setProperty("--aiw-pill-bg-2", branding.grad2);

    if (branding.name) {
      STATE.config.poweredByText = `Powered by ${branding.name}`;
    }
  }

  function render() {
    ensureDOM();

    // remove existing pill/results
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
        ${STATE.isLoading ? `<span class="aiw-spinner"></span> Loading...` : `${STATE.config.ctaText}`}
      </button>

      <button id="aiw-close" class="aiw-close" aria-label="Close">×</button>
    `;

    document.body.appendChild(pill);

    // Results card
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
      <h3 style="display:flex;align-items:center;gap:10px;">
        ${logoHtml}
        Recommended services
      </h3>
      ${listHtml}
      ${STATE.lastError ? `<div class="aiw-error">${escapeHtml(STATE.lastError)}</div>` : ""}
      <div class="aiw-meta">
        <span>${escapeHtml(STATE.config.poweredByText)}</span>
        <span>client: ${escapeHtml(STATE.client || "demo")}</span>
      </div>
    `;

    document.body.appendChild(resultsCard);

    // Apply branding after DOM exists
    applyBranding(STATE.branding);

    // Wire events
    qs("aiw-close").addEventListener("click", close);

    // prevent backdrop click when clicking pill/results
    pill.addEventListener("click", (e) => e.stopPropagation());
    resultsCard.addEventListener("click", (e) => e.stopPropagation());

    qs("aiw-cta").addEventListener("click", onSubmit);
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
  // Submit -> API  ✅ THIS IS onSubmit()
  // -----------------------------
  async function onSubmit() {
    if (STATE.isLoading) return;

    const website_url = (qs("aiw-website").value || "").trim();
    const industry = (qs("aiw-industry").value || "").trim();
    const goal = (qs("aiw-goal").value || "").trim();

    // Basic validation
    if (!website_url || !industry || !goal) {
      STATE.lastError = "Please fill in Website URL, Industry, and Goal.";
      STATE.results = [];
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

      // ✅ show real client + branding from backend
      STATE.client = data.client || "";
      STATE.branding = data.branding || null;

      // Expect: { recommended_services: [...] }
      STATE.results = Array.isArray(data.recommended_services) ? data.recommended_services : [];
      if (!STATE.results.length) {
        STATE.lastError = "No recommendations returned.";
      }
    } catch (err) {
      STATE.results = [];
      STATE.lastError = err?.message || "Request failed.";
    } finally {
      STATE.isLoading = false;
      render();
    }
  }

  // -----------------------------
  // Public API
  // -----------------------------
  window.AIWidget = {
    init(config = {}) {
      STATE.config = { ...DEFAULTS, ...config };
      ensureDOM();
    },
    open,
    close,
  };

  // Auto-init with defaults
  ensureDOM();
})();
