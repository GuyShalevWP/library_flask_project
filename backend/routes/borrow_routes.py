from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.borrow import BorrowedBook
from models.books import Books
from models.auth import User
from models import db
from datetime import datetime, timedelta

borrow_bp = Blueprint('borrow', __name__)

def calculate_return_date(borrow_date_str, return_type):
    borrow_date = datetime.strptime(borrow_date_str, '%d-%m-%Y')
    if return_type == 1:
        return borrow_date + timedelta(days=10)
    elif return_type == 2:
        return borrow_date + timedelta(days=5)
    elif return_type == 3:
        return borrow_date + timedelta(days=2)
    else:
        raise ValueError('Invalid return type')

@borrow_bp.route('/borrow_book', methods=['POST'])
@jwt_required()
def borrow_book():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user.role not in ['admin', 'user']:
        return jsonify({'message': 'Unauthorized to borrow books'}), 403

    data = request.get_json()
    book_id = data.get('book_id')
    borrow_date = data.get('borrow_date', datetime.utcnow().strftime('%d-%m-%Y'))
    return_type = data.get('return_type')

    if return_type not in [1, 2, 3]:
        return jsonify({'message': 'Invalid return type.'}), 400

    book = db.session.get(Books, book_id)
    if not book:
        return jsonify({'message': 'Book not found'}), 404

    if book.is_borrowed:
        return jsonify({'message': 'Book is already borrowed'}), 409

    return_date = calculate_return_date(borrow_date, return_type).strftime('%d-%m-%Y')

    borrowed_book = BorrowedBook(
        user_id=current_user_id,
        book_id=book_id,
        borrow_date=borrow_date,
        return_type=return_type,
        return_date=return_date
    )

    book.is_borrowed = True
    db.session.add(borrowed_book)
    db.session.commit()

    return jsonify({
        'message': 'Book borrowed successfully',
        'book': {'name': book.name, 'author': book.author},
        'borrow_date': borrow_date,
        'return_date': return_date
    }), 201

@borrow_bp.route('/borrowed_books', methods=['GET'])
@jwt_required()
def get_all_borrowed_books():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to access borrowed books'}), 403

    borrowed_books = BorrowedBook.query.all()
    borrowed_books_data = [
        {
            'id': borrowed_book.id,
            'user_email': borrowed_book.user.email,
            'first_name': borrowed_book.user.first_name,
            'last_name': borrowed_book.user.last_name,
            'book_name': borrowed_book.book.name,
            'is_borrowed': borrowed_book.book.is_borrowed,
            'return_type': borrowed_book.return_type,
            'borrow_date': borrowed_book.borrow_date,
            'return_date': borrowed_book.return_date if borrowed_book.return_type == 0 else calculate_return_date(borrowed_book.borrow_date, borrowed_book.return_type).strftime('%d-%m-%Y'),
        }
        for borrowed_book in borrowed_books
    ]
    return jsonify(borrowed_books_data), 200

@borrow_bp.route('/my_borrowed_books', methods=['GET'])
@jwt_required()
def get_user_borrowed_books():
    current_user_id = get_jwt_identity()
    borrowed_books = BorrowedBook.query.filter_by(user_id=current_user_id).all()
    borrowed_books_data = [
        {
            'id': borrowed_book.id,
            'book_id': borrowed_book.book_id,
            'borrow_date': borrowed_book.borrow_date,
            'return_type': borrowed_book.return_type,
            'book_name': borrowed_book.book.name
        }
        for borrowed_book in borrowed_books
    ]
    return jsonify(borrowed_books_data), 200

@borrow_bp.route('/return_book/<int:borrow_id>', methods=['GET', 'PUT'])
@jwt_required()
def return_book(borrow_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    borrowed_book = db.session.get(BorrowedBook, borrow_id)

    if not borrowed_book:
        return jsonify({'message': 'Borrowed book not found'}), 404

    if borrowed_book.user_id != current_user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to return this book'}), 403

    book = db.session.get(Books, borrowed_book.book_id)
    book.is_borrowed = False

    borrowed_book.return_type = 0  # Assuming return_type 0 indicates the book has been returned
    borrowed_book.return_date = datetime.utcnow().strftime('%d-%m-%Y')  # Set return_date to current date

    db.session.commit()
    return jsonify({'message': 'Book returned successfully'}), 200