const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const fetchLateBorrowedBooks = async () => {
    try {
        const response = await axios.get(`${SERVER}/my_borrowed_books`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const books = response.data.filter(
            (book) => !book.is_returned && book.late_return
        );
        renderLateBorrowedBooks(books);
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
    }
};

const renderLateBorrowedBooks = (books) => {
    const tableRows = books
        .map(
            (book, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${book.book_name}</td>
            <td>${book.author}</td>
            <td>${book.borrow_date}</td>
            <td>${book.estimated_return_date}</td>
        </tr>
    `
        )
        .join('');

    const table = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Book Name</th>
                    <th>Author</th>
                    <th>Borrow Date</th>
                    <th>Estimated Return Date</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

    document.getElementById('lateBorrowedBooksTable').innerHTML = table;
    document.getElementById('lateBorrowedBooksSection').style.display =
        books.length > 0 ? 'block' : 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    if (token && role) {
        fetchLateBorrowedBooks();
    }
});
