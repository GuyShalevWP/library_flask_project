from werkzeug.security import generate_password_hash
from models.auth import User
from models import db


# Creates a default admin user
def create_default_admin():
    default_admin_email = "admin@admin.com"
    existing_user = User.query.filter_by(email=default_admin_email).first()
    
    if not existing_user:
        default_admin = User(
            email=default_admin_email,
            password_hash=generate_password_hash("123@123"),
            first_name="Admin",
            last_name="Admin",
            phone="1122334455",
            role="admin",
            is_active=True
        )
        db.session.add(default_admin)
        db.session.commit()
        print("Default admin user created.")
    else:
        print("Default admin user already exists.")

# Creates 5 default users
def create_default_users():
    default_users = [
        {
            "email": "user1@example.com",
            "password": "password1@123",
            "first_name": "Alice",
            "last_name": "Johnson",
            "phone": "1112223333"
        },
        {
            "email": "user2@example.com",
            "password": "password2@123",
            "first_name": "Bob",
            "last_name": "Smith",
            "phone": "2223334444"
        },
        {
            "email": "user3@example.com",
            "password": "password3@123",
            "first_name": "Charlie",
            "last_name": "Brown",
            "phone": "3334445555"
        },
        {
            "email": "user4@example.com",
            "password": "password4@123",
            "first_name": "David",
            "last_name": "Wilson",
            "phone": "4445556666"
        },
        {
            "email": "user5@example.com",
            "password": "password5@123",
            "first_name": "Eva",
            "last_name": "Davis",
            "phone": "5556667777"
        }
    ]

    for user_data in default_users:
        existing_user = User.query.filter_by(email=user_data["email"]).first()
        
        if not existing_user:
            new_user = User(
                email=user_data["email"],
                password_hash=generate_password_hash(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone=user_data["phone"],
                is_active=True
            )
            db.session.add(new_user)
            print(f"Default user {user_data['email']} created.")
        else:
            print(f"Default user {user_data['email']} already exists.")
    
    db.session.commit()
    print("Default users created.")