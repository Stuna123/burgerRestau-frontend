// gestion du panier depuis le localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

const cartItemsEl = document.getElementById("cart-items");
const totalPriceEl = document.getElementById("total-price");

// Affichage du panier
function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
        cartItemsEl.innerHTML = "<p>Votre panier est vide.</p>";
        totalPriceEl.textContent = "0.00€";
        return;
    }

    let total = 0;

    cartItemsEl.innerHTML = cart.map(item => {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;

        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || 'no image'}" alt="${item.name}" class="thumb">

                <div class="info">
                    <h3>${item.name}</h3>
                    <p>${item.description || 'Aucune description disponible.'}</p>
                    <p class="price">${item.price.toFixed(2)}€</p>
                    
                    <div class="qty-controls">
                        <button class="decrease">&#x2212;</button>
                        <span class="qty">${item.quantity}</span>
                        <button class="increase">&#x2b;</button>
                        <!-- <button class="bi bi-plus"></button> -->
                    </div>
                </div>

                <div class="line-total">
                    ${lineTotal.toFixed(2)}€
                    <button class="bi bi-trash3 delete"></button>
                </div>
            </div>
        `;
    }).join("");

    totalPriceEl.textContent = total.toFixed(2) + "€";

    attachEvents();
}

// Attache les actions (supprimer / + / -)
function attachEvents() {
    document.querySelectorAll(".cart-item").forEach(itemRow => {
        const id = parseInt(itemRow.dataset.id);
        let cart = getCart();
        const index = cart.findIndex(p => p.id === id);

        if (index === -1) return;

        const decrease = itemRow.querySelector(".decrease");
        const increase = itemRow.querySelector(".increase");
        const remove = itemRow.querySelector(".delete");

        decrease.addEventListener("click", () => {
            if (cart[index].quantity > 1)
                cart[index].quantity--;
            else
                cart.splice(index, 1);

            saveCart(cart);
            renderCart();
        });

        increase.addEventListener("click", () => {
            cart[index].quantity++;
            saveCart(cart);
            renderCart();
        });

        remove.addEventListener("click", () => {
            cart.splice(index, 1);
            saveCart(cart);
            renderCart();
        });
    });
}

document.addEventListener("DOMContentLoaded", renderCart);

// Mode sombre
const toggleMode = document.getElementById("toggle-mode");
toggleMode.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    toggleMode.textContent =
        document.body.classList.contains("dark") ? "☀" : "🌙 ";
});
