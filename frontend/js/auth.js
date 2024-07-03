const SERVER = 'http://localhost:7000';

const showMessage = (msg, type) => {
    const message = document.getElementById('messageModalBody');
    message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    const messageModal = new bootstrap.Modal(
        document.getElementById('messageModal')
    );
    messageModal.show();
};

const showError = (msg) => {
    const message = document.getElementById('messageModalBody');
    message.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
    const messageModal = new bootstrap.Modal(
        document.getElementById('messageModal')
    );
    messageModal.show();
};

const validateForm = ({
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    phone,
}) => {
    return (
        email && password && confirmPassword && firstName && lastName && phone
    );
};

const login = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError('Please fill all the fields');
        return;
    }

    try {
        const response = await axios.post(`${SERVER}/login`, {
            email,
            password,
        });

        if (response.status === 200) {
            const token = response.data.access_token;
            const msg = response.data.message;

            localStorage.setItem('token', token); // Store token in localStorage
            showMessage(msg, 'success');

            // Wait for 2 seconds before redirecting
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
        } else {
            showError('Invalid email or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        const errorMessage =
            error.response?.data?.message || 'Invalid email or password';
        showError(errorMessage);
    }
};

const register = () => {
    const email = document.getElementById('reg_email').value;
    const password = document.getElementById('reg_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const phone = document.getElementById('phone').value;

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
        })
        .then((response) => {
            const msg = response.data.message;

            message.innerHTML = `<div class="alert alert-success">${msg}</div>`;
            $('#messageModal').modal('show');

            window.location.href = './signin.html';
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
