// URL du backend : à modifier selon ton localhost ou ton déploiement
const API_URL = "https://burgerrestau-backend.onrender.com/api/products";

// Sélection des sections par ID
const sections = {
    menu: document.getElementById("menu"),
    burgers: document.getElementById("burgers"),
    boissons: document.getElementById("boissons"),
    salades: document.getElementById("salades"),
    desserts: document.getElementById("desserts")
};

// Fonction pour créer une carte HTML
function createCard(product) {
    return `
        <div class="menu-item">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">${product.price}€</span>
        </div>
    `;
}

// Charge une catégorie du backend
async function loadCategory(category) {
    try {
        const res = await fetch(`${API_URL}/category/${category}`);
        const data = await res.json();

        // Trouver la bonne section
        const section = sections[category];

        // Injecter HTML
        section.querySelector(".menu-grid").innerHTML = data
            .map(item => createCard(item))
            .join("");

    } catch (err) {
        console.error("Erreur chargement :", err);
    }
}

// Onglets
const tabs = document.querySelectorAll(".tab-btn");

// Click event
tabs.forEach(btn => {
    btn.addEventListener("click", () => {

        // Enlever active
        tabs.forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".menu").forEach(sec => sec.classList.remove("active"));

        // Ajouter active
        btn.classList.add("active");
        const target = btn.dataset.target;
        const section = document.getElementById(target);
        section.classList.add("active");

        // Charger les données de l’API
        loadCategory(target);
    });
});

// Quand la page s’ouvre → charger "menu"
loadCategory("menu");

