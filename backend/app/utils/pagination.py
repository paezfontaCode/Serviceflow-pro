"""
Utility module for consistent pagination across the API.

Provides standardized pagination logic to avoid code duplication
and ensure consistent response formats.
"""
from typing import List, TypeVar, Generic, Optional, Dict, Any
from sqlalchemy.orm import Query
from pydantic import BaseModel

T = TypeVar('T')


class PaginationResponse(BaseModel, Generic[T]):
    """Standardized pagination response model."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_previous: bool


def paginate_query(
    query: Query,
    page: int = 1,
    size: int = 20,
    max_size: int = 100
) -> Dict[str, Any]:
    """
    Apply pagination to a SQLAlchemy query and return standardized response.
    
    Args:
        query: SQLAlchemy Query object
        page: Page number (1-indexed)
        size: Items per page
        max_size: Maximum allowed page size
        
    Returns:
        Dictionary with items, total, page, size, pages, has_next, has_previous
        
    Example:
        result = paginate_query(db.query(User), page=2, size=10)
        # {
        #     "items": [...],
        #     "total": 150,
        #     "page": 2,
        #     "size": 10,
        #     "pages": 15,
        #     "has_next": True,
        #     "has_previous": True
        # }
    """
    # Enforce maximum page size
    size = min(size, max_size)
    
    # Ensure page is at least 1
    page = max(1, page)
    
    # Get total count
    total = query.count()
    
    # Calculate total pages
    pages = (total + size - 1) // size if total > 0 else 1
    
    # Calculate offset
    skip = (page - 1) * size
    
    # Get paginated items
    items = query.offset(skip).limit(size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
        "has_next": page < pages,
        "has_previous": page > 1
    }


def validate_pagination_params(
    page: Optional[int] = None,
    size: Optional[int] = None,
    max_size: int = 100
) -> tuple[int, int]:
    """
    Validate and normalize pagination parameters.
    
    Args:
        page: Page number (1-indexed), defaults to 1
        size: Items per page, defaults to 20
        max_size: Maximum allowed page size
        
    Returns:
        Tuple of (validated_page, validated_size)
    """
    # Default values
    page = page or 1
    size = size or 20
    
    # Enforce constraints
    page = max(1, page)
    size = max(1, min(size, max_size))
    
    return page, size
