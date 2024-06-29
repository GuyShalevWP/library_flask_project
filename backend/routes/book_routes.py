from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.books import Books
from models.auth import User  # Ensure User is imported
from models import db

book_bp = Blueprint('books', __name__)

@book_bp.route('/add_book', methods=['POST'])
@jwt_required()
def add_book():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to add books'}), 403

    data = request.get_json()
    name = data.get('name')
    author = data.get('author')
    release_date = data.get('release_date')
    img = data.get('img', None)
    is_borrowed = data.get('is_borrowed', False)
    is_available = data.get('is_available', True)

    if Books.query.filter_by(name=name).first():
        return jsonify({'message': 'Book already exists'}), 409

    new_book = Books(
        name=name,
        author=author,
        release_date=release_date,
        img=img,
        is_borrowed=is_borrowed,
        is_available=is_available
    )
    db.session.add(new_book)
    db.session.commit()

    return jsonify({'message': 'Book added successfully'}), 201

@book_bp.route('/books', methods=['GET'])
def get_books():
    books = Books.query.all()
    books_data = [
        {
            'id': book.id,
            'name': book.name,
            'author': book.author,
            'release_date': book.release_date,
            'img': book.img,
            'is_borrowed': book.is_borrowed,
            'is_available': book.is_available
        }
        for book in books
    ]
    return jsonify(books_data), 200

@book_bp.route('/update_book/<int:book_id>', methods=['GET', 'PUT'])
@jwt_required(optional=True)
def update_book(book_id):
    if request.method == 'GET':
        book = db.session.get(Books, book_id)
        if not book:
            return jsonify({'message': 'Book not found'}), 404

        book_data = {
            'id': book.id,
            'name': book.name,
            'author': book.author,
            'release_date': book.release_date,
            'img': book.img,
            'is_borrowed': book.is_borrowed,
            'is_available': book.is_available
        }
        return jsonify(book_data), 200

    if request.method == 'PUT':
        current_user_id = get_jwt_identity()
        current_user = db.session.get(User, current_user_id)

        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Unauthorized to update books'}), 403

        book = db.session.get(Books, book_id)
        if not book:
            return jsonify({'message': 'Book not found'}), 404

        data = request.get_json()
        book.name = data.get('name', book.name)
        book.author = data.get('author', book.author)
        book.release_date = data.get('release_date', book.release_date)
        book.img = data.get('img', book.img)
        book.is_borrowed = data.get('is_borrowed', book.is_borrowed)

        db.session.commit()
        return jsonify({'message': 'Book updated successfully'}), 200
    
@book_bp.route('/delete_book/<int:book_id>', methods=['PUT'])
@jwt_required()
def delete_book(book_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to delete books'}), 403

    book = db.session.get(Books, book_id)
    if not book:
        return jsonify({'message': 'Book not found'}), 404

    data = request.get_json()
    is_available = data.get('is_available')

    if isinstance(is_available, bool):
        book.is_available = is_available
        db.session.commit()
        status = 'deleted' if not is_available else 'restored'
        return jsonify({'message': f"Book has been {status} successfully"}), 200

    return jsonify({'message': 'Invalid or missing \'is_available\' boolean value'}), 400