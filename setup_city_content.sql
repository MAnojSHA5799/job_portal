CREATE TABLE IF NOT EXISTS city_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT UNIQUE NOT NULL,
  heading TEXT,
  subheading TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_city_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_city_content_updated_at ON city_content;

CREATE TRIGGER update_city_content_updated_at
BEFORE UPDATE ON city_content
FOR EACH ROW
EXECUTE PROCEDURE update_city_content_updated_at();
