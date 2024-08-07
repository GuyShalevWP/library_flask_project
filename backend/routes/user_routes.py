from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.auth import User
from models import db
import re


user_bp = Blueprint('user', __name__)

# get the current user info
@user_bp.route('/current_user', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({'message': 'User not found'}), 404

    user_info = {
        'id': current_user.id,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'phone': current_user.phone,
        'is_active': current_user.is_active,
        'role': current_user.role
    }

    return jsonify(user_info), 200

# Endpoint get all users (only admin can see)
@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    # Ensure the current user is an admin
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to access this resource'}), 403

    users = User.query.all()
    users_data = [
        {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'is_active': user.is_active,
            'role': user.role
        }
        for user in users
    ]

    return jsonify(users_data), 200

# Endpoint to get or update user profile
@user_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def get_or_update_profile():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({'message': 'User not found'}), 404

    if request.method == 'GET':
        user_data = {
            'id': current_user.id,
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'phone': current_user.phone,
            'is_active': current_user.is_active,
            'role': current_user.role
        }
        return jsonify(user_data), 200

    if request.method == 'PUT':
        data = request.get_json()
        new_email = data.get('email')
        new_first_name = data.get('first_name')
        new_last_name = data.get('last_name')
        new_phone = data.get('phone')

        if new_email:
            # Validate email format
            if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
                return jsonify({'message': 'Invalid email format. It must contain "@" and "."'}), 400

            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({'message': 'Email already registered'}), 409
            current_user.email = new_email

        if new_first_name:
            current_user.first_name = new_first_name
        if new_last_name:
            current_user.last_name = new_last_name
        if new_phone:
            current_user.phone = new_phone

        db.session.commit()

        # Re-fetch the user to confirm the email update
        updated_user = db.session.get(User, current_user_id)

        return jsonify({'message': 'User information updated successfully', 'updated_email': updated_user.email}), 200


# Endpoint get user details and edit it
@user_bp.route('/user/<int:user_id>/details', methods=['GET', 'PUT'])
@jwt_required()
def get_or_update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    
    # Ensure that the user can access or modify their own account or an admin can access any account
    if current_user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to access or modify this user'}), 403

    user_to_modify = db.session.get(User, user_id)
    if not user_to_modify:
        return jsonify({'message': 'User not found'}), 404

    if request.method == 'GET':
        user_data = {
            'id': user_to_modify.id,
            'email': user_to_modify.email,
            'first_name': user_to_modify.first_name,
            'last_name': user_to_modify.last_name,
            'phone': user_to_modify.phone,
            'is_active': user_to_modify.is_active,
            'role': user_to_modify.role
        }
        return jsonify(user_data), 200
    
    if request.method == 'PUT':
        data = request.get_json()
        new_email = data.get('email')
        new_first_name = data.get('first_name')
        new_last_name = data.get('last_name')
        new_phone = data.get('phone')

        if new_email:
            # Validate email format
            if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
                return jsonify({'message': 'Invalid email format. It must contain "@" and "."'}), 400

            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'message': 'Email already registered'}), 409
            user_to_modify.email = new_email

        if new_first_name:
            user_to_modify.first_name = new_first_name
        if new_last_name:
            user_to_modify.last_name = new_last_name
        if new_phone:
            user_to_modify.phone = new_phone

        db.session.commit()

        # Re-fetch the user to confirm the email update
        updated_user = db.session.get(User, user_id)

        return jsonify({'message': 'User information updated successfully', 'updated_email': updated_user.email}), 200

# Endpoint activate and deactivate user
@user_bp.route('/user/<int:user_id>/set_active', methods=['PUT'])
@jwt_required()
def set_user_active(user_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user_id == user_id and current_user.role == 'admin':
        return jsonify({'message': 'Admin cannot deactivate their own account'}), 403

    if current_user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to modify this user'}), 403

    user_to_update = db.session.get(User, user_id)
    if not user_to_update:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    is_active = data.get('is_active')

    if isinstance(is_active, bool):
        user_to_update.is_active = is_active
        if is_active:
            user_to_update.password_needs_reset = True  # Set a flag indicating that the password needs to be reset
        db.session.commit()
        status = 'deactivated' if not is_active else 'activated'
        return jsonify({'message': f"User's active status set to {status}"}), 200

    return jsonify({'message': 'Invalid or missing \'is_active\' boolean value'}), 400



