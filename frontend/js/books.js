const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const role = localStorage.getItem('role');

const message = document.getElementById('message');
const booksList = document.getElementById('booksList');
const addBookForm = document.getElementById('addBookForm');
let currentBookId = null;

const updateBookForm = document.getElementById('updateBookForm');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
let currentBookIsAvailable = true;

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

    booksList.innerHTML = filteredBooks
        .map(
            (book) => `
            <div class="card mt-3">
                <div class="row no-gutters">
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${book.name}</h5>
                            <p class="card-text">Author: ${book.author}</p>
                            <p class="card-text">Release Date: ${
                                book.release_date
                            }</p>
                            <p class="card-text">Status: ${
                                book.is_borrowed ? 'Unavailable' : 'Available'
                            }</p>
                            ${
                                role === 'admin'
                                    ? `<button class="btn btn-primary" onclick="showEditModal(${
                                          book.id
                                      }, '${book.name}', '${book.author}', '${
                                          book.release_date
                                      }', '${book.img}')">Edit</button>
                            <button class="btn ${
                                book.is_available ? 'btn-danger' : 'btn-success'
                            }" onclick="showDeleteModal(${book.id}, ${
                                          book.is_available
                                      })">${
                                          book.is_available
                                              ? 'Delete'
                                              : 'Restore'
                                      }</button>`
                                    : ''
                            }
                        </div>
                    </div>
                    <div class="col-md-4">
                        <img src="${SERVER}/assets/images/${
                book.img
            }" class="card-img" alt="${
                book.name
            }" style="max-width: 100%; height: auto;">
                    </div>
                </div>
            </div>
        `
        )
        .join('');
};

// Add book
const addBook = () => {
    const name = document.getElementById('name').value;
    const author = document.getElementById('author').value;
    const releaseDate = document.getElementById('release_date').value;
    const img = document.getElementById('img').files[0];
    const message = document.getElementById('message');

    if (!name || !author || !releaseDate || !img) {
        message.innerHTML = `<div class="alert alert-danger">Please fill all the fields</div>`;
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('author', author);
    formData.append('release_date', releaseDate);
    formData.append('img', img);

    axios
        .post(`${SERVER}/add_book`, formData, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
            const msg = response.data.message;

            message.innerHTML = `<div class="alert alert-success">${msg}</div>`;

            // Optionally, clear the form fields
            document.getElementById('addBookForm').reset();

            fetchBooks();
        })
        .catch((error) => {
            console.error('Error adding book:', error);
            const errorMessage =
                error.response?.data?.message ||
                'Failed to add book. Please try again.';
            message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        });
};

// Show edit modal
window.showEditModal = (id, name, author, releaseDate, img) => {
    currentBookId = id;
    document.getElementById('updateName').value = name;
    document.getElementById('updateAuthor').value = author;
    document.getElementById('updateReleaseDate').value = releaseDate;
    document.getElementById('updateImg').value = '';
    $('#updateBookModal').modal('show');
};

// Update book
const updateBook = async () => {
    const formData = new FormData(document.getElementById('updateBookForm'));
    const message = document.getElementById('message');

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
            message.innerHTML =
                '<div class="alert alert-success">Book updated successfully</div>';
            $('#updateBookModal').modal('hide');
            fetchBooks();
        } else {
            message.innerHTML =
                '<div class="alert alert-danger">Failed to update book</div>';
        }
    } catch (error) {
        console.error('Error updating book:', error);
        const errorMessage =
            error.response?.data?.message || 'Failed to update book';
        message.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
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
