from flask import Blueprint, jsonify

comparisons_bp = Blueprint("comparisons", __name__, url_prefix="/api/v1")


@comparisons_bp.post("/comparisons")
def post_comparisons():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
