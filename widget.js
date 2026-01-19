(() => {
  // ====== CONFIG ======
  const DEFAULT_API_BASE = "https://ai-widget-backend.onrender.com";
  const DEFAULT_TITLE = "AI Service Recommender";

  // ====== HELPERS ======
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style") Object.assign(node.style, v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "class") node.className = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  const injectStylesOnce = (() => {
    let done = false;
    return () => {
      if (done) return;
      done = true;

      const css = `
        .aiw-launch {
          position: fixed; right: 18px; bottom: 18px; z-index: 999999;
          border: none; border-radius: 999px; padding: 12px 14px;
          background: #111; color: #fff; font: 14px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;
          box-shadow: 0 10px 25px rgba(0,0,0,.18);
          cursor: pointer;
        }
        .aiw-launch:hover { transform: translateY(-1px); }
        .aiw-backdrop {
          position: fixed; inset: 0; z-index: 999998;
          background: rgba(0,0,0,.35);
          display: none;
        }
        .aiw-panel {
          position: fixed; right: 18px; bottom: 70px; z-index: 999999;
          width: 360px; max-width: calc(100vw - 36px);
          background: #fff; border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,.22);
          overflow: hidden;
          display: none;
          font: 14px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;
          color: #111;
        }
        .aiw-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-bottom: 1px solid #eee;
          background: #fff;
        }
        .aiw-title { font-weight: 700; }
        .aiw-close {
          border: none; background: transparent; cursor: pointer;
          font-size: 18px; line-height: 1; padding: 6px 8px; border-radius: 8px;
        }
        .aiw-close:hover { background: #f3f3f3; }
        .aiw-body { padding: 12px 14px; }
        .aiw-field { margin-bottom: 10px; }
        .aiw-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 10px; border: 1px solid #ddd; border-radius: 10px;
          outline: none;
        }
        .aiw-input:focus { border-color: #999; }
        .aiw-btn {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #111; background: #111; color: #fff;
          border-radius: 10px; cursor: pointer; font-weight: 600;
        }
        .aiw-btn:disabled { opacity: .6; cursor: not-allowed; }
        .aiw-status {
          margin-top: 10px;
          font-size: 13px;
          color: #333;
          min-height: 18px;
        }
        .aiw-error {
          margin-top: 10px;
          padding: 10px;
          background: #fff3f3;
          border: 1px solid #ffd1d1;
          color: #a40000;
          border-radius: 10px;
          display: none;
        }
        .aiw-results { margin-top: 10px; }
        .aiw-results ul { margin: 8px 0 0 18px; }
        .aiw-footer {
          padding: 10px 14px;
          border-top: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
          background: #fff;
          font-size: 12px;
          color: #666;
        }
        .aiw-powered a { color: #111; text-decoration: none; font-weight: 600; }
        .aiw-powered a:hover { text-decoration: underline; }
        .aiw-spinner {
          display: inline-block;
          width: 12px; height: 12px;
          border: 2px solid #ccc;
          border-top-color: #111;
          border-radius: 50%;
          animation: aiw-spin 0.8s linear infinite;
          vertical-align: -2px;
          margin-right: 8px;
        }
        @keyframes aiw-spin { to { transform: rotate(360deg); } }
      `;

      const style = document.createElement("style");
      style.setAttribute("data-aiw", "true");
      style.textContent = css;
      document.head.appendChild(style);
    };
  })();

  // ====== BOOT ======
  const script = document.currentScript;
  const API_BASE = script?.getAttribute("data-api-base") || DEFAULT_API_BASE;
  const CLIENT_ID = script?.getAttribute("data-client-id") || "demo";
  const API_KEY = script?.getAttribute("data-api-key") || ""; // optional
  const BRAND_NAME = script?.getAttribute("data-brand-name") || "Your Company";
  const BRAND_URL = script?.getAttribute("data-brand-url") || "#";
  const TITLE = script?.getAttribute("data-title") || DEFAULT_TITLE;

  injectStylesOnce();

  // Prevent double-mount if the script is included twice
  if (window.__AIW_MOUNTED__) return;
  window.__AIW_MOUNTED__ = true;

  const backdrop = el("div", { class: "aiw-backdrop" });
  const panel = el("div", { class: "aiw-panel" });

  const close = () => {
    panel.style.display = "none";
    backdrop.style.display = "none";
  };
  const open = () => {
    panel.style.display = "block";
    backdrop.style.display = "block";
  };

  backdrop.addEventListener("click", close);

  const companyInput = el("input", { class: "aiw-input", placeholder: "Company name" });
  const industryInput = el("input", { class: "aiw-input", placeholder: "Industry (e.g. publishing)" });
  const sizeInput = el("input", { class: "aiw-input", placeholder: "Company size (small/medium/enterprise)" });
  const goalInput = el("input", { class: "aiw-input", placeholder: "Goal (e.g. lead generation)" });

  const btn = el("button", { class: "aiw-btn" }, "Get recommendations");

  const status = el("div", { class: "aiw-status" });
  const errorBox = el("div", { class: "aiw-error" });
  const results = el("div", { class: "aiw-results" });

  const setLoading = (isLoading) => {
    btn.disabled = isLoading;
    if (isLoading) {
      status.innerHTML = "";
      status.appendChild(el("span", { class: "aiw-spinner" }));
      status.appendChild(document.createTextNode("Getting recommendations…"));
    } else {
      status.textContent = "";
    }
  };

  const showError = (msg) => {
    errorBox.style.display = "block";
    errorBox.textContent = msg;
  };
  const clearError = () => {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  };

  const renderResults = (items) => {
    results.innerHTML = "";
    if (!items || !items.length) return;

    results.appendChild(el("div", { style: { fontWeight: "700", marginTop: "8px" } }, "Recommended services:"));
    const ul = el("ul");
    items.forEach((s) => ul.appendChild(el("li", {}, s)));
    results.appendChild(ul);
  };

  btn.addEventListener("click", async () => {
    clearError();
    results.innerHTML = "";

    const payload = {
      company_name: companyInput.value.trim(),
      industry: industryInput.value.trim(),
      company_size: sizeInput.value.trim(),
      goal: goalInput.value.trim(),
    };

    // Basic validation
    if (!payload.company_name || !payload.industry || !payload.company_size || !payload.goal) {
      showError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API error (${res.status}). ${txt || "Please try again."}`);
      }

      const data = await res.json();
      renderResults(data.recommended_services || []);
    } catch (err) {
      showError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  panel.appendChild(
    el("div", { class: "aiw-header" }, [
      el("div", { class: "aiw-title" }, TITLE),
      el("button", { class: "aiw-close", title: "Close", onClick: close }, "×"),
    ])
  );

  panel.appendChild(
    el("div", { class: "aiw-body" }, [
      el("div", { class: "aiw-field" }, companyInput),
      el("div", { class: "aiw-field" }, industryInput),
      el("div", { class: "aiw-field" }, sizeInput),
      el("div", { class: "aiw-field" }, goalInput),
      btn,
      status,
      errorBox,
      results,
    ])
  );

  panel.appendChild(
    el("div", { class: "aiw-footer" }, [
      el("div", {}, `client: ${CLIENT_ID}`),
      el("div", { class: "aiw-powered" }, [
        "Powered by ",
        el("a", { href: BRAND_URL, target: "_blank", rel: "noopener" }, BRAND_NAME),
      ]),
    ])
  );

  const launch = el("button", { class: "aiw-launch", onClick: open }, "AI Recommender");

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(launch);
})();
