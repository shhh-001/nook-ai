-- Nook AI Database Schema Setup
-- Run this script inside the Supabase SQL Editor.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

-- Enable RLS on collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Collections RLS Policies
CREATE POLICY "Users can create their own collections."
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own collections."
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections."
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections."
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'INR',
    rating NUMERIC,
    cooking_time TEXT,
    ingredients TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    ocr_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    image_url TEXT NOT NULL, -- Storage path key in Supabase Storage
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    recommendations_count INT DEFAULT 1,
    creators TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (collection_id, user_id) REFERENCES public.collections(id, user_id) ON DELETE CASCADE
);

-- Enable RLS on items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Items RLS Policies
CREATE POLICY "Users can insert their own items."
    ON public.items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own items."
    ON public.items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own items."
    ON public.items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items."
    ON public.items FOR DELETE
    USING (auth.uid() = user_id);


-- 3. Create Source Screenshots Table (Duplicate tracking)
CREATE TABLE IF NOT EXISTS public.source_screenshots (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (item_id, user_id) REFERENCES public.items(id, user_id) ON DELETE CASCADE
);

-- Enable RLS on source_screenshots
ALTER TABLE public.source_screenshots ENABLE ROW LEVEL SECURITY;

-- Source Screenshots RLS Policies
CREATE POLICY "Users can insert their own source screenshots."
    ON public.source_screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own source screenshots."
    ON public.source_screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own source screenshots."
    ON public.source_screenshots FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own source screenshots."
    ON public.source_screenshots FOR DELETE
    USING (auth.uid() = user_id);
