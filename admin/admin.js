// API URL dynamique (local ou Render) 
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000/api/auth"
    : "https://burgerrestau-backend.onrender.com/api/auth";

// Token présent ?
const token = localStorage.getItem("admin_token");
if (!token) window.location.href = "admin-login.html";

// Headers d’authentification
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token 
    };
}

// DOM 
const ordersList    = document.querySelector("#orders-list");
const searchInput   = document.querySelector("#search");
const filterSelect  = document.querySelector("#filter");
const refreshBtn    = document.querySelector("#refresh");
const statsEl       = document.querySelector("#stats");

const modal         = document.querySelector("#modal");
const modalBody     = document.querySelector("#modal-body");
const closeModalbtn = document.querySelector("#close-modal");

let ordersCache = [];

// Fetch commandes
async function fetchOrders() {
    try {
        const res = await fetch(API_URL, { headers: authHeaders() });

        if (!res.ok) {
            ordersList.innerHTML = `<div class="small">Erreur de chargement</div>`;
            return;
        }

        ordersCache = await res.json();
        renderOrders(ordersCache);
        fetchStats();
    } catch (err) {
        console.error("Erreur fetchOrders:", err);
        ordersList.innerHTML = `<div class="small">Erreur serveur</div>`;
    }
}

// Fetch stats
async function fetchStats() {
    try {
        const res = await fetch(API_URL + "/stats/summary", { headers: authHeaders() });
        if (!res.ok) return;

        const s = await res.json();
        statsEl.innerHTML = `
            <p> Commandes: <strong>${s.totalOrders}</strong> </p>
            <p> CA: <strong>${s.totalRevenue.toFixed(2)}€</strong> </p>
            <p> Traitées: <strong>${s.processed}</strong> </p>
        `;
    } catch {
        statsEl.textContent = "";
    }
}

// Affichage de la liste des commandes 
function renderOrders(list) {
    if (!list.length) {
        ordersList.innerHTML = `<div class="small">Aucune commande</div>`;
        return;
    }

    ordersList.innerHTML = list.map(o => orderCardHTML(o)).join("");
    attachOrderEvents();
}

function orderCardHTML(o) {
    const processed = o.processed 
        ? `<span class="small">Traité</span>` 
        : `<span class="small">En attente</span>`;

    const itemsPreview =
        (o.cart || [])
        .map(i => `${i.name} x${i.quantity}`)
        .join(", ");

    return `
    <div class="order-card" data-id="${o._id}">
        <div class="order-left">
            <div class="order-meta">
                <div><strong>#${o._id}</strong> — ${o.name} ${processed}</div>
                <div class="small">${o.phone} • ${new Date(o.createdAt).toLocaleString()}</div>
                <div class="small">Total: <strong>${(o.total || 0).toFixed(2)}€</strong></div>
                <div class="order-items small">${itemsPreview}</div>
            </div>
        </div>
        <div class="order-actions">
            <button class="btn-view" data-action="view">Voir</button>
            <button class="btn-process" data-action="process">
                ${o.processed ? "Marquer non traité" : "Marquer traité"}
            </button>
            <button class="btn-delete" data-action="delete">Supprimer</button>
        </div>
    </div>`;
}

// Actions à faire (voir, traîtement et supprimer)
function attachOrderEvents() {
    document.querySelectorAll(".order-card button").forEach(btn => {
        const id = btn.closest(".order-card").dataset.id;
        const action = btn.dataset.action;

        if (action === "view") btn.onclick = () => openModal(id);
        if (action === "process") btn.onclick = () => toggleProcessed(id);
        if (action === "delete") btn.onclick = () => deleteOrder(id);
    });
}

async function toggleProcessed(id) {
    try {
        const current = ordersCache.find(o => o._id === id);

        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ processed: !current.processed })
        });

        const updated = await res.json();
        ordersCache = ordersCache.map(o => o._id === id ? updated : o);

        renderOrders(ordersCache);
        fetchStats();
    } catch {
        alert("Erreur mise à jour !");
    }
}

async function deleteOrder(id) {
    if (!confirm("Supprimer la commande ?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error();

        ordersCache = ordersCache.filter(o => o._id !== id);
        renderOrders(ordersCache);
        fetchStats();
    } catch {
        alert("Erreur suppression !");
    }
}

// Modal
function openModal(id) {
    const o = ordersCache.find(x => x._id === id);
    if (!o) return;

    modalBody.innerHTML = `
        <h3>Commande #${o._id}</h3>
        <p><strong>Client:</strong> ${o.name} — ${o.phone}</p>
        <p><strong>Adresse:</strong> ${o.address}</p>
        <p><strong>Date:</strong> ${new Date(o.createdAt).toLocaleString()}</p>

        <h4>Articles</h4>
        <ul>
            ${(o.cart || [])
                .map(i => `<li>${i.name} x${i.quantity} — ${(i.price*i.quantity).toFixed(2)}€</li>`)
                .join("")}
        </ul>

        <p><strong>Total:</strong> ${(o.total || 0).toFixed(2)}€</p>
    `;

    modal.classList.remove("hidden");
}

closeModalbtn.onclick = () => modal.classList.add("hidden");
modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };

// Evenement recherche
refreshBtn.onclick = fetchOrders;
filterSelect.onchange = () => renderOrders(ordersCache);

searchInput.oninput = () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => filterOrders(), 300);
};

// Lancement
fetchOrders();
