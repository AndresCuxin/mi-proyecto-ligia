from flask import Blueprint, request, jsonify
from datetime import date, datetime
from ..db import get_conn

bp = Blueprint("registros", __name__)

@bp.get("/registros")
def listar_registros():
    """Devuelve ventas + total, incluyendo cliente si existe."""
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("""
            SELECT r.id, r.producto, r.precio, r.cantidad, r.comentarios, r.fecha_venta,
                   c.nombre, c.telefono
            FROM registros r
            LEFT JOIN clientes c ON c.id = r.cliente_id
            ORDER BY r.fecha_venta DESC, r.id DESC
        """)
        filas = cur.fetchall()

    registros, total = [], 0.0
    for (rid, producto, precio, cantidad, comentarios, fecha_venta, nom_cli, tel_cli) in filas:
        p = float(precio); q = int(cantidad); sub = p * q; total += sub
        registros.append({
            "id": rid,
            "producto": producto,
            "precio": p,
            "cantidad": q,
            "comentarios": comentarios or "",
            "fecha_venta": str(fecha_venta),
            "subtotal": sub,
            "cliente": {"nombre": nom_cli, "telefono": tel_cli} if nom_cli else None
        })
    return jsonify({"registros": registros, "total": total})

@bp.post("/registros")
def agregar_registro():
    """Inserta venta (acepta precio con coma/punto)."""
    prod = (request.form.get("producto") or "").strip()
    precio_txt = (request.form.get("precio") or "").strip().replace(",", ".")
    cant_txt = (request.form.get("cantidad") or "").strip()
    comentarios = (request.form.get("comentarios") or "").strip()
    fecha_txt = (request.form.get("fecha_venta") or "").strip()
    cliente_id_txt = (request.form.get("cliente_id") or "").strip()

    if not fecha_txt:
        fecha_txt = str(date.today())

    try:
        precio = round(float(precio_txt), 2)
        cantidad = int(cant_txt or "1")
        datetime.strptime(fecha_txt, "%Y-%m-%d")
        cliente_id = int(cliente_id_txt) if cliente_id_txt else None
    except Exception:
        return {"ok": False, "error": "Datos inválidos (formato)"}, 400

    if not prod or precio < 0 or cantidad <= 0:
        return {"ok": False, "error": "Datos inválidos (reglas)"}, 400

    with get_conn() as c:
        cur = c.cursor()
        if cliente_id:
            cur.execute(
                "INSERT INTO registros (producto, precio, cantidad, fecha_venta, comentarios, cliente_id) "
                "VALUES (?,?,?,?,?,?)",
                (prod, precio, cantidad, fecha_txt, comentarios, cliente_id)
            )
        else:
            cur.execute(
                "INSERT INTO registros (producto, precio, cantidad, fecha_venta, comentarios) "
                "VALUES (?,?,?,?,?)",
                (prod, precio, cantidad, fecha_txt, comentarios)
            )
        c.commit()
    return {"ok": True}

@bp.post("/registros/<int:rid>/delete")
def eliminar_registro(rid):
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("DELETE FROM registros WHERE id = ?", (rid,))
        c.commit()
    return {"ok": True}
