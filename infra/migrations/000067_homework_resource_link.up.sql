-- Add resource linking to homework assignments
ALTER TABLE homework ADD COLUMN resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL;
