-- =============================================================================
-- Migration: 20261017000004_seed_data.sql
-- Description: Standard operational seed data for Turashoboye Feeds (Mahama, Rwanda)
-- Units of measure, launch depot location, categories, settings, and regulatory placeholders.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Standard Units of Measure
-- -----------------------------------------------------------------------------
INSERT INTO public.units_of_measure (name, abbreviation, conversion_factor_to_base)
VALUES
    ('Kilogram', 'kg', 1.0000),
    ('50kg Bag', 'bag_50kg', 50.0000),
    ('25kg Bag', 'bag_25kg', 25.0000),
    ('10kg Bag', 'bag_10kg', 10.0000),
    ('Metric Ton', 't', 1000.0000)
ON CONFLICT (abbreviation) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Launch Inventory Location (Mahama Depot)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory_locations (name, code, address, is_default, is_active)
VALUES
    ('Mahama Primary Feed Depot', 'DEPOT-MAHAMA-01', 'Sector Mahama, Kirehe District, Eastern Province, Rwanda', true, true)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Product Categories
-- -----------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, display_order)
VALUES
    ('Poultry Feed', 'poultry-feed', 'Complete balanced feeds and mashes for broilers, layers, and chicks.', 1),
    ('Pig Feed', 'pig-feed', 'High-energy, protein-balanced feeds for piglets, growers, and sows.', 2),
    ('Cattle & Dairy Feed', 'cattle-feed', 'Concentrates and supplementary feeds for dairy and beef cattle.', 3),
    ('Raw Ingredients', 'raw-ingredients', 'Grains, meals, and cakes (maize, soya, bran) for grinding and mixing.', 4),
    ('Premixes & Minerals', 'premixes-minerals', 'Essential vitamins, calcium, and trace mineral premixes.', 5)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Initial Configurable System Settings
-- -----------------------------------------------------------------------------
INSERT INTO public.settings (key, value, description)
VALUES
    (
        'currency',
        '{"code": "RWF", "symbol": "FRW", "decimals": 0}'::jsonb,
        'Operating currency code and presentation format'
    ),
    (
        'production_loss_warning_threshold_pct',
        '{"pct": 5.0}'::jsonb,
        'Configurable production loss percentage warning threshold'
    ),
    (
        'inventory_adjustment_approval_threshold_qty',
        '{"qty": 100.0}'::jsonb,
        'Stock adjustment quantity above which Manager authorization is required'
    ),
    (
        'retention_policy_years',
        '{"financial_years": 10, "traceability_years": 10}'::jsonb,
        'Statutory and operational record retention baseline in years'
    )
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Configurable Rwanda Regulatory Compliance Placeholders
-- Ready for staff verification with RICA, RSB, RDB, and RRA.
-- -----------------------------------------------------------------------------
INSERT INTO public.regulatory_records (category, authority, title, reference_number, status, notes)
VALUES
    (
        'premises_licence',
        'RICA',
        'Animal Feed Operating Licence / Facility Permit',
        'PENDING-RICA-APPLICATION',
        'not_entered',
        'RICA mandate covers animal feed safety and feed processor licensing.'
    ),
    (
        'product_registration',
        'RSB',
        'Animal Feed Product Registration (Zamukana Ubuziranenge)',
        'PENDING-RSB-REGISTRATION',
        'not_entered',
        'RSB program for agro-processing technical assistance and product quality certification.'
    ),
    (
        'company_registration',
        'RDB',
        'RDB Company Incorporation Certificate',
        'PENDING-RDB-VERIFICATION',
        'not_entered',
        'Rwanda Development Board official certificate of registration and enterprise TIN.'
    ),
    (
        'standard_certification',
        'RRA',
        'Taxpayer Registration & Fiscal Compliance',
        'PENDING-RRA-TIN',
        'not_entered',
        'Statutory 10-year retention rule applies to books of account and supporting transaction records.'
    )
ON CONFLICT DO NOTHING;
