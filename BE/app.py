import os

from flask import Flask, jsonify
from flask_cors import CORS

from routers.v1 import ALL_BLUEPRINTS

# Next.js 로컬 개발 주소. 3000이 사용 중이면 3001로 뜬다.
# localhost와 127.0.0.1은 브라우저에서 서로 다른 출처다.
_LOCAL_ORIGINS = (
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
)


def _frontend_origin() -> str | None:
    """운영 프론트 출처 하나. 비어 있으면 로컬 주소만 허용."""
    raw = os.getenv("FRONTEND_ORIGIN", "").strip().strip('"').strip("'")
    if not raw:
        return None

    origin = raw.rstrip("/")
    scheme, sep, rest = origin.partition("://")
    if (
        origin == "*"
        or sep != "://"
        or scheme not in ("http", "https")
        or not rest
        or any(char in rest for char in "/?#")
    ):
        raise RuntimeError(
            "FRONTEND_ORIGIN은 https://앱주소 형식의 출처 하나여야 합니다."
        )
    return origin


def _allowed_origins() -> list[str]:
    origins = list(_LOCAL_ORIGINS)
    frontend = _frontend_origin()
    if frontend and frontend not in origins:
        origins.append(frontend)
    return origins


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=_allowed_origins())

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
