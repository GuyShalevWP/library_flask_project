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
                </div>
            </div>
        `;
        document.getElementById('profileDetails').innerHTML = profileDetails;
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

    document
        .getElementById('confirmReturnButton')
        .addEventListener('click', async () => {
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
        });

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
