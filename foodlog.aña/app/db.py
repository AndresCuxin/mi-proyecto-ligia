import mariadb
from flask import current_app

def get_conn():
    """Devuelve una conexión nueva a MariaDB usando Config.DB."""
    db_cfg = current_app.config["DB"]
    return mariadb.connect(**db_cfg)
