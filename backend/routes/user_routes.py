from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.auth import User
from models import db

user_bp = Blueprint('user', __name__)

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

@user_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if current_user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to access this user'}), 403

    user_to_get = db.session.get(User, user_id)
    if not user_to_get:
        return jsonify({'message': 'User not found'}), 404

    user_data = {
        'id': user_to_get.id,
        'email': user_to_get.email,
        'first_name': user_to_get.first_name,
        'last_name': user_to_get.last_name,
        'phone': user_to_get.phone,
        'is_active': user_to_get.is_active,
        'role': user_to_get.role
    }

    return jsonify(user_data), 200

@user_bp.route('/user/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    
    # Ensure that only the user who owns the account can update their email or password
    if current_user_id != user_id:
        return jsonify({'message': 'Unauthorized to modify this user'}), 403

    user_to_update = db.session.get(User, user_id)
    if not user_to_update:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    new_email = data.get('email')
    new_password = data.get('password')

    if new_email:
        existing_user = User.query.filter_by(email=new_email).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'message': 'Email already registered'}), 409
        user_to_update.email = new_email

    if new_password:
        user_to_update.set_password(new_password)

    db.session.commit()

    # Re-fetch the user to confirm the email update
    updated_user = db.session.get(User, user_id)

    return jsonify({'message': 'User information updated successfully', 'updated_email': updated_user.email}), 200

@user_bp.route('/user/<int:user_id>/details', methods=['PUT'])
@jwt_required()
def update_user_details(user_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    
    if current_user_id != user_id:
        return jsonify({'message': 'Unauthorized to modify this user'}), 403

    user_to_update = db.session.get(User, user_id)
    if not user_to_update:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    new_first_name = data.get('first_name')
    new_last_name = data.get('last_name')
    new_phone = data.get('phone')

    if new_first_name:
        user_to_update.first_name = new_first_name
    if new_last_name:
        user_to_update.last_name = new_last_name
    if new_phone:
        user_to_update.phone = new_phone

    db.session.commit()
    return jsonify({'message': 'User details updated successfully'}), 200

@user_bp.route('/user/<int:user_id>/set_active', methods=['PUT'])
@jwt_required()
def set_user_active(user_id):
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)
    
    if current_user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized to modify this user'}), 403

    user_to_update = db.session.get(User, user_id)
    if not user_to_update:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    is_active = data.get('is_active')

    if isinstance(is_active, bool):
        user_to_update.is_active = is_active
        db.session.commit()
        status = 'deactivated' if not is_active else 'activated'
        return jsonify({'message': f"User's active status set to {status}"}), 200

    return jsonify({'message': 'Invalid or missing \'is_active\' boolean value'}), 400
