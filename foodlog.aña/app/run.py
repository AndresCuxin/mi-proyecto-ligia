from . import create_app   # <— OJO al punto

app = create_app()

if __name__ == "__main__":
    # Ejecuta como módulo:
    #   python -m app.run
    app.run(host="0.0.0.0", port=8080, debug=False)
