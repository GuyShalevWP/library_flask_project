document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = sessionStorage.getItem('user')
        ? JSON.parse(sessionStorage.getItem('user'))
        : null;
    const role = user ? user.role : null;

    const authLinks = document.getElementById('authLinks');
    const customersLink = document.getElementById('customersLink');

    // Check if the user is authenticated and update the navbar
    const updateNavbar = () => {
        if (token) {
            authLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout">Logout</a>
            </li>
        `;

            document.getElementById('logout').addEventListener('click', () => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('user');
                // Redirect to home page
                const currentPath = window.location.pathname;
                if (currentPath.endsWith('index.html') || currentPath === '/') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = '../../index.html';
                }
            });

            if (role === 'admin' && customersLink) {
                customersLink.style.display = 'block';
            }
        }
    };

    // Highlight current page in navbar
    const highlightCurrentPage = () => {
        document.querySelectorAll('.nav-item a.nav-link').forEach((item) => {
            if (item.href === window.location.href) {
                item.classList.add('active');
                item.innerHTML += ' <span class="sr-only">(current)</span>';
            }
        });
    };

    // Initialize page
    const initializePage = () => {
        updateNavbar();
        highlightCurrentPage();
    };

    initializePage();
});
