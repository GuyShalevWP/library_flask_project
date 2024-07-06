from flask import Blueprint, jsonify, current_app
from werkzeug.utils import secure_filename
from models.books import Books
from models import db
from PIL import Image
import os


# Function to create default books
def create_default_books():
    default_books = [
        {
            "name": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "release_date": "11-07-1960",
            "img": "To_Kill_a_MockingbirdHarper_Lee.jpg",
            "return_type": 1
        },
        {
            "name": "1984",
            "author": "George Orwell",
            "release_date": "08-06-1949",
            "img": "1984George_Orwell.jpg",
            "return_type": 3
        },
        {
            "name": "Pride and Prejudice",
            "author": "Jane Austen",
            "release_date": "28-01-1813",
            "img": "Pride_and_PrejudiceJane_Austen.jpeg",
            "return_type": 2
        },
        {
            "name": "Harry Potter and the Philosopher's Stone",
            "author": "J.K. Rowling",
            "release_date": "26-06-1997",
            "img": "Harry_Potter_and_the_Philosophers_StoneJ.K._Rowling.jpg",
            "return_type": 1
        },
        {
            "name": "Moby Dick",
            "author": "Herman Melville",
            "release_date": "18-10-1851",
            "img": "Moby_DickHerman_Melville.jpeg",
            "return_type": 1
        }
    ]

    added_books = []
    for book_data in default_books:
        # Check if a book with the same name and author already exists
        existing_book = Books.query.filter_by(name=book_data["name"], author=book_data["author"]).first()
        
        if not existing_book:
            try:
                # Path to the image file
                img_path = os.path.join('assets/images', book_data['img'])
                
                if not os.path.exists(img_path):
                    return jsonify({'message': f"Image file {book_data['img']} not found"}), 400
                
                # Secure filename
                filename = secure_filename(book_data['name'] + book_data['author'] + '.' + img_path.rsplit('.', 1)[1].lower())
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                
                # Open and resize the image
                image = Image.open(img_path)
                image = image.resize((500, 500), Image.Resampling.LANCZOS)
                image.save(upload_path)
                
                new_book = Books(
                    name=book_data['name'].title(),
                    author=book_data['author'].title(),
                    release_date=book_data['release_date'],
                    img=filename,
                    return_type=book_data['return_type'],
                    is_borrowed=False,
                    is_available=True
                )
                
                db.session.add(new_book)
                db.session.commit()
                added_books.append(new_book)
            except Exception as e:
                db.session.rollback()
                return jsonify({'message': f"Error adding book {book_data['name']}", 'error': str(e)}), 500
        else:
            print(f"Default book '{book_data['name']}' already exists.")

    return jsonify({'message': 'Default books added successfully', 'books': [book.name for book in added_books]}), 201
