(function () {
  // =========================================
  // SaaS-style config (reads from the script tag)
  // =========================================
  const scriptTag =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');

  const API_BASE = scriptTag?.dataset.apiBase || "https://ai-widget-backend.onrender.com";
  const API_KEY  = scriptTag?.dataset.apiKey  || "demo";
  const POSITION = scriptTag?.dataset.position || "bottom-right";
  const BRAND    = scriptTag?.dataset.brand || "AI Service Recommender";

  // Optional: show a small label on the launcher button
  const LAUNCHER_LABEL = scriptTag?.dataset.launcherLabel || "AI Recommender";

  // =========================================
  // Helpers
  // =========================================
  const $ = (tag) => document.createElement(tag);

  function applyPosition(el, position) {
    const positions = {
      "bottom-right": { bottom: "20px", right: "20px" },
      "bottom-left":  { bottom: "20px", left: "20px" },
      "top-right":    { top: "20px", right: "20px" },
      "top-left":     { top: "20px", left: "20px" },
    };
    Object.assign(el.style, positions[position] || positions["bottom-right"]);
  }

  function safeText(str) {
    return (str ?? "").toString().trim();
  }

  // =========================================
  // Styles (minimal, self-contained)
  // =========================================
  const style = $("style");
  style.textContent = `
    .aiw-launcher {
      position: fixed;
      z-index: 999999;
      border: none;
      border-radius: 999px;
      padding: 12px 16px;
      font: 14px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,.18);
      background: #111;
      color: #fff;
    }

    .aiw-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999998;
      background: rgba(0,0,0,.25);
      display: none;
    }

    .aiw-panel {
      position: fixed;
      z-index: 999999;
      width: 360px;
      max-width: calc(100vw - 24px);
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 12px 30px rgba(0,0,0,.25);
      overflow: hidden;
      display: none;
      font: 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    }

    .aiw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid #eee;
      background: #fafafa;
      font-weight: 700;
    }

    .aiw-close {
      border: none;
      background: transparent;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 6px 8px;
    }

    .aiw-body {
      padding: 14px;
    }

    .aiw-input {
      width: 100%;
      padding: 10px 10px;
      border: 1px solid #ddd;
      border-radius: 10px;
      outline: none;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .aiw-btn {
      width: 100%;
      padding: 11px 12px;
      border-radius: 10px;
      border: 1px solid #111;
      background: #111;
      color: #fff;
      cursor: pointer;
      font-weight: 600;
    }

    .aiw-btn:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .aiw-status {
      margin-top: 10px;
      font-size: 13px;
      color: #333;
    }

    .aiw-error {
      margin-top: 10px;
      font-size: 13px;
      color: #b00020;
    }

    .aiw-list {
      margin: 10px 0 0;
      padding-left: 18px;
    }

    .aiw-footer {
      padding: 10px 14px 14px;
      border-top: 1px solid #eee;
      background: #fff;
      font-size: 12px;
      opacity: .7;
    }

    .aiw-footer a { color: inherit; }
  `;
  document.head.appendChild(style);

  // =========================================
  // Build UI (Launcher, Backdrop, Panel)
  // =========================================
  const launcher = $("button");
  launcher.className = "aiw-launcher";
  launcher.textContent = LAUNCHER_LABEL;
  applyPosition(launcher, POSITION);

  const backdrop = $("div");
  backdrop.className = "aiw-backdrop";

  const panel = $("div");
  panel.className = "aiw-panel";
  // Panel sits above launcher, same corner
  applyPosition(panel, POSITION);
  // Nudge panel up a bit when bottom positioned
  if (POSITION.startsWith("bottom")) panel.style.bottom = "70px";
  if (POSITION.startsWith("top")) panel.style.top = "70px";

  const header = $("div");
  header.className = "aiw-header";

  const title = $("div");
  title.textContent = BRAND;

  const closeBtn = $("button");
  closeBtn.className = "aiw-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = $("div");
  body.className = "aiw-body";

  const companyName = $("input");
  companyName.className = "aiw-input";
  companyName.placeholder = "Company name (optional)";
  companyName.value = scriptTag?.dataset.companyName || "";

  const industry = $("input");
  industry.className = "aiw-input";
  industry.placeholder = "Industry (e.g. digital marketing)";

  const companySize = $("input");
  companySize.className = "aiw-input";
  companySize.placeholder = "Company size (e.g. small, medium, enterprise)";

  const goal = $("input");
  goal.className = "aiw-input";
  goal.placeholder = "Goal (e.g. lead generation)";

  const btn = $("button");
  btn.className = "aiw-btn";
  btn.textContent = "Get recommendations";

  const status = $("div");
  status.className = "aiw-status";

  const errorBox = $("div");
  errorBox.className = "aiw-error";

  const resultsLabel = $("div");
  resultsLabel.style.marginTop = "10px";
  resultsLabel.style.fontWeight = "700";
  resultsLabel.textContent = "Recommended services:";
  resultsLabel.style.display = "none";

  const list = $("ul");
  list.className = "aiw-list";
  list.style.display = "none";

  body.appendChild(companyName);
  body.appendChild(industry);
  body.appendChild(companySize);
  body.appendChild(goal);
  body.appendChild(btn);
  body.appendChild(status);
  body.appendChild(errorBox);
  body.appendChild(resultsLabel);
  body.appendChild(list);

  const footer = $("div");
  footer.className = "aiw-footer";
  footer.innerHTML = `Powered by <a href="https://YOURDOMAIN.com" target="_blank" rel="noreferrer">Tamed Media</a> • client: <strong>${API_KEY}</strong>`;

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  // =========================================
  // Open/Close (THIS is the part you fixed before)
  // =========================================
  function open() {
    backdrop.style.display = "block";
    panel.style.display = "block";
  }

  function close() {
    backdrop.style.display = "none";
    panel.style.display = "none";
  }

  launcher.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  // Clicking the backdrop closes the modal
  // (This is the line you asked about earlier—YES this is correct.)
  backdrop.addEventListener("click", close);

  // =========================================
  // API call
  // =========================================
  async function getRecommendations() {
    errorBox.textContent = "";
    status.textContent = "";
    list.innerHTML = "";
    list.style.display = "none";
    resultsLabel.style.display = "none";

    const payload = {
      company_name: safeText(companyName.value),
      industry: safeText(industry.value),
      company_size: safeText(companySize.value),
      goal: safeText(goal.value),
    };

    // Light validation
    if (!payload.industry || !payload.company_size || !payload.goal) {
      errorBox.textContent = "Please fill in Industry, Company size, and Goal.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Loading…";
    status.textContent = "Thinking…";

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
        // Show useful error text
        const text = await res.text().catch(() => "");
        throw new Error(`API error (${res.status}). ${text || ""}`.trim());
      }

      const data = await res.json();

      const items = data.recommended_services || [];
      status.textContent = items.length ? "" : "No recommendations returned.";

      if (items.length) {
        resultsLabel.style.display = "block";
        list.style.display = "block";
        items.forEach((x) => {
          const li = $("li");
          li.textContent = x;
          list.appendChild(li);
        });
      }
    } catch (err) {
      errorBox.textContent =
        "Error: " +
        (err?.message || "Failed to fetch. Check API_BASE, CORS, and API key.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Get recommendations";
      if (status.textContent === "Thinking…") status.textContent = "";
    }
  }

  btn.addEventListener("click", getRecommendations);
})();
