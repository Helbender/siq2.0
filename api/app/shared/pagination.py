"""Shared pagination utilities."""

from typing import Any


def paginate_query(query, page: int = 1, per_page: int = 20) -> dict[str, Any]:
    """Paginate a SQLAlchemy query.

    Args:
        query: SQLAlchemy query object
        page: Page number (1-based)
        per_page: Number of items per page

    Returns:
        dict with paginated results and metadata
    """
    # Calculate offset
    offset = (page - 1) * per_page

    # Get total count
    total = query.count()

    # Get paginated results
    items = query.offset(offset).limit(per_page).all()

    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0

    return {
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }

