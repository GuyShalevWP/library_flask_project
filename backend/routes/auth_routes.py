from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token
from models.auth import User
from models.roles import Role, UserRole
from models import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    roles = data.get('roles', ['user'])  # Default role is 'user' if not provided

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409

    new_user = User(email=email, first_name=first_name, last_name=last_name, phone=phone)
    new_user.set_password(password)
    db.session.add(new_user)
    
    for role_name in roles:
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name)
            db.session.add(role)
        new_user.roles.append(role)
    
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

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
            'refresh_token': refresh_token
        }), 200

    return jsonify({'message': 'Invalid username or password'}), 401
