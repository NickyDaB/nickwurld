

function darkmodeInit(){
    const toggle = document.getElementById("theme_toggle");

    if (toggle) {
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
        });
    }
}