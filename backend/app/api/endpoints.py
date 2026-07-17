import os
import shutil
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel

from ..models.schemas import (
    Collection, Item, SourceScreenshot,
    UploadResponse, AnalyzeRequest, AnalyzeResponse,
    AskResponse, ProfileResponse, AIInsights
)
from ..services.ai_pipeline import ai_pipeline
from ..services.search_service import SearchService

router = APIRouter()

# Local Temp Storage Directory for Uploaded Files
TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# -------------------------------------------------------------
# Rich Initial Mock Database (In-Memory)
# Matches design reference and search test queries perfectly.
# -------------------------------------------------------------

INITIAL_SCREENSHOTS = [
    SourceScreenshot(id="ss-1", item_id="item-nike", image_url="/mock_screenshots/nike_af1.png", extracted_at=datetime.utcnow() - timedelta(days=20)),
    SourceScreenshot(id="ss-2", item_id="item-interstellar", image_url="/mock_screenshots/interstellar_post.png", extracted_at=datetime.utcnow() - timedelta(days=15)),
    SourceScreenshot(id="ss-3", item_id="item-ordinary", image_url="/mock_screenshots/ordinary_serum.png", extracted_at=datetime.utcnow() - timedelta(days=4)),
]

DB_ITEMS: List[Item] = [
    Item(
        id="item-nike",
        collection_id="col-products",
        category="Products",
        title="Nike Air Force 1 '07",
        subtitle="Nike",
        description="The radiance lives on in the Nike Air Force 1 '07, the basketball icon that puts a fresh spin on what you know best: crisp leather and clean lines.",
        price=8405.00,
        currency="INR",
        rating=4.8,
        tags=["Footwear", "Nike", "Sneakers", "White", "Streetwear"],
        ocr_text="NIKE AIR FORCE 1 '07 White - Price Rs 8,405 - Premium Leather - Nike India Store",
        image_url="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[INITIAL_SCREENSHOTS[0]],
        recommendations_count=3,
        creators=["stylewithcam", "hypebeast_in", "kicksfinder"],
        created_at=datetime.utcnow() - timedelta(days=20)
    ),
    Item(
        id="item-interstellar",
        collection_id="col-movies",
        category="Movies",
        title="Interstellar",
        subtitle="Christopher Nolan",
        description="A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        rating=8.7,
        tags=["Sci-Fi", "Adventure", "Drama", "Nolan", "Astronauts"],
        ocr_text="INTERSTELLAR - Directed by Christopher Nolan - IMDb 8.7/10 - Warner Bros Pictures - Streaming on Netflix & Prime",
        image_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[INITIAL_SCREENSHOTS[1]],
        recommendations_count=3,
        creators=["fitnrecs", "cinephile_hub", "nolan_fan"],
        created_at=datetime.utcnow() - timedelta(days=15)
    ),
    Item(
        id="item-ordinary",
        collection_id="col-skincare",
        category="Skincare",
        title="Niacinamide 10% + Zinc 1%",
        subtitle="The Ordinary",
        description="High-strength vitamin and mineral blemish formula. Niacinamide (Vitamin B3) reduces blemishes and skin congestion.",
        price=600.00,
        currency="INR",
        rating=4.5,
        tags=["Skincare", "Serum", "Blemish Control", "The Ordinary", "Beauty"],
        ocr_text="The Ordinary Niacinamide 10% + Zinc 1% - High-Strength Vitamin and Mineral Blemish Formula - Deciem",
        image_url="https://images.unsplash.com/photo-1608248597481-496100c80836?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[INITIAL_SCREENSHOTS[2]],
        recommendations_count=1,
        creators=["heylkazi"],
        created_at=datetime.utcnow() - timedelta(days=4)
    ),
    Item(
        id="item-bedroom",
        collection_id="col-ideas",
        category="Ideas",
        title="Warm Minimalist Bedroom",
        subtitle="Scandinavian Design",
        description="A cozy, warm minimalist bedroom aesthetic utilizing natural oak wood, off-white linen, soft ambient paper lamp lighting, and olive plants.",
        tags=["Home Decor", "Minimalism", "Bedroom", "Interior Design", "Cozy"],
        ocr_text="Minimalist Bedroom Idea - Warm lighting, oak bed frame, beige linen, plants - Home decor inspiration",
        image_url="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[],
        recommendations_count=1,
        creators=["aestheticspace"],
        created_at=datetime.utcnow() - timedelta(days=10)
    ),
    Item(
        id="item-araku",
        collection_id="col-travel",
        category="Travel",
        title="Araku Coffee Bangalore",
        subtitle="Indiranagar, Bangalore",
        description="A premium organic coffee experience and beautiful flagship cafe in Indiranagar, Bangalore. High ceilings, minimalist wood accents, and gorgeous brewing bar.",
        tags=["Travel", "Bangalore", "Cafe", "Aesthetic", "Restaurants", "Coffee"],
        ocr_text="Araku Cafe Indiranagar Bangalore - Premium Coffee Experience and Cafe",
        image_url="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[],
        recommendations_count=2,
        creators=["blr_foodie", "cafeculture"],
        created_at=datetime.utcnow() - timedelta(days=2)
    ),
    Item(
        id="item-chicken",
        collection_id="col-recipes",
        category="Recipes",
        title="Creamy Tuscan Garlic Chicken",
        subtitle="Italian-American",
        description="Tender chicken breasts simmered in a rich, creamy garlic sauce with fresh spinach and sweet sun-dried tomatoes.",
        cooking_time="30 mins",
        ingredients=["2 chicken breasts", "1 cup heavy cream", "1/2 cup chicken broth", "1 tsp garlic powder", "2 cups fresh spinach", "1/2 cup sun-dried tomatoes"],
        tags=["Dinner", "Chicken", "Creamy Sauce", "Italian", "Easy Cook"],
        ocr_text="Creamy Tuscan Garlic Chicken - Prep Time 10m - Cook Time 20m - Ingredients: Chicken breast, heavy cream, spinach, sun-dried tomatoes",
        image_url="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80",
        source_screenshots=[],
        recommendations_count=1,
        creators=["delishfood"],
        created_at=datetime.utcnow() - timedelta(days=1)
    )
]

DB_COLLECTIONS: List[Collection] = [
    Collection(id="col-products", name="Products", icon="ShoppingBag", color="#D3DFF2", description="Aesthetic items, gadget setups, skincare products, and outfits to buy.", items_count=1, items=[]),
    Collection(id="col-movies", name="Movies", icon="Film", color="#93A4C1", description="Movies, TV shows, and anime recommendations.", items_count=1, items=[]),
    Collection(id="col-recipes", name="Recipes", icon="Utensils", color="#E7E8E4", description="Delicious dishes, ingredients list, and cook times.", items_count=1, items=[]),
    Collection(id="col-skincare", name="Skincare", icon="Sparkles", color="#F5F6F3", description="Skincare, makeup, and beauty items.", items_count=1, items=[]),
    Collection(id="col-travel", name="Travel", icon="MapPin", color="#D3DFF2", description="Aesthetic cafes, restaurants, hotels, and vacation spots.", items_count=1, items=[]),
    Collection(id="col-ideas", name="Ideas", icon="Lightbulb", color="#93A4C1", description="Home decor setups, bedroom aesthetics, and UI references.", items_count=1, items=[])
]

# Sync items to collections initially
def _sync_collections():
    for col in DB_COLLECTIONS:
        col.items = [item for item in DB_ITEMS if item.collection_id == col.id]
        col.items_count = len(col.items)

_sync_collections()

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@router.post("/upload", response_model=UploadResponse)
async def upload_screenshots(files: List[UploadFile] = File(...)):
    """
    Receives and stores files temporarily. Returns unique tokens.
    """
    temp_tokens = []
    filenames = []
    
    for file in files:
        # Generate clean temp token
        token = f"tmp_{uuid.uuid4().hex}"
        file_ext = os.path.splitext(file.filename)[1]
        temp_filename = f"{token}{file_ext}"
        temp_filepath = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
        
        # Save file to disk
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        temp_tokens.append(token)
        filenames.append(file.filename)
        
    return UploadResponse(temp_tokens=temp_tokens, filenames=filenames)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_screenshots(payload: AnalyzeRequest):
    """
    Simulates AI pipeline analysis, extracts metadata, groups duplicates,
    assigns items to collections, and registers source screenshots.
    """
    added_items = []
    
    # Read temp_uploads directory to find files matching tokens
    files_in_temp = os.listdir(TEMP_UPLOAD_DIR)
    
    for token in payload.temp_tokens:
        # Find file with matching token prefix
        matched_filename = None
        for f in files_in_temp:
            if f.startswith(token):
                matched_filename = f
                break
                
        if not matched_filename:
            continue
            
        filepath = os.path.join(TEMP_UPLOAD_DIR, matched_filename)
        
        # Run AI parsing pipeline (contains Mock OCR + Mock Vision details)
        ai_data = ai_pipeline.process_screenshot(filepath, token)
        
        # Duplicate intelligence: check if item with SAME title already exists (fuzzy matching)
        existing_item = None
        for item in DB_ITEMS:
            if item.title.lower().strip() == ai_data["title"].lower().strip():
                existing_item = item
                break
                
        # Register screenshot
        screenshot_url = f"/temp_uploads/{matched_filename}" # Exposed by static directory
        
        if existing_item:
            # Match found: merge screenshots and creators
            new_ss = SourceScreenshot(
                id=f"ss-{uuid.uuid4().hex[:8]}",
                item_id=existing_item.id,
                image_url=screenshot_url
            )
            existing_item.source_screenshots.append(new_ss)
            existing_item.recommendations_count += 1
            if ai_data["creator"] not in existing_item.creators:
                existing_item.creators.append(ai_data["creator"])
            added_items.append(existing_item)
        else:
            # Create a new collection if category is not mapped
            category_normalized = ai_data["category"].title()
            collection_id = f"col-{category_normalized.lower().replace(' ', '-')}"
            
            # Ensure collection exists
            col_exists = False
            for col in DB_COLLECTIONS:
                if col.id == collection_id:
                    col_exists = True
                    break
            if not col_exists:
                new_col = Collection(
                    id=collection_id,
                    name=category_normalized,
                    icon="FolderHeart",
                    color="#E7E8E4",
                    description=f"AI grouped items for {category_normalized}.",
                    items_count=0,
                    items=[]
                )
                DB_COLLECTIONS.append(new_col)
            
            # Create the new item
            new_item_id = f"item-{uuid.uuid4().hex[:8]}"
            new_ss = SourceScreenshot(
                id=f"ss-{uuid.uuid4().hex[:8]}",
                item_id=new_item_id,
                image_url=screenshot_url
            )
            
            new_item = Item(
                id=new_item_id,
                collection_id=collection_id,
                category=category_normalized,
                title=ai_data["title"],
                subtitle=ai_data["subtitle"],
                description=ai_data["description"],
                price=ai_data["price"],
                currency=ai_data["currency"],
                rating=ai_data["rating"],
                cooking_time=ai_data["cooking_time"],
                ingredients=ai_data["ingredients"],
                tags=ai_data["tags"],
                ocr_text=ai_data["ocr_text"],
                metadata=ai_data["metadata"],
                image_url=ai_data["image_url"],
                source_screenshots=[new_ss],
                recommendations_count=1,
                creators=[ai_data["creator"]],
                created_at=datetime.utcnow()
            )
            
            DB_ITEMS.append(new_item)
            added_items.append(new_item)
            
    # Sync items to collections
    _sync_collections()
    
    return AnalyzeResponse(success=True, added_items=added_items)


@router.get("/collections", response_model=List[Collection])
async def get_collections():
    """
    Returns collections containing items.
    """
    _sync_collections()
    return DB_COLLECTIONS


@router.get("/search", response_model=AskResponse)
async def search_items(query: str = Query(..., min_length=1)):
    """
    Performs NLP/Semantic query analysis and returns matching items with AI dialogue answer.
    """
    matched, q_type = SearchService.search(DB_ITEMS, query)
    answer = SearchService.get_query_answer(matched, query)
    return AskResponse(answer=answer, matched_items=matched, query_type=q_type)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile():
    """
    Retrieves user profile stats and AI insights.
    """
    # Calculate stats
    counts = {}
    for item in DB_ITEMS:
        counts[item.category] = counts.get(item.category, 0) + 1
        
    stats = {
        "Saved": len(DB_ITEMS),
        "Collections": len(DB_COLLECTIONS),
        "Following": 89
    }
    
    # Compile insights
    monthly_trend = [
        {"month": "Feb", "count": 20},
        {"month": "Mar", "count": 35},
        {"month": "Apr", "count": 48},
        {"month": "May", "count": 52},
        {"month": "Jun", "count": 61},
        {"month": "Jul", "count": len(DB_ITEMS) + 10}
    ]
    
    insights = AIInsights(
        saved_this_month=68,
        top_category="Skincare",
        favorite_brand="Nike",
        recurring_theme="Minimalism",
        monthly_trend=monthly_trend,
        summary="You saved 38 Products, 12 Movies, and 15 Recipes this month. Your gallery focuses highly on Japanese Minimalism and Skincare routines."
    )
    
    return ProfileResponse(
        name="Aayisha Kazi",
        handle="@heylkazi",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        stats=stats,
        insights=insights
    )


@router.delete("/item/{item_id}")
async def delete_item(item_id: str):
    """
    Deletes an item from the database.
    """
    global DB_ITEMS
    item_to_remove = None
    for item in DB_ITEMS:
        if item.id == item_id:
            item_to_remove = item
            break
            
    if not item_to_remove:
        raise HTTPException(status_code=404, detail="Item not found")
        
    DB_ITEMS.remove(item_to_remove)
    _sync_collections()
    return {"success": True, "deleted_id": item_id}
