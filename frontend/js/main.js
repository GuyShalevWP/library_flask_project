// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = localStorage.getItem('token');
    const authLinks = document.getElementById('authLinks');

    if (authLinks && isAuthenticated) {
        authLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout">Logout</a>
            </li>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Highlight current page in navbar
    const navItems = document.querySelectorAll('.nav-item a.nav-link');
    navItems.forEach((item) => {
        if (item.href === window.location.href) {
            item.classList.add('active');
            item.innerHTML += ' <span class="sr-only">(current)</span>';
        }
    });
});
