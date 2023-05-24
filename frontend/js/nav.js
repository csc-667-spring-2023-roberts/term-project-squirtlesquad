function loadNavbar(name) {
  fetch("navbar.html")
    .then((response) => response.text())
    .then((data) => {
      const navContainer = document.getElementById(name);
      navContainer.innerHTML = data;
    });
}
