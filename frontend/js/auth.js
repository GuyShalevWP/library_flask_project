const SERVER = 'http://localhost:7000';
const registerForm = document.getElementById('registerForm');

const login = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    axios
        .post(`${SERVER}/login`, {
            email: email,
            password: password,
        })
        .then((response) => {
            const token = response.data.access_token;
            const msg = response.data.message;

            localStorage.setItem('token', token); // Store token in localStorage

            message.innerHTML = `<div class="alert alert-success">${msg}</div>`;

            // Wait for 1 second before redirecting
            setTimeout(() => {
                window.location.href = '../../index.html'; // Redirect to home page
            }, 1000);
        })

        .catch((error) => {
            console.error('Error during login:', error);
            const errorMessage =
                error.response?.data?.message || 'Invalid email or password';
            message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        });
};

const register = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const retype_password = document.getElementById('retype_password').value;
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
            error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : 'Registration failed';
        document.getElementById(
            'message'
        ).innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    }
};

if (registerForm) {
    registerForm.addEventListener('submit', register);
}
