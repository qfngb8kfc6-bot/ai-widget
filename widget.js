(function () {
  const API_BASE = "https://ai-widget-backend.onrender.com";
  const API_KEY = "demo-key-123"; // 🔁 replace later with real key

  /* ------------------------------
     Floating Button
  ------------------------------ */
  const button = document.createElement("button");
  button.innerText = "AI Recommender";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    zIndex: "9999"
  });
  document.body.appendChild(button);

  /* ------------------------------
     Backdrop
  ------------------------------ */
  const backdrop = document.createElement("div");
  Object.assign(backdrop.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: "9998",
    display: "none"
  });
  document.body.appendChild(backdrop);

  /* ------------------------------
     Widget Container
  ------------------------------ */
  const widget = document.createElement("div");
  Object.assign(widget.style, {
    position: "fixed",
    bottom: "90px",
    right: "20px",
    width: "320px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    padding: "18px",
    zIndex: "9999",
    display: "none",
    fontFamily: "system-ui, sans-serif"
  });

  /* ------------------------------
     Header
  ------------------------------ */
  const header = document.createElement("div");
  header.innerText = "AI Service Recommender";
  header.style.fontWeight = "600";
  header.style.marginBottom = "12px";

  const closeBtn = document.createElement("span");
  closeBtn.innerText = "×";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "10px",
    right: "14px",
    cursor: "pointer",
    fontSize: "18px"
  });

  widget.appendChild(header);
  widget.appendChild(closeBtn);

  /* ------------------------------
     Inputs
  ------------------------------ */
  function createInput(placeholder) {
    const input = document.createElement("input");
    input.placeholder = placeholder;
    input.required = true;
    Object.assign(input.style, {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fff",
      fontSize: "14px"
    });
    return input;
  }

  const websiteInput = createInput("Website URL");
  const companyInput = createInput("Company name");
  const jobInput = createInput("Job title");
  const industryInput = createInput("Industry");
  const goalInput = createInput("Goal (e.g. Lead generation)");

  widget.appendChild(websiteInput);
  widget.appendChild(companyInput);
  widget.appendChild(jobInput);
  widget.appendChild(industryInput);
  widget.appendChild(goalInput);

  /* ------------------------------
     Button
  ------------------------------ */
  const submitBtn = document.createElement("button");
  submitBtn.innerText = "Get recommendations";
  Object.assign(submitBtn.style, {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px"
  });

  widget.appendChild(submitBtn);

  /* ------------------------------
     Result Area
  ------------------------------ */
  const result = document.createElement("div");
  result.style.marginTop = "12px";
  result.style.fontSize = "14px";
  widget.appendChild(result);

  document.body.appendChild(widget);

  /* ------------------------------
     Open / Close Logic
  ------------------------------ */
  function openWidget() {
    widget.style.display = "block";
    backdrop.style.display = "block";
  }

  function closeWidget() {
    widget.style.display = "none";
    backdrop.style.display = "none";
  }

  button.addEventListener("click", openWidget);
  closeBtn.addEventListener("click", closeWidget);
  backdrop.addEventListener("click", closeWidget);

  /* ------------------------------
     API Call
  ------------------------------ */
  submitBtn.addEventListener("click", async () => {
    result.innerHTML = "Loading…";

    const payload = {
      website_url: websiteInput.value,
      company_name: companyInput.value,
      job_title: jobInput.value,
      industry: industryInput.value,
      goal: goalInput.value
    };

    try {
      const response = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();

      result.innerHTML =
        "<strong>Recommended services:</strong><ul>" +
        data.recommended_services.map(s => `<li>${s}</li>`).join("") +
        "</ul>";

    } catch (err) {
      result.innerHTML = "Something went wrong. Please try again.";
    }
  });
})();
