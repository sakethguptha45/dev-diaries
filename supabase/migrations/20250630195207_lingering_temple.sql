/*
  # Dev Diaries Database Setup

  This SQL script sets up the complete database schema for the Dev Diaries application.
  
  ## What this creates:
  1. Cards table for storing user notes, code snippets, and knowledge
  2. Row Level Security (RLS) policies for data protection
  3. Indexes for optimal performance
  4. Triggers for automatic timestamp updates

  ## Security:
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations

  ## Usage:
  1. Copy this entire SQL code
  2. Go to your Supabase Dashboard
  3. Navigate to SQL Editor
  4. Paste and run this script
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'code', 'link', 'file')),
  content text NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  links text[] NOT NULL DEFAULT '{}',
  files jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cards table

-- Policy: Users can view their own cards
CREATE POLICY "Users can view own cards"
  ON cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own cards
CREATE POLICY "Users can insert own cards"
  ON cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cards
CREATE POLICY "Users can update own cards"
  ON cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cards
CREATE POLICY "Users can delete own cards"
  ON cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance

-- Index on user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- Index on updated_at for sorting by recent updates
CREATE INDEX IF NOT EXISTS idx_cards_updated_at ON cards(updated_at DESC);

-- Index on created_at for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- Index on favorite for filtering favorite cards
CREATE INDEX IF NOT EXISTS idx_cards_favorite ON cards(favorite) WHERE favorite = true;

-- Index on type for filtering by card type
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);

-- Composite index for user + updated_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_cards_user_updated ON cards(user_id, updated_at DESC);

-- Composite index for user + favorite
CREATE INDEX IF NOT EXISTS idx_cards_user_favorite ON cards(user_id, favorite) WHERE favorite = true;

-- GIN index for full-text search on title and content
CREATE INDEX IF NOT EXISTS idx_cards_search ON cards USING gin(
  to_tsvector('english', title || ' ' || content || ' ' || explanation)
);

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_cards_tags ON cards USING gin(tags);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on card updates
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_cards(
  search_query text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  type text,
  content text,
  explanation text,
  links text[],
  files jsonb,
  tags text[],
  favorite boolean,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.title,
    c.type,
    c.content,
    c.explanation,
    c.links,
    c.files,
    c.tags,
    c.favorite,
    c.created_at,
    c.updated_at,
    ts_rank(
      to_tsvector('english', c.title || ' ' || c.content || ' ' || c.explanation),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM cards c
  WHERE 
    c.user_id = user_uuid
    AND (
      to_tsvector('english', c.title || ' ' || c.content || ' ' || c.explanation) @@ plainto_tsquery('english', search_query)
      OR c.tags && string_to_array(search_query, ' ')
    )
  ORDER BY rank DESC, c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON cards TO authenticated;
GRANT EXECUTE ON FUNCTION search_cards TO authenticated;

-- Insert some sample data (optional - remove if you don't want sample data)
-- This will only work if you have a user account created

/*
-- Uncomment the following lines if you want to insert sample data
-- Replace 'your-user-id-here' with your actual user ID from auth.users

INSERT INTO cards (user_id, title, type, content, explanation, tags, favorite) VALUES
(
  'your-user-id-here', -- Replace with your actual user ID
  'Welcome to Dev Diaries',
  'note',
  '<h1>Welcome to Dev Diaries!</h1><p>This is your personal knowledge management system. You can create notes, save code snippets, and organize your development insights.</p>',
  'This is a sample welcome note to get you started with Dev Diaries.',
  ARRAY['welcome', 'getting-started'],
  true
),
(
  'your-user-id-here', -- Replace with your actual user ID
  'React useState Hook',
  'code',
  '<pre><code>import React, { useState } from ''react'';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}</code></pre>',
  'Basic example of React useState hook for managing component state.',
  ARRAY['react', 'hooks', 'javascript'],
  false
);
*/

-- Verify the setup
SELECT 
  'Cards table created successfully' as status,
  COUNT(*) as total_cards
FROM cards;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cards';

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'cards'
ORDER BY indexname;