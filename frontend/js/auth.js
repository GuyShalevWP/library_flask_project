const SERVER = 'http://localhost:7000';

const login = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('messageModalBody');

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
            $('#messageModal').modal('show');

            // Wait for 2 second before redirecting
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
        })
        .catch((error) => {
            console.error('Error during login:', error);
            const errorMessage =
                error.response?.data?.message || 'Invalid email or password';
            message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
            $('#messageModal').modal('show');
        });
};

const register = () => {
    const email = document.getElementById('reg_email').value;
    const password = document.getElementById('reg_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const phone = document.getElementById('phone').value;
    const role = document.getElementById('role').value || 'user';
    const message = document.getElementById('messageModalBody');

    if (password !== confirmPassword) {
        message.innerHTML = `<div class="alert alert-danger">Passwords do not match</div>`;
        $('#messageModal').modal('show');
        return;
    }

    axios
        .post(`${SERVER}/register`, {
            email: email,
            password: password,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: role,
        })
        .then((response) => {
            const msg = response.data.message;

            message.innerHTML = `<div class="alert alert-success">${msg}</div>`;
            $('#messageModal').modal('show');

            // Wait for 2 second before redirecting to login page
            setTimeout(() => {
                window.location.href = './signin.html';
            }, 2000);
        })
        .catch((error) => {
            console.error('Error during registration:', error);
            const errorMessage =
                error.response?.data?.message ||
                'Registration failed. Please try again.';
            message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
            $('#messageModal').modal('show');
        });
};
