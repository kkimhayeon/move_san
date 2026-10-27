from flask import Flask, jsonify
from flask_cors import CORS

from routers.v1 import ALL_BLUEPRINTS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "message": "부산살림 Flask 서버 정상 작동",
        })

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
