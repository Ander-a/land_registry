from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.community import CommunityPost, PostLike, PostComment, PostVerification
from app.models.user import User
from app.auth.auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/community", tags=["community"])


# Pydantic schemas
class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    post_type: str = Field(default="general")
    images: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    claim_id: Optional[str] = None


class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_trust_score: int = 75  # TODO: Get from user model
    content: str
    post_type: str
    images: List[str]
    location: Optional[str]
    likes_count: int
    comments_count: int
    verifications_count: int
    liked_by_user: bool = False
    verified_by_user: bool = False
    claim_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime


# Routes
@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new community post"""
    post = CommunityPost(
        author_id=str(current_user.id),
        author_name=current_user.name,
        content=post_data.content,
        post_type=post_data.post_type,
        images=post_data.images,
        location=post_data.location,
        claim_id=post_data.claim_id
    )
    
    await post.insert()
    
    return PostResponse(
        id=str(post.id),
        author_id=post.author_id,
        author_name=post.author_name,
        content=post.content,
        post_type=post.post_type,
        images=post.images,
        location=post.location,
        likes_count=0,
        comments_count=0,
        verifications_count=0,
        liked_by_user=False,
        verified_by_user=False,
        claim_id=post.claim_id,
        created_at=post.created_at,
        updated_at=post.updated_at
    )


@router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    skip: int = 0,
    limit: int = 20,
    post_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get community posts with pagination"""
    query = {"is_hidden": False}
    
    if post_type:
        query["post_type"] = post_type
    
    posts = await CommunityPost.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    # Get user's likes and verifications
    user_likes = await PostLike.find({"user_id": str(current_user.id)}).to_list()
    liked_post_ids = {like.post_id for like in user_likes}
    
    user_verifications = await PostVerification.find({"user_id": str(current_user.id)}).to_list()
    verified_post_ids = {verification.post_id for verification in user_verifications}
    
    # Build response
    response = []
    for post in posts:
        post_id = str(post.id)
        response.append(PostResponse(
            id=post_id,
            author_id=post.author_id,
            author_name=post.author_name,
            content=post.content,
            post_type=post.post_type,
            images=post.images,
            location=post.location,
            likes_count=post.likes_count,
            comments_count=post.comments_count,
            verifications_count=post.verifications_count,
            liked_by_user=post_id in liked_post_ids,
            verified_by_user=post_id in verified_post_ids,
            claim_id=post.claim_id,
            created_at=post.created_at,
            updated_at=post.updated_at
        ))
    
    return response


@router.post("/posts/{post_id}/like", status_code=status.HTTP_200_OK)
async def like_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Like or unlike a post"""
    # Check if post exists
    post = await CommunityPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    existing_like = await PostLike.find_one({
        "post_id": post_id,
        "user_id": str(current_user.id)
    })
    
    if existing_like:
        # Unlike
        await existing_like.delete()
        post.likes_count = max(0, post.likes_count - 1)
        await post.save()
        return {"message": "Post unliked", "liked": False, "likes_count": post.likes_count}
    else:
        # Like
        like = PostLike(
            post_id=post_id,
            user_id=str(current_user.id)
        )
        await like.insert()
        post.likes_count += 1
        await post.save()
        return {"message": "Post liked", "liked": True, "likes_count": post.likes_count}


@router.post("/posts/{post_id}/verify", status_code=status.HTTP_200_OK)
async def verify_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Verify or unverify a post"""
    # Check if post exists
    post = await CommunityPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already verified
    existing_verification = await PostVerification.find_one({
        "post_id": post_id,
        "user_id": str(current_user.id)
    })
    
    if existing_verification:
        # Unverify
        await existing_verification.delete()
        post.verifications_count = max(0, post.verifications_count - 1)
        await post.save()
        return {"message": "Verification removed", "verified": False, "verifications_count": post.verifications_count}
    else:
        # Verify
        verification = PostVerification(
            post_id=post_id,
            user_id=str(current_user.id)
        )
        await verification.insert()
        post.verifications_count += 1
        await post.save()
        return {"message": "Post verified", "verified": True, "verifications_count": post.verifications_count}


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(
    post_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get comments for a post"""
    # Check if post exists
    post = await CommunityPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments = await PostComment.find({"post_id": post_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    
    return [
        CommentResponse(
            id=str(comment.id),
            post_id=comment.post_id,
            user_id=comment.user_id,
            user_name=comment.user_name,
            content=comment.content,
            created_at=comment.created_at
        )
        for comment in comments
    ]


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a post"""
    # Check if post exists
    post = await CommunityPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    comment = PostComment(
        post_id=post_id,
        user_id=str(current_user.id),
        user_name=current_user.name,
        content=comment_data.content
    )
    await comment.insert()
    
    # Update post comments count
    post.comments_count += 1
    await post.save()
    
    return CommentResponse(
        id=str(comment.id),
        post_id=comment.post_id,
        user_id=comment.user_id,
        user_name=comment.user_name,
        content=comment.content,
        created_at=comment.created_at
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a post (only by author or admin)"""
    post = await CommunityPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user is author or admin
    if post.author_id != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Delete associated likes, comments, and verifications
    await PostLike.find({"post_id": post_id}).delete()
    await PostComment.find({"post_id": post_id}).delete()
    await PostVerification.find({"post_id": post_id}).delete()
    
    # Delete the post
    await post.delete()
    
    return None
