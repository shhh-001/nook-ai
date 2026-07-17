import re
from typing import List, Dict, Any, Tuple
from ..models.schemas import Item

class SearchService:
    @staticmethod
    def parse_natural_query(query: str) -> Dict[str, Any]:
        """
        Parses a natural language query into filter parameters.
        Example: "skincare products under 1000" -> category: Skincare, price_max: 1000
        """
        q = query.lower()
        filters = {
            "category": None,
            "price_max": None,
            "min_creators": None,
            "keywords": [],
            "query_type": "search"
        }

        # 1. Extract category hints
        if any(w in q for w in ["sneaker", "shoe", "product", "footwear", "buy", "shop"]):
            filters["category"] = "Products"
        elif any(w in q for w in ["movie", "film", "show", "watch", "director"]):
            filters["category"] = "Movies"
        elif any(w in q for w in ["recipe", "food", "cook", "dish", "ingredient", "cuisine"]):
            filters["category"] = "Recipes"
        elif any(w in q for w in ["skincare", "serum", "sunscreen", "ordinary", "skin"]):
            filters["category"] = "Skincare"
        elif any(w in q for w in ["restaurant", "cafe", "coffee", "place", "travel", "bangalore"]):
            filters["category"] = "Travel"
        elif any(w in q for w in ["bedroom", "decor", "interior", "idea", "library"]):
            filters["category"] = "Ideas"
        elif any(w in q for w in ["chair", "furniture", "couch"]):
            filters["category"] = "Furniture"

        # 2. Extract price limit (e.g. "under 1000", "below Rs 8000")
        price_match = re.search(r'(?:under|below|less than|rs\.?|₹)\s*(\d+)', q)
        if price_match:
            filters["price_max"] = float(price_match.group(1))
            filters["query_type"] = "filter"

        # 3. Extract recommendations / creators filter
        if any(w in q for w in ["recommended by more than two", "more than 2", "multiple creators", "more than two"]):
            filters["min_creators"] = 3
            filters["query_type"] = "filter"
        elif "recommended by" in q:
            creator_match = re.search(r'recommended by\s*(\d+)', q)
            if creator_match:
                filters["min_creators"] = int(creator_match.group(1))
                filters["query_type"] = "filter"

        # 4. Keyword tokens (excluding filter words)
        words = q.split()
        stop_words = {
            "find", "show", "me", "what", "which", "i", "saved", "last", "month",
            "the", "a", "an", "in", "on", "at", "under", "below", "less", "than", "by", "more"
        }
        filters["keywords"] = [w for w in words if w not in stop_words and len(w) > 2]

        return filters

    @classmethod
    def search(cls, items: List[Item], query: str) -> Tuple[List[Item], str]:
        """
        Searches a list of items using semantic query parsing and keyword matching.
        Returns a tuple: (matched_items_list, query_type_string)
        """
        if not query.strip():
            return items, "all"

        filters = cls.parse_natural_query(query)
        matched = []

        for item in items:
            # Check Category
            if filters["category"] and item.category.lower() != filters["category"].lower():
                # Special cases: Skincare is a type of Product, allow fallbacks
                if not (filters["category"] == "Products" and item.category == "Skincare"):
                    continue

            # Check Price
            if filters["price_max"] is not None:
                if item.price is None or item.price > filters["price_max"]:
                    continue

            # Check Creators/Recommendations count
            if filters["min_creators"] is not None:
                if item.recommendations_count < filters["min_creators"]:
                    continue

            # Check keyword text matches
            if filters["keywords"]:
                item_content = (
                    f"{item.title} {item.subtitle or ''} {item.description or ''} "
                    f"{' '.join(item.tags)} {item.ocr_text or ''} {item.category}"
                ).lower()
                
                # Check if all keywords are matched (fuzzy AND match)
                matches_keywords = True
                for kw in filters["keywords"]:
                    if kw not in item_content:
                        # Allow partial matches for terms like "astronauts" -> "astronaut"
                        if kw.endswith("s") and kw[:-1] in item_content:
                            continue
                        matches_keywords = False
                        break
                if not matches_keywords:
                    continue

            matched.append(item)

        # Decide human-readable response type
        if filters["price_max"] is not None or filters["min_creators"] is not None:
            q_type = "filter"
        elif filters["category"]:
            q_type = "category_search"
        else:
            q_type = "text_search"

        return matched, q_type

    @staticmethod
    def get_query_answer(matched_items: List[Item], query: str) -> str:
        """
        Generates a cozy, conversational response from Nook AI based on search results.
        """
        count = len(matched_items)
        if count == 0:
            return "I couldn't find any items matching that query in your screenshot brain. Try uploading more images!"
        
        q = query.lower()
        if "under" in q or "price" in q:
            prices = [f"₹{item.price:.2f}" for item in matched_items if item.price]
            price_str = ", ".join(prices)
            return f"I found {count} item(s) matching your price criteria, including: {', '.join([item.title for item in matched_items])} (priced at {price_str})."
        
        if "recommended" in q or "creator" in q:
            return f"Yes! I found {count} popular item(s) recommended by multiple creators. {matched_items[0].title} is recommended by {matched_items[0].recommendations_count} creators."
        
        if "astronaut" in q:
            return f"Found it! {matched_items[0].title} is a movie directed by {matched_items[0].subtitle} featuring astronauts, matching your request."

        # Default response
        items_list = ", ".join([f"**{item.title}**" for item in matched_items[:3]])
        suffix = " and more" if count > 3 else ""
        return f"Here's what I found for '{query}': {items_list}{suffix} ({count} total item(s))."
