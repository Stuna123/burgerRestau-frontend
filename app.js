// URL du backend : à modifier selon ton localhost ou ton déploiement
// const API_URL = "https://burgerrestau-backend.onrender.com/api/products";

// const API_URL = "http://localhost:5000/api/products";
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api/orders"
  : "https://burgerrestau-backend.onrender.com/api/orders";

// Sélection des sections par ID
const sections = {
    menu: document.getElementById("menu"),
    burger: document.getElementById("burger"),
    snack: document.getElementById("snack"),
    boisson: document.getElementById("boisson"),
    salade: document.getElementById("salade"),
    dessert: document.getElementById("dessert")
};

const cartCount = document.getElementById("cart-count");

// Fonction pour créer une carte HTML
function createCard(product) {
    //            <button class="add-to-cart-btn"
    //            data-id="${product._id}"
    return `
        <div class="menu-item">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">${product.price}€</span>

            <button class="add-to-cart-btn"
                data-id="${product.id}"
                data-name="${product.name}"
                data-description="${product.description}"
                data-price="${product.price}"
                data-image="${product.image}">
                Ajouter au panier <i class="bi bi-cart"></i>
            </button>
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
        console.error("Erreur chargement : ", err);
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
        console.log(section)
        section.classList.add("active");

        // Charger les données de l’API
        loadCategory(target);
    });
});

// Quand la page s’ouvre → charger "menu"
loadCategory("menu");

function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // const existing = cart.find(item => item._id === product._id);
    const existing = cart.find(item => item.id === product.id)

    if(existing) {
        existing.quantity++;
    } else {
        cart.push({... product, quantity: 1})
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(product.name + " a été ajouté au panier");
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
}
updateCartCount();

document.addEventListener("click", (event) => {
    if(event.target.classList.contains("add-to-cart-btn")) {
        const product = {
            // _id: event.target.dataset.id
            id: parseInt(event.target.dataset.id),
            name: event.target.dataset.name,
            description: event.target.dataset.description,
            price: parseFloat(event.target.dataset.price),
            image: event.target.dataset.image
        }

        addToCart(product);
    }
})

