const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
if (!token || user.role !== "owner") {
  location.href = "/login.html";
}

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
  return `
    <div class="card">
      <div class="card-content">
        <div class="row" style="justify-content: space-between;">
          <strong>${a.name}</strong>
          <span class="pilla">${a.status}</span>
        </div>
        <div class="muted">${a.email} • ${a.phone}</div>
        <div>${new Date(a.preferredDate).toLocaleString()}</div>
        <div class="muted">Property: ${a.property?.title}</div>
        <div class="actions">
          ${
            a.status === "pending"
              ? `<button data-status="confirmed" data-id="${a._id}" class="primary">Confirm</button>`
              : ""
          }
          ${
            a.status !== "cancelled"
              ? `<button data-status="cancelled" data-id="${a._id}" class="can">Cancel</button>`
              : ""
          }
        </div>
      </div>
    </div>`;
}

function propCard(p) {
  return `
    <div class="card">
      <div class="cover">${
        p.images?.[0]
          ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;">`
          : "🏡"
      }</div>
      <div class="card-content">
        <div class="row" style="justify-content: space-between;">
          <h3 style="margin:0">${p.title}</h3>
          <span class="pilla">₹${p.price}</span>
        </div>
        <div class="muted">${p.address}, ${p.city}, ${p.state}</div>
      </div>
    </div>`;
}

async function load() {
  const aRes = await authedFetch("/api/owner/appointments");
  const appts = await aRes.json();
  document.querySelector("#appts").innerHTML = appts.map(apptCard).join("");

  document.querySelectorAll("#appts [data-status]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const status = btn.getAttribute("data-status");
      if (status === "cancelled") {
        await authedFetch("/api/appointments/" + id + "/cancel", {
          method: "PATCH",
        });
      } else {
        await authedFetch("/api/owner/appointments/" + id, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      }
      load();
    };
  });

  const pRes = await authedFetch("/api/owner/properties");
  const props = await pRes.json();
  document.querySelector("#props").innerHTML = props.map(propCard).join("");
}

document.querySelector("#addPropForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: document.querySelector("#p_title").value,
    description: document.querySelector("#p_desc").value,
    price: Number(document.querySelector("#p_price").value),
    address: document.querySelector("#p_addr").value,
    city: document.querySelector("#p_city").value,
    state: document.querySelector("#p_state").value,
    bedrooms: Number(document.querySelector("#p_bed").value || 1),
    bathrooms: Number(document.querySelector("#p_bath").value || 1),
    areaSqFt: Number(document.querySelector("#p_area").value || 500),
    images: document.querySelector("#p_img").value
      ? [document.querySelector("#p_img").value]
      : [],
  };
  const res = await authedFetch("/api/properties", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const statusEl = document.querySelector("#propStatus");
  if (res.ok) {
    statusEl.textContent = "Created!";
    e.target.reset();
    load();
  } else {
    const data = await res.json();
    statusEl.textContent = data.error || "Failed";
    statusEl.classList.add("error");
  }
});

load();
