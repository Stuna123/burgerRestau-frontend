// API URL dynamique (local ou Render)
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000/api/orders"
    : "https://burgerrestau-backend.onrender.com/api/orders";

// Récup panier
const cart = JSON.parse(localStorage.getItem("cart")) || [];

const orderItems = document.getElementById("order-items");
const totalPriceEl = document.getElementById("total-price");
const form = document.getElementById("checkout-form");
const toggleBtn = document.getElementById("toggle-mode"); 
const usernname = document.getElementById("name");
const phoneNumber = document.getElementById("phone");
const adress = document.getElementById("address");

// Affichage commande
function displayOrder() {
    if (!orderItems || !totalPriceEl) return;

    if (cart.length === 0) {
        orderItems.innerHTML = "<p>Votre panier est vide.</p>";
        totalPriceEl.textContent = "0.00€";
        return;
    }

    let total = 0;

    orderItems.innerHTML = cart.map(item => {
        total += item.price * item.quantity;

        return `
            <div class="order-line">
                <img src="${item.image}" class="thumb" alt="${item.name}">
                <span class="details">
                    <span><strong>${item.name}</strong> x${item.quantity}</span>
                    <p> <strong>Prix:</strong> ${(item.price * item.quantity).toFixed(2)}€</p>
                    <p class="desc"> <strong>Description:</strong> ${item.description || ""}</p>
                </span>
            </div>
        `;
    }).join("");

    totalPriceEl.textContent = total.toFixed(2) + "€";
}
displayOrder();

// Empêcher l'écriture des lettres
phoneNumber.addEventListener("input", function () {
    // Supprimer les caractères non autorisés (les lettres, par exemple)
    let value = this.value.replace(/[^0-9+ ]/g, "");
    let valueZero = this.value.replace(/[^0-9+ ]/g, "");

    // Empêcher d'écrire "+" plusieurs fois dans le input
    const countPlus = (value.match(/\+/g) || []).length;
    if(countPlus > 1) {
        value = value.replace(/\+/g, (match, offset) => offset === value.indexOf('+') ? '+' : '');
    } 

    // Empêcher "+" d'être ailleurs qu'au debut
    if(value.includes("+") && value.indexOf("+") !== 0) {
        value = "+" + value.replace(/\+/g, "");
    }

    this.value = value;
});

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Votre panier est vide.");
            return;
        }

        // calcul total côté client (on peut aussi laisser le serveur recalculer pour sécurité)
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        const orderData = {
            name: usernname.value.trim(),
            phone: phoneNumber.value.trim(),
            address: adress.value.trim(),
            cart,
            total
        };

        // validation simple
        if (!orderData.name || !orderData.phone || !orderData.address) {
            alert("Veuillez remplir tous les champs du formulaire.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            const oldText = submitBtn.textContent;
            submitBtn.textContent = "Envoi...";
        }

        try {
            // Pour essayer en local : http://localhost:5000/api/orders 
            // Pour essayer avec render : https://burgerrestau-backend.onrender.com/api/orders

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            // essaie de parser la réponse JSON en évitant le plantage si ce n'est pas du JSON
            let data = null;
            try {
                data = await res.json();
            } catch (err) {
                // réponse non-JSON (html ou autre)
                console.error("Réponse non JSON :", err);
            }

            if (res.ok) {
                alert("Votre commande a été enregistrée avec succès !");
                localStorage.removeItem("cart");
                window.location.href = "index.html";
            } else {
                console.error("Erreur serveur :", res.status, data);
                alert("Erreur lors de l'envoi de la commande. Réessayez plus tard.");
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez plus tard.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Passer la commande";
            }
        }
    });
} else {
    console.warn("Formulaire de commande introuvable (id=checkout-form).");
}

// Mode sombre — n'ajoute l'écouteur que si le bouton existe
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        toggleBtn.textContent =
            document.body.classList.contains("dark") ? "☀" : "🌙";
    });
}
