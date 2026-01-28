console.log("✅ AIWidget loaded");

(function () {
  const DEFAULTS = {
    apiBase: "https://ai-widget-backend.onrender.com",
    apiKey: "cust_demo_123", // change per customer
    buttonText: "AI Recommender",
    ctaText: "✨ Recommend services?",
    poweredByText: "Powered by Tamed AI",
    position: "top",
  };

  const STATE = {
    isOpen: false,
    isLoading: false,
    lastError: "",
    ranked: [], // [{ service, score, why }]
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
        --ring:#2ecc71;
      }

      .aiw-launcher {
        position:fixed; right:22px; bottom:22px;
        border:0; padding:12px 16px;
        border-radius:999px;
        background:#0b1020; color:#fff;
        cursor:pointer; z-index:999999;
        box-shadow:0 18px 50px rgba(0,0,0,.12);
        font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
      }

      .aiw-backdrop {
        position:fixed; inset:0;
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        background:rgba(0,0,0,.08);
        opacity:0; pointer-events:none;
        transition:.2s; z-index:999998;
      }
      .aiw-backdrop.open { opacity:1; pointer-events:auto; }

      .aiw-pill {
        position:fixed; left:50%; transform:translateX(-50%);
        top:90px;
        width:min(1100px,calc(100vw - 40px));
        background:linear-gradient(90deg,var(--pill1),var(--pill2));
        padding:18px; border-radius:999px;
        display:flex; gap:12px; align-items:center;
        z-index:999999;
        box-shadow:0 30px 70px rgba(0,0,0,.18);
      }

      .aiw-input {
        flex:1;
        padding:14px 16px;
        border-radius:999px;
        border:0;
        background:rgba(245,247,255,.95);
        font-weight:600;
        outline:none;
        font:600 14px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
      }

      .aiw-cta {
        padding:14px 20px;
        border-radius:999px;
        border:0;
        background:var(--btn);
        color:#fff;
        font-weight:800;
        cursor:pointer;
        white-space:nowrap;
        font:800 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        display:inline-flex;
        align-items:center;
        gap:10px;
      }
      .aiw-cta:disabled { opacity:.65; cursor:not-allowed; }

      .aiw-spinner {
        width:16px; height:16px;
        border:2px solid rgba(255,255,255,.35);
        border-top-color:rgba(255,255,255,.95);
        border-radius:999px;
        animation:aiwspin .8s linear infinite;
      }
      @keyframes aiwspin { to { transform:rotate(360deg); } }

      .aiw-close {
        width:44px; height:44px;
        border-radius:999px;
        border:0;
        background:rgba(255,255,255,.16);
        color:#fff;
        font-size:20px;
        cursor:pointer;
      }

      .aiw-results {
        position:fixed;
        top:170px;
        left:50%;
        transform:translateX(-50%);
        width:min(1100px,calc(100vw - 40px));
        background:rgba(255,255,255,.92);
        border-radius:18px;
        padding:18px;
        box-shadow:0 20px 60px rgba(0,0,0,.15);
        z-index:999999;
        border:1px solid rgba(0,0,0,.06);
      }

      .aiw-row {
        display:flex;
        align-items:flex-start;
        gap:14px;
        padding:12px 0;
        border-bottom:1px solid #eee;
      }

      .aiw-ring-wrap {
        position:relative;
        width:44px;
        height:44px;
        flex:0 0 44px;
      }

      .aiw-ring {
        width:44px;
        height:44px;
      }

      .aiw-ring circle {
        fill:none;
        stroke-width:5;
      }

      .aiw-ring .bg {
        stroke:#e9e9e9;
      }

      .aiw-ring .fg {
        stroke:var(--ring);
        stroke-linecap:round;
        transform:rotate(-90deg);
        transform-origin:50% 50%;
      }

      .aiw-score {
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        font:900 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        color:#111;
        gap:2px;
      }
      .aiw-score span { font-weight:900; }
      .aiw-score i {
        font-style:normal;
        font-weight:900;
        opacity:.75;
        font-size:11px;
      }

      .aiw-service {
        font-weight:800;
        font:800 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        color:#111;
      }

      .aiw-why {
        margin-top:6px;
        font:600 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        color:#555;
      }

      .aiw-toggle {
        margin-top:12px;
        font:800 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        cursor:pointer;
        color:#1e50a0;
        display:inline-flex;
        align-items:center;
        gap:8px;
        user-select:none;
      }
      .aiw-toggle .chev {
        width:18px; height:18px;
        display:grid; place-items:center;
        border-radius:999px;
        background:rgba(30,80,160,.08);
      }

      .aiw-error {
        margin-top:10px;
        color:#b00020;
        font:800 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
      }

      .aiw-meta {
        display:flex;
        justify-content:space-between;
        margin-top:10px;
        font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        color:#777;
      }

      @media (max-width: 880px) {
        .aiw-pill { border-radius:26px; flex-wrap:wrap; }
        .aiw-input { flex:1 1 240px; }
        .aiw-cta { flex:1 1 220px; justify-content:center; }
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
    if (branding.grad1) document.documentElement.style.setProperty("--pill1", branding.grad1);
    if (branding.grad2) document.documentElement.style.setProperty("--pill2", branding.grad2);
    if (branding.primary) document.documentElement.style.setProperty("--btn", branding.primary);
    if (branding.name) STATE.config.poweredByText = `Powered by ${branding.name}`;
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
        ${STATE.isLoading ? `<span class="aiw-spinner"></span> Loading…` : STATE.config.ctaText}
      </button>
      <button class="aiw-close" id="w-close" aria-label="Close">×</button>
    `;
    document.body.appendChild(pill);

    // stop backdrop click when interacting with UI
    pill.addEventListener("click", (e) => e.stopPropagation());

    qs("w-close").onclick = close;
    qs("w-cta").onclick = submit;

    const card = document.createElement("div");
    card.id = "aiw-results";
    card.className = "aiw-results";
    card.addEventListener("click", (e) => e.stopPropagation());

    let html = `<h3 style="margin:0 0 10px;font:900 18px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111;">Recommended services</h3>`;

    if (!STATE.ranked.length && !STATE.lastError) {
      html += `<p style="margin:0;color:#555;font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        Fill in the fields and click “Why attend?”.
      </p>`;
    }

    // rows
    STATE.ranked.forEach(r => {
      const score = Math.max(0, Math.min(100, Number(r.score) || 0));
      const radius = 20;
      const circ = 2 * Math.PI * radius;
      const dash = (score / 100) * circ;
      const gap = circ - dash;

      html += `
        <div class="aiw-row">
          <div class="aiw-ring-wrap">
            <svg class="aiw-ring" viewBox="0 0 44 44" aria-label="${score}% match">
              <circle class="bg" cx="22" cy="22" r="${radius}"></circle>
              <circle class="fg" cx="22" cy="22" r="${radius}"
                stroke-dasharray="${dash} ${gap}"></circle>
            </svg>
            <div class="aiw-score"><span>${score}</span><i>%</i></div>
          </div>

          <div style="flex:1">
            <div class="aiw-service">${escapeHtml(r.service)}</div>
            ${STATE.showWhy ? `<div class="aiw-why">${escapeHtml(r.why)}</div>` : ``}
          </div>
        </div>
      `;
    });

    // toggle
    if (STATE.ranked.length) {
      html += `
        <div class="aiw-toggle" id="aiw-toggle">
          <span class="chev">${STATE.showWhy ? "–" : "+"}</span>
          ${STATE.showWhy ? "Hide why" : "Why these?"}
        </div>
      `;
    }

    // error
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

    // toggle click
    card.querySelector("#aiw-toggle")?.addEventListener("click", () => {
      STATE.showWhy = !STATE.showWhy;
      render();
    });

    applyBranding(STATE.branding);
  }

  /* ------------------ LOGIC ------------------ */
  function open() { STATE.isOpen = true; render(); }
  function close() { STATE.isOpen = false; render(); }

  async function submit() {
    if (STATE.isLoading) return;

    const website_url = (qs("w-url")?.value || "").trim();
    const industry = (qs("w-ind")?.value || "").trim();
    const goal = (qs("w-goal")?.value || "").trim();

    if (!website_url || !industry || !goal) {
      STATE.lastError = "Please fill in Website URL, Industry, and Goal.";
      STATE.ranked = [];
      render();
      return;
    }

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
        body: JSON.stringify({ website_url, industry, goal }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        const msg =
          (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }

      STATE.client = data.client || "";
      STATE.branding = data.branding || null;

      // ✅ FIX: backend returns "recommendations"
      // [{ service, score, why }]
      STATE.ranked = Array.isArray(data.recommendations) ? data.recommendations : [];

      if (!STATE.ranked.length) {
        STATE.lastError = "No recommendations returned (check backend response).";
      }
    } catch (e) {
      STATE.ranked = [];
      STATE.lastError = e?.message || "Request failed.";
    } finally {
      STATE.isLoading = false;
      render();
    }
  }

  window.AIWidget = {
    init(cfg = {}) { STATE.config = { ...DEFAULTS, ...cfg }; ensureDOM(); },
    open, close
  };

  ensureDOM();
})();
