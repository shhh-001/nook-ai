export interface SourceScreenshot {
  id: string;
  item_id: string;
  image_url: string;
  extracted_at: string;
}

export interface Item {
  id: string;
  collection_id: string;
  category: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  currency?: string;
  rating?: number;
  cooking_time?: string;
  ingredients?: string[];
  tags: string[];
  ocr_text?: string;
  metadata: Record<string, any>;
  image_url: string;
  source_screenshots: SourceScreenshot[];
  recommendations_count: number;
  creators: string[];
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  items_count: number;
  items: Item[];
}

export interface AIInsights {
  saved_this_month: number;
  top_category: string;
  favorite_brand: string;
  recurring_theme: string;
  monthly_trend: Array<{ month: string; count: number }>;
  summary: string;
}

export interface ProfileResponse {
  name: string;
  handle: string;
  avatar_url: string;
  stats: Record<string, number>;
  insights: AIInsights;
}

export interface AskResponse {
  answer: string;
  matched_items: Item[];
  query_type: string;
}

const API_BASE = "http://localhost:8000/api";

// Helper to determine if we should fall back to mock data
async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json() as T;
  } catch (error) {
    console.warn(`API call failed for ${url}. Falling back to mock data.`, error);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// CLIENT SIDE MOCK DATABASE (Fallback)
// -------------------------------------------------------------
let MOCK_ITEMS: Item[] = [
  {
    id: "item-nike",
    collection_id: "col-products",
    category: "Products",
    title: "Nike Air Force 1 '07",
    subtitle: "Nike",
    description: "The radiance lives on in the Nike Air Force 1 '07, the basketball icon that puts a fresh spin on what you know best: crisp leather and clean lines.",
    price: 8405.00,
    currency: "INR",
    rating: 4.8,
    tags: ["Footwear", "Nike", "Sneakers", "White", "Streetwear"],
    ocr_text: "NIKE AIR FORCE 1 '07 White - Price Rs 8,405 - Premium Leather - Nike India Store",
    image_url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [{ id: "ss-1", item_id: "item-nike", image_url: "", extracted_at: new Date().toISOString() }],
    recommendations_count: 3,
    creators: ["stylewithcam", "hypebeast_in", "kicksfinder"],
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    metadata: { buy_link: "https://nike.com", sizes: ["UK 8", "UK 9", "UK 10"] }
  },
  {
    id: "item-interstellar",
    collection_id: "col-movies",
    category: "Movies",
    title: "Interstellar",
    subtitle: "Christopher Nolan",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    rating: 8.7,
    tags: ["Sci-Fi", "Adventure", "Drama", "Nolan", "Astronauts"],
    ocr_text: "INTERSTELLAR - Directed by Christopher Nolan - IMDb 8.7/10 - Warner Bros Pictures - Streaming on Netflix & Prime",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [{ id: "ss-2", item_id: "item-interstellar", image_url: "", extracted_at: new Date().toISOString() }],
    recommendations_count: 3,
    creators: ["fitnrecs", "cinephile_hub", "nolan_fan"],
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    metadata: { streaming_platforms: ["Netflix", "Prime Video"], release_year: 2014 }
  },
  {
    id: "item-ordinary",
    collection_id: "col-skincare",
    category: "Skincare",
    title: "Niacinamide 10% + Zinc 1%",
    subtitle: "The Ordinary",
    description: "High-strength vitamin and mineral blemish formula. Niacinamide (Vitamin B3) reduces blemishes and skin congestion.",
    price: 600.00,
    currency: "INR",
    rating: 4.5,
    tags: ["Skincare", "Serum", "Blemish Control", "The Ordinary", "Beauty"],
    ocr_text: "The Ordinary Niacinamide 10% + Zinc 1% - High-Strength Vitamin and Mineral Blemish Formula - Deciem",
    image_url: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [{ id: "ss-3", item_id: "item-ordinary", image_url: "", extracted_at: new Date().toISOString() }],
    recommendations_count: 1,
    creators: ["heylkazi"],
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    metadata: { skin_type: "All skin types", volume: "30ml" }
  },
  {
    id: "item-bedroom",
    collection_id: "col-ideas",
    category: "Ideas",
    title: "Warm Minimalist Bedroom",
    subtitle: "Scandinavian Design",
    description: "A cozy, warm minimalist bedroom aesthetic utilizing natural oak wood, off-white linen, soft ambient paper lamp lighting, and olive plants.",
    tags: ["Home Decor", "Minimalism", "Bedroom", "Interior Design", "Cozy"],
    ocr_text: "Minimalist Bedroom Idea - Warm lighting, oak bed frame, beige linen, plants - Home decor inspiration",
    image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [],
    recommendations_count: 1,
    creators: ["aestheticspace"],
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    metadata: { color_palette: ["Beige", "Oak"] }
  },
  {
    id: "item-araku",
    collection_id: "col-travel",
    category: "Travel",
    title: "Araku Coffee Bangalore",
    subtitle: "Indiranagar, Bangalore",
    description: "A premium organic coffee experience and beautiful flagship cafe in Indiranagar, Bangalore. High ceilings, minimalist wood accents, and gorgeous brewing bar.",
    tags: ["Travel", "Bangalore", "Cafe", "Aesthetic", "Restaurants", "Coffee"],
    ocr_text: "Araku Cafe Indiranagar Bangalore - Premium Coffee Experience and Cafe",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [],
    recommendations_count: 2,
    creators: ["blr_foodie", "cafeculture"],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    metadata: { location: "Indiranagar, Bangalore" }
  },
  {
    id: "item-chicken",
    collection_id: "col-recipes",
    category: "Recipes",
    title: "Creamy Tuscan Garlic Chicken",
    subtitle: "Italian-American",
    description: "Tender chicken breasts simmered in a rich, creamy garlic sauce with fresh spinach and sweet sun-dried tomatoes.",
    cooking_time: "30 mins",
    ingredients: ["2 chicken breasts", "1 cup heavy cream", "1/2 cup chicken broth", "1 tsp garlic powder", "2 cups fresh spinach", "1/2 cup sun-dried tomatoes"],
    tags: ["Dinner", "Chicken", "Creamy Sauce", "Italian", "Easy Cook"],
    ocr_text: "Creamy Tuscan Garlic Chicken - Prep Time 10m - Cook Time 20m - Ingredients: Chicken breast, heavy cream, spinach, sun-dried tomatoes",
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80",
    source_screenshots: [],
    recommendations_count: 1,
    creators: ["delishfood"],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    metadata: { prep_time: "10 mins", cook_time: "20 mins" }
  }
];

let MOCK_COLLECTIONS: Collection[] = [
  { id: "col-products", name: "Products", icon: "ShoppingBag", color: "#D3DFF2", description: "Aesthetic items, gadget setups, skincare products, and outfits to buy.", items_count: 1, items: [] },
  { id: "col-movies", name: "Movies", icon: "Film", color: "#93A4C1", description: "Movies, TV shows, and anime recommendations.", items_count: 1, items: [] },
  { id: "col-recipes", name: "Recipes", icon: "Utensils", color: "#E7E8E4", description: "Delicious dishes, ingredients list, and cook times.", items_count: 1, items: [] },
  { id: "col-skincare", name: "Skincare", icon: "Sparkles", color: "#F5F6F3", description: "Skincare, makeup, and beauty items.", items_count: 1, items: [] },
  { id: "col-travel", name: "Travel", icon: "MapPin", color: "#D3DFF2", description: "Aesthetic cafes, restaurants, hotels, and vacation spots.", items_count: 1, items: [] },
  { id: "col-ideas", name: "Ideas", icon: "Lightbulb", color: "#93A4C1", description: "Home decor setups, bedroom aesthetics, and UI references.", items_count: 1, items: [] }
];

function syncMockCollections() {
  MOCK_COLLECTIONS.forEach(col => {
    col.items = MOCK_ITEMS.filter(item => item.collection_id === col.id);
    col.items_count = col.items.length;
  });
}
syncMockCollections();

// -------------------------------------------------------------
// API CLIENT IMPLEMENTATION
// -------------------------------------------------------------

import { supabase } from "./supabaseClient";

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        "Authorization": `Bearer ${session.access_token}`
      };
    }
  } catch (e) {
    console.warn("Error getting session for auth headers:", e);
  }
  return {};
}

export const api = {
  // Upload screenshot files
  async uploadScreenshots(files: File[]): Promise<{ temp_tokens: string[]; filenames: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: headers, // Pass auth header for token verification
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    } catch (e) {
      console.warn("Upload API failed, using client-side temporary tokens.", e);
      // Fallback
      const tokens = files.map(() => `client_tmp_${Math.random().toString(36).substring(2, 11)}`);
      return {
        temp_tokens: tokens,
        filenames: files.map(f => f.name)
      };
    }
  },

  // Analyze screenshots
  async analyzeScreenshots(tempTokens: string[]): Promise<Item[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders 
        },
        body: JSON.stringify({ temp_tokens: tempTokens }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      return data.added_items;
    } catch (e) {
      console.warn("Analysis API failed. Simulating client-side AI extraction.", e);
      
      const addedItems: Item[] = [];
      tempTokens.forEach((token) => {
        const rand = Math.random();
        let itemTemplate: Partial<Item> = {};
        
        if (rand < 0.2) {
          itemTemplate = {
            category: "Products",
            title: "Aesthetic Leather Wallet",
            subtitle: "Bellroy",
            description: "Slim wallet constructed of environmentally certified premium leather. Holds up to 12 cards.",
            price: 4500,
            tags: ["Wallet", "Leather", "Aesthetic", "Bellroy"],
            image_url: "https://images.unsplash.com/photo-1627124118304-429c717945d8?w=600&auto=format&fit=crop&q=80",
            metadata: { material: "Leather" }
          };
        } else if (rand < 0.4) {
          itemTemplate = {
            category: "Movies",
            title: "Dune: Part Two",
            subtitle: "Denis Villeneuve",
            description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
            rating: 8.9,
            tags: ["Sci-Fi", "Epic", "Dune", "Cinematic"],
            image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
            metadata: { release_year: 2024 }
          };
        } else if (rand < 0.6) {
          itemTemplate = {
            category: "Recipes",
            title: "Matcha Latte",
            subtitle: "Japanese Beverage",
            description: "A warming tea-based drink made with pure stone-ground matcha powder and creamy oat milk.",
            cooking_time: "5 mins",
            ingredients: ["1 tsp Matcha", "1/4 cup hot water", "3/4 cup Oat milk", "1 tsp Maple syrup"],
            tags: ["Beverage", "Matcha", "Healthy", "Japanese"],
            image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
            metadata: { prep_time: "5 mins" }
          };
        } else if (rand < 0.8) {
          itemTemplate = {
            category: "Skincare",
            title: "BHA Liquid Exfoliant",
            subtitle: "Paula's Choice",
            description: "Skin perfecting 2% BHA liquid exfoliant unclogs pores, smooths wrinkles, and brightens skin tone.",
            price: 2700,
            tags: ["Skincare", "Exfoliant", "Paulas Choice", "Beauty"],
            image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
            metadata: { volume: "118ml" }
          };
        } else {
          itemTemplate = {
            category: "Travel",
            title: "Aman Kyoto Resort",
            subtitle: "Kyoto, Japan",
            description: "A secluded sanctuary in a hidden forest garden of Kyoto, surrounded by ancient moss-covered paths.",
            tags: ["Travel", "Kyoto", "Luxury", "Aman", "Japan"],
            image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80",
            metadata: { location: "Kyoto, Japan" }
          };
        }

        const newId = `item-${Math.random().toString(36).substring(2, 9)}`;
        const newItem: Item = {
          id: newId,
          collection_id: `col-${itemTemplate.category!.toLowerCase()}`,
          category: itemTemplate.category!,
          title: itemTemplate.title!,
          subtitle: itemTemplate.subtitle,
          description: itemTemplate.description,
          price: itemTemplate.price,
          currency: "INR",
          rating: itemTemplate.rating,
          cooking_time: itemTemplate.cooking_time,
          ingredients: itemTemplate.ingredients,
          tags: itemTemplate.tags || [],
          ocr_text: `Extracted text from screenshot for ${itemTemplate.title}`,
          metadata: itemTemplate.metadata || {},
          image_url: itemTemplate.image_url!,
          source_screenshots: [{ id: `ss-${Math.random().toString(36).substring(2, 9)}`, item_id: newId, image_url: "", extracted_at: new Date().toISOString() }],
          recommendations_count: 1,
          creators: ["self_gallery"],
          created_at: new Date().toISOString()
        };

        const duplicateIndex = MOCK_ITEMS.findIndex(item => item.title.toLowerCase() === newItem.title.toLowerCase());
        if (duplicateIndex !== -1) {
          MOCK_ITEMS[duplicateIndex].recommendations_count += 1;
          MOCK_ITEMS[duplicateIndex].source_screenshots.push(newItem.source_screenshots[0]);
          addedItems.push(MOCK_ITEMS[duplicateIndex]);
        } else {
          MOCK_ITEMS.push(newItem);
          addedItems.push(newItem);
        }
      });

      // Sync
      syncMockCollections();
      return addedItems;
    }
  },

  // Get collections with nested items
  async getCollections(): Promise<Collection[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/collections`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Collections fetch failed");
      return await res.json();
    } catch (e) {
      console.warn("Collections API failed, falling back to mock data.", e);
      syncMockCollections();
      return MOCK_COLLECTIONS;
    }
  },

  // Natural Language Search / Ask Nook
  async askNook(query: string): Promise<AskResponse> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Search failed");
      return await res.json();
    } catch (e) {
      console.warn("Search API failed, parsing query client-side.", e);
      const q = query.toLowerCase();
      let matched = MOCK_ITEMS;

      if (q.includes("movie") || q.includes("film")) {
        matched = matched.filter(i => i.category === "Movies");
      } else if (q.includes("sneaker") || q.includes("shoe") || q.includes("product")) {
        matched = matched.filter(i => i.category === "Products");
      } else if (q.includes("skincare") || q.includes("serum") || q.includes("ordinary")) {
        matched = matched.filter(i => i.category === "Skincare");
      } else if (q.includes("recipe") || q.includes("food") || q.includes("cook")) {
        matched = matched.filter(i => i.category === "Recipes");
      } else if (q.includes("restaurant") || q.includes("cafe") || q.includes("travel") || q.includes("bangalore")) {
        matched = matched.filter(i => i.category === "Travel");
      }

      const priceMatch = q.match(/under\s*(\d+)/);
      if (priceMatch) {
        const maxPrice = parseFloat(priceMatch[1]);
        matched = matched.filter(i => i.price !== undefined && i.price <= maxPrice);
      }

      const keywords = q.split(" ").filter(w => w.length > 3 && !["show", "find", "what", "which", "saved", "under", "recommended"].includes(w));
      if (keywords.length > 0) {
        matched = matched.filter(item => {
          const content = `${item.title} ${item.subtitle || ''} ${item.description || ''} ${item.tags.join(" ")}`.toLowerCase();
          return keywords.every(kw => content.includes(kw));
        });
      }

      let answer = `Here's what I found for '${query}': ${matched.length} item(s).`;
      if (matched.length > 0) {
        if (q.includes("astronaut")) {
          answer = `Found it! **Interstellar** is a movie directed by Christopher Nolan featuring astronauts.`;
        } else if (q.includes("under")) {
          answer = `I found ${matched.length} skincare products under ₹1000, including **${matched[0].title}** (priced at ₹${matched[0].price}).`;
        } else if (q.includes("recommended") || q.includes("creator")) {
          const multi = matched.filter(i => i.recommendations_count > 1);
          if (multi.length > 0) {
            answer = `Yes! I found **${multi[0].title}** which has been recommended by ${multi[0].recommendations_count} creators.`;
          }
        }
      } else {
        answer = "I couldn't find any items matching that query in your screenshot brain.";
      }

      return {
        answer,
        matched_items: matched,
        query_type: "search"
      };
    }
  },

  // Get Profile + Insights
  async getProfile(): Promise<ProfileResponse> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/profile`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Profile fetch failed");
      return await res.json();
    } catch (e) {
      console.warn("Profile API failed, falling back to mock.", e);
      return {
        name: "Aayisha Kazi",
        handle: "@heylkazi",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        stats: {
          Saved: MOCK_ITEMS.length,
          Collections: MOCK_COLLECTIONS.length,
          Following: 89
        },
        insights: {
          saved_this_month: 68,
          top_category: "Skincare",
          favorite_brand: "Nike",
          recurring_theme: "Minimalism",
          monthly_trend: [
            { month: "Feb", count: 20 },
            { month: "Mar", count: 35 },
            { month: "Apr", count: 48 },
            { month: "May", count: 52 },
            { month: "Jun", count: 61 },
            { month: "Jul", count: MOCK_ITEMS.length + 10 }
          ],
          summary: `You saved ${MOCK_ITEMS.filter(i => i.category === "Products").length + 35} Products, ${MOCK_ITEMS.filter(i => i.category === "Movies").length + 10} Movies, and ${MOCK_ITEMS.filter(i => i.category === "Recipes").length + 12} Recipes this month. Your gallery focuses highly on Japanese Minimalism and Skincare routines.`
        }
      };
    }
  },

  // Delete an item permanently
  async deleteItem(id: string): Promise<boolean> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/item/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      return res.ok;
    } catch (e) {
      console.warn("Delete API failed, removing item client-side.", e);
      MOCK_ITEMS = MOCK_ITEMS.filter(item => item.id !== id);
      syncMockCollections();
      return true;
    }
  },

  // Archive an item (move to archive)
  async archiveItem(id: string): Promise<boolean> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/item/${id}/archive`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (res.ok) {
        // Remove from local mock immediately
        MOCK_ITEMS = MOCK_ITEMS.filter(item => item.id !== id);
        syncMockCollections();
      }
      return res.ok;
    } catch (e) {
      console.warn("Archive API failed.", e);
      MOCK_ITEMS = MOCK_ITEMS.filter(item => item.id !== id);
      syncMockCollections();
      return true;
    }
  },

  // Restore an archived item
  async restoreItem(id: string): Promise<boolean> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/item/${id}/restore`, {
        method: "PATCH",
        headers: authHeaders,
      });
      return res.ok;
    } catch (e) {
      console.warn("Restore API failed.", e);
      return false;
    }
  },
};

