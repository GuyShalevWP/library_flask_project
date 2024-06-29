document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const signinForm = document.getElementById('signinForm');
    const registerForm = document.getElementById('registerForm');

    if (signinForm) {
        signinForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log('Sign In Attempt:', { email, password });

            try {
                const response = await axios.post(`${SERVER}/login`, {
                    email,
                    password,
                });

                if (response.status === 200) {
                    document.getElementById('message').innerHTML =
                        '<div class="alert alert-success">Login successful</div>';
                    // Store the token in localStorage
                    localStorage.setItem('token', response.data.access_token);

                    // Store user details in session storage
                    sessionStorage.setItem(
                        'user',
                        JSON.stringify(response.data.user)
                    );

                    // Redirect to home page
                    window.location.href = '../../index.html';
                } else {
                    document.getElementById('message').innerHTML =
                        '<div class="alert alert-danger">Invalid email or password</div>';
                }
            } catch (error) {
                console.error('Error during login:', error); // Log error to console
                const errorMessage =
                    error.response &&
                    error.response.data &&
                    error.response.data.message
                        ? error.response.data.message
                        : 'Invalid email or password';
                document.getElementById(
                    'message'
                ).innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const retype_password =
                document.getElementById('retype_password').value;
            const first_name = document.getElementById('first_name').value;
            const last_name = document.getElementById('last_name').value;
            const phone = document.getElementById('phone').value;

            if (password !== retype_password) {
                document.getElementById('message').innerHTML =
                    '<div class="alert alert-danger">Passwords do not match</div>';
                return;
            }

            console.log('Registration Attempt:', {
                email,
                password,
                first_name,
                last_name,
                phone,
            });

            try {
                const response = await axios.post(`${SERVER}/register`, {
                    email,
                    password,
                    first_name,
                    last_name,
                    phone,
                });

                if (response.status === 201) {
                    document.getElementById('message').innerHTML =
                        '<div class="alert alert-success">Registration successful</div>';
                    // Redirect to sign-in page
                    window.location.href = 'signin.html';
                } else {
                    document.getElementById('message').innerHTML =
                        '<div class="alert alert-danger">Registration failed</div>';
                }
            } catch (error) {
                console.error('Error during registration:', error);
                const errorMessage =
                    error.response &&
                    error.response.data &&
                    error.response.data.message
                        ? error.response.data.message
                        : 'Registration failed';
                document.getElementById(
                    'message'
                ).innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
            }
        });
    }

    // Check if the user is authenticated and update the navbar
    const isAuthenticated = localStorage.getItem('token');
    const authLinks = document.getElementById('authLinks');
    if (authLinks) {
        if (isAuthenticated) {
            authLinks.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" id="logout">Logout</a>
                </li>
            `;

            document.getElementById('logout').addEventListener('click', () => {
                // Remove the token and user details from storage
                localStorage.removeItem('token');
                sessionStorage.removeItem('user');
                // Redirect to home page
                window.location.href = '../../index.html';
            });
        }
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
