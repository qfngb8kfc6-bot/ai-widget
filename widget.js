(() => {
  // =========================
  // CONFIG
  // =========================
  const API_BASE = "https://ai-widget-backend.onrender.com"; // your backend
  const API_KEY = "demo-key-123"; // <-- replace per customer

  // Keep placeholders the same (edit these if you want)
  const PLACEHOLDERS = {
    website_url: "website url",
    company_name: "Company name",
    job_title: "Job title",
    industry: "Industry",
    goal: "Goal",
  };

  // =========================
  // HELPERS
  // =========================
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "style") node.style.cssText = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  };

  const getOrigin = () => window.location.origin;

  // =========================
  // STYLES
  // =========================
  const style = el("style", {}, [
    `
    :root {
      --aw-font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      --aw-bg: rgba(255,255,255,0.18);
      --aw-bg-strong: rgba(255,255,255,0.26);
      --aw-border: rgba(255,255,255,0.25);
      --aw-text: rgba(255,255,255,0.95);
      --aw-muted: rgba(255,255,255,0.75);
      --aw-input-bg: rgba(255,255,255,0.92);
      --aw-input-text: rgba(15,15,20,0.92);
      --aw-shadow: 0 12px 40px rgba(0,0,0,0.25);
      --aw-radius: 999px;
    }

    /* Floating pill container (top-ish) */
    .aw-wrap {
      position: fixed;
      left: 50%;
      top: 22px;
      transform: translateX(-50%);
      z-index: 999999;
      font-family: var(--aw-font);
    }

    /* Toggle button (if closed) */
    .aw-toggle {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 999999;
      font-family: var(--aw-font);
      border: none;
      border-radius: 999px;
      padding: 12px 16px;
      cursor: pointer;
      box-shadow: var(--aw-shadow);
      background: rgba(0,0,0,0.78);
      color: white;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    /* The pill bar */
    .aw-pill {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: var(--aw-radius);
      background: var(--aw-bg);
      border: 1px solid var(--aw-border);
      box-shadow: var(--aw-shadow);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      min-width: min(980px, calc(100vw - 40px));
      max-width: min(1100px, calc(100vw - 40px));
    }

    .aw-label {
      color: var(--aw-text);
      font-size: 26px;
      font-weight: 700;
      white-space: nowrap;
    }

    .aw-smalllabel {
      color: var(--aw-text);
      font-size: 22px;
      font-weight: 700;
      white-space: nowrap;
    }

    .aw-input {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--aw-radius);
      background: var(--aw-input-bg);
      border: 1px solid rgba(255,255,255,0.65);
      min-width: 210px;
    }

    .aw-input input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      font-size: 16px;
      color: var(--aw-input-text);
    }

    .aw-icon {
      width: 18px;
      height: 18px;
      opacity: 0.75;
      flex: 0 0 auto;
    }

    .aw-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.25);
      margin: 0 2px;
    }

    .aw-cta {
      margin-left: auto;
      border: none;
      cursor: pointer;
      border-radius: var(--aw-radius);
      padding: 12px 18px;
      font-weight: 800;
      color: white;
      background: rgba(21, 29, 88, 0.95);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      white-space: nowrap;
      font-size: 16px;
    }

    .aw-cta:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .aw-close {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.18);
      color: white;
      cursor: pointer;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
    }

    .aw-status {
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(0,0,0,0.55);
      color: white;
      font-size: 14px;
      max-width: min(980px, calc(100vw - 40px));
    }

    .aw-error {
      color: #ffd2d2;
    }

    .aw-results {
      margin-top: 8px;
      padding-left: 18px;
      line-height: 1.4;
    }

    /* Responsive: stack inputs on small widths */
    @media (max-width: 980px) {
      .aw-pill {
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px;
        border-radius: 26px;
      }
      .aw-label {
        font-size: 22px;
      }
      .aw-smalllabel {
        font-size: 18px;
      }
      .aw-input { min-width: min(320px, calc(100vw - 60px)); }
      .aw-divider { display: none; }
      .aw-cta { width: 100%; justify-content: center; }
    }
  `,
  ]);
  document.head.appendChild(style);

  // =========================
  // UI BUILD
  // =========================
  const wrap = el("div", { class: "aw-wrap", "data-aw": "wrap" });
  const pill = el("div", { class: "aw-pill", "data-aw": "pill" });

  const closeBtn = el("button", { class: "aw-close", title: "Close", onclick: () => close() }, ["×"]);

  // Icons (simple inline SVGs)
  const iconBriefcase = () =>
    el("svg", { class: "aw-icon", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, [
      el("path", {
        d: "M9 7V6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
      }),
      el("path", {
        d: "M4 8h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linejoin": "round",
      }),
    ]);

  const iconGlobe = () =>
    el("svg", { class: "aw-icon", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, [
      el("path", {
        d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
        stroke: "currentColor",
        "stroke-width": "2",
      }),
      el("path", {
        d: "M3 12h18",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
      }),
      el("path", {
        d: "M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9Z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linejoin": "round",
      }),
    ]);

  const inputBlock = ({ id, placeholder, iconFn }) => {
    const input = el("input", { id, placeholder, autocomplete: "off" });
    const box = el("div", { class: "aw-input" }, [iconFn(), input]);
    return { box, input };
  };

  // Build pill: "I work at" [company] "as a" [job] -> CTA
  const label1 = el("div", { class: "aw-label" }, ["I work at"]);
  const label2 = el("div", { class: "aw-smalllabel" }, ["as a"]);

  // Inputs (keeping your placeholder wording)
  const website = inputBlock({ id: "aw_website_url", placeholder: PLACEHOLDERS.website_url, iconFn: iconGlobe });
  const company = inputBlock({ id: "aw_company_name", placeholder: PLACEHOLDERS.company_name, iconFn: iconBriefcase });
  const job = inputBlock({ id: "aw_job_title", placeholder: PLACEHOLDERS.job_title, iconFn: iconBriefcase });

  // Extra inputs (Industry, Goal) – still same placeholders you asked for
  const industry = inputBlock({ id: "aw_industry", placeholder: PLACEHOLDERS.industry, iconFn: iconBriefcase });
  const goal = inputBlock({ id: "aw_goal", placeholder: PLACEHOLDERS.goal, iconFn: iconBriefcase });

  const cta = el(
    "button",
    {
      class: "aw-cta",
      onclick: async () => {
        await submit();
      },
    },
    ["✨ Get recommendations"]
  );

  pill.appendChild(label1);
  pill.appendChild(company.box);
  pill.appendChild(label2);
  pill.appendChild(job.box);
  pill.appendChild(el("div", { class: "aw-divider" }));
  pill.appendChild(website.box);
  pill.appendChild(industry.box);
  pill.appendChild(goal.box);
  pill.appendChild(cta);
  pill.appendChild(closeBtn);

  const status = el("div", { class: "aw-status", style: "display:none;" });
  wrap.appendChild(pill);
  wrap.appendChild(status);

  // Toggle button (when closed)
  const toggle = el("button", { class: "aw-toggle", onclick: () => open() }, ["AI Recommender"]);

  // Mount
  document.body.appendChild(wrap);
  document.body.appendChild(toggle);

  // Default state: closed
  close();

  function open() {
    wrap.style.display = "block";
    toggle.style.display = "none";
  }

  function close() {
    wrap.style.display = "none";
    toggle.style.display = "inline-flex";
    hideStatus();
  }

  function showStatus(html, isError = false) {
    status.style.display = "block";
    status.innerHTML = html;
    status.classList.toggle("aw-error", isError);
  }

  function hideStatus() {
    status.style.display = "none";
    status.innerHTML = "";
    status.classList.remove("aw-error");
  }

  async function submit() {
    hideStatus();

    const payload = {
      website_url: website.input.value.trim(),
      company_name: company.input.value.trim(),
      job_title: job.input.value.trim(),
      industry: industry.input.value.trim(),
      goal: goal.input.value.trim(),
      origin: getOrigin(),
    };

    // Basic required fields (edit if you want)
    if (!payload.company_name || !payload.job_title || !payload.industry || !payload.goal) {
      showStatus("Please fill in: Company name, Job title, Industry, and Goal.", true);
      return;
    }

    cta.disabled = true;
    cta.textContent = "Loading…";

    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error (${res.status}): ${text || "Request failed"}`);
      }

      const data = await res.json();

      const items = Array.isArray(data.recommended_services) ? data.recommended_services : [];
      if (!items.length) {
        showStatus("No recommendations returned.", true);
      } else {
        showStatus(
          `
          <div><strong>Recommended services:</strong></div>
          <ul class="aw-results">
            ${items.map((x) => `<li>${escapeHtml(String(x))}</li>`).join("")}
          </ul>
          `,
          false
        );
      }
    } catch (err) {
      showStatus(`Error: ${escapeHtml(err.message || "Failed to fetch")}`, true);
    } finally {
      cta.disabled = false;
      cta.textContent = "✨ Get recommendations";
    }
  }

  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
