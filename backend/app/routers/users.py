from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.schemas import FCMTokenUpdate, UserCreate, UserResponse
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse)
async def create_user(data: UserCreate):
    db = get_supabase()
    avatar = dicebear_url(data.username)

    result = db.table("users").insert({
        "username": data.username,
        "display_name": data.display_name,
        "bio": data.bio,
        "avatar_url": avatar,
    }).execute()

    if not result.data:
        raise HTTPException(400, "Could not create user")
    return result.data[0]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID):
    db = get_supabase()
    result = db.table("users").select("*").eq("id", str(user_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "User not found")
    return result.data


@router.get("/by-username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str):
    db = get_supabase()
    result = db.table("users").select("*").eq("username", username).single().execute()
    if not result.data:
        raise HTTPException(404, "User not found")
    return result.data


@router.patch("/{user_id}/fcm-token")
async def update_fcm_token(user_id: UUID, data: FCMTokenUpdate):
    db = get_supabase()
    db.table("users").update({"fcm_token": data.fcm_token}).eq("id", str(user_id)).execute()
    return {"ok": True}


@router.patch("/{user_id}/premium")
async def upgrade_premium(user_id: UUID):
    db = get_supabase()
    db.table("users").update({"tier_level": "premium"}).eq("id", str(user_id)).execute()
    return {"tier_level": "premium"}
