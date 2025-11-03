# app/__init__.py
from flask import Flask
from .config import Config

def create_app():
    app = Flask(
        __name__,
        template_folder="../templates",  # <- están fuera de app/
        static_folder="../static"
    )
    app.config.from_object(Config)

    from .routes.pages import bp as pages_bp
    from .routes.menu import bp as menu_bp
    from .routes.clientes import bp as clientes_bp
    from .routes.registros import bp as registros_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(menu_bp, url_prefix="/api")
    app.register_blueprint(clientes_bp, url_prefix="/api")
    app.register_blueprint(registros_bp, url_prefix="/api")
    return app
