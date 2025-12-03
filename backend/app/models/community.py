from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field
from bson import ObjectId

class PostType(str):
    GENERAL = "general"
    VERIFICATION = "verification"
    ANNOUNCEMENT = "announcement"
    MILESTONE = "milestone"


class PostLike(Document):
    """Model for tracking post likes"""
    post_id: str = Field(..., description="ID of the post being liked")
    user_id: str = Field(..., description="ID of the user who liked")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_likes"
        indexes = [
            [("post_id", 1), ("user_id", 1)],  # Compound index for uniqueness
            "post_id",
            "user_id"
        ]


class PostComment(Document):
    """Model for post comments"""
    post_id: str = Field(..., description="ID of the post")
    user_id: str = Field(..., description="ID of the commenter")
    user_name: str = Field(..., description="Name of the commenter")
    content: str = Field(..., min_length=1, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_comments"
        indexes = [
            "post_id",
            "user_id",
            [("post_id", 1), ("created_at", -1)]
        ]


class PostVerification(Document):
    """Model for tracking post verifications (like badges/endorsements)"""
    post_id: str = Field(..., description="ID of the post being verified")
    user_id: str = Field(..., description="ID of the user who verified")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_verifications"
        indexes = [
            [("post_id", 1), ("user_id", 1)],
            "post_id",
            "user_id"
        ]


class CommunityPost(Document):
    """Model for community feed posts"""
    author_id: str = Field(..., description="ID of the post author")
    author_name: str = Field(..., description="Name of the author")
    content: str = Field(..., min_length=1, max_length=5000)
    post_type: str = Field(default=PostType.GENERAL, description="Type of post")
    images: List[str] = Field(default_factory=list, description="URLs of attached images")
    location: Optional[str] = Field(None, description="Location mentioned in post")
    
    # Engagement metrics (cached for performance)
    likes_count: int = Field(default=0)
    comments_count: int = Field(default=0)
    verifications_count: int = Field(default=0)
    
    # Related claim (if post is about a specific claim)
    claim_id: Optional[str] = Field(None, description="Related land claim ID")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Moderation
    is_pinned: bool = Field(default=False)
    is_hidden: bool = Field(default=False)

    class Settings:
        name = "community_posts"
        indexes = [
            "author_id",
            [("created_at", -1)],  # For recent posts
            [("post_type", 1), ("created_at", -1)],
            "claim_id",
            [("is_hidden", 1), ("created_at", -1)]
        ]

    def dict(self, **kwargs):
        """Override dict to convert ObjectId to string"""
        data = super().dict(**kwargs)
        if 'id' in data and isinstance(data['id'], ObjectId):
            data['id'] = str(data['id'])
        return data
