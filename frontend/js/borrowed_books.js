const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
let currentBorrowId = null;

const showMessage = (msg, type) => {
    const message = document.getElementById('message');
    if (message) {
        message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    } else {
        console.error('Message element not found');
    }
};

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

const mapBorrowedBooksToTableRows = (books) => {
    return books
        .map(
            (book, index) => `
            <tr class="${book.late_return ? 'table-danger' : ''}">
                <td>${index + 1}</td>
                <td>${book.user_email}</td>
                <td>${book.first_name} ${book.last_name}</td>
                <td>${book.book_name}</td>
                <td>${book.borrow_date}</td>
                <td class="text-truncate">${
                    book.return_date || book.estimated_return_date
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

const renderBorrowedBooksTable = (borrowedBooks) => {
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
                        book.user_email.toLowerCase().includes(searchInput) ||
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
                (returnFilter === 'not_returned' && !book.is_returned) ||
                (returnFilter === 'late_return' && book.late_return);

            return matchesSearch && matchesFilter;
        })
        .reverse();

    const tableRows = mapBorrowedBooksToTableRows(filteredBooks);
    const table = `
        <h3>Borrowed Books</h3>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Book Name</th>
                    <th>Borrow Date</th>
                    <th>Return Date</th>
                    <th>Details</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
    document.getElementById('borrowedBooksTable').innerHTML = table;
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
                showMessage('Failed to return book', 'danger');
            }
        } catch (error) {
            console.error('Error returning book:', error);
            showMessage('Error returning book', 'danger');
        }
    }
};

const initializePage = () => {
    fetchBorrowedBooks();

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchBorrowedBooks);
    document
        .getElementById('searchCriteria')
        .addEventListener('change', fetchBorrowedBooks);
    document
        .getElementById('returnFilter')
        .addEventListener('change', fetchBorrowedBooks);
};

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    initializePage();
});
