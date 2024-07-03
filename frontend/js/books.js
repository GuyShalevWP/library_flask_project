const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const role = localStorage.getItem('role');

const message = document.getElementById('message');
const booksList = document.getElementById('booksList');
const updateBookForm = document.getElementById('updateBookForm');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
let currentBookId = null;
let currentBookIsAvailable = null;

// Get error message
const showMessage = (msg, type) => {
    message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
};

// Validate form
const validateForm = (formData) => {
    for (const [key, value] of formData.entries()) {
        if (!value) return false;
    }
    return true;
};

// Fetch books from Flask endpoint
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

// Renders and printing the books
const renderBooksTable = (books) => {
    const searchInput = document
        .getElementById('searchInput')
        .value.toLowerCase();
    const searchCriteria = document.getElementById('searchCriteria').value;

    const filteredBooks = books.filter((book) => {
        let matchesSearch = true;
        if (searchInput) {
            if (searchCriteria === 'all') {
                matchesSearch =
                    book.name.toLowerCase().includes(searchInput) ||
                    book.author.toLowerCase().includes(searchInput);
            } else if (searchCriteria === 'book_name') {
                matchesSearch = book.name.toLowerCase().includes(searchInput);
            } else if (searchCriteria === 'author') {
                matchesSearch = book.author.toLowerCase().includes(searchInput);
            }
        }

        return matchesSearch;
    });

    const checkBorrowLength = (returnType) =>
        ({
            1: '10 days',
            2: '5 days',
            3: '2 days',
        }[returnType] || 'Unknown');

    booksList.innerHTML = filteredBooks
        .map(
            (book) => `
            ${
                role !== 'admin' && !book.is_available
                    ? ``
                    : `
                    <div class="card mt-3">
                        <div class="row no-gutters">
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">${book.name}</h5>
                                    <p class="card-text">Author: ${
                                        book.author
                                    }</p>
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
                                        role !== 'admin'
                                            ? ''
                                            : `<button class="btn btn-primary" onclick="showEditModal(
                                            ${book.id}, 
                                            '${book.name}', 
                                            '${book.author}', 
                                            '${book.release_date}', 
                                            '${book.return_type}', 
                                            '${book.img}'
                                            )">Edit
                                        </button>
                                        <button class="btn ${
                                            book.is_available
                                                ? 'btn-danger'
                                                : 'btn-success'
                                        }" 
                                        onclick="showDeleteModal(
                                            ${book.id}, 
                                            ${book.is_available}
                                        )">
                                        ${
                                            book.is_available
                                                ? 'Delete'
                                                : 'Restore'
                                        }
                                        </button>`
                                    }
                                </div>
                            </div>
                            <div class="col-md-4">
                                <img 
                                    src="${SERVER}/assets/images/${book.img}" 
                                    class="card-img" alt="${book.name}" 
                                    style="max-width: 100%; height: auto;">
                            </div>
                        </div>
                    </div>
                `
            }
        `
        )
        .join('');
};

// Add book
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

// Show edit modal
window.showEditModal = (id, name, author, releaseDate, returnType, img) => {
    currentBookId = id;
    document.getElementById('updateName').value = name;
    document.getElementById('updateAuthor').value = author;
    document.getElementById('updateReleaseDate').value = releaseDate;
    document.getElementById('updateBorrowLength').value = returnType;
    document.getElementById('updateImg').value = '';
    $('#updateBookModal').modal('show');
};

// Update book
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
            $('#updateBookModal').modal('hide');
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

// Show delete modal
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
    $('#deleteBookModal').modal('show');
};

// Delete or Restore book (update availability)
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
            message.innerHTML = `<div class="alert alert-success">Book ${
                currentBookIsAvailable ? 'deleted' : 'restored'
            } successfully</div>`;
            $('#deleteBookModal').modal('hide');
            fetchBooks();
        } else {
            message.innerHTML = `<div class="alert alert-danger">Failed to ${
                currentBookIsAvailable ? 'delete' : 'restore'
            } book</div>`;
        }
    } catch (error) {
        console.error(
            `Error ${currentBookIsAvailable ? 'deleting' : 'restoring'} book:`,
            error
        );
        const errorMessage =
            error.response?.data?.message ||
            `Failed to ${currentBookIsAvailable ? 'delete' : 'restore'} book`;
        message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    }
};

// Initialize page
const initializePage = () => {
    fetchBooks();

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchBooks);
    document
        .getElementById('searchCriteria')
        .addEventListener('change', fetchBooks);
};

// Check if user is admin on page load
document.addEventListener('DOMContentLoaded', () => {
    if (role !== 'admin') {
        document.getElementById('addBook').style.display = 'none';
    } else {
        document.getElementById('addBook').style.display = 'block';
    }
    initializePage();
});
