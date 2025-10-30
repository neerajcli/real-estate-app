const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
if (!token || user.role !== "buyer") {
  location.href = "/login.html";
}

document.querySelector("#buyerName").textContent = user.name || "Buyer";

document.querySelector("#logout").onclick = () => {
  localStorage.clear();
  location.href = "/login.html";
};

async function authedFetch(url, options = {}) {
  options.headers = {
    ...options.headers,
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.clear();
    location.href = "/login.html";
  }
  return res;
}

function apptCard(a) {
  const canCancel = a.status !== "cancelled";

  return `
    <div class="card">
      <div class="card-content">
        <div class="row" style="justify-content: space-between;">
          <strong>${a.property?.title}</strong>
          <span class="pilla">${a.status}</span>
        </div>
        <div>${new Date(a.preferredDate).toLocaleString()}</div>
        <div class="muted">${a.property?.address}, ${a.property?.city}</div>
        <div class="actions">
          ${
            canCancel
              ? `<button class="primary" data-cancel="${a._id}">Cancel</button>`
              : ""
          }
        </div>
      </div>
    </div>`;
}

async function load() {
  const res = await authedFetch("/api/buyer/appointments");
  const appts = await res.json();
  document.querySelector("#appts").innerHTML = appts.map(apptCard).join("");

  document.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-cancel");
      const res = await authedFetch("/api/appointments/" + id + "/cancel", {
        method: "PATCH",
      });
      if (res.ok) {
        load();
      }
    };
  });
}

load();
