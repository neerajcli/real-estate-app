const form = document.querySelector("#signupForm");
const statusEl = document.querySelector("#signupStatus");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Creating account...";
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        phone: document.querySelector("#phone").value,
        password: document.querySelector("#password").value,
        role: document.querySelector("#role").value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    statusEl.textContent = "Account created! Please login.";
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.classList.add("error");
  }
});
