document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    let user = null;
    let role = null;

    const authLinks = document.getElementById('authLinks');
    const customersLink = document.getElementById('customersLink');
    const borrowedBooksLink = document.getElementById('borrowedBooksLink');

    // Fetch current user details and store role on refresh
    const fetchCurrentUser = async () => {
        if (token) {
            try {
                const response = await axios.get(`${SERVER}/current_user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.status === 200) {
                    user = response.data;
                    role = user.role;

                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('role', role);

                    updateNavbar(); // Update the navbar after fetching user info
                } else {
                    console.error('Failed to fetch current user info');
                }
            } catch (error) {
                console.error('Error fetching current user info:', error);
            }
        }
    };

    // Check if the user is authenticated and update the navbar
    const updateNavbar = () => {
        if (token && user) {
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
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                // Redirect to home page
                if (currentPath.endsWith('index.html') || currentPath === '/') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = '../../index.html';
                }
            });

            if (token && role === 'user') {
                if (borrowedBooksLink)
                    borrowedBooksLink.style.display = 'block';
            }
            if (token && role === 'admin') {
                if (customersLink) customersLink.style.display = 'block';
            }
        }
    };

    // Highlight current page in navbar
    const highlightCurrentPage = () => {
        document.querySelectorAll('.nav-item a.nav-link').forEach((item) => {
            if (item.href === window.location.href) {
                item.classList.add('active');
            }
        });
    };

    // Initialize page
    const initializePage = () => {
        fetchCurrentUser(); // Fetch current user info on page load
        highlightCurrentPage();
    };

    initializePage();

    window.getUserRole = () => role; // Expose a function to get the user role globally
});
