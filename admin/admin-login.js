// API URL dynamique (local ou Render)
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000/api/auth"
    : "https://burgerrestau-backend.onrender.com/api/auth";

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        document.getElementById("msg").textContent = "Email et mot de passe requis";
        return;
    }

    try {
        const res = await fetch(API_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("Server response:", data);

        if (!res.ok) throw new Error(data.message || "Erreur de connexion");

        // Stockage du token
        localStorage.setItem("admin_token", data.token);

        // Redirection
        window.location.href = "admin.html";

    } catch (error) {
        document.getElementById("msg").textContent = error.message;
    }
});
