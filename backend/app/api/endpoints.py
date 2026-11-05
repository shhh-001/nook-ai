import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from pydantic import BaseModel

from ..models.schemas import (
    Collection, Item, SourceScreenshot,
    UploadResponse, AnalyzeRequest, AnalyzeResponse,
    AskResponse, ProfileResponse, AIInsights,
)
from ..services.ai_pipeline import ai_pipeline
from ..services.search_service import SearchService
from ..core.security import get_verified_user_id
from ..core.supabase_client import supabase_client as _sb

router = APIRouter()

# Temp upload directory — used during OCR processing then cleaned up
TEMP_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp_uploads"
)
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)


# ──────────────────────────────────────────────────────────────
# In-Memory Fallback Database
# Used when Supabase is unavailable or not configured.
# ──────────────────────────────────────────────────────────────
_INITIAL_SS = [
    SourceScreenshot(id="ss-1", item_id="item-nike",         image_url="/mock_screenshots/nike_af1.png",           extracted_at=datetime.utcnow() - timedelta(days=20)),
    SourceScreenshot(id="ss-2", item_id="item-interstellar", image_url="/mock_screenshots/interstellar_post.png",  extracted_at=datetime.utcnow() - timedelta(days=15)),
    SourceScreenshot(id="ss-3", item_id="item-ordinary",     image_url="/mock_screenshots/ordinary_serum.png",     extracted_at=datetime.utcnow() - timedelta(days=4)),
]

DB_ITEMS: List[Item] = [
    Item(id="item-nike",         collection_id="col-products", category="Products",
         title="Nike Air Force 1 '07", subtitle="Nike",
         description="The radiance lives on in the Nike Air Force 1 '07.",
         price=8405.00, currency="INR", rating=4.8,
         tags=["Footwear", "Nike", "Sneakers", "White", "Streetwear"],
         ocr_text="NIKE AIR FORCE 1 '07 White - Price Rs 8,405",
         image_url="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[_INITIAL_SS[0]], recommendations_count=3,
         creators=["stylewithcam", "hypebeast_in", "kicksfinder"],
         created_at=datetime.utcnow() - timedelta(days=20)),
    Item(id="item-interstellar", collection_id="col-movies",   category="Movies",
         title="Interstellar", subtitle="Christopher Nolan",
         description="A team of explorers travel through a wormhole in space.",
         rating=8.7, tags=["Sci-Fi", "Adventure", "Drama", "Nolan", "Astronauts"],
         ocr_text="INTERSTELLAR - Christopher Nolan - IMDb 8.7/10",
         image_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[_INITIAL_SS[1]], recommendations_count=3,
         creators=["fitnrecs", "cinephile_hub", "nolan_fan"],
         created_at=datetime.utcnow() - timedelta(days=15)),
    Item(id="item-ordinary",     collection_id="col-skincare", category="Skincare",
         title="Niacinamide 10% + Zinc 1%", subtitle="The Ordinary",
         description="High-strength vitamin and mineral blemish formula.",
         price=600.00, currency="INR", rating=4.5,
         tags=["Skincare", "Serum", "Blemish Control", "The Ordinary", "Beauty"],
         ocr_text="The Ordinary Niacinamide 10% + Zinc 1% - Deciem",
         image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[_INITIAL_SS[2]], recommendations_count=1,
         creators=["heylkazi"], created_at=datetime.utcnow() - timedelta(days=4)),
    Item(id="item-bedroom",      collection_id="col-ideas",    category="Ideas",
         title="Warm Minimalist Bedroom", subtitle="Scandinavian Design",
         description="Cozy bedroom aesthetic with oak wood and linen.",
         tags=["Home Decor", "Minimalism", "Bedroom", "Interior Design", "Cozy"],
         ocr_text="Minimalist Bedroom Idea - Warm lighting, oak bed frame",
         image_url="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[], recommendations_count=1,
         creators=["aestheticspace"], created_at=datetime.utcnow() - timedelta(days=10)),
    Item(id="item-araku",        collection_id="col-travel",   category="Travel",
         title="Araku Coffee Bangalore", subtitle="Indiranagar, Bangalore",
         description="Premium organic coffee experience in Indiranagar.",
         tags=["Travel", "Bangalore", "Cafe", "Aesthetic", "Coffee"],
         ocr_text="Araku Cafe Indiranagar Bangalore - Premium Coffee",
         image_url="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[], recommendations_count=2,
         creators=["blr_foodie", "cafeculture"], created_at=datetime.utcnow() - timedelta(days=2)),
    Item(id="item-chicken",      collection_id="col-recipes",  category="Recipes",
         title="Creamy Tuscan Garlic Chicken", subtitle="Italian-American",
         description="Chicken simmered in creamy garlic sauce with spinach and sun-dried tomatoes.",
         cooking_time="30 mins",
         ingredients=["2 chicken breasts", "1 cup heavy cream", "1 tsp garlic powder", "2 cups fresh spinach"],
         tags=["Dinner", "Chicken", "Creamy Sauce", "Italian", "Easy Cook"],
         ocr_text="Creamy Tuscan Garlic Chicken - Cook Time 20m",
         image_url="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80",
         source_screenshots=[], recommendations_count=1,
         creators=["delishfood"], created_at=datetime.utcnow() - timedelta(days=1)),
]

DB_COLLECTIONS: List[Collection] = [
    Collection(id="col-products", name="Products",  icon="ShoppingBag", color="#D3DFF2", description="Products to buy."),
    Collection(id="col-movies",   name="Movies",    icon="Film",        color="#93A4C1", description="Movies and shows."),
    Collection(id="col-recipes",  name="Recipes",   icon="Utensils",    color="#E7E8E4", description="Food and recipes."),
    Collection(id="col-skincare", name="Skincare",  icon="Sparkles",    color="#F5F6F3", description="Skincare and beauty."),
    Collection(id="col-travel",   name="Travel",    icon="MapPin",      color="#D3DFF2", description="Cafes and destinations."),
    Collection(id="col-ideas",    name="Ideas",     icon="Lightbulb",   color="#93A4C1", description="Home decor and aesthetics."),
]


def _sync_mem_collections():
    for col in DB_COLLECTIONS:
        col.items = [i for i in DB_ITEMS if i.collection_id == col.id and not i.is_archived]
        col.items_count = len(col.items)


_sync_mem_collections()


# ──────────────────────────────────────────────────────────────
# Supabase Storage Helper
# ──────────────────────────────────────────────────────────────
def _signed_url(storage_path: str) -> str:
    """Return a 1-hour signed URL for a private Supabase storage path."""
    if not _sb or not storage_path:
        return storage_path
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    try:
        res = _sb.storage.from_("screenshots").create_signed_url(storage_path, 3600)
        return res.get("signedURL") or storage_path
    except Exception as exc:
        print(f"[signed_url] Warning: {exc}")
        return storage_path


def _resolve_item_urls(item_data: dict) -> dict:
    """Convert raw storage paths to signed URLs in an item dict."""
    item_data["image_url"] = _signed_url(item_data.get("image_url", ""))
    for ss in item_data.get("source_screenshots", []):
        ss["image_url"] = _signed_url(ss.get("image_url", ""))
    return item_data


# ──────────────────────────────────────────────────────────────
# Category → Icon/Color mapping
# ──────────────────────────────────────────────────────────────
_ICON_MAP = {
    "products":    "ShoppingBag",
    "movies":      "Film",
    "recipes":     "Utensils",
    "skincare":    "Sparkles",
    "travel":      "MapPin",
    "ideas":       "Lightbulb",
    "anime":       "Tv",
    "books":       "BookOpen",
    "fashion":     "Shirt",
    "technology":  "Cpu",
    "furniture":   "Sofa",
    "fitness":     "Dumbbell",
    "music":       "Music",
    "games":       "Gamepad2",
    "food":        "UtensilsCrossed",
}
_COLOR_CYCLE = ["#D3DFF2", "#93A4C1", "#E7E8E4", "#F5F6F3", "#C9D9F0", "#A8B8D8"]


def _collection_icon(category_name: str) -> str:
    return _ICON_MAP.get(category_name.lower(), "FolderHeart")


def _collection_color(category_name: str) -> str:
    idx = sum(ord(c) for c in category_name) % len(_COLOR_CYCLE)
    return _COLOR_CYCLE[idx]


# ──────────────────────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_screenshots(
    files: List[UploadFile] = File(...),
    user_id: str = Depends(get_verified_user_id),
):
    """Save uploaded files to temp dir and return processing tokens."""
    temp_tokens, filenames = [], []
    for file in files:
        token = f"tmp_{uuid.uuid4().hex}"
        ext = os.path.splitext(file.filename or "file.png")[1] or ".png"
        dest = os.path.join(TEMP_UPLOAD_DIR, f"{token}{ext}")
        with open(dest, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        temp_tokens.append(token)
        filenames.append(file.filename or "")
    return UploadResponse(temp_tokens=temp_tokens, filenames=filenames)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_screenshots(
    payload: AnalyzeRequest,
    user_id: str = Depends(get_verified_user_id),
):
    """
    For each temp token:
    1. OCR + Groq analysis
    2. Upload image to Supabase Storage (user_id/<item_id>.png)
    3. Upsert collection if new category discovered
    4. Insert/merge item in PostgreSQL
    Falls back to in-memory store if Supabase unavailable.
    """
    added_items: List[Item] = []
    files_in_temp = set(os.listdir(TEMP_UPLOAD_DIR))

    for token in payload.temp_tokens:
        # Find matching temp file
        matched_filename = next((f for f in files_in_temp if f.startswith(token)), None)
        if not matched_filename:
            continue

        filepath = os.path.join(TEMP_UPLOAD_DIR, matched_filename)

        # ── AI Analysis ────────────────────────────────────────
        try:
            ai_data = ai_pipeline.process_screenshot(filepath, token)
        except Exception as exc:
            print(f"[analyze] AI pipeline error for {token}: {exc}")
            continue

        item_id = f"item-{uuid.uuid4().hex[:8]}"
        category_name = (ai_data.get("category") or "Other").title()
        collection_id = f"col-{category_name.lower().replace(' ', '-')}"

        # ── Supabase Path ──────────────────────────────────────
        supabase_ok = False
        if _sb is not None:
            try:
                storage_path = f"{user_id}/{item_id}.png"

                # Upload image to private bucket
                with open(filepath, "rb") as img:
                    _sb.storage.from_("screenshots").upload(
                        file=img,
                        path=storage_path,
                        file_options={"content-type": "image/png", "upsert": "true"},
                    )

                # Ensure collection exists (dynamic category creation)
                col_res = (
                    _sb.table("collections")
                    .select("id")
                    .eq("id", collection_id)
                    .eq("user_id", user_id)
                    .execute()
                )
                if not col_res.data:
                    _sb.table("collections").insert({
                        "id":          collection_id,
                        "user_id":     user_id,
                        "name":        category_name,
                        "icon":        _collection_icon(category_name),
                        "color":       _collection_color(category_name),
                        "description": f"AI-created collection for {category_name}.",
                    }).execute()

                # Duplicate intelligence — check by title
                dup_res = (
                    _sb.table("items")
                    .select("id, recommendations_count, creators")
                    .eq("title", ai_data["title"])
                    .eq("user_id", user_id)
                    .execute()
                )

                if dup_res.data:
                    existing = dup_res.data[0]
                    existing_id = existing["id"]
                    new_count = existing["recommendations_count"] + 1
                    creators = list(existing.get("creators") or [])
                    creator = ai_data.get("creator", "unknown")
                    if creator not in creators:
                        creators.append(creator)

                    _sb.table("items").update({
                        "recommendations_count": new_count,
                        "creators": creators,
                    }).eq("id", existing_id).eq("user_id", user_id).execute()

                    ss_id = f"ss-{uuid.uuid4().hex[:8]}"
                    _sb.table("source_screenshots").insert({
                        "id": ss_id, "user_id": user_id,
                        "item_id": existing_id, "image_url": storage_path,
                    }).execute()

                    updated = (
                        _sb.table("items")
                        .select("*, source_screenshots(*)")
                        .eq("id", existing_id)
                        .eq("user_id", user_id)
                        .single()
                        .execute()
                    )
                    if updated.data:
                        added_items.append(Item(**_resolve_item_urls(updated.data)))
                else:
                    row = {
                        "id": item_id, "user_id": user_id,
                        "collection_id": collection_id,
                        "category": category_name,
                        "title":       ai_data.get("title", "Unknown"),
                        "subtitle":    ai_data.get("subtitle"),
                        "description": ai_data.get("description"),
                        "price":       ai_data.get("price"),
                        "currency":    ai_data.get("currency", "INR"),
                        "rating":      ai_data.get("rating"),
                        "cooking_time":ai_data.get("cooking_time"),
                        "ingredients": ai_data.get("ingredients") or [],
                        "tags":        ai_data.get("tags") or [],
                        "ocr_text":    ai_data.get("ocr_text"),
                        "metadata":    ai_data.get("metadata") or {},
                        "image_url":   storage_path,
                        "recommendations_count": 1,
                        "creators":    [ai_data.get("creator", "unknown")],
                        "is_favorite": False,
                        "is_archived": False,
                    }
                    _sb.table("items").insert(row).execute()

                    ss_id = f"ss-{uuid.uuid4().hex[:8]}"
                    _sb.table("source_screenshots").insert({
                        "id": ss_id, "user_id": user_id,
                        "item_id": item_id, "image_url": storage_path,
                    }).execute()

                    row["image_url"] = _signed_url(storage_path)
                    row["source_screenshots"] = [
                        SourceScreenshot(id=ss_id, item_id=item_id, image_url=row["image_url"])
                    ]
                    added_items.append(Item(**row))

                supabase_ok = True

            except Exception as exc:
                print(f"[analyze] Supabase error: {exc}. Falling back to memory.")

        # ── Memory Fallback ────────────────────────────────────
        if not supabase_ok:
            screenshot_url = f"/temp_uploads/{matched_filename}"
            existing_item = next(
                (i for i in DB_ITEMS if i.title.lower() == ai_data["title"].lower()), None
            )
            if existing_item:
                new_ss = SourceScreenshot(
                    id=f"ss-{uuid.uuid4().hex[:8]}",
                    item_id=existing_item.id,
                    image_url=screenshot_url,
                )
                existing_item.source_screenshots.append(new_ss)
                existing_item.recommendations_count += 1
                creator = ai_data.get("creator", "unknown")
                if creator not in existing_item.creators:
                    existing_item.creators.append(creator)
                added_items.append(existing_item)
            else:
                if not any(c.id == collection_id for c in DB_COLLECTIONS):
                    DB_COLLECTIONS.append(Collection(
                        id=collection_id, name=category_name,
                        icon=_collection_icon(category_name),
                        color=_collection_color(category_name),
                        description=f"AI-created collection for {category_name}.",
                    ))
                new_ss = SourceScreenshot(
                    id=f"ss-{uuid.uuid4().hex[:8]}",
                    item_id=item_id, image_url=screenshot_url,
                )
                new_item = Item(
                    id=item_id, collection_id=collection_id,
                    category=category_name,
                    title=ai_data.get("title", "Unknown"),
                    subtitle=ai_data.get("subtitle"),
                    description=ai_data.get("description"),
                    price=ai_data.get("price"),
                    currency=ai_data.get("currency", "INR"),
                    rating=ai_data.get("rating"),
                    cooking_time=ai_data.get("cooking_time"),
                    ingredients=ai_data.get("ingredients") or [],
                    tags=ai_data.get("tags") or [],
                    ocr_text=ai_data.get("ocr_text"),
                    metadata=ai_data.get("metadata") or {},
                    image_url=screenshot_url,
                    source_screenshots=[new_ss],
                    recommendations_count=1,
                    creators=[ai_data.get("creator", "unknown")],
                    created_at=datetime.utcnow(),
                )
                DB_ITEMS.append(new_item)
                added_items.append(new_item)
            _sync_mem_collections()

        # Clean up temp file
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as exc:
            print(f"[analyze] Temp cleanup warning: {exc}")

    return AnalyzeResponse(success=True, added_items=added_items)


@router.get("/collections", response_model=List[Collection])
async def get_collections(user_id: str = Depends(get_verified_user_id)):
    """Return all active (non-archived) collections with nested items for this user."""
    if _sb is not None:
        try:
            col_res = (
                _sb.table("collections")
                .select("*")
                .eq("user_id", user_id)
                .order("name")
                .execute()
            )
            result = []
            for col in col_res.data:
                items_res = (
                    _sb.table("items")
                    .select("*, source_screenshots(*)")
                    .eq("collection_id", col["id"])
                    .eq("user_id", user_id)
                    .eq("is_archived", False)
                    .execute()
                )
                items = [Item(**_resolve_item_urls(row)) for row in items_res.data]
                result.append(Collection(
                    id=col["id"], name=col["name"],
                    icon=col.get("icon", "FolderHeart"),
                    color=col.get("color", "#D3DFF2"),
                    description=col.get("description"),
                    items_count=len(items), items=items,
                ))
            return result
        except Exception as exc:
            print(f"[collections] Supabase error: {exc}. Falling back to memory.")

    _sync_mem_collections()
    return DB_COLLECTIONS


@router.get("/archive", response_model=List[Item])
async def get_archive(user_id: str = Depends(get_verified_user_id)):
    """Return all archived items for this user."""
    if _sb is not None:
        try:
            res = (
                _sb.table("items")
                .select("*, source_screenshots(*)")
                .eq("user_id", user_id)
                .eq("is_archived", True)
                .execute()
            )
            return [Item(**_resolve_item_urls(row)) for row in res.data]
        except Exception as exc:
            print(f"[archive] Supabase error: {exc}.")

    return [i for i in DB_ITEMS if i.is_archived]


@router.patch("/item/{item_id}/archive")
async def archive_item(
    item_id: str,
    user_id: str = Depends(get_verified_user_id),
):
    """Move an item to the archive (is_archived = true)."""
    if _sb is not None:
        try:
            _sb.table("items").update({"is_archived": True}).eq("id", item_id).eq("user_id", user_id).execute()
            return {"success": True, "item_id": item_id, "action": "archived"}
        except Exception as exc:
            print(f"[archive item] Supabase error: {exc}.")

    for item in DB_ITEMS:
        if item.id == item_id:
            item.is_archived = True
            break
    _sync_mem_collections()
    return {"success": True, "item_id": item_id, "action": "archived"}


@router.patch("/item/{item_id}/restore")
async def restore_item(
    item_id: str,
    user_id: str = Depends(get_verified_user_id),
):
    """Restore an archived item (is_archived = false)."""
    if _sb is not None:
        try:
            _sb.table("items").update({"is_archived": False}).eq("id", item_id).eq("user_id", user_id).execute()
            return {"success": True, "item_id": item_id, "action": "restored"}
        except Exception as exc:
            print(f"[restore item] Supabase error: {exc}.")

    for item in DB_ITEMS:
        if item.id == item_id:
            item.is_archived = False
            break
    _sync_mem_collections()
    return {"success": True, "item_id": item_id, "action": "restored"}


@router.delete("/item/{item_id}")
async def delete_item(
    item_id: str,
    user_id: str = Depends(get_verified_user_id),
):
    """Permanently delete an item and its storage file."""
    if _sb is not None:
        try:
            item_res = (
                _sb.table("items")
                .select("image_url")
                .eq("id", item_id)
                .eq("user_id", user_id)
                .execute()
            )
            if item_res.data:
                storage_path = item_res.data[0].get("image_url", "")
                if storage_path and not storage_path.startswith("http"):
                    try:
                        _sb.storage.from_("screenshots").remove([storage_path])
                    except Exception as exc:
                        print(f"[delete item] Storage delete warning: {exc}")

            _sb.table("items").delete().eq("id", item_id).eq("user_id", user_id).execute()
            return {"success": True, "deleted_id": item_id}
        except Exception as exc:
            print(f"[delete item] Supabase error: {exc}.")

    global DB_ITEMS
    DB_ITEMS = [i for i in DB_ITEMS if i.id != item_id]
    _sync_mem_collections()
    return {"success": True, "deleted_id": item_id}


@router.get("/search", response_model=AskResponse)
async def search_items(
    query: str = Query(..., min_length=1),
    user_id: str = Depends(get_verified_user_id),
):
    """Full-text search across title, tags, OCR text, description."""
    user_items: List[Item] = []

    if _sb is not None:
        try:
            res = (
                _sb.table("items")
                .select("*, source_screenshots(*)")
                .eq("user_id", user_id)
                .eq("is_archived", False)
                .execute()
            )
            user_items = [Item(**_resolve_item_urls(row)) for row in res.data]
        except Exception as exc:
            print(f"[search] Supabase error: {exc}. Using memory.")
            user_items = DB_ITEMS
    else:
        user_items = DB_ITEMS

    matched, q_type = SearchService.search(user_items, query)
    answer = SearchService.get_query_answer(matched, query)
    return AskResponse(answer=answer, matched_items=matched, query_type=q_type)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_verified_user_id)):
    """Return profile stats and AI insights for the authenticated user."""
    saved_count = 0
    collections_count = 0
    top_cat = "Ideas"
    user_name = "Nook User"

    if _sb is not None:
        try:
            items_res = (
                _sb.table("items")
                .select("category")
                .eq("user_id", user_id)
                .eq("is_archived", False)
                .execute()
            )
            col_res = (
                _sb.table("collections")
                .select("id")
                .eq("user_id", user_id)
                .execute()
            )
            saved_count = len(items_res.data)
            collections_count = len(col_res.data)

            cats: dict = {}
            for row in items_res.data:
                c = row.get("category")
                if c:
                    cats[c] = cats.get(c, 0) + 1
            if cats:
                top_cat = max(cats, key=lambda k: cats[k])

            # Fetch user email from Supabase Auth admin API
            try:
                user_res = _sb.auth.admin.get_user_by_id(user_id)
                email = user_res.user.email or ""
                user_name = email.split("@")[0].replace(".", " ").title()
            except Exception:
                pass

        except Exception as exc:
            print(f"[profile] Supabase error: {exc}.")
            saved_count = len(DB_ITEMS)
            collections_count = len(DB_COLLECTIONS)
    else:
        saved_count = len(DB_ITEMS)
        collections_count = len(DB_COLLECTIONS)

    return ProfileResponse(
        name=user_name,
        handle=f"@{user_name.lower().replace(' ', '')}",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        stats={"Saved": saved_count, "Collections": collections_count},
        insights=AIInsights(
            saved_this_month=saved_count,
            top_category=top_cat,
            favorite_brand="",
            recurring_theme="Minimalism",
            monthly_trend=[
                {"month": "Feb", "count": max(0, saved_count - 50)},
                {"month": "Mar", "count": max(0, saved_count - 35)},
                {"month": "Apr", "count": max(0, saved_count - 20)},
                {"month": "May", "count": max(0, saved_count - 12)},
                {"month": "Jun", "count": max(0, saved_count - 5)},
                {"month": "Jul", "count": saved_count},
            ],
            summary=(
                f"You have {saved_count} screenshots saved across {collections_count} collections. "
                f"Your most active category is {top_cat}."
            ),
        ),
    )
