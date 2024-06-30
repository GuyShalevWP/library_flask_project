// js/navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = sessionStorage.getItem('user')
        ? JSON.parse(sessionStorage.getItem('user'))
        : null;
    const role = user ? user.role : null;

    const authLinks = document.getElementById('authLinks');
    const customersLink = document.getElementById('customersLink');
    const borrowedBooksLink = document.getElementById('borrowedBooksLink');

    // Check if the user is authenticated and update the navbar
    const updateNavbar = () => {
        if (token) {
            const currentPath = window.location.pathname;
            let profileHref = 'pages/profile/profile.html';
            if (currentPath.includes('/pages/')) {
                profileHref = '../profile/profile.html';
            }

            authLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="${profileHref}" id="profile">Profile</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout">Logout</a>
            </li>
        
    `;

            document.getElementById('logout').addEventListener('click', () => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('user');
                // Redirect to home page
                if (currentPath.endsWith('index.html') || currentPath === '/') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = '../../index.html';
                }
            });

            if (
                (role === 'admin' && customersLink) ||
                (role === 'admin' && borrowedBooksLink)
            ) {
                customersLink.style.display = 'block';
                borrowedBooksLink.style.display = 'block';
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
