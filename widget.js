/* AI Widget (SaaS embed) — FINAL
   Fields: Website URL + Industry + Goal
*/
console.log("✅ AIWidget loaded");

(function () {
  const DEFAULTS = {
    apiBase: "https://ai-widget-backend.onrender.com",
    apiKey: "cust_demo_123", // change per customer
    buttonText: "AI Recommender",
    ctaText: "✨ Why attend?",
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

      .aiw-launcher {
        position:fixed; right:22px; bottom:22px;
        border:0; padding:12px 16px;
        border-radius:999px;
        background:#0b1020; color:#fff;
        cursor:pointer; z-index:999999;
      }

      .aiw-backdrop {
        position:fixed; inset:0;
        backdrop-filter:blur(10px);
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
      }

      .aiw-input {
        flex:1;
        padding:14px 16px;
        border-radius:999px;
        border:0;
        font-weight:600;
      }

      .aiw-cta {
        padding:14px 20px;
        border-radius:999px;
        border:0;
        background:var(--btn);
        color:#fff;
        font-weight:800;
        cursor:pointer;
      }

      .aiw-close {
        width:44px; height:44px;
        border-radius:999px;
        border:0;
        font-size:20px;
        cursor:pointer;
      }

      .aiw-results {
        position:fixed;
        top:170px;
        left:50%;
        transform:translateX(-50%);
        width:min(1100px,calc(100vw - 40px));
        background:#fff;
        border-radius:18px;
        padding:18px;
        box-shadow:0 20px 60px rgba(0,0,0,.15);
        z-index:999999;
      }

      .aiw-row {
        display:flex;
        align-items:center;
        gap:14px;
        padding:10px 0;
        border-bottom:1px solid #eee;
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
        stroke:#eee;
      }

      .aiw-ring .fg {
        stroke:#2ecc71;
        stroke-linecap:round;
        transform:rotate(-90deg);
        transform-origin:50% 50%;
      }

      .aiw-score {
        position:absolute;
        font-size:12px;
        font-weight:800;
      }

      .aiw-service {
        font-weight:700;
      }

      .aiw-why {
        margin-top:6px;
        font-size:13px;
        color:#555;
      }

      .aiw-toggle {
        margin-top:12px;
        font-weight:700;
        cursor:pointer;
        color:#1e50a0;
      }

      .aiw-meta {
        display:flex;
        justify-content:space-between;
        margin-top:10px;
        font-size:12px;
        color:#777;
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
      <button class="aiw-cta" id="w-cta">${STATE.isLoading ? "Loading…" : STATE.config.ctaText}</button>
      <button class="aiw-close" id="w-close">×</button>
    `;
    document.body.appendChild(pill);

    qs("w-close").onclick = close;
    qs("w-cta").onclick = submit;

    const card = document.createElement("div");
    card.id = "aiw-results";
    card.className = "aiw-results";

    let html = `<h3>Recommended services</h3>`;

    if (!STATE.ranked.length) {
      html += `<p>Fill in the fields and click “Why attend?”.</p>`;
    }

    STATE.ranked.forEach(r => {
      const circ = 2 * Math.PI * 20;
      const dash = (r.score / 100) * circ;
      html += `
        <div class="aiw-row">
          <div style="position:relative">
            <svg class="aiw-ring" viewBox="0 0 44 44">
              <circle class="bg" cx="22" cy="22" r="20"/>
              <circle class="fg" cx="22" cy="22" r="20"
                stroke-dasharray="${dash} ${circ-dash}"/>
            </svg>
            <div class="aiw-score" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              ${r.score}%
            </div>
          </div>
          <div>
            <div class="aiw-service">${r.service}</div>
            ${STATE.showWhy ? `<div class="aiw-why">${r.why}</div>` : ``}
          </div>
        </div>
      `;
    });

    if (STATE.ranked.length) {
      html += `<div class="aiw-toggle">${STATE.showWhy ? "Hide why" : "Why these?"}</div>`;
    }

    html += `
      <div class="aiw-meta">
        <span>${STATE.config.poweredByText}</span>
        <span>client: ${STATE.client || "demo"}</span>
      </div>
    `;

    card.innerHTML = html;
    document.body.appendChild(card);

    card.querySelector(".aiw-toggle")?.addEventListener("click", () => {
      STATE.showWhy = !STATE.showWhy;
      render();
    });
  }

  /* ------------------ LOGIC ------------------ */
  function open() { STATE.isOpen = true; render(); }
  function close() { STATE.isOpen = false; render(); }

  async function submit() {
    if (STATE.isLoading) return;

    const website_url = qs("w-url").value.trim();
    const industry = qs("w-ind").value.trim();
    const goal = qs("w-goal").value.trim();

    if (!website_url || !industry || !goal) return;

    STATE.isLoading = true;
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

      const data = await res.json();
      STATE.client = data.client;
      STATE.ranked = data.ranked_services || [];
    } catch {
      STATE.ranked = [];
    } finally {
      STATE.isLoading = false;
      render();
    }
  }

  window.AIWidget = {
    init(cfg={}) { STATE.config = {...DEFAULTS,...cfg}; ensureDOM(); },
    open, close
  };

  ensureDOM();
})();
