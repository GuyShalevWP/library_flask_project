from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token
from models.auth import User
from models import db

auth_bp = Blueprint('auth', __name__ ) #url_prefix='/auth'

#TODO: add errors in case the password too short, or missing special char
#TODO: add errors in case the email don't contain @ and .
#TODO: before commit change first latter of first name and last name to be capitalized

# Register
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    role = data.get('role', 'user')  # Default role is 'user' if not provided

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409

    new_user = User(email=email, first_name=first_name, last_name=last_name, phone=phone, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()

    if user and user.check_password(data.get('password')) and user.is_active:
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            "user": {"id": user.id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email,"phone": user.phone, "is_active": user.is_active, "role": user.role}
        }), 200

    return jsonify({'message': 'Invalid username or password'}), 401
