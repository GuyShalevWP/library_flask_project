# Library Management System

## Project Overview

This project is a simple Flask-based RESTful API designed to manage a library system. It supports user account creation, authentication, book management, customer management, and book borrowings.

## Features

-   User authentication and authorization
-   User management (CRUD operations)
-   Book management (CRUD operations)
-   Borrow management (CRUD operations)
-   Responsive frontend pages for interaction with the system

## Features

### Backend

-   :white_check_mark: Create authentication and authorization
-   :white_check_mark: Create login endpoint and get token
-   :white_check_mark: Update client details
-   :white_check_mark: Implement CRUD with REST API for users
-   :white_check_mark: Implement CRUD with REST API for books
-   :white_check_mark: Implement CRUD with REST API for borrowings

### Frontend

-   :white_check_mark: Create Home page
-   :white_check_mark: Create Signin and Register pages
-   :white_check_mark: Create Books page and implement CRUD with REST API
-   :white_check_mark: Create Customers (users) page and implement CRUD with REST API
-   :white_check_mark: Create Borrow Books page and implement CRUD with REST API
-   :white_large_square: Add footer (In process)
-   :white_large_square: Style (In process)

## Installation and Setup

1. Clone the Repository:

```
git clone https://github.com/GuyShalevWP/library_flask_project.git
cd project
```

2. Create a Virtual Environment:

```
python -m virtualenv env
source env\Scripts\activate
```

3. Install Dependencies:

```
pip install -r requirements.txt
```

4. Run the Server:

```
python app.py
```

_If there's no data in library.db, in app.py there're Default setups (run the app first)_

## Usage

### Authentication

-   **Register**: `POST /register`
-   **Login**: `POST /login`
-   **Change password**: `PUT /user/change_password`
-   **Request reset password**: `POST /user/request_reset_password`
-   **Reset password**: `PUT /user/reset_password`

### User Management

-   **Get all users**: `GET /users`
-   **Get user by ID**: `GET /user/<user_id>`
-   **Update user**: `PUT /user/<user_id>`
-   **Update user details**: `PUT /user/<user_id>/details`
-   **Set user active/inactive**: `PUT /user/<user_id>/set_active`

### Book Management

-   **Get all books**: `GET /books`
-   **Add a book**: `POST /add_book`
-   **Update a book**: `PUT /update_book/<book_id>`
-   **Delete/restore a book**: `PUT /delete_book/<book_id>`

### Borrow Management

-   **Borrow a book**: `POST /borrow_book`
-   **Return a book**: `PUT /return_book/<borrow_id>`
-   **Get all borrowed books**: `GET /borrowed_books`
-   **Get user borrowed books**: `GET /my_borrowed_books`

### Frontend Pages

-   **Home**: Displays general information and navigation links.
-   **Signin/Register**: Forms for user authentication.
-   **Books**: List of books with options to add, edit, delete, and restore.
-   **Customers**: List of customers with options to manage their details.
-   **Borrow Books**: Form to borrow a book.
-   **Profile**: Displays user profile details and borrowed books.
