from werkzeug.security import generate_password_hash
from models.auth import User
from models import db

#TODO: change password for admin 

# Creates a default admin user
def create_default_admin():
    default_admin_email = "guy@guy.com"
    existing_user = User.query.filter_by(email=default_admin_email).first()
    
    if not existing_user:
        default_admin = User(
            email=default_admin_email,
            password_hash=generate_password_hash("123@123"),
            first_name="Guy",
            last_name="Guy",
            phone="1122334455",
            role="admin",
            is_active=True
        )
        db.session.add(default_admin)
        db.session.commit()
        print("Default admin user created.")
    else:
        print("Default admin user already exists.")
