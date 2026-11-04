-- Workspaces: one per brand. Main workspace = the account itself (data_user_id = owner_id).
-- Extra workspaces own their data through a hidden auth user, so every user_id scoped table is per brand.
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  position INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspaces_owner ON public.workspaces (owner_id, position);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces_owner_read" ON public.workspaces;
CREATE POLICY "workspaces_owner_read" ON public.workspaces FOR SELECT USING (auth.uid() = owner_id);
