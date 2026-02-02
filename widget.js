(function () {
  const DEFAULTS = {
    apiBase: "https://YOUR-BACKEND.com", // <- change this
    apiKey: "cust_demo_123",             // <- change per customer
    buttonText: "Find my best services",
    position: "bottom-right",            // bottom-right | bottom-left | top-right | top-left
    theme: "dark",                       // dark | light
  };

  const STATE = {
    isOpen: false,
    isLoading: false,
    lastError: "",
    recommendations: [],
    host: {
      url: window.location.href,
      title: document.title || "",
      // optional: take some visible text for extra accuracy (kept small)
      textHint: "",
    },
    config: { ...DEFAULTS },
  };

  function getHostTextHint(maxChars = 1200) {
    // Extract a small amount of visible text from the page
    const bodyText = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
    if (!bodyText) return "";
    return bodyText.slice(0, maxChars);
  }

  function mountConfigFromGlobal() {
    // Allow website to set window.AIWidgetConfig = { ... }
    const c = window.AIWidgetConfig || {};
    STATE.config = { ...STATE.config, ...c };
  }

  function injectStyles() {
    if (document.getElementById("aiw-styles")) return;

    const isDark = STATE.config.theme === "dark";
    const bg = isDark ? "#111" : "#fff";
    const fg = isDark ? "#fff" : "#111";
    const card = isDark ? "#1a1a1a" : "#fafafa";
    const border = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
    const muted = isDark ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.65)";

    const css = `
      .aiw-btn{position:fixed;z-index:999999;border:0;border-radius:999px;padding:12px 14px;font:14px/1.2 system-ui;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.25);background:${bg};color:${fg}}
      .aiw-bottom-right{right:18px;bottom:18px}
      .aiw-bottom-left{left:18px;bottom:18px}
      .aiw-top-right{right:18px;top:18px}
      .aiw-top-left{left:18px;top:18px}

      .aiw-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999998;display:flex;align-items:flex-end;justify-content:flex-end;padding:18px}
      .aiw-modal{width:min(440px, 92vw);background:${bg};color:${fg};border-radius:16px;padding:14px 14px 12px;font:14px system-ui;box-shadow:0 10px 28px rgba(0,0,0,.3);border:1px solid ${border}}
      .aiw-row{display:flex;gap:8px;align-items:center}
      .aiw-title{font-weight:800;margin:0}
      .aiw-muted{color:${muted};margin:8px 0 0}
      .aiw-close{margin-left:auto;background:transparent;border:0;font-size:18px;cursor:pointer;color:${fg}}
      .aiw-input{width:100%;padding:10px 12px;border:1px solid ${border};border-radius:12px;font:14px system-ui;background:transparent;color:${fg};outline:none}
      .aiw-primary{background:${fg};color:${bg};border:0;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700}
      .aiw-error{color:#ff6b6b;margin-top:10px}
      .aiw-loading{margin-top:10px;color:${muted}}
      .aiw-card{border:1px solid ${border};border-radius:14px;padding:10px 10px;margin-top:10px;background:${card}}
      .aiw-card h4{margin:0 0 6px;font-size:14px}
      .aiw-card ul{margin:0;padding-left:18px}
      .aiw-card li{margin:6px 0;color:${muted}}
      .aiw-link{display:inline-block;margin-top:8px;color:${fg};text-decoration:underline}
    `;

    const style = document.createElement("style");
    style.id = "aiw-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "style") Object.assign(e.style, v);
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    children.forEach((c) => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return e;
  }

  async function postJSON(path, body) {
    const res = await fetch(STATE.config.apiBase + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  function renderModal() {
    const input = el("input", {
      class: "aiw-input",
      placeholder: "Enter your website URL (e.g. https://yourbusiness.com)",
      type: "url",
    });

    const closeBtn = el("button", { class: "aiw-close", onclick: () => backdrop.remove() }, ["×"]);

    const header = el("div", { class: "aiw-row" }, [
      el("div", {}, [el("div", { class: "aiw-title" }, ["Service recommendations"])]),
      closeBtn,
    ]);

    const subtitle = el("p", { class: "aiw-muted" }, [
      "We’ll compare this page (host site) with your URL to recommend services that fit you — and explain why.",
    ]);

    const status = el("div", { class: "aiw-loading" }, [""]);
    const results = el("div");

    const goBtn = el("button", {
      class: "aiw-primary",
      onclick: async () => {
        results.innerHTML = "";
        status.textContent = "";
        status.className = "aiw-loading";

        const userUrl = (input.value || "").trim();
        if (!userUrl) {
          status.className = "aiw-error";
          status.textContent = "Please enter a URL.";
          return;
        }

        status.textContent = "Analyzing both pages…";

        try {
          const data = await postJSON("/analyze", {
            apiKey: STATE.config.apiKey,
            hostUrl: STATE.host.url,
            hostTextHint: STATE.host.textHint,
            userUrl,
          });

          status.textContent = "";

          const recs = data.recommendations || [];
          if (!recs.length) {
            results.appendChild(
              el("div", { class: "aiw-card" }, [
                el("h4", {}, ["No strong matches found"]),
                el("div", { class: "aiw-muted" }, [
                  "Try another URL or add more services/keywords in your backend catalog.",
                ]),
              ])
            );
            return;
          }

          recs.forEach((r) => {
            const card = el("div", { class: "aiw-card" }, [
              el("h4", {}, [`${r.name} (Fit: ${r.fitScore}%)`]),
              el("ul", {}, (r.why || []).map((w) => el("li", {}, [w]))),
              r.ctaUrl
                ? el("a", { class: "aiw-link", href: r.ctaUrl, target: "_blank", rel: "noopener" }, ["View service"])
                : el("span"),
            ]);
            results.appendChild(card);
          });
        } catch (e) {
          status.className = "aiw-error";
          status.textContent = e.message || "Something went wrong.";
        }
      },
    }, ["Recommend"]);

    const row = el("div", { class: "aiw-row" }, [input, goBtn]);

    const modal = el("div", { class: "aiw-modal" }, [header, subtitle, row, status, results]);

    const backdrop = el("div", {
      class: "aiw-backdrop",
      onclick: (e) => { if (e.target === backdrop) backdrop.remove(); },
    }, [modal]);

    document.body.appendChild(backdrop);
  }

  function getPositionClass() {
    switch (STATE.config.position) {
      case "bottom-left": return "aiw-bottom-left";
      case "top-right": return "aiw-top-right";
      case "top-left": return "aiw-top-left";
      case "bottom-right":
      default: return "aiw-bottom-right";
    }
  }

  function init() {
    mountConfigFromGlobal();

    // host context
    STATE.host.textHint = getHostTextHint();

    injectStyles();

    const btn = el("button", { class: `aiw-btn ${getPositionClass()}`, onclick: renderModal }, [
      STATE.config.buttonText,
    ]);

    document.body.appendChild(btn);

    console.log("✅ AIWidget loaded", {
      hostUrl: STATE.host.url,
      hostTitle: STATE.host.title,
    });
  }

  init();
})();

