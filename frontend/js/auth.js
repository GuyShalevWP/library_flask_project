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
    const errorContainer = document.getElementById('showErrorMassege');
    errorContainer.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
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
        if (error.response?.status === 403) {
            const status = error.response?.data?.status;
            const msg = error.response?.data?.message;

            if (status === 'deactivated' || status === 'password_reset') {
                showMessage(msg, 'warning');
                setTimeout(() => {
                    window.location.href =
                        '../signin_register/reset_password.html';
                }, 2000);
            }
        } else {
            const errorMessage =
                error.response?.data?.message || 'Invalid email or password';
            showError(errorMessage);
        }
    }
};

const resetPassword = async () => {
    const email = document.getElementById('resetEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword =
        document.getElementById('confirmNewPassword').value;

    if (!email || !newPassword || !confirmNewPassword) {
        showError('Please fill all the fields');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        const response = await axios.post(`${SERVER}/user/reset_password`, {
            email,
            new_password: newPassword,
        });

        if (response.status === 200) {
            showMessage(response.data.message, 'success');
            window.location.href = './signin.html';
        } else {
            showError('Failed to reset password');
        }
    } catch (error) {
        console.error('Error during password reset:', error);
        const errorMessage =
            error.response?.data?.message || 'Failed to reset password';
        showError(errorMessage);
    }
};

const register = async () => {
    const email = document.getElementById('reg_email').value;
    const password = document.getElementById('reg_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const phone = document.getElementById('phone').value;

    if (password !== confirmPassword) {
        showError(`Passwords do not match`);
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

            console.log(msg);
            window.location.href = './signin.html';
        })
        .catch((error) => {
            console.error('Error during registration:', error);
            const errorMessage =
                error.response?.data?.message ||
                'Registration failed. Please try again.';
            showError(errorMessage);
        });
};
