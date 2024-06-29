import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

# Define the path to the 'media' directory
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'media')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

class UserFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userName = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(255), nullable=False)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    userName = request.form.get('userName')
    email = request.form.get('email')

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    print(file.filename)
    # Save the file to the 'media' directory
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    # # Save user info and file info to database
    new_file = UserFile(userName=userName, email=email, filename=filename)
    db.session.add(new_file)
    db.session.commit()

    return jsonify({
        'message': 'File uploaded successfully',
        'userName': userName,
        'email': email,
        # 'filename': filename
    }), 200


@app.route('/media/<filename>')
def media(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/images')
def get_images():
    files = UserFile.query.all()
    images = [{'id': file.id, 'userName': file.userName, 'email': file.email, 'filename': file.filename} for file in files]
    return jsonify(images)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
