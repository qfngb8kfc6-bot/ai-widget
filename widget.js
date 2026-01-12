(function () {
  const API_BASE = "https://ai-widget-backend.onrender.com"; // your live backend
  const clientId = document.currentScript.dataset.clientId || "demo";

  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.width = "340px";
  box.style.padding = "14px";
  box.style.background = "#fff";
  box.style.border = "1px solid #ddd";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
  box.style.fontFamily = "Arial, sans-serif";
  box.style.zIndex = "999999";

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>AI Service Recommender</strong>
      <button id="aiw_close" style="border:none;background:transparent;font-size:18px;cursor:pointer;">×</button>
    </div>

    <div style="margin-top:10px;display:grid;gap:8px;">
      <input id="aiw_company" placeholder="Company name" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
      <input id="aiw_industry" placeholder="Industry (e.g., Publishing)" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
      <input id="aiw_size" placeholder="Company size (Small/Medium)" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
      <input id="aiw_goal" placeholder="Goal (e.g., Lead generation)" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />

      <button id="aiw_submit" style="padding:10px;border:none;border-radius:8px;cursor:pointer;">
        Get recommendations
      </button>

      <div id="aiw_status" style="font-size:12px;color:#555;"></div>
      <ul id="aiw_results" style="margin:0;padding-left:18px;"></ul>
    </div>

    <div style="margin-top:10px;font-size:11px;color:#777;">
      client: <span>${clientId}</span>
    </div>
  `;

  document.body.appendChild(box);

  document.getElementById("aiw_close").onclick = () => box.remove();

  document.getElementById("aiw_submit").onclick = async () => {
    const company_name = document.getElementById("aiw_company").value.trim();
    const industry = document.getElementById("aiw_industry").value.trim();
    const company_size = document.getElementById("aiw_size").value.trim();
    const goal = document.getElementById("aiw_goal").value.trim();

    const status = document.getElementById("aiw_status");
    const results = document.getElementById("aiw_results");
    results.innerHTML = "";

    if (!industry || !goal) {
      status.textContent = "Please enter at least Industry and Goal.";
      return;
    }

    status.textContent = "Thinking…";

    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name, industry, company_size, goal, client_id: clientId })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API error (${res.status}): ${txt}`);
      }

      const data = await res.json();
      const list = data.recommended_services || [];

      status.textContent = "Recommended services:";
      results.innerHTML = list.map(s => `<li>${s}</li>`).join("");
    } catch (e) {
      status.textContent = `Error: ${e.message}`;
    }
  };
})();
