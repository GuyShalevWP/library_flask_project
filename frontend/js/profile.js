const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
let currentBorrowId = null;
let currentProfileId = null;

const showMessage = (msg, type) => {
    const message = document.getElementById('messageModalBody');
    if (message) {
        message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        const messageModal = new bootstrap.Modal(
            document.getElementById('messageModal')
        );
        messageModal.show();
    } else {
        console.error('Message modal body element not found');
    }
};

const showError = (msg) => {
    const errorContainer = document.getElementById('showProfileErrorMassege');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
    } else {
        console.error('Error message container element not found');
    }
};

const fetchBorrowedBooks = async () => {
    try {
        const response = await axios.get(`${SERVER}/my_borrowed_books`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const books = response.data;
        renderBorrowedBooks(books);
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
    }
};

const fetchProfile = async () => {
    try {
        const response = await axios.get(`${SERVER}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data;
        currentProfileId = profile.id;
        renderProfileDetails(profile);
        fetchBorrowedBooks();
    } catch (error) {
        console.error('Error fetching profile:', error);
        const errorMessage =
            error.response?.data?.message || 'Failed to fetch profile';
        document.getElementById(
            'message'
        ).innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    }
};

const renderProfileDetails = (profile) => {
    const profileDetails = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Profile Details</h5>
                <p class="card-text"><strong>Email:</strong> ${
                    profile.email
                }</p>
                <p class="card-text"><strong>First Name:</strong> ${
                    profile.first_name
                }</p>
                <p class="card-text"><strong>Last Name:</strong> ${
                    profile.last_name
                }</p>
                <p class="card-text"><strong>Phone:</strong> ${
                    profile.phone
                }</p>
                <button class="btn btn-primary" id="changePasswordButton" onclick="showChangePasswordModal()">Change Password</button>
                <button class="btn btn-secondary" id="editProfileButton" onclick='showEditProfileModal(${JSON.stringify(
                    profile
                )})'>Edit Profile</button>
            </div>
        </div>
    `;
    document.getElementById('profileDetails').innerHTML = profileDetails;
};

const showChangePasswordModal = () => {
    const changePasswordModal = new bootstrap.Modal(
        document.getElementById('changePasswordModal')
    );
    changePasswordModal.show();
};

let updateProfileModalInstance;
let deactivateConfirmationModalInstance;

const showEditProfileModal = (profile) => {
    currentProfileId = profile.id;
    document.getElementById('updateEmail').value = profile.email;
    document.getElementById('updateFirstName').value = profile.first_name;
    document.getElementById('updateLastName').value = profile.last_name;
    document.getElementById('updatePhone').value = profile.phone;

    updateProfileModalInstance = new bootstrap.Modal(
        document.getElementById('updateProfileModal')
    );
    updateProfileModalInstance.show();
};

const showDeactivateConfirmationModal = () => {
    deactivateConfirmationModalInstance = new bootstrap.Modal(
        document.getElementById('deactivateConfirmationModal')
    );
    updateProfileModalInstance.hide();
    deactivateConfirmationModalInstance.show();
};

const deactivateAccount = async () => {
    try {
        const response = await axios.put(
            `${SERVER}/user/${currentProfileId}/set_active`,
            { is_active: false },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '../../index.html';
        } else {
            showError('Failed to deactivate account');
        }
    } catch (error) {
        console.error('Error deactivating account:', error);
        showError('Error deactivating account');
    }
};

const mapBorrowedBooksToTableRows = (books) => {
    return books
        .map(
            (book, index) => `
        <tr class="${book.late_retun ? 'table-danger' : ''}">
            <td>${index + 1}</td>
            <td>${book.book_name}</td>
            <td>${book.author}</td>
            <td>${book.borrow_date}</td>
            <td class="text-truncate">${
                book.return_date || book.estimated_return_date
            }</td>
            <td>
                <button class="btn ${
                    book.is_returned ? 'btn-secondary' : 'btn-primary'
                } btn-sm" ${
                book.is_returned ? 'disabled' : ''
            } onclick="showConfirmReturnModal(${book.id})">
                    ${book.is_returned ? 'Returned' : 'Return'}
                </button>
            </td>
        </tr>
    `
        )
        .join('');
};

const renderBorrowedBooks = (borrowedBooks) => {
    const searchInput = document
        .getElementById('searchInput')
        .value.toLowerCase();
    const searchCriteria = document.getElementById('searchCriteria').value;
    const returnFilter = document.getElementById('returnFilter').value;

    let filteredBooks = borrowedBooks
        .filter((book) => {
            let matchesSearch = true;
            if (searchInput) {
                if (searchCriteria === 'all') {
                    matchesSearch =
                        book.book_name.toLowerCase().includes(searchInput) ||
                        book.author.toLowerCase().includes(searchInput);
                } else if (searchCriteria === 'book_name') {
                    matchesSearch = book.book_name
                        .toLowerCase()
                        .includes(searchInput);
                } else if (searchCriteria === 'author') {
                    matchesSearch = book.author
                        .toLowerCase()
                        .includes(searchInput);
                }
            }

            const matchesFilter =
                returnFilter === '' ||
                (returnFilter === 'returned' && book.is_returned) ||
                (returnFilter === 'not_returned' && !book.is_returned) ||
                (returnFilter === 'late_return' && book.late_retun);

            return matchesSearch && matchesFilter;
        })
        .reverse();

    const tableRows = mapBorrowedBooksToTableRows(filteredBooks);
    const table = `
        <h3>Borrowed Books</h3>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Book Name</th>
                    <th>Author</th>
                    <th>Borrow Date</th>
                    <th>Return Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
    document.getElementById('borrowedBooks').innerHTML = table;
};

const showDetailsModal = (book) => {
    document.getElementById('detailsBorrowId').innerText = book.id;
    document.getElementById(
        'detailsFullName'
    ).innerText = `${book.first_name} ${book.last_name}`;
    document.getElementById('detailsEmail').innerText = book.user_email;
    document.getElementById('detailsBookId').innerText = book.book_id;
    document.getElementById('detailsBookName').innerText = book.book_name;
    document.getElementById('detailsAuthor').innerText = book.author;
    document.getElementById('detailsBorrowDate').innerText = book.borrow_date;
    document.getElementById('detailsReturnDate').innerText =
        book.return_date || book.estimated_return_date;

    const detailsModal = new bootstrap.Modal(
        document.getElementById('detailsModal')
    );
    detailsModal.show();
};

const showConfirmReturnModal = (borrowId) => {
    currentBorrowId = borrowId;
    const confirmReturnModal = new bootstrap.Modal(
        document.getElementById('confirmReturnModal')
    );
    confirmReturnModal.show();
};

const confirmReturnBook = async () => {
    if (currentBorrowId) {
        try {
            const response = await axios.put(
                `${SERVER}/return_book/${currentBorrowId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 200) {
                const confirmReturnModal = bootstrap.Modal.getInstance(
                    document.getElementById('confirmReturnModal')
                );
                confirmReturnModal.hide();
                showMessage('Book returned successfully', 'success');
                fetchBorrowedBooks();
            } else {
                showError('Failed to return book');
            }
        } catch (error) {
            console.error('Error returning book:', error);
            showError('Error returning book');
        }
    }
};

const changePassword = async () => {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword =
        document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        showError('New passwords do not match');
        return;
    }

    try {
        const response = await axios.put(
            `${SERVER}/user/change_password`,
            {
                old_password: oldPassword,
                new_password: newPassword,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            const changePasswordModal = bootstrap.Modal.getInstance(
                document.getElementById('changePasswordModal')
            );
            changePasswordModal.hide();
            showMessage('Password changed successfully', 'success');
        } else {
            showError('Failed to change password');
        }
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || 'Error changing password';
        showError(errorMessage);
        console.error('Error changing password:', error);
    }
};

const updateProfile = async () => {
    const email = document.getElementById('updateEmail').value;
    const firstName = document.getElementById('updateFirstName').value;
    const lastName = document.getElementById('updateLastName').value;
    const phone = document.getElementById('updatePhone').value;

    try {
        const response = await axios.put(
            `${SERVER}/profile`,
            {
                email,
                first_name: firstName,
                last_name: lastName,
                phone,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            const updateProfileModal = bootstrap.Modal.getInstance(
                document.getElementById('updateProfileModal')
            );
            updateProfileModal.hide();
            showMessage('Profile updated successfully', 'success');
            fetchProfile(); // Refresh the profile details
        } else {
            showError('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Error updating profile');
    }
};

const initializePage = () => {
    fetchProfile();

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchBorrowedBooks);
    document
        .getElementById('searchCriteria')
        .addEventListener('change', fetchBorrowedBooks);
    document
        .getElementById('returnFilter')
        .addEventListener('change', fetchBorrowedBooks);
    document
        .getElementById('deactivateConfirmationModal')
        .addEventListener('hidden.bs.modal', () => {
            if (updateProfileModalInstance) {
                updateProfileModalInstance.show();
            }
        });
};

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    initializePage();
});
