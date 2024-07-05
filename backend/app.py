from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config.config import Config
from utils.ensure_upload_folder_exists import ensure_upload_folder_exists
from utils.default_user import create_default_admin
from models import db  # Import the single instance of db


jwt = JWTManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Ensure the upload folder exists
    ensure_upload_folder_exists(app.config['UPLOAD_FOLDER'])
    

    with app.app_context():
        from routes.auth_routes import auth_bp
        from routes.user_routes import user_bp
        from routes.book_routes import book_bp
        from routes.borrow_routes import borrow_bp

        app.register_blueprint(auth_bp)
        app.register_blueprint(user_bp)
        app.register_blueprint(book_bp)
        app.register_blueprint(borrow_bp)

        db.create_all()
        create_default_admin()


    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=7000)
