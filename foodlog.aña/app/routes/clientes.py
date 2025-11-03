from flask import Blueprint, request, jsonify
from ..db import get_conn

bp = Blueprint("clientes", __name__)

@bp.post("/clientes")
def clientes_crear_o_buscar():
    """Crea o recupera un cliente por teléfono."""
    nombre = (request.form.get("nombre") or "").strip()
    telefono = (request.form.get("telefono") or "").strip()

    if not nombre or not telefono:
        return {"ok": False, "error": "Faltan nombre o teléfono"}, 400

    with get_conn() as c:
        cur = c.cursor()
        cur.execute("SELECT id, nombre, telefono FROM clientes WHERE telefono=?", (telefono,))
        row = cur.fetchone()
        if row:
            cid, n, t = row
            return {"ok": True, "cliente": {"id": cid, "nombre": n, "telefono": t}}

        cur.execute("INSERT INTO clientes (nombre, telefono) VALUES (?,?)", (nombre, telefono))
        c.commit()
        cid = cur.lastrowid

    return {"ok": True, "cliente": {"id": cid, "nombre": nombre, "telefono": telefono}}

@bp.get("/clientes/buscar")
def clientes_buscar():
    tel = (request.args.get("tel") or "").strip()
    if not tel:
        return {"ok": False, "error": "Falta tel"}, 400

    with get_conn() as c:
        cur = c.cursor()
        cur.execute("SELECT id, nombre, telefono FROM clientes WHERE telefono=?", (tel,))
        row = cur.fetchone()
        if not row:
            return {"ok": False, "error": "No encontrado"}, 404
        cid, n, t = row
        return {"ok": True, "cliente": {"id": cid, "nombre": n, "telefono": t}}
