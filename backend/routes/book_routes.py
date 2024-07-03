import os
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
from models.books import Books
from models.auth import User
from models import db

book_bp = Blueprint('books', __name__)

# Add book
@book_bp.route('/add_book', methods=['POST'])
@jwt_required()
def add_book():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to add books'}), 403

    data = request.form
    name = data.get('name')
    author = data.get('author')
    release_date = data.get('release_date')
    img_file = request.files.get('img')
    return_type = data.get('return_type', 1)  # Default return type if not provided

    if not name or not author or not release_date or not return_type:
        return jsonify({'message': 'Missing required fields'}), 400
    
    if int(return_type) not in [1, 2, 3]:
        return jsonify({'message': 'Invalid return type.'}), 400

    # Check if a book with the same name and author already exists
    existing_book = Books.query.filter_by(name=name, author=author).first()
    if existing_book:
        return jsonify({'message': 'A book with the same name and author already exists.'}), 409
    
    try:
        filename = secure_filename(name + author + '.' + img_file.filename.rsplit('.', 1)[1].lower())
        img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # Open the image file
        image = Image.open(img_file)
        # Resize the image
        image = image.resize((500, 500), Image.Resampling.LANCZOS)
        # Save the image
        image.save(img_path)
    except Exception as e:
        return jsonify({'message': 'Error saving image file', 'error': str(e)}), 500

    # Capitalize the first letter of each word in the author and name of the book
    name = name.title()
    author = author.title()

    new_book = Books(
        name=name,
        author=author,
        release_date=release_date,
        img=filename,
        return_type=return_type,
        is_borrowed=False,
        is_available=True
    )

    db.session.add(new_book)
    db.session.commit()

    return jsonify({'message': 'Book added successfully'}), 201

# Pathing uploaded image
@book_bp.route('/assets/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# Get all books (with or without user)
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
            'is_available': book.is_available,
            'return_type': book.return_type
        }
        for book in books
    ]
    return jsonify(books_data), 200

# Update book (name, author, release date, image)
@book_bp.route('/update_book/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to update books'}), 403

    book = db.session.query(Books).get(book_id)
    if not book:
        return jsonify({'message': 'Book not found'}), 404

    data = request.form
    img_file = request.files.get('img')
    name = data.get('name', book.name).title()
    author = data.get('author', book.author).title()
    release_date = data.get('release_date', book.release_date)
    return_type = data.get('return_type', book.return_type)

    # Check if any required field is empty
    if not name or not author or not release_date or not return_type:
        return jsonify({'message': 'Missing required fields'}), 400

    # Check if the return type is valid
    if int(return_type) not in [1, 2, 3]:
        return jsonify({'message': 'Invalid return type.'}), 400

    # Check if a book with the same name and author already exists
    existing_book = Books.query.filter_by(name=name, author=author).first()
    if existing_book and existing_book.id != book_id:
        return jsonify({'message': 'A book with the same name and author already exists.'}), 409

    book.name = name
    book.author = author
    book.release_date = release_date
    book.return_type = return_type

    if img_file:
        try:
            # Open the image file
            image = Image.open(img_file)
            # Resize the image
            image = image.resize((500, 500), Image.Resampling.LANCZOS)
            # Save the image to a temporary path
            temp_filename = secure_filename('temp_' + book.name + book.author + '.' + img_file.filename.rsplit('.', 1)[1].lower())
            temp_img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
            image.save(temp_img_path)
            
            # If saving the new image was successful, remove the old image if it exists
            if book.img and os.path.exists(os.path.join(current_app.config['UPLOAD_FOLDER'], book.img)):
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], book.img))
            
            # Rename the temporary file to the final filename
            filename = secure_filename(book.name + book.author + '.' + img_file.filename.rsplit('.', 1)[1].lower())
            final_img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            os.rename(temp_img_path, final_img_path)
            
            # Update the book's image attribute
            book.img = filename

        except Exception as e:
            return jsonify({'message': 'Error saving image file', 'error': str(e)}), 500

    db.session.commit()
    return jsonify({'message': 'Book updated successfully'}), 200



# Enable/Disable a book (change is_available)
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

    return jsonify({'message': 'Invalid or missing "is_available" boolean value'}), 400
