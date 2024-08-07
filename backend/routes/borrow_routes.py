from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.borrow import BorrowedBook
from models.books import Books
from models.auth import User
from models import db
from utils.calculate_return_date import calculate_return_date
from datetime import datetime

borrow_bp = Blueprint('borrow', __name__)


# Endpoint borrow a book
@borrow_bp.route('/borrow_book', methods=['POST'])
@jwt_required()
def borrow_book():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user.role not in ['admin', 'user']:
        return jsonify({'message': 'Unauthorized to borrow books'}), 403

    data = request.get_json()
    book_id = data.get('book_id')
    return_type = data.get('return_type')
    borrow_date = data.get('borrow_date', datetime.utcnow().strftime('%d-%m-%Y'))

    if not book_id or not return_type:
        return jsonify({'message': 'Missing required fields'}), 400

    book = db.session.get(Books, book_id)
    if not book:
        return jsonify({'message': 'Book not found'}), 404

    if book.is_borrowed:
        return jsonify({'message': 'Book is already borrowed'}), 409

    try:
        estimated_return_date = calculate_return_date(borrow_date, return_type).strftime('%d-%m-%Y')
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    borrowed_book = BorrowedBook(
        user_id=current_user_id,
        book_id=book_id,
        borrow_date=borrow_date,
        estimated_return_date=estimated_return_date,
        is_returned=False,
        late_return=False
    )

    book.is_borrowed = True
    db.session.add(borrowed_book)
    db.session.commit()

    return jsonify({
        'message': 'Book borrowed successfully',
        'book': {'name': book.name.title(), 'author': book.author.title()},
        'borrow_date': borrow_date,
        'estimated_return_date': estimated_return_date
    }), 201

# Endpoint for all users borrowed books
@borrow_bp.route('/all_borrowed_books', methods=['GET'])
@jwt_required()
def get_all_borrowed_books():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to view borrowed books'}), 403

    borrowed_books = BorrowedBook.query.all()
    current_date = datetime.utcnow().strftime('%d-%m-%Y')
    current_date = datetime.strptime(current_date, '%d-%m-%Y')
    borrowed_books_data = []

    for borrowed_book in borrowed_books:
        # Check if current date is past the estimated return date
        if borrowed_book.estimated_return_date:
            estimated_return_date = datetime.strptime(borrowed_book.estimated_return_date, '%d-%m-%Y')
            if current_date > estimated_return_date and not borrowed_book.return_date:
                borrowed_book.late_return = True
                db.session.commit()  # Commit the change to the database

        borrowed_books_data.append({
            'id': borrowed_book.id,
            'user_email': borrowed_book.user.email,
            'first_name': borrowed_book.user.first_name,
            'last_name': borrowed_book.user.last_name,
            'book_id': borrowed_book.book_id,
            'book_name': borrowed_book.book.name.title(),
            'author': borrowed_book.book.author.title(),
            'is_borrowed': borrowed_book.book.is_borrowed,
            'borrow_date': borrowed_book.borrow_date,
            'is_returned': borrowed_book.is_returned,
            'estimated_return_date': borrowed_book.estimated_return_date,
            'return_date': borrowed_book.return_date,
            'late_return': borrowed_book.late_return,
        })

    return jsonify(borrowed_books_data), 200

# Endpoint for user borrowed books
@borrow_bp.route('/my_borrowed_books', methods=['GET'])
@jwt_required()
def get_user_borrowed_books():
    current_user_id = get_jwt_identity()
    borrowed_books = BorrowedBook.query.filter_by(user_id=current_user_id).all()

    if not current_user_id:
        return jsonify({'message': 'Unauthorized to view borrowed books'}), 403
    
    current_date = datetime.utcnow().strftime('%d-%m-%Y')
    current_date = datetime.strptime(current_date, '%d-%m-%Y')
    borrowed_books_data = []

    for borrowed_book in borrowed_books:
        # Check if current date is past the estimated return date
        if borrowed_book.estimated_return_date:
            estimated_return_date = datetime.strptime(borrowed_book.estimated_return_date, '%d-%m-%Y')
            if current_date > estimated_return_date and not borrowed_book.return_date:
                borrowed_book.late_return = True
                db.session.commit()  # Commit the change to the database

        borrowed_books_data.append({
            'id': borrowed_book.id,
            'user_email': borrowed_book.user.email,
            'first_name': borrowed_book.user.first_name,
            'last_name': borrowed_book.user.last_name,
            'book_id': borrowed_book.book_id,
            'book_name': borrowed_book.book.name.title(),
            'author': borrowed_book.book.author.title(),
            'is_borrowed': borrowed_book.book.is_borrowed,
            'borrow_date': borrowed_book.borrow_date,
            'is_returned': borrowed_book.is_returned,
            'estimated_return_date': borrowed_book.estimated_return_date,
            'return_date': borrowed_book.return_date,
            'late_return': borrowed_book.late_return,
        })

    return jsonify(borrowed_books_data), 200

# Endpoint return book
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
    borrowed_book.is_returned = True
    borrowed_book.return_date = datetime.utcnow().strftime('%d-%m-%Y')  # Set return_date to current date

    db.session.commit()
    return jsonify({'message': 'Book returned successfully'}), 200