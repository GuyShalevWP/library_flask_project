const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const role = localStorage.getItem('role');

const message = document.getElementById('message');
const booksList = document.getElementById('booksList');
let currentBookId = null;
let currentReturnType = null;
let currentBookIsAvailable = null;

const showMessage = (msg, type) => {
    message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
};

const validateForm = (formData) => {
    for (const [key, value] of formData.entries()) {
        if (!value) return false;
    }
    return true;
};

const checkBorrowLength = (returnType) =>
    ({
        1: '10 days',
        2: '5 days',
        3: '2 days',
    }[returnType] || 'Unknown');

const fetchBooks = async () => {
    try {
        const response = await axios.get(`${SERVER}/books`);
        let books = response.data;

        if (role !== 'admin') {
            books = books.filter((book) => book.is_available);
        }

        renderBooksTable(books);
    } catch (error) {
        console.error('Error fetching books:', error);
    }
};

const renderBooksTable = (books) => {
    const searchInput = document
        .getElementById('searchInput')
        .value.toLowerCase();
    const searchBookBy = document.getElementById('searchBookBy').value;
    const availabilityFilter =
        document.getElementById('availabilityFilter').value;
    const borrowLengthFilter =
        document.getElementById('borrowLengthFilter').value;

    const filteredBooks = books
        .filter((book) => {
            let matchesSearch = true;
            if (searchInput) {
                if (searchBookBy === 'all') {
                    matchesSearch =
                        book.name.toLowerCase().includes(searchInput) ||
                        book.author.toLowerCase().includes(searchInput);
                } else if (searchBookBy === 'book_name') {
                    matchesSearch = book.name
                        .toLowerCase()
                        .includes(searchInput);
                } else if (searchBookBy === 'author') {
                    matchesSearch = book.author
                        .toLowerCase()
                        .includes(searchInput);
                }
            }

            const matchesAvailabilityFilter =
                availabilityFilter === '' ||
                (availabilityFilter === 'available_books' &&
                    !book.is_borrowed) ||
                (availabilityFilter === 'borrowed_books' && book.is_borrowed);

            const matchesBorrowLengthFilter =
                borrowLengthFilter === '' ||
                (borrowLengthFilter === 'ten_days' && book.return_type === 1) ||
                (borrowLengthFilter === 'five_days' &&
                    book.return_type === 2) ||
                (borrowLengthFilter === 'two_days' && book.return_type === 3);

            return (
                matchesSearch &&
                matchesAvailabilityFilter &&
                matchesBorrowLengthFilter
            );
        })
        .reverse();

        booksList.innerHTML = filteredBooks
        .map(
            (book) => `
        ${
            role !== 'admin' && !book.is_available
                ? ``
                : `
                <div class="card mb-3" style="max-width: 540px;">
                    <div class="row g-0">
                        <div class="col-md-5">
                            <img 
                                src="${SERVER}/assets/images/${book.img}" 
                                class="img-fluid rounded-start" 
                                alt="${book.name}" 
                                style="height: 100%;">
                        </div>
                        <div class="col-md-7 ">
                            <div class="card-body ">
                                <h5 class="card-title">${book.name}</h5>
                                <p class="card-text">Author: ${book.author}</p>
                                <p class="card-text">Release Date: ${
                                    book.release_date
                                }</p>
                                <p class="card-text">Borrow for: ${checkBorrowLength(
                                    book.return_type
                                )}</p>
                                <p class="card-text">Status: ${
                                    book.is_borrowed
                                        ? 'Unavailable'
                                        : 'Available'
                                }</p>

                                ${
                                    !role
                                        ? ``
                                        : `<button class="btn btn-primary 
                                        ${
                                            book.is_borrowed
                                                ? 'btn-secondary disabled'
                                                : 'btn-primary'
                                        }" 
                                        onclick="showBorrowBook(${book.id}, 
                                            \`${book.name}\`, 
                                            ${book.return_type})">
                                        Borrow</button>`
                                }

                                ${
                                    role !== 'admin'
                                        ? ''
                                        : `<button class="btn btn-secondary" onclick="showEditModal(
                                            ${book.id},
                                            \`${book.name}\`, 
                                            \`${book.author}\`, 
                                            \`${book.release_date}\`, 
                                            ${book.return_type}, 
                                            \`${book.img}\`)">
                                        Edit</button>
                                    <button class="btn ${
                                        book.is_available
                                            ? 'btn-danger'
                                            : 'btn-success'
                                    }" onclick="showDeleteModal(
                                        ${book.id}, 
                                        ${book.is_available})">
                                    ${book.is_available ? 'Delete' : 'Restore'}
                                    </button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `
        }
    `
        )
        .join('');
};

const addBook = async () => {
    const formData = new FormData(document.getElementById('addBookForm'));

    if (!validateForm(formData)) {
        showMessage('Please fill all the fields', 'danger');
        return;
    }

    try {
        const response = await axios.post(`${SERVER}/add_book`, formData, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 201) {
            showMessage(response.data.message, 'success');
            document.getElementById('addBookForm').reset();
            fetchBooks();
        } else {
            showMessage('Failed to add book', 'danger');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        const errorMessage =
            error.response?.data?.message ||
            'Failed to add book. Please try again.';
        showMessage(errorMessage, 'danger');
    }
};

const showEditModal = (id, name, author, releaseDate, returnType, img) => {
    currentBookId = id;

    const updateNameElement = document.getElementById('updateName');
    const updateAuthorElement = document.getElementById('updateAuthor');
    const updateReleaseDateElement = document.getElementById('updateReleaseDate');
    const updateBorrowLengthElement = document.getElementById('updateBorrowLength');
    const updateImgElement = document.getElementById('updateImg');

    if (updateNameElement && updateAuthorElement && updateReleaseDateElement && updateBorrowLengthElement && updateImgElement) {
        updateNameElement.value = name;
        updateAuthorElement.value = author;
        updateReleaseDateElement.value = releaseDate;
        updateBorrowLengthElement.value = returnType;
        updateImgElement.value = '';

        const updateBookModal = new bootstrap.Modal(document.getElementById('updateBookModal'));
        updateBookModal.show();
    } else {
        console.error('One or more elements not found in the DOM');
    }
};

const updateBook = async () => {
    const formData = new FormData(document.getElementById('updateBookForm'));

    if (!validateForm(formData)) {
        showMessage('Please fill all the fields', 'danger');
        return;
    }

    try {
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        const response = await axios.put(
            `${SERVER}/update_book/${currentBookId}`,
            formData,
            {
                headers: headers,
            }
        );

        if (response.status === 200) {
            showMessage('Book updated successfully', 'success');
            const updateBookModal = bootstrap.Modal.getInstance(
                document.getElementById('updateBookModal')
            );
            updateBookModal.hide();
            fetchBooks();
        } else {
            showMessage('Failed to update book', 'danger');
        }
    } catch (error) {
        console.error('Error updating book:', error);
        const errorMessage =
            error.response?.data?.message || 'Failed to update book';
        showMessage(errorMessage, 'danger');
    }
};

window.showDeleteModal = (id, isAvailable) => {
    currentBookId = id;
    currentBookIsAvailable = isAvailable;
    document.getElementById('deleteBookModalLabel').innerText = isAvailable
        ? 'Delete Book'
        : 'Restore Book';
    document.querySelector('#deleteBookModal .modal-body').innerText =
        isAvailable
            ? 'Are you sure you want to delete this book?'
            : 'Are you sure you want to restore this book?';
    document.getElementById('confirmDeleteButton').innerText = isAvailable
        ? 'Delete'
        : 'Restore';
    const deleteBookModal = new bootstrap.Modal(
        document.getElementById('deleteBookModal')
    );
    deleteBookModal.show();
};

const toggleBookAvailability = async () => {
    try {
        const response = await axios.put(
            `${SERVER}/delete_book/${currentBookId}`,
            {
                is_available: !currentBookIsAvailable,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            showMessage(
                `Book ${
                    currentBookIsAvailable ? 'deleted' : 'restored'
                } successfully`,
                'success'
            );
            const deleteBookModal = bootstrap.Modal.getInstance(
                document.getElementById('deleteBookModal')
            );
            deleteBookModal.hide();
            fetchBooks();
        } else {
            showMessage(
                `Failed to ${
                    currentBookIsAvailable ? 'delete' : 'restore'
                } book`,
                'danger'
            );
        }
    } catch (error) {
        console.error(
            `Error ${currentBookIsAvailable ? 'deleting' : 'restoring'} book:`,
            error
        );
        const errorMessage =
            error.response?.data?.message ||
            `Failed to ${currentBookIsAvailable ? 'delete' : 'restore'} book`;
        showMessage(errorMessage, 'danger');
    }
};

const showBorrowBook = (id, bookName, returnType) => {
    currentBookId = id;
    currentReturnType = returnType;
    document.getElementById('confirmBookName').innerText = bookName;
    document.getElementById('confirmBorrowLength').innerText = checkBorrowLength(returnType);
    const confirmBorrowModal = new bootstrap.Modal(
        document.getElementById('confirmBorrowModal')
    );
    confirmBorrowModal.show();
};



const borrowBook = async () => {
    try {
        const response = await axios.post(
            `${SERVER}/borrow_book`,
            {
                book_id: currentBookId,
                return_type: currentReturnType,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 201) {
            showMessage('Book borrowed successfully', 'success');
            const confirmBorrowModal = bootstrap.Modal.getInstance(
                document.getElementById('confirmBorrowModal')
            );
            confirmBorrowModal.hide();
            fetchBooks();
        } else {
            showMessage('Failed to borrow book', 'danger');
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        const errorMessage =
            error.response?.data?.message ||
            'Failed to borrow book. Please try again.';
        showMessage(errorMessage, 'danger');
    }
};

const initializePage = () => {
    fetchBooks();

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchBooks);
    document
        .getElementById('searchBookBy')
        .addEventListener('change', fetchBooks);
    document
        .getElementById('availabilityFilter')
        .addEventListener('change', fetchBooks);
    document
        .getElementById('borrowLengthFilter')
        .addEventListener('change', fetchBooks);

};

document.addEventListener('DOMContentLoaded', () => {
    if (role !== 'admin') {
        document.getElementById('addBook').style.display = 'none';
    } else {
        document.getElementById('addBook').style.display = 'block';
    }
    initializePage();
});
