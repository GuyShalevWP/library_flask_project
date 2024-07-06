document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    let currentBorrowId = null;

    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

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
                    <p class="card-text"><strong>Email:</strong> ${profile.email}</p>
                    <p class="card-text"><strong>First Name:</strong> ${profile.first_name}</p>
                    <p class="card-text"><strong>Last Name:</strong> ${profile.last_name}</p>
                    <p class="card-text"><strong>Phone:</strong> ${profile.phone}</p>
                    <button class="btn btn-primary" id="changePasswordButton">Change Password</button>
                    <button class="btn btn-secondary" id="editProfileButton">Edit Profile</button>
                </div>
            </div>
        `;
        document.getElementById('profileDetails').innerHTML = profileDetails;

        document
            .getElementById('changePasswordButton')
            .addEventListener('click', () => {
                const changePasswordModal = new bootstrap.Modal(
                    document.getElementById('changePasswordModal')
                );
                changePasswordModal.show();
            });

        document
            .getElementById('editProfileButton')
            .addEventListener('click', () => {
                const updateProfileModal = new bootstrap.Modal(
                    document.getElementById('updateProfileModal')
                );
                updateProfileModal.show();
                document.getElementById('updateEmail').value = profile.email;
                document.getElementById('updateFirstName').value =
                    profile.first_name;
                document.getElementById('updateLastName').value =
                    profile.last_name;
                document.getElementById('updatePhone').value = profile.phone;
            });
    };

    // checks the current date
    const isDatePast = (estimatedReturnDate, returnDate) => {
        const currentDate = new Date();
        const formattedCurrentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );

        const [estDay, estMonth, estYear] = estimatedReturnDate.split('-');
        const estimatedReturn = new Date(estYear, estMonth - 1, estDay); // Month is 0-indexed in JS Date

        // Check if the current date is past the estimated return date
        const isCurrentDatePast = formattedCurrentDate > estimatedReturn;

        let isReturnDatePast = false;
        if (returnDate) {
            const [retDay, retMonth, retYear] = returnDate.split('-');
            const actualReturnDate = new Date(retYear, retMonth - 1, retDay); // Month is 0-indexed in JS Date

            // Check if the return date is past the estimated return date
            isReturnDatePast = actualReturnDate > estimatedReturn;
        }

        return isCurrentDatePast || isReturnDatePast;
    };

    // Function to map books to table rows
    const mapBorrowedBooksToTableRows = (books) => {
        return books
            .map(
                (book, index) => `
            <tr class="${
                isDatePast(book.estimated_return_date, book.return_date)
                    ? 'table-danger'
                    : ''
            }">
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

    // Function to render borrowed books table
    const renderBorrowedBooks = (borrowedBooks) => {
        const searchInput = document
            .getElementById('searchInput')
            .value.toLowerCase();
        const searchCriteria = document.getElementById('searchCriteria').value;
        const returnFilter = document.getElementById('returnFilter').value;

        // Filter the books based on search input and return filter
        let filteredBooks = borrowedBooks.filter((book) => {
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
                (returnFilter === 'late_return' &&
                    isDatePast(book.estimated_return_date, book.return_date));

            return matchesSearch && matchesFilter;
        });

        // Sort the books: late returns first, then by most recent
        filteredBooks.sort((a, b) => {
            const isLateA = isDatePast(a.estimated_return_date, a.return_date);
            const isLateB = isDatePast(b.estimated_return_date, b.return_date);

            if (isLateA && !isLateB) return -1;
            if (!isLateA && isLateB) return 1;

            return b.id - a.id;
        });

        // Map the sorted books to table rows and render the table
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

    window.showDetailsModal = (book) => {
        document.getElementById('detailsBorrowId').innerText = book.id;
        document.getElementById(
            'detailsFullName'
        ).innerText = `${book.first_name} ${book.last_name}`;
        document.getElementById('detailsEmail').innerText = book.user_email;
        document.getElementById('detailsBookId').innerText = book.book_id;
        document.getElementById('detailsBookName').innerText = book.book_name;
        document.getElementById('detailsAuthor').innerText = book.author;
        document.getElementById('detailsBorrowDate').innerText =
            book.borrow_date;
        document.getElementById('detailsReturnDate').innerText =
            book.return_date || book.estimated_return_date;

        const detailsModal = new bootstrap.Modal(
            document.getElementById('detailsModal')
        );
        detailsModal.show();
    };

    window.showConfirmReturnModal = (borrowId) => {
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
                const changePasswordModal = bootstrap.Modal.getInstance(
                    document.getElementById('changePasswordModal')
                );
                changePasswordModal.hide();
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
                `${SERVER}/profile`, // Updated endpoint to update profile
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
