-- =============================================================================
-- Migration: 20261018000002_user_management_and_triggers.sql
-- Description:
-- 1. Automates profile creation on auth.users registration (fixing signup RLS)
-- 2. Adds email column to public.profiles for administrative user management
-- 3. Enables role management function for system owner
-- 4. Seeds authentic real product and animal imagery into public.product_images
-- =============================================================================

-- 1. Add email column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.auth_user_id = u.id AND (p.email IS NULL OR p.email = '');

-- 2. Automatic Profile Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.app_role;
    user_display_name TEXT;
BEGIN
    -- Determine role from user metadata, defaulting to 'public' for customer self-signup
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            assigned_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
        EXCEPTION WHEN OTHERS THEN
            assigned_role := 'public'::public.app_role;
        END;
    ELSE
        assigned_role := 'public'::public.app_role;
    END IF;

    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'displayName',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (auth_user_id, email, display_name, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_display_name,
        user_display_name,
        assigned_role
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Admin function to update user roles
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_profile_id UUID, new_role public.app_role)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only system administrators/owners can reassign user roles.';
    END IF;

    UPDATE public.profiles
    SET role = new_role, updated_at = timezone('utc', now())
    WHERE id = target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policy Enhancements for Profiles
DROP POLICY IF EXISTS "Profiles are viewable by self or management" ON public.profiles;
CREATE POLICY "Profiles are viewable by self or management"
ON public.profiles FOR SELECT
USING (
    auth_user_id = auth.uid() OR public.is_staff()
);

DROP POLICY IF EXISTS "Profiles can be inserted on registration or by owner" ON public.profiles;
CREATE POLICY "Profiles can be inserted on registration or by owner"
ON public.profiles FOR INSERT
WITH CHECK (
    auth_user_id = auth.uid() OR public.is_owner() OR auth.uid() IS NULL
);

-- 5. Seed Real Agricultural Animal Feed Photos into public.product_images
-- Links real Unsplash high-resolution livestock and feed photos to seeded products
DO $$
DECLARE
    prod_record RECORD;
BEGIN
    FOR prod_record IN SELECT id, slug FROM public.products LOOP
        IF prod_record.slug LIKE '%broiler%' THEN
            INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary, display_order)
            VALUES (
                prod_record.id,
                'animal-broiler-chicks',
                'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
                'Broiler Chicks & Starter Feed at Mahama Depot',
                true,
                0
            ) ON CONFLICT DO NOTHING;

        ELSIF prod_record.slug LIKE '%layer%' THEN
            INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary, display_order)
            VALUES (
                prod_record.id,
                'animal-layer-hens',
                'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80',
                'Healthy Layer Hens in Egg Laying Facility',
                true,
                0
            ) ON CONFLICT DO NOTHING;

        ELSIF prod_record.slug LIKE '%pig%' THEN
            INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary, display_order)
            VALUES (
                prod_record.id,
                'animal-pigs-grower',
                'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=800&q=80',
                'Pigs Feeding with Balanced Grower Feed',
                true,
                0
            ) ON CONFLICT DO NOTHING;

        ELSIF prod_record.slug LIKE '%dairy%' OR prod_record.slug LIKE '%cattle%' THEN
            INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary, display_order)
            VALUES (
                prod_record.id,
                'animal-dairy-cattle',
                'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80',
                'Lactating Dairy Cattle with High Milk Yield Ration',
                true,
                0
            ) ON CONFLICT DO NOTHING;

        ELSIF prod_record.slug LIKE '%soya%' THEN
            INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary, display_order)
            VALUES (
                prod_record.id,
                'feed-milled-soya',
                'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
                'Roasted Feed-Grade Soya Bean Meal Sacks',
                true,
                0
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
