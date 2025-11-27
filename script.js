const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".menu");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        // Retirer "active" partout
        tabs.forEach(btn => btn.classList.remove("active"))
        sections.forEach(sect => sect.classList.remove("active"))

        // Ajouter active à l'onglet cliqué
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.target);
        target.classList.add("active");
    })
})