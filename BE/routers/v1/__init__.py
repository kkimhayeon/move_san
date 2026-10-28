from routers.v1.auth import auth_bp
from routers.v1.comments import comments_bp
from routers.v1.comparisons import comparisons_bp
from routers.v1.housing import housing_bp
from routers.v1.policies import policies_bp, policy_favorites_bp
from routers.v1.posts import posts_bp
from routers.v1.products import products_bp
from routers.v1.uploads import uploads_bp
from routers.v1.users import users_bp

ALL_BLUEPRINTS = (
    auth_bp,
    users_bp,
    comparisons_bp,
    housing_bp,
    policies_bp,
    policy_favorites_bp,
    products_bp,
    posts_bp,
    comments_bp,
    uploads_bp,
)
