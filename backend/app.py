from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config.config import Config
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

    with app.app_context():
        from routes.auth_routes import auth_bp
        from routes.user_routes import user_bp
        from routes.book_routes import book_bp

        app.register_blueprint(auth_bp)
        app.register_blueprint(user_bp)
        app.register_blueprint(book_bp)

        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=7000)
