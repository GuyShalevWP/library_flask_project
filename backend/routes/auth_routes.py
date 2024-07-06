from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.auth import User
from models import db
import re
import secrets
from datetime import datetime, timedelta

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

# Endpoint change password
@auth_bp.route('/user/change_password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not current_user.check_password(old_password):
        return jsonify({'message': 'Old password is incorrect'}), 403

    # Validate password length
    if len(new_password) < 6:
        return jsonify({'message': 'Password is too short. It must be at least 6 characters long.'}), 400

    # Validate password for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
        return jsonify({'message': 'Password must contain at least one special character.'}), 400

    current_user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200



@auth_bp.route('/user/request_reset_password', methods=['POST'])
def request_reset_password():
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Generate a secure token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiration = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour

    db.session.commit()

    return jsonify({'message': 'Password reset token generated. Use the following token to reset your password.', 'reset_token': reset_token}), 200

@auth_bp.route('/user/reset_password', methods=['POST'])
@jwt_required()
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Invalid email address'}), 400

    # Validate password length
    if len(new_password) < 6:
        return jsonify({'message': 'Password is too short. It must be at least 6 characters long.'}), 400

    # Validate password for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
        return jsonify({'message': 'Password must contain at least one special character.'}), 400

    user.set_password(new_password)
    user.password_needs_reset = False  # Clear the flag
    user.is_active = True  # Set the user as active
    db.session.commit()

    return jsonify({'message': 'Password has been reset successfully'}), 200


