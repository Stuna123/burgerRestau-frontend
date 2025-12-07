// API URL dynamique (local ou Render) 
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000/api/orders"
    : "https://burgerrestau-backend.onrender.com/api/orders";

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

// Variable DOM 
const ordersList    = document.querySelector("#orders-list");
const searchInput   = document.querySelector("#search");
const filterSelect  = document.querySelector("#filter");
const refreshBtn    = document.querySelector("#refresh");
const statsEl       = document.querySelector("#stats");

const modal         = document.querySelector("#modal");
const modalBody     = document.querySelector("#modal-body");
const closeModalbtn = document.querySelector("#close-modal");

const PER_PAGE = 5;
const themeBtn = document.getElementById("toggle-theme");

let chartInstance = null;
let currentPage = 1;
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

        // Appliquer les filtres actuels
        filterOrders();

        // Stats
        fetchStats();

        // chart
        renderChart();
        
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

        filterOrders()
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
        filterOrders();
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
        <p><strong>Client :</strong> ${o.name} — ${o.phone}</p>
        <p><strong>Adresse :</strong> ${o.address}</p>
        <p><strong>Date :</strong> ${new Date(o.createdAt).toLocaleString()}</p>

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

// Filtre + recherches
function filterOrders() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const f = filterSelect.value; 

    let list = ordersCache.slice();

    // filtre statut
    if(f === "processed") {
        list = list.filter(o => !!o.processed);
    } else if (f === "pending") {
        list = list.filter(o => !o.processed);
    }

    if(q) {
        list = list.filter( o => {
            const name  = (o.name || "").toLowerCase().includes(q);
            const phone = (o.phone || "").toLowerCase().includes(q);
            const id = (o._id || "").toLowerCase().includes(q);
            const inItems = (o.cart || []).some(i => (i.name || "").toLowerCase().includes(q));

            return name || phone || id || inItems;
        })
    }

    currentPage = 1;
    renderOrdersWithPagination(list);
}

// Pagination
function paginate(list, page = 1, perPage = PER_PAGE) {
    const start = (page - 1) * perPage;
    const pageItems = list.slice(start, start + perPage);
    const totalPages = Math.ceil(list.length/perPage) || 1;

    return { pageItems, totalPages };
}

function renderOrdersWithPagination(list) {
    const { pageItems, totalPages } = paginate(list, currentPage, PER_PAGE);

    renderOrders(pageItems);

    const pageEl = document.getElementById("pagination");
    if(!pageEl) 
        return;

    pageEl.innerHTML = "";

    //prev
    const prev = document.createElement("button");
    prev.textContent = "<";
    prev.disabled = currentPage === 1;
    prev.onclick = () => {
        currentPage--;
        renderOrdersWithPagination(list);
    };
    pageEl.appendChild(prev);

    //pages
    for(let p = 1; p <= totalPages; p++) {
        const b = document.createElement("button");
        b.textContent = p;
        b.className = p === currentPage ? "active" : "";
        b.onclick = () => {
            currentPage = p;
            renderOrdersWithPagination(list);
        }
        pageEl.appendChild(b);
    }

    //next
    const next = document.createElement("button");
    next.textContent = ">";
    next.disabled = currentPage === totalPages;
    next.onclick = () => {
        currentPage++;
        renderOrdersWithPagination(list);
    };
    pageEl.appendChild(next);
}

// chart graphique
// chart graphique
async function renderChart() {
    try {
        const res = await fetch(API_URL + "/stats/summary", { headers: authHeaders() });
        const data = await res.json();
        const ctx = document.getElementById("ordersChart");

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Traîtées", "En attente"],
                datasets: [{
                    data: [data.processed, data.totalOrders - data.processed],
                    backgroundColor: ["#2b8a3e", "#ff7a00"],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

    } catch (error) {
        console.error("Erreur chart :", error);
    }
}


// Evenement recherche
refreshBtn.addEventListener("click", () => {
    window.location.reload();
} );
filterSelect.addEventListener("change", filterOrders);

let debounceTimer = null;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filterOrders(), 300)
});

// Lancement
fetchOrders();

// Mode sombre
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "🌞";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    themeBtn.textContent = isDark ? "🌞" : "🌕";

    // Sauvegarde le theme
    localStorage.setItem("theme", isDark ? "dark" : "light");
})
