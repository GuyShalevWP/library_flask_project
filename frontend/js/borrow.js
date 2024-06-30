document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');

    // Check if the token exists, if not redirect to sign-in
    if (!token) {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    const fetchBooks = async () => {
        try {
            const response = await axios.get(`${SERVER}/books`);
            const books = response.data.filter((book) => !book.is_borrowed);
            const bookSelect = document.getElementById('bookSelect');

            bookSelect.innerHTML = `
                <option value="" disabled selected>Select a book</option>
                ${books
                    .map(
                        (book) => `
                        <option value="${book.id}">${book.name}</option>
                    `
                    )
                    .join('')}
            `;
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    };

    const borrowBookButton = document.getElementById('borrowBookButton');
    const confirmBorrowButton = document.getElementById('confirmBorrowButton');

    borrowBookButton.addEventListener('click', () => {
        const bookSelect = document.getElementById('bookSelect');
        const borrowLength = document.getElementById('borrowLength');
        const bookName = bookSelect.options[bookSelect.selectedIndex].text;
        const borrowLengthText =
            borrowLength.options[borrowLength.selectedIndex].text;

        document.getElementById('confirmBookName').innerText = bookName;
        document.getElementById('confirmBorrowLength').innerText =
            borrowLengthText;

        $('#confirmBorrowModal').modal('show');
    });

    confirmBorrowButton.addEventListener('click', async () => {
        const bookSelect = document.getElementById('bookSelect');
        const borrowLength = document.getElementById('borrowLength');

        const bookId = bookSelect.value;
        const borrowLengthValue = parseInt(borrowLength.value, 10);

        try {
            const response = await axios.post(
                `${SERVER}/borrow_book`,
                {
                    book_id: bookId,
                    return_type: borrowLengthValue,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 201) {
                const { book, borrow_date, return_date } = response.data;

                document.getElementById('successBookName').innerText =
                    book.name;
                document.getElementById('successBookAuthor').innerText =
                    book.author;
                document.getElementById('successBorrowDate').innerText =
                    borrow_date;
                document.getElementById('successReturnDate').innerText =
                    return_date;

                $('#confirmBorrowModal').modal('hide');
                $('#successModal').modal('show');
            } else {
                document.getElementById('message').innerHTML =
                    '<div class="alert alert-danger">Failed to borrow book</div>';
            }
        } catch (error) {
            console.error('Error borrowing book:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to borrow book';
            document.getElementById(
                'message'
            ).innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        }
    });

    fetchBooks();
});
