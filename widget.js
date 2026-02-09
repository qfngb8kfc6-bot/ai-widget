console.log("✅ AIWidget loaded");

(function () {
  const DEFAULTS = {
    apiBase: "https://ai-widget-backend.onrender.com",
    apiKey: "cust_demo_123",
    buttonText: "AI Recommender",
    ctaText: "✨ Recommend services?",
    poweredByText: "Powered by AI Widget",
    position: "top",
  };

  const STATE = {
    isOpen: false,
    isLoading: false,
    lastError: "",
    ranked: [],
    showWhy: false,
    client: "",
    branding: null,
    config: { ...DEFAULTS },
  };

  /* ------------------ STYLES ------------------ */
  function injectStyles() {
    if (document.getElementById("aiw-styles")) return;

    const css = `
      :root {
        --pill1:#1e50a0;
        --pill2:#28aabe;
        --btn:#0b1020;
      }

      .aiw-launcher{
        position:fixed; right:22px; bottom:22px;
        border:0; padding:12px 16px;
        border-radius:999px;
        background:#0b1020; color:#fff;
        cursor:pointer; z-index:2147483647;
        font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        box-shadow:0 18px 50px rgba(0,0,0,.12);
      }

      .aiw-backdrop{
        position:fixed; inset:0;
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        background:rgba(0,0,0,.08);
        opacity:0; pointer-events:none;
        transition:.2s; z-index:2147483646;
      }
      .aiw-backdrop.open{ opacity:1; pointer-events:auto; }

      .aiw-pill{
        position:fixed; left:50%; transform:translateX(-50%);
        top:90px;
        width:min(1100px,calc(100vw - 40px));
        background:linear-gradient(90deg,var(--pill1),var(--pill2));
        padding:18px; border-radius:999px;
        display:flex; gap:12px; align-items:center;
        z-index:2147483647;
        box-shadow:0 30px 70px rgba(0,0,0,.18);
      }

      .aiw-input{
        flex:1;
        padding:14px 16px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.25);
        background:rgba(245,247,255,.95);
        font-weight:600;
        outline:none;
      }

      .aiw-cta{
        padding:14px 20px;
        border-radius:999px;
        border:0;
        background:var(--btn);
        color:#fff;
        font-weight:800;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:10px;
        white-space:nowrap;
      }
      .aiw-cta:disabled{ opacity:.6; cursor:not-allowed; }

      .aiw-close{
        width:44px; height:44px;
        border-radius:999px;
        border:0;
        background:rgba(255,255,255,.14);
        color:#fff;
        font-size:20px;
        cursor:pointer;
      }

      .aiw-results{
        position:fixed;
        top:170px;
        left:50%;
        transform:translateX(-50%);
        width:min(1100px,calc(100vw - 40px));
        background:rgba(255,255,255,.92);
        border-radius:18px;
        padding:18px;
        box-shadow:0 20px 60px rgba(0,0,0,.15);
        z-index:2147483647;
      }

      .aiw-row{
        display:flex;
        align-items:flex-start;
        gap:14px;
        padding:12px 0;
        border-bottom:1px solid #eee;
      }

      .aiw-ringWrap{
        width:48px;
        height:48px;
        position:relative;
        flex:0 0 48px;
      }

      .aiw-ring{
        width:48px;
        height:48px;
      }

      .aiw-ring circle{
        fill:none;
        stroke-width:6;
      }

      .aiw-ring .bg{ stroke:#e9e9e9; }

      .aiw-ring .fg{
        stroke:#2ecc71;
        stroke-linecap:round;
        transform:rotate(-90deg);
        transform-origin:50% 50%;
      }

      .aiw-score{
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:900;
        color:#0b1020;
      }

      .aiw-service{
        font-weight:900;
        color:#0b1020;
      }

      .aiw-why{
        margin-top:6px;
        font-size:13px;
        color:#4b5563;
        line-height:1.35;
      }

      .aiw-toggle{
        margin-top:12px;
        font-weight:800;
        cursor:pointer;
        color:#1e50a0;
        user-select:none;
      }

      .aiw-error{
        margin-top:10px;
        color:#b00020;
        font-weight:800;
        font-size:13px;
        white-space:pre-wrap;
      }

      .aiw-meta{
        display:flex;
        justify-content:space-between;
        margin-top:10px;
        font-size:12px;
        color:#6b7280;
        font-weight:700;
      }

      .aiw-spinner{
        width:16px; height:16px;
        border:2px solid rgba(255,255,255,.35);
        border-top-color:rgba(255,255,255,.95);
        border-radius:999px;
        animation:aiwspin .8s linear infinite;
      }
      @keyframes aiwspin{ to { transform:rotate(360deg);} }

      @media (max-width: 880px){
        .aiw-pill{ border-radius:26px; flex-wrap:wrap; }
        .aiw-input{ flex:1 1 260px; }
        .aiw-cta{ flex:1 1 220px; justify-content:center; }
      }
    `;
    const s = document.createElement("style");
    s.id = "aiw-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ------------------ DOM ------------------ */
  function qs(id) { return document.getElementById(id); }

  function ensureDOM() {
    injectStyles();

    if (!qs("aiw-launcher")) {
      const b = document.createElement("button");
      b.id = "aiw-launcher";
      b.className = "aiw-launcher";
      b.textContent = STATE.config.buttonText;
      b.onclick = open;
      document.body.appendChild(b);
    }

    if (!qs("aiw-backdrop")) {
      const d = document.createElement("div");
      d.id = "aiw-backdrop";
      d.className = "aiw-backdrop";
      d.onclick = close;
      document.body.appendChild(d);
    }
  }

  function applyBranding() {
    const b = STATE.branding;
    if (!b) return;
    if (b.grad1) document.documentElement.style.setProperty("--pill1", b.grad1);
    if (b.grad2) document.documentElement.style.setProperty("--pill2", b.grad2);
    if (b.primary) document.documentElement.style.setProperty("--btn", b.primary);
    if (b.name) STATE.config.poweredByText = `Powered by ${b.name}`;
  }

  /* ------------------ RENDER ------------------ */
  function render() {
    ensureDOM();

    ["aiw-pill","aiw-results"].forEach(id => qs(id)?.remove());
    qs("aiw-backdrop").classList.toggle("open", STATE.isOpen);
    if (!STATE.isOpen) return;

    const pill = document.createElement("div");
    pill.id = "aiw-pill";
    pill.className = "aiw-pill";
    pill.innerHTML = `
      <input id="w-url" class="aiw-input" placeholder="Website URL">
      <input id="w-ind" class="aiw-input" placeholder="Industry">
      <input id="w-goal" class="aiw-input" placeholder="Goal">
      <button class="aiw-cta" id="w-cta" ${STATE.isLoading ? "disabled" : ""}>
        ${STATE.isLoading ? `<span class="aiw-spinner"></span> Analysing...` : STATE.config.ctaText}
      </button>
      <button class="aiw-close" id="w-close">×</button>
    `;
    document.body.appendChild(pill);

    pill.addEventListener("click", (e) => e.stopPropagation());
    qs("w-close").onclick = close;
    qs("w-cta").onclick = submit;

    const card = document.createElement("div");
    card.id = "aiw-results";
    card.className = "aiw-results";

    let html = `<h3 style="margin:0 0 10px;font-weight:900;">Recommended services</h3>`;

    if (!STATE.ranked.length && !STATE.lastError) {
      html += `<div style="font-weight:700;color:#374151;">Fill in the fields and click “Recommend services?”.</div>`;
    }

    if (STATE.ranked.length) {
      STATE.ranked.forEach(r => {
        const score = Math.max(0, Math.min(100, Number(r.score || 0)));
        const radius = 20;
        const circ = 2 * Math.PI * radius;
        const dash = (score / 100) * circ;

        html += `
          <div class="aiw-row">
            <div class="aiw-ringWrap">
              <svg class="aiw-ring" viewBox="0 0 48 48">
                <circle class="bg" cx="24" cy="24" r="${radius}"></circle>
                <circle class="fg" cx="24" cy="24" r="${radius}"
                  stroke-dasharray="${dash} ${Math.max(0, circ - dash)}"></circle>
              </svg>
              <div class="aiw-score">${score}%</div>
            </div>
            <div style="flex:1;">
              <div class="aiw-service">${escapeHtml(r.service)}</div>
              ${STATE.showWhy && r.why ? `<div class="aiw-why">${escapeHtml(r.why)}</div>` : ``}
            </div>
          </div>
        `;
      });

      html += `<div class="aiw-toggle" id="aiw-toggle">${STATE.showWhy ? "Hide why" : "Why these?"}</div>`;
    }

    if (STATE.lastError) {
      html += `<div class="aiw-error">${escapeHtml(STATE.lastError)}</div>`;
    }

    html += `
      <div class="aiw-meta">
        <span>${escapeHtml(STATE.config.poweredByText)}</span>
        <span>client: ${escapeHtml(STATE.client || "demo")}</span>
      </div>
    `;

    card.innerHTML = html;
    document.body.appendChild(card);
    card.addEventListener("click", (e) => e.stopPropagation());

    document.getElementById("aiw-toggle")?.addEventListener("click", () => {
      STATE.showWhy = !STATE.showWhy;
      render();
    });

    applyBranding();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ------------------ LOGIC ------------------ */
  function open() {
    STATE.isOpen = true;
    STATE.lastError = "";
    render();
  }

  function close() {
    STATE.isOpen = false;
    render();
  }

  async function submit() {
    if (STATE.isLoading) return;

    const website_url = (qs("w-url").value || "").trim();
    const industry = (qs("w-ind").value || "").trim();
    const goal = (qs("w-goal").value || "").trim();

    if (!website_url || !industry || !goal) {
      STATE.lastError = "Please fill in Website URL, Industry and Goal.";
      STATE.ranked = [];
      render();
      return;
    }

    // ✅ send the HOST ORIGIN (best for backend fetching)
    const host_url = window.location.origin;

    STATE.isLoading = true;
    STATE.lastError = "";
    render();

    try {
      const res = await fetch(`${STATE.config.apiBase}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${STATE.config.apiKey}`,
        },
        body: JSON.stringify({ website_url, host_url, industry, goal }),
      });

      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = { raw }; }

      console.log("🔎 /recommend response:", res.status, data);

      if (!res.ok) {
        const msg =
          (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }

      STATE.client = data.client || "";
      STATE.branding = data.branding || null;

      // ✅ IMPORTANT: backend returns ranked_services
      STATE.ranked = Array.isArray(data.ranked_services) ? data.ranked_services : [];

      if (!STATE.ranked.length) {
        // show helpful debugging info if backend sent it
        const sig = data.signals ? `signals=${JSON.stringify(data.signals)}` : "";
        const host = data.host_services_detected ? `host_services=${JSON.stringify(data.host_services_detected)}` : "";
        STATE.lastError = `No recommendations returned.\n${sig}\n${host}`.trim();
      }
    } catch (e) {
      STATE.ranked = [];
      STATE.lastError = e?.message || "Request failed.";
    } finally {
      STATE.isLoading = false;
      render();
    }
  }

  /* ------------------ PUBLIC API ------------------ */
  window.AIWidget = {
    init(cfg = {}) {
      STATE.config = { ...DEFAULTS, ...cfg };
      ensureDOM();
    },
    open,
    close,
  };

  ensureDOM();
})();
