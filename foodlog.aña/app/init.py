from flask import Flask, jsonify
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Blueprints
    from .routes.pages import bp as pages_bp
    from .routes.menu import bp as menu_bp
    from .routes.clientes import bp as clientes_bp
    from .routes.registros import bp as registros_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(menu_bp, url_prefix="/api")
    app.register_blueprint(clientes_bp, url_prefix="/api")
    app.register_blueprint(registros_bp, url_prefix="/api")

    # Ejemplo de error handler JSON para APIs
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"ok": False, "error": "No encontrado"}), 404

    return app
