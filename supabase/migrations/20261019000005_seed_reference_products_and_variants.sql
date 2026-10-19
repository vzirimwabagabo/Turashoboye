-- =============================================================================
-- Migration: 20261019000005_seed_reference_products_and_variants.sql
-- Description:
-- Seeds authentic reference products, variants, product images, suppliers,
-- and production formulations for Turashoboye Feeds.
-- =============================================================================

DO $$
DECLARE
    -- Category IDs
    v_cat_poultry UUID;
    v_cat_pig UUID;
    v_cat_cattle UUID;
    v_cat_raw UUID;
    v_cat_premix UUID;

    -- Unit IDs
    v_unit_kg UUID;
    v_unit_50kg UUID;
    v_unit_25kg UUID;
    v_unit_10kg UUID;

    -- Product IDs
    v_prod_bsm UUID := gen_random_uuid();
    v_prod_lcm UUID := gen_random_uuid();
    v_prod_psm UUID := gen_random_uuid();
    v_prod_dmc UUID := gen_random_uuid();
    v_prod_maize UUID := gen_random_uuid();
    v_prod_soya UUID := gen_random_uuid();
    v_prod_premix UUID := gen_random_uuid();

    -- Variant IDs
    v_var_bsm_50kg UUID := gen_random_uuid();
    v_var_bsm_25kg UUID := gen_random_uuid();
    v_var_lcm_50kg UUID := gen_random_uuid();
    v_var_psm_50kg UUID := gen_random_uuid();
    v_var_dmc_50kg UUID := gen_random_uuid();
    v_var_maize_kg UUID := gen_random_uuid();
    v_var_soya_kg UUID := gen_random_uuid();
    v_var_premix_kg UUID := gen_random_uuid();

    -- Supplier IDs
    v_sup_kirehe UUID := gen_random_uuid();
    v_sup_soya UUID := gen_random_uuid();
BEGIN
    -- Retrieve existing category IDs
    SELECT id INTO v_cat_poultry FROM public.categories WHERE slug = 'poultry-feed';
    SELECT id INTO v_cat_pig FROM public.categories WHERE slug = 'pig-feed';
    SELECT id INTO v_cat_cattle FROM public.categories WHERE slug = 'cattle-feed';
    SELECT id INTO v_cat_raw FROM public.categories WHERE slug = 'raw-ingredients';
    SELECT id INTO v_cat_premix FROM public.categories WHERE slug = 'premixes-minerals';

    -- Retrieve existing unit IDs
    SELECT id INTO v_unit_kg FROM public.units_of_measure WHERE abbreviation = 'kg';
    SELECT id INTO v_unit_50kg FROM public.units_of_measure WHERE abbreviation = 'bag_50kg';
    SELECT id INTO v_unit_25kg FROM public.units_of_measure WHERE abbreviation = 'bag_25kg';
    SELECT id INTO v_unit_10kg FROM public.units_of_measure WHERE abbreviation = 'bag_10kg';

    -- 1. Insert Reference Finished Feeds
    INSERT INTO public.products (id, category_id, name, slug, description, type, target_animal, published)
    VALUES
        (v_prod_bsm, v_cat_poultry, 'Turashoboye Broiler Starter Mash', 'broiler-starter-mash',
         'High-protein starter mash (21-22% crude protein) formulated with soya meal and essential minerals for broiler chicks aged 0 to 3 weeks.',
         'finished_feed', 'Poultry (Broilers)', true),
        (v_prod_lcm, v_cat_poultry, 'Turashoboye Layer Complete Mash', 'layer-complete-mash',
         'Fortified with calcium, phosphorus, and vitamin premix to sustain strong eggshell quality and high peak lay percentages in laying hens.',
         'finished_feed', 'Poultry (Layers)', true),
        (v_prod_psm, v_cat_pig, 'Turashoboye Pig Starter Mash', 'pig-starter-mash',
         'Digestible energy-dense formula formulated with amino acids for healthy piglet growth and feed conversion.',
         'finished_feed', 'Swine (Piglets)', true),
        (v_prod_dmc, v_cat_cattle, 'Turashoboye Dairy Meal Concentrate', 'dairy-meal-concentrate',
         'Balanced protein concentrate supporting daily milk production in local and crossbred dairy cattle.',
         'finished_feed', 'Dairy Cattle', true)
    ON CONFLICT (slug) DO UPDATE SET published = true;

    -- 2. Insert Reference Raw Ingredients
    INSERT INTO public.products (id, category_id, name, slug, description, type, target_animal, published)
    VALUES
        (v_prod_maize, v_cat_raw, 'Whole Yellow Maize Grain', 'whole-maize-grain',
         'Clean, tested whole maize grain (Max moisture 13.5%, Aflatoxin <10 ppb) sourced from Eastern Province cooperatives.',
         'raw_ingredient', 'Multi-Species', false),
        (v_prod_soya, v_cat_raw, 'Feed-Grade Soya Bean Meal', 'feed-grade-soya-meal',
         'Solvent-extracted high-protein soya bean meal (Crude Protein >= 46%) for animal feed blending.',
         'raw_ingredient', 'Multi-Species', false),
        (v_prod_premix, v_cat_premix, 'Broiler & Layer Mineral Premix', 'mineral-premix',
         'Essential micronutrients, trace minerals, vitamins A, D3, E, and lysine.',
         'mineral_premix', 'Poultry', false)
    ON CONFLICT (slug) DO NOTHING;

    -- Fetch product IDs if already existed
    SELECT id INTO v_prod_bsm FROM public.products WHERE slug = 'broiler-starter-mash';
    SELECT id INTO v_prod_lcm FROM public.products WHERE slug = 'layer-complete-mash';
    SELECT id INTO v_prod_psm FROM public.products WHERE slug = 'pig-starter-mash';
    SELECT id INTO v_prod_dmc FROM public.products WHERE slug = 'dairy-meal-concentrate';
    SELECT id INTO v_prod_maize FROM public.products WHERE slug = 'whole-maize-grain';
    SELECT id INTO v_prod_soya FROM public.products WHERE slug = 'feed-grade-soya-meal';
    SELECT id INTO v_prod_premix FROM public.products WHERE slug = 'mineral-premix';

    -- 3. Insert Product Variants
    INSERT INTO public.product_variants (id, product_id, sku, package_size, unit_id, price_rwf, cost_rwf, reorder_threshold, is_active)
    VALUES
        (v_var_bsm_50kg, v_prod_bsm, 'BSM-50KG', '50kg Bag', v_unit_50kg, 24000, 19500, 20.00, true),
        (v_var_bsm_25kg, v_prod_bsm, 'BSM-25KG', '25kg Bag', v_unit_25kg, 12500, 10000, 15.00, true),
        (v_var_lcm_50kg, v_prod_lcm, 'LCM-50KG', '50kg Bag', v_unit_50kg, 22000, 18000, 20.00, true),
        (v_var_psm_50kg, v_prod_psm, 'PSM-50KG', '50kg Bag', v_unit_50kg, 21500, 17500, 15.00, true),
        (v_var_dmc_50kg, v_prod_dmc, 'DMC-50KG', '50kg Bag', v_unit_50kg, 20000, 16000, 15.00, true),
        (v_var_maize_kg, v_prod_maize, 'RAW-MAIZE-KG', '1kg Bulk', v_unit_kg, 320, 290, 500.00, true),
        (v_var_soya_kg, v_prod_soya, 'RAW-SOYA-KG', '1kg Bulk', v_unit_kg, 840, 780, 200.00, true),
        (v_var_premix_kg, v_prod_premix, 'PREMIX-KG', '1kg Bulk', v_unit_kg, 1800, 1600, 50.00, true)
    ON CONFLICT (sku) DO NOTHING;

    -- 4. Insert Primary Images
    INSERT INTO public.product_images (product_id, cloudinary_public_id, image_url, alt_text, is_primary)
    VALUES
        (v_prod_bsm, 'broiler_starter', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80', 'Turashoboye Broiler Starter Mash', true),
        (v_prod_lcm, 'layer_mash', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', 'Turashoboye Layer Complete Mash', true),
        (v_prod_psm, 'pig_starter', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', 'Turashoboye Pig Starter Mash', true),
        (v_prod_dmc, 'dairy_meal', 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80', 'Turashoboye Dairy Meal Concentrate', true)
    ON CONFLICT DO NOTHING;

    -- 5. Insert Verified Suppliers
    INSERT INTO public.suppliers (id, name, contact_name, phone, email, address, tin_number)
    VALUES
        (v_sup_kirehe, 'Kirehe Grain Farmers Cooperative (KIFCO)', 'Emmanuel Nshimyumuremyi', '+250 788 456 789', 'kifco.coop@gmail.com', 'Sector Gahara, Kirehe, Rwanda', '102345678'),
        (v_sup_soya, 'Eastern Province Soya Processors Ltd', 'Chantal Mukamana', '+250 788 654 321', 'sales@ep-soya.rw', 'Rwamagana Industrial Park, Rwanda', '109876543')
    ON CONFLICT DO NOTHING;

END $$;
