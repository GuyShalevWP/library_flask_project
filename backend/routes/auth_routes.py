from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from models.auth import User
from models import db
import re

auth_bp = Blueprint('auth', __name__ ) #url_prefix='/auth'

# Register
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name').title()
    last_name = data.get('last_name').title()
    phone = data.get('phone')
    role = data.get('role', 'user')  # Default role is 'user' if not provided

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'message': 'Invalid email format. It must contain "@" and "."'}), 400

    # Validate password length
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long.'}), 400

    # Validate password for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return jsonify({'message': 'Password must contain at least one special character.'}), 400

    new_user = User(email=email, first_name=first_name, last_name=last_name, phone=phone, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()

    if user and user.check_password(data.get('password')):
        if not user.is_active:
            return jsonify({'message': 'User account is deactivated. Please reset your password.', 'status': 'deactivated'}), 403

        if user.password_needs_reset:
            return jsonify({'message': 'Password needs to be reset. Please reset your password.', 'status': 'password_reset'}), 403

        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
        }), 200

    return jsonify({'message': 'Invalid username or password'}), 401


