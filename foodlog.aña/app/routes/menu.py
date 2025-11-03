from flask import Blueprint, jsonify
from ..menu_data import MENU

bp = Blueprint("menu", __name__)

@bp.get("/menu")
def api_menu():
    return jsonify(MENU)
