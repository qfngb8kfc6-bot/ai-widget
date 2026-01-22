(() => {
  // =========================
  // SaaS embed config
  // =========================
  const scriptEl = document.currentScript || [...document.scripts].slice(-1)[0];

  const API_BASE =
    scriptEl?.getAttribute("data-api-base") ||
    "https://ai-widget-backend.onrender.com";

  const API_KEY =
    scriptEl?.getAttribute("data-api-key") ||
    "demo-key-123";

  const CLIENT_ID =
    scriptEl?.getAttribute("data-client") ||
    "demo";

  const POSITION =
    scriptEl?.getAttribute("data-position") ||
    "top"; // top | bottom

  if (window.__AI_RECOMMENDER_WIDGET_MOUNTED__) return;
  window.__AI_RECOMMENDER_WIDGET_MOUNTED__ = true;

  // =========================
  // Styles
  // =========================
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --shadow: 0 22px 60px rgba(0,0,0,.18);
      --glass: rgba(255,255,255,.16);
      --stroke: rgba(255,255,255,.28);
      --input-bg: rgba(255,255,255,.94);
      --btn: rgba(10,18,82,.95);
      --btn-hover: rgba(10,18,82,1);
      --radius: 999px;
      --font: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    .aiw-host {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      width: min(1100px, calc(100vw - 24px));
      font-family: var(--font);
      pointer-events: none;
    }
    .aiw-host.top { top: 16px; }
    .aiw-host.bottom { bottom: 16px; }

    .aiw-bar {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, #2f369e, #1e7d96);
      box-shadow: var(--shadow);
      border: 1px solid rgba(255,255,255,.12);
    }

    .aiw-field {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--input-bg);
      border-radius: var(--radius);
      padding: 10px 14px;
      height: 44px;
      flex: 1;
      min-width: 180px;
    }

    .aiw-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 15px;
      width: 100%;
    }

    .aiw-btn {
      border: none;
      border-radius: var(--radius);
      height: 46px;
      padding: 0 18px;
      font-size: 16px;
      font-weight: 700;
      background: var(--btn);
      color: #fff;
      cursor: pointer;
      white-space: nowrap;
    }
    .aiw-btn:hover { background: var(--btn-hover); }

    .aiw-close {
      margin-left: 6px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,.3);
      background: rgba(255,255,255,.15);
      color: #fff;
      cursor: pointer;
    }

    .aiw-result {
      margin-top: 10px;
      display: none;
      pointer-events: auto;
    }

    .aiw-result-card {
      background: #fff;
      border-radius: 18px;
      padding: 14px 16px;
      box-shadow: var(--shadow);
    }

    .aiw-list { padding-left: 18px; }

    @media (max-width: 900px) {
      .aiw-bar { flex-wrap: wrap; }
      .aiw-btn { width: 100%; }
    }
  `;
  document.head.appendChild(style);

  // =========================
  // UI
  // =========================
  const host = document.createElement("div");
  host.className = `aiw-host ${POSITION}`;

  host.innerHTML = `
    <div class="aiw-bar">
      <div class="aiw-field">
        <input class="aiw-input" name="website_url" placeholder="website url" />
      </div>

      <div class="aiw-field">
        <input class="aiw-input" name="industry" placeholder="Industry" />
      </div>

      <div class="aiw-field">
        <input class="aiw-input" name="goal" placeholder="Goal" />
      </div>

      <button class="aiw-btn">✨ Why attend?</button>
      <button class="aiw-close">✕</button>
    </div>

    <div class="aiw-result">
      <div class="aiw-result-card">
        <strong>Recommended services</strong>
        <ul class="aiw-list"></ul>
        <small>client: ${CLIENT_ID}</small>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  // =========================
  // Logic
  // =========================
  const btn = host.querySelector(".aiw-btn");
  const closeBtn = host.querySelector(".aiw-close");
  const result = host.querySelector(".aiw-result");
  const list = host.querySelector(".aiw-list");

  const val = (name) =>
    host.querySelector(`input[name="${name}"]`)?.value.trim() || "";

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Loading…";

    const website = val("website_url");

    const payload = {
      company_name: website || "unknown",
      industry: val("industry"),
      goal: val("goal"),
      company_size: "n/a",
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

      const data = await res.json();
      list.innerHTML = "";

      (data.recommended_services || []).forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        list.appendChild(li);
      });

      result.style.display = "block";
    } catch (e) {
      alert("API error");
    } finally {
      btn.disabled = false;
      btn.textContent = "✨ Why attend?";
    }
  };

  closeBtn.onclick = () => {
    host.remove();
    window.__AI_RECOMMENDER_WIDGET_MOUNTED__ = false;
  };
})();
