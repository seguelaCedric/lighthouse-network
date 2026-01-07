-- Create team_members table for About page
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  bio text NOT NULL,
  languages text,
  email text,
  image_url text,
  linkedin_url text,
  facebook_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_org_sort_idx
  ON public.team_members (organization_id, sort_order);

-- Keep updated_at current
DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function for admin role checks
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public can read active team members
DROP POLICY IF EXISTS team_members_public_select ON public.team_members;
CREATE POLICY team_members_public_select ON public.team_members
  FOR SELECT
  USING (is_active = true);

-- Agency admins can manage team members for their org
DROP POLICY IF EXISTS team_members_admin_select ON public.team_members;
CREATE POLICY team_members_admin_select ON public.team_members
  FOR SELECT
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS team_members_admin_insert ON public.team_members;
CREATE POLICY team_members_admin_insert ON public.team_members
  FOR INSERT
  WITH CHECK (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS team_members_admin_update ON public.team_members;
CREATE POLICY team_members_admin_update ON public.team_members
  FOR UPDATE
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  )
  WITH CHECK (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS team_members_admin_delete ON public.team_members;
CREATE POLICY team_members_admin_delete ON public.team_members
  FOR DELETE
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

-- Seed default team data if table is empty
WITH default_agency AS (
  SELECT id
  FROM public.organizations
  WHERE type = 'agency'
  ORDER BY created_at ASC
  LIMIT 1
),
seed_data AS (
  SELECT * FROM (VALUES
    (1, 'Milica Seguela', 'Director / Captains and Pursers', 'Milica heads up the team and offers a wealth of experience, having spent her entire career in the service industry - from working in luxury hotels, to private households, cruise ships and the yachting industry. She has a Hotel Management degree and over a decade experience in placing senior crew in the yacht crew recruitment sector, as well as household staff.', 'English, French, Serbo-Croatian', 'ms@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2024/12/Milica-after-AI-filter.png', 'https://www.linkedin.com/in/milica-seguela-53a4b814/', 'https://www.facebook.com/profile.php?id=100006010186497'),
    (2, 'Phil Richards', 'Engineering department', 'With a 16-year tenure in the yachting industry, Phil honed his expertise as a Chief Engineer aboard a number of vessels. Progressing to the role of a Technical Manager. Passionate about steering engineers'' career paths, he remains dedicated to nurturing talent and providing invaluable industry guidance to both candidates and clients.', null, 'pr@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2024/12/Phil.png', 'https://www.linkedin.com/in/phil-richards-a1906985/', null),
    (3, 'Joaneen Botha', 'Deck department', 'With over 10 years at sea, Joaneen rose to Chief Stew on yachts over 100 meters, mastering crew dynamics and vessel needs. After studying in New York, she thrived as an international recruitment consultant in the Netherlands, specializing in top talent. Her dual expertise in yachting and recruitment uniquely positions her to connect exceptional candidates with luxury yacht roles.', null, 'jb@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2025/01/JOANEEN-3.png', 'https://www.linkedin.com/in/joaneenbotha', null),
    (4, 'Waldi Coetzee', 'Interior Department', 'Having spent 11 years on yachts up to 100m, and another 3 years as Crew Coordinator, Waldi now draws on her deep maritime experience as a recruiter. She matches seasoned interior crew with yachts, using her firsthand understanding of vessel needs and team dynamics to build the perfect onboard teams. Dedicated to finding the perfect match every time!', null, 'wc@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2025/12/PHOTO-2025-12-01-16-29-31.jpg', null, null),
    (5, 'Charlie Cartledge', 'Deck Department', 'Charlie is British and grew up in the coastal town of Dover. With a BA in Sports Journalism and a deep-rooted passion for sports, they have shaped a diverse career path that blends communication with technical expertise. Over the past three years, he has gained valuable experience in yacht recruitment, focusing on the Deck department.', null, 'cc@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2024/12/Charlie-scaled.jpg', 'https://www.linkedin.com/in/charles-cartledge/', null),
    (6, 'Laura Hayes', 'Interior department', 'Laura has over four years of hands-on experience onboard yachts, working her way up to a Head of House. Now, she''s channelling her passion for the yachting world into yacht crew recruitment, where she can leverage her first-hand knowledge to help build strong, reliable interior teams.', null, 'lh@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2025/03/PHOTO-2025-03-18-11-34-54.jpg', null, null),
    (7, 'Britt McBride', 'Interior department / Specialist roles', 'Britt is an Australian national. She is a fully qualified nurse with over a decade of hospital experience and over four years working aboard yachts as a nurse and housekeeper. She remains dedicated to nurturing talent and offering valuable industry insight to candidates coming from similar backgrounds.', null, 'bm@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2025/05/Britt-Headshot-1.jpeg', null, null),
    (8, 'Ornela Grmusa', 'Administrator', 'Ornela is Croatian, who lived and worked in the UK for many years. Coming from a seaside town, she loves everything to do with the sea. Ornela previously worked on board cruise liners, as well as in admin roles. She now looks after all things admin and ensures smooth running of our daily business.', 'English, Italian, Croatian', 'admin@lighthouse-careers.com', 'https://www.lighthouse-careers.com/wp-content/uploads/2024/12/Ornela.png', null, null),
    (9, 'Kaoutar Zahouane', 'Admin/ Digital Marketing', 'Kaoutar grew up in Morocco and moved to France in 2017 to pursue a career in International Business Management. With a Master''s degree in Marketing, she is particularly passionate about digital marketing and is keen to gain more experience in the recruitment industry.', 'Arabic, French, English', null, 'https://www.lighthouse-careers.com/wp-content/uploads/2024/12/Kaoutar.png', null, null)
  ) AS v(sort_order, name, role, bio, languages, email, image_url, linkedin_url, facebook_url)
)
INSERT INTO public.team_members (
  organization_id,
  name,
  role,
  bio,
  languages,
  email,
  image_url,
  linkedin_url,
  facebook_url,
  sort_order,
  is_active
)
SELECT
  default_agency.id,
  seed_data.name,
  seed_data.role,
  seed_data.bio,
  seed_data.languages,
  seed_data.email,
  seed_data.image_url,
  seed_data.linkedin_url,
  seed_data.facebook_url,
  seed_data.sort_order,
  true
FROM default_agency
CROSS JOIN seed_data
WHERE EXISTS (SELECT 1 FROM default_agency)
  AND NOT EXISTS (SELECT 1 FROM public.team_members);
