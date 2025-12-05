// const API_URL = "http://localhost:5000/api/orders";
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api/orders"
  : "https://burgerrestau-backend.onrender.com/api/orders";

const token = localStorage.getItem("admin_token");
if (!token) window.location.href = "admin-login.html";

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token 
    };
}

// Choix backend (local ou production)
// const API_URL = "https://burgerrestau-backend.onrender.com/api/orders";
/*
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api/orders"
  : "https://burgerrestau-backend.onrender.com/api/orders";
*/
// Variables DOM
const ordersList    = document.querySelector("#orders-list");
const searchInput   = document.querySelector("#search");
const filterSelect  = document.querySelector("#filter");
const refreshBtn    = document.querySelector("#refresh");
const statsEl       = document.querySelector("#stats");

const modal         = document.querySelector("#modal");
const modalBody     = document.querySelector("#modal-body");
const closeModalbtn = document.querySelector("#close-modal");

let ordersCache = [];

// --- FETCH COMMANDES ---
async function fetchOrders() {
    try {
        const res = await fetch(API_URL, { headers: authHeaders() });
        ordersCache = await res.json();
        renderOrders(ordersCache);
        fetchStats();
    } catch (err) {
        console.error("Erreur fetch orders", err);
        ordersList.innerHTML = `<div class="small"> Erreur de chargement des commandes </div>`;
    }
}

// --- FETCH STATS ---
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
    } catch (e) {
        statsEl.textContent = "";
    }
}

// --- AFFICHAGE COMMANDES ---
function renderOrders(list) {
    if (!list.length) {
        ordersList.innerHTML = `<div class="small"> Aucune commande </div>`;
        return;
    }
    ordersList.innerHTML = list.map(o => orderCardHTML(o)).join("");
    attachOrderEvents();
}

function orderCardHTML(o) {
    const processed = o.processed 
        ? `<span class="small"> Traité</span>` 
        : `<span>... En attente</span>`;
    const itemsPreview = (o.cart || []).map(i => `${i.name} x${i.quantity}`).join(", ");

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

// --- ACTIONS ---
function attachOrderEvents() {
    document.querySelectorAll(".order-card").forEach(card => {
        const id = card.dataset.id;
        card.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                const action = btn.dataset.action;
                if (action === "view") return openModal(id);
                if (action === "process") return toggleProcessed(id);
                if (action === "delete") return deleteOrder(id);
            });
        });
    });
}

function filterOrders() {
    const q = searchInput.value.trim().toLowerCase();
    const f = filterSelect.value;
    let list = ordersCache.slice();

    if (f === "processed") list = list.filter(o => o.processed);
    if (f === "pending") list = list.filter(o => !o.processed);

    if(q) {
        list = list.filter(o => 
            o.name.toLowerCase().includes(q) ||
            (o.phone || "").toLowerCase().includes(q) || 
            o._id.toLowerCase().includes(q) || 
            (o.cart || []).some(i => i.name.toLowerCase().includes(q))
        )
    }
    renderOrders(list);
}

async function toggleProcessed(id) {
    try {
        const current = ordersCache.find(o => o._id === id);
        const res = await fetch(API_URL + "/" + id, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ processed: !current.processed })
        });

        const updated = await res.json();
        ordersCache = ordersCache.map(o => o._id === id ? updated : o);

        filterOrders();
        renderOrders(ordersCache);
        fetchStats();
    } catch {
        alert("Erreur lors de la mise à jour !");
    }
}

async function deleteOrder(id) {
    if (!confirm("Voulez-vous définitivement supprimer cette commande ?")) return;

    try {
        const res = await fetch(API_URL + "/" + id, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error();
        ordersCache = ordersCache.filter(o => o._id !== id);

        filterOrders()
        renderOrders(ordersCache);
        fetchStats();
    } catch {
        alert("Erreur de suppression !");
    }
}

// --- MODAL ---
async function openModal(id) {
    const o = ordersCache.find(x => x._id === id);
    if (!o) return;

    modalBody.innerHTML = `
        <h3>Commande #${o._id}</h3>
        <p><strong>Client:</strong> ${o.name} — ${o.phone}</p>
        <p><strong>Adresse:</strong> ${o.address}</p>
        <p><strong>Date:</strong> ${new Date(o.createdAt).toLocaleString()}</p>
        <h4>Articles</h4>
        <ul>
            ${(o.cart || []).map(i => `<li>${i.name} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)}€</li>`).join("")}
        </ul>
        <p><strong>Total:</strong> ${(o.total || 0).toFixed(2)}€</p>
    `;

    modal.classList.remove("hidden");
}

closeModalbtn.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
});

// --- EVENTS ---
refreshBtn.addEventListener("click", fetchOrders);
filterSelect.addEventListener("change", filterOrders);

let debounceTimer = null;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterOrders, 400);
});

// --- INITIAL LOAD ---
fetchOrders();
