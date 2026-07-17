from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Flexible Database Schema: Collection -> Items -> SourceScreenshots

class SourceScreenshot(BaseModel):
    id: str
    item_id: str
    image_url: str
    extracted_at: datetime = Field(default_factory=datetime.utcnow)

class Item(BaseModel):
    id: str
    collection_id: str
    category: str  # E.g., Products, Movies, Recipes, Books, Travel, Ideas, Fashion, Skincare
    title: str
    subtitle: Optional[str] = None  # Brand, Creator, Author, Cuisine, Director
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "INR"
    rating: Optional[float] = None
    cooking_time: Optional[str] = None
    ingredients: Optional[List[str]] = None
    tags: List[str] = Field(default_factory=list)
    ocr_text: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Flexible extra metadata (e.g. streaming platforms, buy link)
    image_url: str
    source_screenshots: List[SourceScreenshot] = Field(default_factory=list)
    recommendations_count: int = 1
    creators: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Collection(BaseModel):
    id: str
    name: str
    icon: str  # Lucide icon name string
    color: str  # Color key or hex code matching the palette
    description: Optional[str] = None
    items_count: int = 0
    items: List[Item] = Field(default_factory=list)

# API Schemas

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class UserRegister(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UploadResponse(BaseModel):
    temp_tokens: List[str]
    filenames: List[str]

class AnalyzeRequest(BaseModel):
    temp_tokens: List[str]

class AnalyzeResponse(BaseModel):
    success: bool
    added_items: List[Item]

class AskRequest(BaseModel):
    query: str

class AskResponse(BaseModel):
    answer: str
    matched_items: List[Item]
    query_type: str  # search, filter, count, etc.

class AIInsights(BaseModel):
    saved_this_month: int
    top_category: str
    favorite_brand: str
    recurring_theme: str
    monthly_trend: List[Dict[str, Any]]
    summary: str

class ProfileResponse(BaseModel):
    name: str
    handle: str
    avatar_url: str
    stats: Dict[str, int]
    insights: AIInsights
