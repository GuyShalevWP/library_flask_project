document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    let currentBorrowId = null;

    const user = sessionStorage.getItem('user');
    const role = user ? user.role : null;

    // Check if the token exists, if not redirect to sign-in
    if (!token && role !== 'admin') {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    const fetchBorrowedBooks = async () => {
        try {
            const response = await axios.get(`${SERVER}/borrowed_books`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const borrowedBooks = response.data;
            renderBorrowedBooksTable(borrowedBooks);
        } catch (error) {
            console.error('Error fetching borrowed books:', error);
        }
    };

    const renderBorrowedBooksTable = (borrowedBooks) => {
        const searchInput = document
            .getElementById('searchInput')
            .value.toLowerCase();
        const searchCriteria = document.getElementById('searchCriteria').value;
        const returnFilter = document.getElementById('returnFilter').value;

        const filteredBooks = borrowedBooks
            .filter((book) => {
                let matchesSearch = true;
                if (searchInput) {
                    if (searchCriteria === 'all') {
                        matchesSearch =
                            book.user_email
                                .toLowerCase()
                                .includes(searchInput) ||
                            `${book.first_name} ${book.last_name}`
                                .toLowerCase()
                                .includes(searchInput) ||
                            book.book_name.toLowerCase().includes(searchInput);
                    } else if (searchCriteria === 'email') {
                        matchesSearch = book.user_email
                            .toLowerCase()
                            .includes(searchInput);
                    } else if (searchCriteria === 'name') {
                        matchesSearch = `${book.first_name} ${book.last_name}`
                            .toLowerCase()
                            .includes(searchInput);
                    } else if (searchCriteria === 'book_name') {
                        matchesSearch = book.book_name
                            .toLowerCase()
                            .includes(searchInput);
                    }
                }

                const matchesFilter =
                    returnFilter === '' ||
                    (returnFilter === 'returned' && book.return_type === 0) ||
                    (returnFilter === 'not_returned' && book.return_type !== 0);

                return matchesSearch && matchesFilter;
            })
            .reverse(); // Reversing the filtered array to show most recent first

        const table = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Index</th>
                        <th>User Email</th>
                        <th>Full Name</th>
                        <th>Book Name</th>
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
                                <td>${book.user_email}</td>
                                <td>${book.first_name} ${book.last_name}</td>
                                <td>${book.book_name}</td>
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
        document.getElementById('borrowedBooksTable').innerHTML = table;
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

    fetchBorrowedBooks();
});
