/*
  # Create meditations and related tables

  1. New Tables
    - `categories`
      - `id` (text, primary key)
      - `name` (text, display name)
      - `description` (text, optional description)
      - `created_at` (timestamp)
    - `meditations`
      - `id` (text, primary key)
      - `title` (text)
      - `description` (text)
      - `category_id` (text, foreign key to categories)
      - `duration_minutes` (integer)
      - `audio_url` (text)
      - `image_url` (text)
      - `featured` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (meditations are public content)

  3. Data
    - Insert initial categories
    - Insert existing meditation data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create meditations table
CREATE TABLE IF NOT EXISTS meditations (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id),
  duration_minutes integer NOT NULL,
  audio_url text NOT NULL,
  image_url text NOT NULL,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditations ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (meditations are public content)
CREATE POLICY "Categories are publicly readable"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Meditations are publicly readable"
  ON meditations
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meditations_category_id ON meditations(category_id);
CREATE INDEX IF NOT EXISTS idx_meditations_featured ON meditations(featured);
CREATE INDEX IF NOT EXISTS idx_meditations_duration ON meditations(duration_minutes);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meditations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on meditation changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_meditations_updated_at'
  ) THEN
    CREATE TRIGGER update_meditations_updated_at
      BEFORE UPDATE ON meditations
      FOR EACH ROW EXECUTE FUNCTION update_meditations_updated_at();
  END IF;
END $$;

-- Insert categories
INSERT INTO categories (id, name, description) VALUES
  ('breathing', 'Breathing', 'Focus on breath awareness and breathing techniques'),
  ('sleep', 'Sleep', 'Guided meditations to help you fall asleep peacefully'),
  ('body-scan', 'Body Scan', 'Progressive relaxation through body awareness'),
  ('anxiety-relief', 'Anxiety Relief', 'Calming meditations to reduce stress and anxiety'),
  ('women', 'Women', 'Meditations specifically designed for women'),
  ('guided-imagery', 'Guided Imagery', 'Visualization and imaginative meditation practices')
ON CONFLICT (id) DO NOTHING;

-- Insert meditations
INSERT INTO meditations (id, title, description, category_id, duration_minutes, audio_url, image_url, featured, created_at) VALUES
  ('1', 'Finding Calm', 'A meditation to help you find your inner peace and breath.', 'breathing', 5, 'https://desert-zenmeditations.com/wp-content/uploads/2025/05/5-Minute-Breathing-Meditation-22Finding-Calm22.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/101-Finding-Calm-5m-breathing-1x1-1-1024x1024.webp', false, '2024-05-01'),
  ('2', 'Drifting into Rest', 'A meditation to bring help you find your dreams.', 'sleep', 15, 'https://desert-zenmeditations.com/wp-content/uploads/2025/05/15-Minute-Sleep-Meditation-Drifting-into-rest.mp3', 'https://desert-zenmeditations.com/wp-content/uploads/102-Drifting-Into-Rest-15m-sleep-1x1-1-1024x1024.webp', false, '2024-05-02'),
  ('3', 'Coming Home to Your Body', 'A meditation to help you return to your body.', 'body-scan', 30, 'https://desert-zenmeditations.com/wp-content/uploads/2025/05/30-Minute-Body-Scan-Meditation-Coming-Home-to-Your-Body.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/103-Coming-Home-to-Your-Body-30m-body-scan-1x1-1-1024x1024.webp', false, '2024-05-03'),
  ('4', 'Inner Awareness', 'A meditation to help soothe anxious thoughts.', 'anxiety-relief', 15, 'https://desert-zenmeditations.com/wp-content/uploads/2025/05/Anxiety-Stress-Relief-10-min.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/104-Inner-Awareness-10m-anxiety-relief-1x1-1-1024x1024.webp', false, '2024-05-04'),
  ('5', 'Head to Toe', 'A body scan meditation to bring you back to yourself.', 'body-scan', 30, 'https://desert-zenmeditations.com/wp-content/uploads/Body-Scan-Meditation-for-Deep-Relaxation-15-min.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/105-Head-to-Toe-15m-body-scan-1x1-1-1024x1024.webp', true, '2024-05-05'),
  ('6', 'Breathing Through the Loss', 'A meditation for those who have lost.', 'anxiety-relief', 5, 'https://desert-zenmeditations.com/wp-content/uploads/Guided-Imagery-Meditation-for-Grief-and-Loss-10-min.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/106-Anchored-in-Sorrow-20m-grief-and-loss-1x1-1-1024x1024.jpg', false, '2024-05-06'),
  ('7', 'A Walk on the Beach', 'A meditation for Women.', 'women', 10, 'https://desert-zenmeditations.com/wp-content/uploads/Guided-Imagery-Meditation-A-Walk-on-the-Beach-10-min.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/107-A-Walk-on-the-Beach-10m-women-1x1-1-1024x1024.webp', false, '2024-05-07'),
  ('8', 'Embracing Inner Strength and Peace', 'A meditation to find your inner strength.', 'women', 10, 'https://desert-zenmeditations.com/wp-content/uploads/Guided-Meditation-for-Women-–-Embracing-Inner-Strength-and-Peace-10-min-.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/108-Embracing-Inner-Strength-10m-women-1x1-1-1024x1024.webp', true, '2024-05-08'),
  ('9', 'You are Doing Enough', 'A meditation for Busy Parents.', 'body-scan', 30, 'https://desert-zenmeditations.com/wp-content/uploads/Meditation-for-Busy-Parents-You-Are-Doing-Enough-10min.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/109-You-Are-Doing-Enough-10m-parents-1x1-1-1024x1024.webp', false, '2024-05-09'),
  ('10', 'Releasing Shame and Remembering Your Worth', 'A meditation for Women.', 'guided-imagery', 45, 'https://desert-zenmeditations.com/wp-content/uploads/Meditation-for-Women-Releasing-Shame-and-Remembering-Your-Worth.m4a', 'https://desert-zenmeditations.com/wp-content/uploads/110-Releasing-Shame-and-Remembering-Your-Worth-10m-women-1x1-1-1024x1024.jpg', false, '2024-05-10')
ON CONFLICT (id) DO NOTHING;