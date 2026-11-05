import os
import random
import json

from groq import Groq
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime

from dotenv import load_dotenv
from google import genai
from PIL import Image

from ..models.schemas import Item, SourceScreenshot

load_dotenv()
# Pluggable Provider Interfaces

class OCRProvider(ABC):
    @abstractmethod
    def extract_text(self, file_path: str) -> str:
        pass

class VisionProvider(ABC):
    @abstractmethod
    def analyze_image(self, file_path: str, ocr_text: str) -> Dict[str, Any]:
        pass

class EmbeddingProvider(ABC):
    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        pass


# Mock Implementations for Development

class RealOCRProvider(OCRProvider):

    def extract_text(self, file_path: str) -> str:
        try:
            image = Image.open(file_path)

            text = pytesseract.image_to_string(image)

            print("\n===== OCR TEXT =====")
            print(text[:1000])
            print("====================\n")

            return text

        except Exception as e:
            print("OCR ERROR:", str(e))
            return ""

class MockVisionProvider(VisionProvider):
    def analyze_image(self, file_path: str, ocr_text: str) -> Dict[str, Any]:
        filename = os.path.basename(file_path).lower()
        ocr_lower = ocr_text.lower()
        
        # Decide category and metadata based on filename and OCR
        if "nike" in filename or "sneaker" in filename or "shoe" in filename or "sneakers" in ocr_lower:
            return {
                "category": "Products",
                "title": "Nike Air Force 1 '07",
                "subtitle": "Nike",
                "description": "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold colors and the perfect amount of flash to make you shine.",
                "price": 8405.00,
                "currency": "INR",
                "tags": ["Footwear", "Nike", "Sneakers", "White", "Streetwear"],
                "metadata": {
                    "buy_link": "https://www.nike.com/in/t/air-force-1-07-shoes-Wr0DmT",
                    "rating": 4.8,
                    "sizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"]
                },
                "image_url": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
                "creator": "stylewithcam"
            }
        elif "interstellar" in filename or "astronaut" in filename or "movie" in ocr_lower or "interstellar" in ocr_lower:
            return {
                "category": "Movies",
                "title": "Interstellar",
                "subtitle": "Christopher Nolan",
                "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                "rating": 8.7,
                "tags": ["Sci-Fi", "Adventure", "Drama", "Nolan", "Astronauts"],
                "metadata": {
                    "streaming_platforms": ["Netflix", "Prime Video", "Apple TV"],
                    "release_year": 2014,
                    "duration": "2h 49m",
                    "cast": ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"]
                },
                "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
                "creator": "fitnrecs"
            }
        elif "ordinary" in filename or "skincare" in filename or "serum" in filename or "niacinamide" in ocr_lower:
            return {
                "category": "Skincare",
                "title": "Niacinamide 10% + Zinc 1%",
                "subtitle": "The Ordinary",
                "description": "High-strength vitamin and mineral blemish formula. Niacinamide (Vitamin B3) is indicated to reduce the appearance of skin blemishes and congestion.",
                "price": 600.00,
                "currency": "INR",
                "tags": ["Skincare", "Serum", "Blemish Control", "The Ordinary", "Beauty"],
                "metadata": {
                    "skin_type": "All skin types",
                    "volume": "30ml",
                    "recommended_use": "Morning and Evening"
                },
                "image_url": "https://images.unsplash.com/photo-1608248597481-496100c80836?w=600&auto=format&fit=crop&q=80",
                "creator": "heylkazi"
            }
        elif "pasta" in filename or "recipe" in filename or "chicken" in filename or "cook" in ocr_lower:
            return {
                "category": "Recipes",
                "title": "Creamy Tuscan Garlic Chicken",
                "subtitle": "Italian-American",
                "description": "Tender chicken breasts simmered in a rich, creamy garlic sauce with fresh spinach and sweet sun-dried tomatoes. Perfect with pasta or rice.",
                "cooking_time": "30 mins",
                "ingredients": ["2 chicken breasts", "1 cup heavy cream", "1/2 cup chicken broth", "1 tsp garlic powder", "2 cups fresh spinach", "1/2 cup sun-dried tomatoes"],
                "tags": ["Dinner", "Chicken", "Creamy Sauce", "Italian", "Easy Cook"],
                "metadata": {
                    "prep_time": "10 mins",
                    "cook_time": "20 mins",
                    "servings": 4,
                    "calories": 480
                },
                "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80",
                "creator": "delishfood"
            }
        elif "bali" in filename or "travel" in filename or "cafe" in filename or "canggu" in ocr_lower:
            return {
                "category": "Travel",
                "title": "Pennylane Cafe Bali",
                "subtitle": "Canggu, Bali",
                "description": "An aesthetic indoor-outdoor restaurant in Canggu featuring soaring Romanesque arches, green plants, and a fusion Mediterranean menu.",
                "tags": ["Travel", "Bali", "Cafe", "Aesthetic", "Restaurants"],
                "metadata": {
                    "location": "Canggu, Bali, Indonesia",
                    "must_try": "Truffle Fries, Flat White",
                    "price_tier": "$$"
                },
                "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80",
                "creator": "wanderlust_jen"
            }
        elif "bedroom" in filename or "decor" in filename or "interior" in ocr_lower or "bedroom" in ocr_lower:
            return {
                "category": "Ideas",
                "title": "Warm Minimalist Bedroom",
                "subtitle": "Scandinavian Design",
                "description": "A cozy, warm minimalist bedroom aesthetic utilizing natural oak wood, off-white linen, soft ambient paper lamp lighting, and olive plants.",
                "tags": ["Home Decor", "Minimalism", "Bedroom", "Interior Design", "Cozy"],
                "metadata": {
                    "primary_materials": ["Oak Wood", "Linen", "Paper"],
                    "color_palette": ["Beige", "Warm White", "Oak"]
                },
                "image_url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
                "creator": "aestheticspace"
            }
        elif "chair" in filename or "furniture" in filename or "chair" in ocr_lower:
            return {
                "category": "Furniture",
                "title": "Mid-Century Womb Chair",
                "subtitle": "Knoll",
                "description": "Designed by Eero Saarinen, the Womb Chair is a masterpiece of mid-century furniture, offering comfort and organic contours wrapped in soft boucle wool.",
                "price": 45000.00,
                "currency": "INR",
                "tags": ["Furniture", "Mid-Century", "Womb Chair", "Knoll", "Design"],
                "metadata": {
                    "designer": "Eero Saarinen",
                    "material": "Boucle Wool",
                    "dimensions": "35.5\" H x 40\" W x 34\" D"
                },
                "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80",
                "creator": "furnituredaily"
            }
        else:
            # Random fallback categories
            categories = ["Products", "Movies", "Recipes", "Travel", "Ideas"]
            cat = random.choice(categories)
            if cat == "Products":
                return {
                    "category": "Products",
                    "title": f"Aesthetic Item - {filename[:10]}",
                    "subtitle": "Curated Brand",
                    "description": "Automatically recognized premium product from screenshot.",
                    "price": 1299.00,
                    "currency": "INR",
                    "tags": ["Product", "Curated", "Aesthetic"],
                    "metadata": {"brand": "Generic Premium"},
                    "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
                    "creator": "discoveries"
                }
            elif cat == "Movies":
                return {
                    "category": "Movies",
                    "title": f"Dune: Part Two",
                    "subtitle": "Denis Villeneuve",
                    "description": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                    "rating": 8.9,
                    "tags": ["Sci-Fi", "Epic", "Dune", "Cinematic"],
                    "metadata": {"release_year": 2024, "streaming_platforms": ["BookMyShow Stream", "Apple TV"]},
                    "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
                    "creator": "film_lover"
                }
            elif cat == "Recipes":
                return {
                    "category": "Recipes",
                    "title": "Matcha Crepe Cake",
                    "subtitle": "Japanese Patisserie",
                    "description": "A delicate, multi-layered crepe cake made with premium Uji Matcha green tea powder and light whipped cream layers.",
                    "cooking_time": "45 mins",
                    "ingredients": ["Matcha powder", "Crepe batter", "Whipped cream", "Sugar"],
                    "tags": ["Dessert", "Matcha", "Cake", "Baking", "Sweet"],
                    "metadata": {"prep_time": "30 mins", "cook_time": "15 mins"},
                    "image_url": "https://images.unsplash.com/photo-1536680465769-2365207b035e?w=600&auto=format&fit=crop&q=80",
                    "creator": "baker_chef"
                }
            elif cat == "Travel":
                return {
                    "category": "Travel",
                    "title": "Aman Kyoto Resort",
                    "subtitle": "Kyoto, Japan",
                    "description": "A secluded sanctuary in a hidden garden of Kyoto, surrounded by ancient moss-covered stone pathways and tall maples.",
                    "tags": ["Travel", "Kyoto", "Luxury", "Aman", "Resort"],
                    "metadata": {"location": "Kyoto, Japan", "experience": "Wellness Onsen"},
                    "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80",
                    "creator": "wanderlust_resorts"
                }
            else:
                return {
                    "category": "Ideas",
                    "title": "Cozy Home Library",
                    "subtitle": "Interior Design",
                    "description": "Floor-to-ceiling dark oak bookshelves packed with colorful books, complete with a leather armchair and a brass reading lamp.",
                    "tags": ["Home Library", "Bookshelf", "Reading", "Cozy", "Aesthetic"],
                    "metadata": {"primary_materials": ["Oak wood", "Leather"]},
                    "image_url": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=80",
                    "creator": "bookish_nook"
                }

class GroqVisionProvider(VisionProvider):

    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )

    def analyze_image(self, file_path: str, ocr_text: str):

        print("🔥 GROQ PROVIDER CALLED")

        prompt = f"""
You are an AI screenshot organizer.

Analyze the OCR text below and return ONLY valid JSON.

OCR TEXT:
{ocr_text}

Return JSON in this exact format:

{{
  "category": "",
  "title": "",
  "subtitle": "",
  "description": "",
  "price": null,
  "currency": "INR",
  "tags": [],
  "metadata": {{}},
  "image_url": "",
  "creator": "unknown"
}}

Possible categories:
Products
Movies
Anime
Books
Recipes
Travel
Ideas
Fashion
Technology
Skincare
Furniture
Other
"""

        try:

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2
            )

            text = response.choices[0].message.content.strip()

            print("===== GROQ RESPONSE =====")
            print(text)
            print("=========================")

            text = text.strip()

            if text.startswith("```"):
                text = text.replace("```json", "")
                text = text.replace("```", "")
                text = text.strip()

            print("===== CLEANED JSON =====")
            print(text)
            print("========================")

            return json.loads(text)

        except Exception as e:

            print("===== GROQ ERROR =====")
            print(str(e))
            print("======================")

            raise
    
class MockEmbeddingProvider(EmbeddingProvider):
    def get_embedding(self, text: str) -> List[float]:
        # Return a dummy 128-dimensional embedding array
        random.seed(hash(text))
        return [random.uniform(-1.0, 1.0) for _ in range(128)]


# Pluggable AI Pipeline Engine

class AIPipelineEngine:
    def __init__(self, ocr: OCRProvider, vision: VisionProvider, embedder: EmbeddingProvider):
        self.ocr = ocr
        self.vision = vision
        self.embedder = embedder

    def process_screenshot(self, file_path: str, temp_token: str) -> Dict[str, Any]:
        # 1. OCR Extraction
        ocr_text = self.ocr.extract_text(file_path)

        # 2. Vision Model Analysis (extract metadata and category)
        analysis = self.vision.analyze_image(file_path, ocr_text)
        print("===== FINAL ANALYSIS =====")
        print(analysis)
        print("==========================")
        # 3. Generate Semantic Embeddings (placeholder for pgvector/semantic search)
        embedding = self.embedder.get_embedding(ocr_text + " " + analysis["title"] + " " + " ".join(analysis["tags"]))

        # 4. Format structured result
        return {
            "ocr_text": ocr_text,
            "title": analysis["title"],
            "subtitle": analysis.get("subtitle"),
            "description": analysis.get("description"),
            "category": analysis["category"],
            "price": analysis.get("price"),
            "currency": analysis.get("currency", "INR"),
            "rating": analysis.get("rating"),
            "cooking_time": analysis.get("cooking_time"),
            "ingredients": analysis.get("ingredients"),
            "tags": analysis["tags"],
            "metadata": analysis.get("metadata", {}),
            "image_url": analysis["image_url"],
            "embedding": embedding,
            "creator": analysis.get("creator", "anonymous")
        }


# Global pipeline instance (default to Mock, can be switched to real via environment variables)
ocr_provider = RealOCRProvider()
vision_provider = GroqVisionProvider()
embedding_provider = MockEmbeddingProvider()

ai_pipeline = AIPipelineEngine(ocr_provider, vision_provider, embedding_provider)
