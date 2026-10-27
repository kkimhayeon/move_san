"""금융상품 목록/상세 서비스."""

from typing import Any, Optional


def list_products(
    *,
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    raise NotImplementedError("product_service.list_products 미구현")


def get_product(product_id: str) -> dict[str, Any]:
    raise NotImplementedError("product_service.get_product 미구현")
