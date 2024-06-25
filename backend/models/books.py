from . import db

class Books(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    author = db.Column(db.String(50), nullable=False)
    release_date = db.Column(db.String(20), nullable=False)
    img = db.Column(db.String(100), nullable=True)
    is_borrowed = db.Column(db.Boolean, default=False, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False)