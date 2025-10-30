const el = (q, ctx = document) => ctx.querySelector(q);
const els = (q, ctx = document) => [...ctx.querySelectorAll(q)];

const propertiesEl = el("#properties");
const cityEl = el("#city");
const bedroomsEl = el("#bedrooms");
const minPriceEl = el("#minPrice");
const maxPriceEl = el("#maxPrice");
const applyFiltersBtn = el("#applyFilters");

const modal = el("#modal");
const closeModalBtn = el("#closeModal");
const appointmentForm = el("#appointmentForm");
const formStatus = el("#formStatus");
const propertyIdField = el("#propertyId");
const modalTitle = el("#modalTitle");

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

async function fetchProperties(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch("/api/properties" + (qs ? `?${qs}` : ""));
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

function propertyCard(p) {
  const img = p.images && p.images[0] ? p.images[0] : "";
  return `
    <div class="card">
      <div class="cover">${
        img
          ? `<img src="${img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;">`
          : "🏡"
      }</div>
      <div class="card-content">
        <div class="row" style="justify-content: space-between;">
          <h3 style="margin: 0;">${p.title}</h3>
          <span class="price">${formatINR(p.price)}</span>
        </div>
        <p class="muted">${p.address}, ${p.city}, ${p.state}</p>
        <div class="row">
          <span class="pill">${p.bedrooms} BR</span>
          <span class="pill">${p.bathrooms} Bath</span>
          <span class="pill">${p.areaSqFt} sq.ft</span>
        </div>
        <div class="muted">Owner: ${p.owner?.name} • ${p.owner?.phone}</div>
        <div class="actions">
          <button class="ghost" data-id="${p._id}" data-view>View</button>
          <button class="primary" data-id="${
            p._id
          }" data-schedule>Schedule Visit</button>
        </div>
      </div>
    </div>
  `;
}

function renderProperties(list = []) {
  if (!list.length) {
    propertiesEl.innerHTML =
      '<p class="muted">No properties match your filters.</p>';
    return;
  }
  propertiesEl.innerHTML = list.map(propertyCard).join("");
  els("[data-schedule]").forEach((btn) =>
    btn.addEventListener("click", onScheduleClick)
  );
  els("[data-view]").forEach((btn) =>
    btn.addEventListener("click", onViewClick)
  );
}

function openModal() {
  modal.classList.remove("hidden");
}
function closeModal() {
  modal.classList.add("hidden");
  formStatus.textContent = "";
  formStatus.classList.remove("error");
  appointmentForm.reset();
}

async function onScheduleClick(e) {
  const id = e.currentTarget.getAttribute("data-id");
  const res = await fetch("/api/properties/" + id);
  const p = await res.json();
  propertyIdField.value = p._id;
  modalTitle.textContent = `Schedule: ${p.title}`;
  openModal();
}

async function onViewClick(e) {
  const id = e.currentTarget.getAttribute("data-id");
  const res = await fetch("/api/properties/" + id);
  const p = await res.json();
  alert(
    `${p.title}\n${p.description}\n\nOwner: ${p.owner.name} (${p.owner.phone})`
  );
}

appointmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "Submitting…";
  formStatus.classList.remove("error");

  const payload = {
    propertyId: el("#propertyId").value,
    name: el("#name").value.trim(),
    email: el("#email").value.trim(),
    phone: el("#phone").value.trim(),
    preferredDate: el("#preferredDate").value,
    message: el("#message").value.trim(),
  };

  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create appointment");
    formStatus.textContent =
      "✅ Appointment request sent! The owner will contact you shortly.";
    appointmentForm.reset();
    setTimeout(closeModal, 1400);
  } catch (err) {
    formStatus.textContent = err.message;
    formStatus.classList.add("error");
  }
});

closeModalBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

applyFiltersBtn.addEventListener("click", async () => {
  const params = {};
  if (cityEl.value) params.city = cityEl.value;
  if (bedroomsEl.value) params.bedrooms = bedroomsEl.value;
  if (minPriceEl.value) params.minPrice = minPriceEl.value;
  if (maxPriceEl.value) params.maxPrice = maxPriceEl.value;
  const list = await fetchProperties(params);
  renderProperties(list);
});

(async () => {
  try {
    const list = await fetchProperties();
    renderProperties(list);
  } catch (err) {
    propertiesEl.innerHTML = `<p class="muted">Failed to load properties: ${err.message}</p>`;
  }
})();
