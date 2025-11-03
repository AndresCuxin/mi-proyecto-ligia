# app/routes/pages.py
from flask import Blueprint, render_template
bp = Blueprint("pages", __name__)

@bp.get("/")
def index():
    return render_template("pages/index.html")  # o "index.html" según tu estructura
