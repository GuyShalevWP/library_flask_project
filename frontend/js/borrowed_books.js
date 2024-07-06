document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    let currentBorrowId = null;

    // Check if the token exists, if not redirect to sign-in
    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    const fetchBorrowedBooks = async () => {
        try {
            const endpoint =
                role === 'admin' ? 'all_borrowed_books' : 'my_borrowed_books';
            const response = await axios.get(`${SERVER}/${endpoint}`, {
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
                    (returnFilter === 'returned' && book.is_returned) ||
                    (returnFilter === 'not_returned' && !book.is_returned);

                return matchesSearch && matchesFilter;
            })
            .reverse(); // Reversing the filtered array to show most recent first

        const table = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Email</th>
                        <th class="text-truncate">Full Name</th>
                        <th class="text-truncate">Book Name</th>
                        <th class="text-truncate">Borrow Date</th>
                        <th class="text-truncate">Return Date</th>
                        <th>Details</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBooks
                        .map(
                            (book, index) => `
                            <tr class="${
                                !book.late_return ? '' : 'table-danger'
                            }">
                                <td>${index + 1}</td>
                                <td class="text-truncate">${
                                    book.user_email
                                }</td>
                                <td class="text-truncate">${book.first_name} ${
                                book.last_name
                            }</td>
                                <td class="text-truncate">${book.book_name}</td>
                                <td class="text-truncate">${
                                    book.borrow_date
                                }</td>
                                <td class="text-truncate">${
                                    !book.return_date
                                        ? book.estimated_return_date
                                        : book.return_date
                                }</td>
                                <td>
                                    <button class="btn btn-primary btn-sm" onclick='showDetailsModal(${JSON.stringify(
                                        book
                                    )})'>
                                        Show
                                    </button>
                                </td>                      
                                <td class="d-flex justify-content-center align-items-center">
                                    <button class="btn ${
                                        !book.is_returned
                                            ? 'btn-primary'
                                            : 'btn-secondary'
                                    } btn-sm" ${
                                !book.is_returned ? '' : 'disabled'
                            } onclick="showConfirmReturnModal(${book.id})">
                                    ${!book.is_returned ? 'Return' : 'Returned'}
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
        const confirmReturnModal = new bootstrap.Modal(
            document.getElementById('confirmReturnModal')
        );
        confirmReturnModal.show();
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
