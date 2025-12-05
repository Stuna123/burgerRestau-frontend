const tabs = document.querySelectorAll(".tab-btn");
const menus_ = document.querySelectorAll(".menu");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        // Retirer "active" partout
        tabs.forEach(btn => btn.classList.remove("active"))
        menus_.forEach(sect => sect.classList.remove("active"))

        // Ajouter active à l'onglet cliqué
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.target);
        target.classList.add("active");
    })
})