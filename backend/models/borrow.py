from . import db

class BorrowedBook(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    borrow_date = db.Column(db.String(10), nullable=False)
    estimated_return_date = db.Column(db.String(10), nullable=False)
    return_date = db.Column(db.String(10), nullable=True)
    is_returned = db.Column(db.Boolean, default=False, nullable=False)
    late_return = db.Column(db.Boolean, default=False, nullable=False)
    user = db.relationship('User', backref=db.backref('borrowed_books', lazy=True))
    book = db.relationship('Books', backref=db.backref('borrowed_books', lazy=True))
