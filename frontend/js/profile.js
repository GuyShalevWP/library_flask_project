document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    let currentBorrowId = null;

    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${SERVER}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const profile = response.data;
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

    const fetchBorrowedBooks = async () => {
        try {
            const response = await axios.get(`${SERVER}/my_borrowed_books`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            renderBorrowedBooks(response.data);
        } catch (error) {
            console.error('Error fetching borrowed books:', error);
        }
    };

    const renderProfileDetails = (profile) => {
        const profileDetails = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Profile Details</h5>
                    <p class="card-text"><strong>Email:</strong> ${profile.email}</p>
                    <p class="card-text"><strong>First Name:</strong> ${profile.first_name}</p>
                    <p class="card-text"><strong>Last Name:</strong> ${profile.last_name}</p>
                    <p class="card-text"><strong>Phone:</strong> ${profile.phone}</p>
                    <button class="btn btn-primary" id="changePasswordButton">
                        Change Password
                    </button>
                    <button class="btn btn-secondary" id="editProfileButton">
                        Edit Profile
                    </button>
                </div>
            </div>
        `;
        document.getElementById('profileDetails').innerHTML = profileDetails;

        document
            .getElementById('changePasswordButton')
            .addEventListener('click', () => {
                $('#changePasswordModal').modal('show');
            });

        document
            .getElementById('editProfileButton')
            .addEventListener('click', () => {
                $('#updateProfileModal').modal('show');
                document.getElementById('updateEmail').value = profile.email;
                document.getElementById('updateFirstName').value =
                    profile.first_name;
                document.getElementById('updateLastName').value =
                    profile.last_name;
                document.getElementById('updatePhone').value = profile.phone;
            });
    };

    const renderBorrowedBooks = (borrowedBooks) => {
        const searchInput = document
            .getElementById('searchInput')
            .value.toLowerCase();
        const searchCriteria = document.getElementById('searchCriteria').value;
        const returnFilter = document.getElementById('returnFilter').value;

        const filteredBooks = borrowedBooks.filter((book) => {
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
                (returnFilter === 'returned' && book.return_type === 0) ||
                (returnFilter === 'not_returned' && book.return_type !== 0);

            return matchesSearch && matchesFilter;
        });

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
                    ${filteredBooks
                        .map(
                            (book, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${book.book_name}</td>
                                <td>${book.author}</td>
                                <td>${book.borrow_date}</td>
                                <td>${book.return_date || 'Not Returned'}</td>
                                <td>
                                    <button class="btn ${
                                        book.return_type === 0
                                            ? 'btn-secondary'
                                            : 'btn-primary'
                                    } btn-sm" ${
                                book.return_type === 0 ? 'disabled' : ''
                            } onclick="showConfirmReturnModal(${book.id})">
                                        ${
                                            book.return_type === 0
                                                ? 'Returned'
                                                : 'Return'
                                        }
                                    </button>
                                </td>
                            </tr>
                        `
                        )
                        .join('')}
                </tbody>
            </table>
        `;
        document.getElementById('borrowedBooks').innerHTML = table;
    };

    window.showConfirmReturnModal = (borrowId) => {
        currentBorrowId = borrowId;
        $('#confirmReturnModal').modal('show');
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
                    $('#confirmReturnModal').modal('hide');
                    alert('Book returned successfully');
                    fetchBorrowedBooks(); // Refresh the table after returning the book
                } else {
                    alert('Failed to return book');
                }
            } catch (error) {
                console.error('Error returning book:', error);
                alert('Error returning book');
            }
        }
    };

    const changePassword = async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword =
            document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
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
                $('#changePasswordModal').modal('hide');
                alert('Password changed successfully');
            } else {
                alert('Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password');
        }
    };

    const updateProfile = async (event) => {
        event.preventDefault();
        const email = document.getElementById('updateEmail').value;
        const firstName = document.getElementById('updateFirstName').value;
        const lastName = document.getElementById('updateLastName').value;
        const phone = document.getElementById('updatePhone').value;

        try {
            const response = await axios.put(
                `${SERVER}/user/profile`, // Endpoint to update profile
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
                $('#updateProfileModal').modal('hide');
                alert('Profile updated successfully');
                fetchProfile(); // Refresh the profile details
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        }
    };

    document
        .getElementById('changePasswordForm')
        .addEventListener('submit', changePassword);

    document
        .getElementById('updateProfileForm')
        .addEventListener('submit', updateProfile);

    document
        .getElementById('confirmReturnButton')
        .addEventListener('click', confirmReturnBook);

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchBorrowedBooks);
    document
        .getElementById('searchCriteria')
        .addEventListener('change', fetchBorrowedBooks);
    document
        .getElementById('returnFilter')
        .addEventListener('change', fetchBorrowedBooks);

    fetchProfile();
});
