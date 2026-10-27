from flask import Blueprint, jsonify

policies_bp = Blueprint("policies", __name__, url_prefix="/api/v1")


@policies_bp.get("/policies")
def get_policies():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@policies_bp.get("/policies/categories")
def get_policy_categories():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@policies_bp.put("/policies/<policy_id>/favorite")
def add_favorite(policy_id: str):
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@policies_bp.delete("/policies/<policy_id>/favorite")
def remove_favorite(policy_id: str):
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
