-- Public cover images; writes remain restricted to the server service role.
-- Do not add anonymous or general authenticated storage write policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event_covers', 'event_covers', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
