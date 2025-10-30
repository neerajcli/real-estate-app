const form = document.querySelector("#loginForm");
const statusEl = document.querySelector("#loginStatus");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Signing in...";
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.querySelector("#email").value,
        password: document.querySelector("#password").value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.user.role === "owner") location.href = "/owner.html";
    else location.href = "/buyer.html";
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.classList.add("error");
  }
});
