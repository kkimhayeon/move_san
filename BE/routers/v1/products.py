from flask import Blueprint, jsonify

products_bp = Blueprint("products", __name__, url_prefix="/api/v1")


@products_bp.get("/financial-products")
def get_products():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@products_bp.get("/financial-products/<product_id>")
def get_product(product_id: str):
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
