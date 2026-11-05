-- ============================================================================
-- ThreadPilot AI — Demo Textile Traders Comprehensive Demo Data Seeding
-- Designed for MCA Major Project Evaluation
-- Tenant: Demo Textile Traders (ID: d061d703-f8b2-4669-98ed-cbd65b9896a7, Code: DEMO123)
-- Admin User: Demo Man (ID: 1818be5b-5f4f-4cf0-ac8c-8bca01d198ae, Email: Demo123@gmail.com)
-- Fictional Demonstration Data - Decimal Safe, Foreign-Key Safe, Fully Idempotent
-- Exact Enums verified against Java Domain Models
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_org_id UUID := 'd061d703-f8b2-4669-98ed-cbd65b9896a7'::uuid;
    v_user_id UUID := '1818be5b-5f4f-4cf0-ac8c-8bca01d198ae'::uuid;
    
    -- Products
    v_prod1_id UUID := 'd80c6c13-cc9a-4565-8c16-c1e7dca2b3a6'::uuid; -- Classic Wool Sweater
    v_prod2_id UUID := '3fe6402e-397b-4f72-8b1c-fe210008f76d'::uuid; -- Men's Thermal Wear
    v_prod3_id UUID := 'a1111111-1111-4111-8111-111111111103'::uuid; -- Ladies Winter Cardigan
    v_prod4_id UUID := 'a1111111-1111-4111-8111-111111111104'::uuid; -- Knitted Woollen Vest
    
    -- Suppliers
    v_supp1_id UUID := 'c1111111-1111-4111-8111-111111111101'::uuid; -- Punjab Woollen Suppliers
    v_supp2_id UUID := 'c1111111-1111-4111-8111-111111111102'::uuid; -- Northern Textile Distributors
    
    -- Customers
    v_cust1_id UUID := 'd1111111-1111-4111-8111-111111111101'::uuid; -- Sharma Garments
    v_cust2_id UUID := 'd1111111-1111-4111-8111-111111111102'::uuid; -- Royal Hosiery
    v_cust3_id UUID := 'd1111111-1111-4111-8111-111111111103'::uuid; -- Fashion Point
    
    -- Orders
    v_ord1_id UUID := 'e1111111-1111-4111-8111-111111111101'::uuid;
    v_ord2_id UUID := 'e1111111-1111-4111-8111-111111111102'::uuid;
    v_ord3_id UUID := 'e1111111-1111-4111-8111-111111111103'::uuid;
    
    -- Invoices
    v_sinv1_id UUID := 'a4444444-4444-4444-8444-444444444401'::uuid;
    v_sinv2_id UUID := 'a4444444-4444-4444-8444-444444444402'::uuid;
    
    -- POs
    v_po1_id UUID := 'a3333333-3333-4333-8333-333333333301'::uuid;
    v_po2_id UUID := 'a3333333-3333-4333-8333-333333333302'::uuid;
    
    -- Sales
    v_sale1_id UUID := 'a2222222-2222-4222-8222-222222222201'::uuid;
    v_sale2_id UUID := 'a2222222-2222-4222-8222-222222222202'::uuid;
    
    -- Payments
    v_pay1_id UUID := 'f1111111-1111-4111-8111-111111111101'::uuid;
    v_pay2_id UUID := 'f1111111-1111-4111-8111-111111111102'::uuid;
    v_pay3_id UUID := 'f1111111-1111-4111-8111-111111111103'::uuid;
    v_pay4_id UUID := 'f1111111-1111-4111-8111-111111111104'::uuid;
    v_pay5_id UUID := 'f1111111-1111-4111-8111-111111111105'::uuid;
    
    -- Expenses
    v_exp1_id UUID := 'b2222222-2222-4222-8222-222222222201'::uuid;
    v_exp2_id UUID := 'b2222222-2222-4222-8222-222222222202'::uuid;
    v_exp3_id UUID := 'b2222222-2222-4222-8222-222222222203'::uuid;
    v_exp4_id UUID := 'b2222222-2222-4222-8222-222222222204'::uuid;
    
    -- Alerts
    v_alt1_id UUID := 'b3333333-3333-4333-8333-333333333301'::uuid;
    v_alt2_id UUID := 'b3333333-3333-4333-8333-333333333302'::uuid;
    v_alt3_id UUID := 'b3333333-3333-4333-8333-333333333303'::uuid;
    
    -- Reminders
    v_rem1_id UUID := 'b4444444-4444-4444-8444-444444444401'::uuid;
    v_rem2_id UUID := 'b4444444-4444-4444-8444-444444444402'::uuid;
    v_rem3_id UUID := 'b4444444-4444-4444-8444-444444444403'::uuid;
BEGIN
    -- ------------------------------------------------------------------------
    -- 1. SUPPLIERS
    -- ------------------------------------------------------------------------
    INSERT INTO suppliers (
        id, name, company_name, phone, email, address, city, state, postal_code,
        gst_number, pan_number, payment_terms, outstanding_amount, status, notes,
        organization_id, created_at, updated_at, version
    ) VALUES (
        v_supp1_id, 'Punjab Woollen Suppliers', 'Punjab Woollen Mills Pvt Ltd',
        '+91 98111 22334', 'punjab.woollen.demo@threadpilot.ai', 'Plot 42, Industrial Area A',
        'Ludhiana', 'Punjab', '141003', '03AAAPP1122D1Z4', 'AAAPP1122D', 'NET_30',
        15000.00, 'ACTIVE', '[DEMO DATA] Primary spinning yarn and dyed wool supplier for MCA project evaluation',
        v_org_id, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        payment_terms = EXCLUDED.payment_terms,
        outstanding_amount = EXCLUDED.outstanding_amount,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;

    INSERT INTO suppliers (
        id, name, company_name, phone, email, address, city, state, postal_code,
        gst_number, pan_number, payment_terms, outstanding_amount, status, notes,
        organization_id, created_at, updated_at, version
    ) VALUES (
        v_supp2_id, 'Northern Textile Distributors', 'Northern Textile & Fabrics LLP',
        '+91 98222 33445', 'northern.textile.demo@threadpilot.ai', 'B-12, Phase 5, Focal Point',
        'Ludhiana', 'Punjab', '141010', '03AAANN3344E1Z9', 'AAANN3344E', 'NET_15',
        8000.00, 'ACTIVE', '[DEMO DATA] High-grade blended fabrics and knitted trims supplier for MCA project evaluation',
        v_org_id, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        payment_terms = EXCLUDED.payment_terms,
        outstanding_amount = EXCLUDED.outstanding_amount,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;

    -- ------------------------------------------------------------------------
    -- 2. PRODUCTS
    -- ------------------------------------------------------------------------
    -- Product 1: Classic Wool Sweater
    UPDATE products SET
        sku = 'TP-SWT-001',
        name = 'Classic Wool Sweater',
        brand = 'ThreadPilot Demo',
        category = 'Hosiery',
        subcategory = 'Sweater',
        size = 'L',
        color = 'Navy Blue',
        material = 'Wool / Acrylic Blend',
        gender = 'Men',
        unit = 'Pieces',
        purchase_price = 350.00,
        selling_price = 599.00,
        min_stock_level = 15,
        reorder_quantity = 30,
        barcode = '890100100001',
        status = 'ACTIVE',
        description = '[DEMO DATA] Premium wool knitted sweater for winter collection',
        supplier_id = v_supp1_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_prod1_id AND organization_id = v_org_id;

    -- Product 2: Men's Thermal Wear
    UPDATE products SET
        sku = 'TP-THM-002',
        name = 'Men''s Thermal Wear',
        brand = 'ThreadPilot Demo',
        category = 'Hosiery',
        subcategory = 'Thermal',
        size = 'L',
        color = 'Charcoal Black',
        material = 'Thermal Ribbed Cotton Blend',
        gender = 'Men',
        unit = 'Pieces',
        purchase_price = 230.00,
        selling_price = 399.00,
        min_stock_level = 10,
        reorder_quantity = 25,
        barcode = '890100100002',
        status = 'ACTIVE',
        description = '[DEMO DATA] Double-layer insulated thermal innerwear set',
        supplier_id = v_supp2_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_prod2_id AND organization_id = v_org_id;

    -- Product 3: Ladies Winter Cardigan
    INSERT INTO products (
        id, sku, name, brand, category, subcategory, size, color, material, gender,
        unit, purchase_price, selling_price, min_stock_level, reorder_quantity,
        barcode, status, description, organization_id, supplier_id, created_at, updated_at, version
    ) VALUES (
        v_prod3_id, 'TP-CDG-003', 'Ladies Winter Cardigan', 'ThreadPilot Demo', 'Hosiery', 'Cardigan',
        'M', 'Maroon', 'Cashmere Wool Blend', 'Women', 'Pieces', 480.00, 799.00,
        10, 15, '890100100003', 'ACTIVE',
        '[DEMO DATA] Button-down fine-knit winter cardigan for women (Low stock trigger)',
        v_org_id, v_supp1_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (sku, organization_id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        purchase_price = EXCLUDED.purchase_price,
        selling_price = EXCLUDED.selling_price,
        min_stock_level = EXCLUDED.min_stock_level,
        reorder_quantity = EXCLUDED.reorder_quantity,
        barcode = EXCLUDED.barcode,
        status = EXCLUDED.status;

    -- Product 4: Knitted Woollen Vest
    INSERT INTO products (
        id, sku, name, brand, category, subcategory, size, color, material, gender,
        unit, purchase_price, selling_price, min_stock_level, reorder_quantity,
        barcode, status, description, organization_id, supplier_id, created_at, updated_at, version
    ) VALUES (
        v_prod4_id, 'TP-VST-004', 'Knitted Woollen Vest', 'ThreadPilot Demo', 'Hosiery', 'Vest',
        'XL', 'Steel Grey', 'Merino Wool Blend', 'Unisex', 'Pieces', 280.00, 499.00,
        10, 20, '890100100004', 'ACTIVE',
        '[DEMO DATA] Sleeveless V-neck knitted thermal vest for winter layer',
        v_org_id, v_supp2_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (sku, organization_id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        purchase_price = EXCLUDED.purchase_price,
        selling_price = EXCLUDED.selling_price,
        min_stock_level = EXCLUDED.min_stock_level,
        reorder_quantity = EXCLUDED.reorder_quantity,
        barcode = EXCLUDED.barcode,
        status = EXCLUDED.status;

    -- ------------------------------------------------------------------------
    -- 3. INVENTORY LEVELS
    -- ------------------------------------------------------------------------
    -- Product 1: Stock 50
    UPDATE inventory SET
        current_quantity = 50,
        reserved_quantity = 0,
        available_quantity = 50,
        average_cost = 350.00,
        total_value = 17500.00,
        last_movement_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = v_prod1_id AND organization_id = v_org_id;

    -- Product 2: Stock 30
    UPDATE inventory SET
        current_quantity = 30,
        reserved_quantity = 0,
        available_quantity = 30,
        average_cost = 230.00,
        total_value = 6900.00,
        last_movement_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = v_prod2_id AND organization_id = v_org_id;

    -- Product 3: Stock 5 (Low Stock alert trigger)
    INSERT INTO inventory (
        id, current_quantity, reserved_quantity, available_quantity, incoming_quantity,
        damaged_quantity, returned_quantity, average_cost, total_value, last_movement_at,
        product_id, variant_id, organization_id, created_at, updated_at, version
    ) VALUES (
        'b1111111-1111-4111-8111-111111111103'::uuid, 5, 0, 5, 0, 0, 0, 480.00, 2400.00,
        CURRENT_TIMESTAMP, v_prod3_id, NULL, v_org_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (product_id, organization_id) WHERE product_id IS NOT NULL DO UPDATE SET
        current_quantity = EXCLUDED.current_quantity,
        reserved_quantity = EXCLUDED.reserved_quantity,
        available_quantity = EXCLUDED.available_quantity,
        average_cost = EXCLUDED.average_cost,
        total_value = EXCLUDED.total_value,
        last_movement_at = CURRENT_TIMESTAMP;

    -- Product 4: Stock 20
    INSERT INTO inventory (
        id, current_quantity, reserved_quantity, available_quantity, incoming_quantity,
        damaged_quantity, returned_quantity, average_cost, total_value, last_movement_at,
        product_id, variant_id, organization_id, created_at, updated_at, version
    ) VALUES (
        'b1111111-1111-4111-8111-111111111104'::uuid, 20, 0, 20, 0, 0, 0, 280.00, 5600.00,
        CURRENT_TIMESTAMP, v_prod4_id, NULL, v_org_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (product_id, organization_id) WHERE product_id IS NOT NULL DO UPDATE SET
        current_quantity = EXCLUDED.current_quantity,
        reserved_quantity = EXCLUDED.reserved_quantity,
        available_quantity = EXCLUDED.available_quantity,
        average_cost = EXCLUDED.average_cost,
        total_value = EXCLUDED.total_value,
        last_movement_at = CURRENT_TIMESTAMP;

    -- ------------------------------------------------------------------------
    -- 4. STOCK MOVEMENTS
    -- ------------------------------------------------------------------------
    INSERT INTO stock_movements (
        id, movement_type, quantity, quantity_before, quantity_after, unit_cost,
        reference_type, reference_number, notes, product_id, organization_id,
        created_by, created_at, updated_at, version
    ) VALUES
    ('91111111-1111-4111-8111-111111111101'::uuid, 'INITIAL_STOCK', 50, 0, 50, 350.00, 'INVENTORY_INIT', 'INIT-001', '[DEMO DATA] Opening inventory stock batch', v_prod1_id, v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0),
    ('91111111-1111-4111-8111-111111111102'::uuid, 'INITIAL_STOCK', 30, 0, 30, 230.00, 'INVENTORY_INIT', 'INIT-002', '[DEMO DATA] Opening inventory stock batch', v_prod2_id, v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0),
    ('91111111-1111-4111-8111-111111111103'::uuid, 'INITIAL_STOCK', 5, 0, 5, 480.00, 'INVENTORY_INIT', 'INIT-003', '[DEMO DATA] Opening inventory stock batch (low threshold)', v_prod3_id, v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0),
    ('91111111-1111-4111-8111-111111111104'::uuid, 'INITIAL_STOCK', 20, 0, 20, 280.00, 'INVENTORY_INIT', 'INIT-004', '[DEMO DATA] Opening inventory stock batch', v_prod4_id, v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0)
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 5. CUSTOMERS
    -- ------------------------------------------------------------------------
    INSERT INTO customers (
        id, name, business_name, phone, email, address, city, state, postal_code,
        gst_number, pan_number, customer_type, credit_limit, outstanding_amount,
        payment_terms, status, notes, organization_id, created_at, updated_at, version
    ) VALUES (
        v_cust1_id, 'Sharma Garments', 'Sharma Garments Wholesale & Retail',
        '+91 98765 43210', 'sharma.garments.demo@threadpilot.ai', 'Shop 14-16, AC Market, GT Road',
        'Ludhiana', 'Punjab', '141008', '03AAACS1234A1Z5', 'AAACS1234A', 'WHOLESALER',
        30000.00, 13000.00, 'NET_30', 'ACTIVE',
        '[DEMO DATA] Wholesale distributor with active overdue balance for aging evaluation',
        v_org_id, CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        business_name = EXCLUDED.business_name,
        credit_limit = EXCLUDED.credit_limit,
        outstanding_amount = EXCLUDED.outstanding_amount,
        payment_terms = EXCLUDED.payment_terms,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;

    INSERT INTO customers (
        id, name, business_name, phone, email, address, city, state, postal_code,
        gst_number, pan_number, customer_type, credit_limit, outstanding_amount,
        payment_terms, status, notes, organization_id, created_at, updated_at, version
    ) VALUES (
        v_cust2_id, 'Royal Hosiery', 'Royal Hosiery & Knitwear Center',
        '+91 98765 43211', 'royal.hosiery.demo@threadpilot.ai', 'Hall Bazaar Main Market',
        'Amritsar', 'Punjab', '143001', '03AABCR5678B1Z2', 'AABCR5678B', 'RETAILER',
        20000.00, 0.00, 'NET_30', 'ACTIVE',
        '[DEMO DATA] Consistent prompt-paying retailer with zero outstanding debt',
        v_org_id, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        business_name = EXCLUDED.business_name,
        credit_limit = EXCLUDED.credit_limit,
        outstanding_amount = EXCLUDED.outstanding_amount,
        payment_terms = EXCLUDED.payment_terms,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;

    INSERT INTO customers (
        id, name, business_name, phone, email, address, city, state, postal_code,
        gst_number, pan_number, customer_type, credit_limit, outstanding_amount,
        payment_terms, status, notes, organization_id, created_at, updated_at, version
    ) VALUES (
        v_cust3_id, 'Fashion Point', 'Fashion Point Men & Women Wear',
        '+91 98765 43212', 'fashion.point.demo@threadpilot.ai', 'Model Town Market',
        'Jalandhar', 'Punjab', '144003', '03AACCF9012C1Z8', 'AACCF9012C', 'RETAILER',
        15000.00, 6000.00, 'NET_30', 'ACTIVE',
        '[DEMO DATA] Growing retailer with current outstanding well within credit limits',
        v_org_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        business_name = EXCLUDED.business_name,
        credit_limit = EXCLUDED.credit_limit,
        outstanding_amount = EXCLUDED.outstanding_amount,
        payment_terms = EXCLUDED.payment_terms,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;

    -- ------------------------------------------------------------------------
    -- 6. CUSTOMER ORDERS & ITEMS
    -- Exact PaymentStatus enum: PENDING, PARTIALLY_PAID, PAID, OVERDUE, REFUNDED
    -- Exact FulfillmentStatus enum: PENDING, PROCESSING, READY, SHIPPED, DELIVERED, CANCELLED
    -- ------------------------------------------------------------------------
    -- Order 1: Sharma Garments (Order: ₹18,000, Paid: ₹5,000, Outstanding: ₹13,000)
    -- Due Date: 2026-09-01 (64 days overdue relative to 2026-11-04 -> 61-90 days cohort!)
    INSERT INTO customer_orders (
        id, order_number, order_date, expected_delivery_date, actual_delivery_date,
        status, payment_status, fulfillment_status, subtotal, tax_amount, discount_amount,
        total_amount, paid_amount, outstanding_amount, notes, shipping_address,
        customer_id, organization_id, created_by, confirmed_by, confirmed_at,
        created_at, updated_at, version
    ) VALUES (
        v_ord1_id, 'ORD-DEMO-2026-001', '2026-08-01'::date, '2026-09-01'::date, '2026-08-28'::date,
        'DELIVERED', 'OVERDUE', 'DELIVERED', 18000.00, 0.00, 0.00,
        18000.00, 5000.00, 13000.00,
        '[DEMO DATA] Overdue invoice (due date: 1 Sep 2026) for aging evaluation',
        'Shop 14-16, AC Market, GT Road, Ludhiana, Punjab',
        v_cust1_id, v_org_id, v_user_id, v_user_id, '2026-08-02 10:00:00+00'::timestamptz,
        '2026-08-01 09:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (order_number, organization_id) DO UPDATE SET
        order_date = EXCLUDED.order_date,
        expected_delivery_date = EXCLUDED.expected_delivery_date,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        outstanding_amount = EXCLUDED.outstanding_amount;

    INSERT INTO customer_order_items (
        id, quantity, reserved_quantity, fulfilled_quantity, unit_price,
        tax_rate, discount_rate, line_total, description, order_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '81111111-1111-4111-8111-111111111101'::uuid, 30, 0, 30, 600.00,
        0.00, 0.00, 18000.00, '[DEMO DATA] Classic Wool Sweaters - wholesale bundle',
        v_ord1_id, v_prod1_id, v_org_id, '2026-08-01 09:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- Order 2: Royal Hosiery (Order: ₹12,000, Paid: ₹12,000, Outstanding: ₹0)
    INSERT INTO customer_orders (
        id, order_number, order_date, expected_delivery_date, actual_delivery_date,
        status, payment_status, fulfillment_status, subtotal, tax_amount, discount_amount,
        total_amount, paid_amount, outstanding_amount, notes, shipping_address,
        customer_id, organization_id, created_by, confirmed_by, confirmed_at,
        created_at, updated_at, version
    ) VALUES (
        v_ord2_id, 'ORD-DEMO-2026-002', '2026-10-10'::date, '2026-10-25'::date, '2026-10-22'::date,
        'DELIVERED', 'PAID', 'DELIVERED', 12000.00, 0.00, 0.00,
        12000.00, 12000.00, 0.00,
        '[DEMO DATA] Completed and fully settled thermal wear delivery order',
        'Hall Bazaar Main Market, Amritsar, Punjab',
        v_cust2_id, v_org_id, v_user_id, v_user_id, '2026-10-10 11:00:00+00'::timestamptz,
        '2026-10-10 10:15:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (order_number, organization_id) DO UPDATE SET
        order_date = EXCLUDED.order_date,
        expected_delivery_date = EXCLUDED.expected_delivery_date,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        outstanding_amount = EXCLUDED.outstanding_amount;

    INSERT INTO customer_order_items (
        id, quantity, reserved_quantity, fulfilled_quantity, unit_price,
        tax_rate, discount_rate, line_total, description, order_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '81111111-1111-4111-8111-111111111102'::uuid, 30, 0, 30, 400.00,
        0.00, 0.00, 12000.00, '[DEMO DATA] Men''s Thermal Wear pack',
        v_ord2_id, v_prod2_id, v_org_id, '2026-10-10 10:15:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- Order 3: Fashion Point (Order: ₹8,000, Paid: ₹2,000, Outstanding: ₹6,000)
    -- Due Date: 2026-11-20 (Within terms / 0-30 days cohort!)
    INSERT INTO customer_orders (
        id, order_number, order_date, expected_delivery_date, actual_delivery_date,
        status, payment_status, fulfillment_status, subtotal, tax_amount, discount_amount,
        total_amount, paid_amount, outstanding_amount, notes, shipping_address,
        customer_id, organization_id, created_by, confirmed_by, confirmed_at,
        created_at, updated_at, version
    ) VALUES (
        v_ord3_id, 'ORD-DEMO-2026-003', '2026-10-25'::date, '2026-11-20'::date, NULL,
        'CONFIRMED', 'PARTIALLY_PAID', 'PENDING', 8000.00, 0.00, 0.00,
        8000.00, 2000.00, 6000.00,
        '[DEMO DATA] Current winter cardigan order with partial advance receipt',
        'Model Town Market, Jalandhar, Punjab',
        v_cust3_id, v_org_id, v_user_id, v_user_id, '2026-10-25 14:00:00+00'::timestamptz,
        '2026-10-25 13:45:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (order_number, organization_id) DO UPDATE SET
        order_date = EXCLUDED.order_date,
        expected_delivery_date = EXCLUDED.expected_delivery_date,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        outstanding_amount = EXCLUDED.outstanding_amount;

    INSERT INTO customer_order_items (
        id, quantity, reserved_quantity, fulfilled_quantity, unit_price,
        tax_rate, discount_rate, line_total, description, order_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '81111111-1111-4111-8111-111111111103'::uuid, 10, 0, 0, 800.00,
        0.00, 0.00, 8000.00, '[DEMO DATA] Ladies Winter Cardigans trial batch',
        v_ord3_id, v_prod3_id, v_org_id, '2026-10-25 13:45:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 7. CUSTOMER PAYMENTS
    -- Exact PaymentMethod: CASH, BANK_TRANSFER, UPI, CARD, CHEQUE, ONLINE, OTHER
    -- Exact PaymentType: CUSTOMER_PAYMENT, SUPPLIER_PAYMENT
    -- ------------------------------------------------------------------------
    -- Sharma Garments: ₹5,000 received
    INSERT INTO payments (
        id, payment_number, payment_type, payment_method, payment_date, amount,
        reference_number, notes, customer_id, customer_order_id, organization_id,
        recorded_by, reconciled, reconciled_at, reconciled_by, created_at, updated_at, version
    ) VALUES (
        v_pay1_id, 'PAY-DEMO-CUST-001', 'CUSTOMER_PAYMENT', 'BANK_TRANSFER', '2026-09-10'::date, 5000.00,
        'NEFT/PUNB/20260910/00481', '[DEMO DATA] Partial receipt against ORD-DEMO-2026-001',
        v_cust1_id, v_ord1_id, v_org_id, v_user_id, true, CURRENT_TIMESTAMP, v_user_id,
        '2026-09-10 14:20:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (payment_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        payment_date = EXCLUDED.payment_date,
        reconciled = EXCLUDED.reconciled;

    -- Royal Hosiery: ₹12,000 received
    INSERT INTO payments (
        id, payment_number, payment_type, payment_method, payment_date, amount,
        reference_number, notes, customer_id, customer_order_id, organization_id,
        recorded_by, reconciled, reconciled_at, reconciled_by, created_at, updated_at, version
    ) VALUES (
        v_pay2_id, 'PAY-DEMO-CUST-002', 'CUSTOMER_PAYMENT', 'UPI', '2026-10-20'::date, 12000.00,
        'UPI/HDFC/20261020/991204', '[DEMO DATA] Full clearance receipt for ORD-DEMO-2026-002',
        v_cust2_id, v_ord2_id, v_org_id, v_user_id, true, CURRENT_TIMESTAMP, v_user_id,
        '2026-10-20 16:45:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (payment_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        payment_date = EXCLUDED.payment_date,
        reconciled = EXCLUDED.reconciled;

    -- Fashion Point: ₹2,000 received
    INSERT INTO payments (
        id, payment_number, payment_type, payment_method, payment_date, amount,
        reference_number, notes, customer_id, customer_order_id, organization_id,
        recorded_by, reconciled, reconciled_at, reconciled_by, created_at, updated_at, version
    ) VALUES (
        v_pay3_id, 'PAY-DEMO-CUST-003', 'CUSTOMER_PAYMENT', 'CHEQUE', '2026-10-28'::date, 2000.00,
        'CHQ-SBI-441209', '[DEMO DATA] Advance token receipt for ORD-DEMO-2026-003',
        v_cust3_id, v_ord3_id, v_org_id, v_user_id, true, CURRENT_TIMESTAMP, v_user_id,
        '2026-10-28 11:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (payment_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        payment_date = EXCLUDED.payment_date,
        reconciled = EXCLUDED.reconciled;

    -- ------------------------------------------------------------------------
    -- 8. SALES (COMPLETED DIRECT TRANSACTIONS & REVENUE LEDGER)
    -- ------------------------------------------------------------------------
    INSERT INTO sales (
        id, sale_number, sale_date, subtotal, tax_amount, discount_amount,
        total_amount, cost_amount, gross_profit, notes, customer_id, order_id,
        organization_id, created_by, created_at, updated_at, version
    ) VALUES (
        v_sale1_id, 'SALE-DEMO-2026-001', '2026-10-20'::date, 12000.00, 0.00, 0.00,
        12000.00, 6900.00, 5100.00, '[DEMO DATA] Completed wholesale sale transaction',
        v_cust2_id, v_ord2_id, v_org_id, v_user_id, '2026-10-20 12:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (sale_number, organization_id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        cost_amount = EXCLUDED.cost_amount,
        gross_profit = EXCLUDED.gross_profit;

    INSERT INTO sale_items (
        id, quantity, unit_price, unit_cost, tax_rate, discount_rate,
        line_total, cost_amount, description, sale_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '71111111-1111-4111-8111-111111111101'::uuid, 30, 400.00, 230.00, 0.00, 0.00,
        12000.00, 6900.00, '[DEMO DATA] Men''s Thermal Wear unit',
        v_sale1_id, v_prod2_id, v_org_id, '2026-10-20 12:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO sales (
        id, sale_number, sale_date, subtotal, tax_amount, discount_amount,
        total_amount, cost_amount, gross_profit, notes, customer_id, order_id,
        organization_id, created_by, created_at, updated_at, version
    ) VALUES (
        v_sale2_id, 'SALE-DEMO-2026-002', '2026-11-02'::date, 5990.00, 0.00, 0.00,
        5990.00, 3500.00, 2490.00, '[DEMO DATA] Counter wholesale cash sale',
        v_cust1_id, NULL, v_org_id, v_user_id, '2026-11-02 15:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (sale_number, organization_id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        cost_amount = EXCLUDED.cost_amount,
        gross_profit = EXCLUDED.gross_profit;

    INSERT INTO sale_items (
        id, quantity, unit_price, unit_cost, tax_rate, discount_rate,
        line_total, cost_amount, description, sale_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '71111111-1111-4111-8111-111111111102'::uuid, 10, 599.00, 350.00, 0.00, 0.00,
        5990.00, 3500.00, '[DEMO DATA] Classic Wool Sweaters',
        v_sale2_id, v_prod1_id, v_org_id, '2026-11-02 15:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 9. SUPPLIER PURCHASE ORDERS & ITEMS
    -- Exact PurchaseOrderStatus: DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
    -- ------------------------------------------------------------------------
    INSERT INTO purchase_orders (
        id, order_number, order_date, expected_delivery_date, actual_delivery_date,
        status, subtotal, tax_amount, discount_amount, total_amount, notes,
        shipping_address, supplier_id, organization_id, created_by, approved_by, approved_at,
        created_at, updated_at, version
    ) VALUES (
        v_po1_id, 'PO-DEMO-2026-001', '2026-09-15'::date, '2026-09-30'::date, '2026-09-29'::date,
        'RECEIVED', 35000.00, 0.00, 0.00, 35000.00,
        '[DEMO DATA] Bulk wool and yarn replenishment PO',
        'Main Warehouse, Industrial Area, Ludhiana, Punjab',
        v_supp1_id, v_org_id, v_user_id, v_user_id, '2026-09-16 10:00:00+00'::timestamptz,
        '2026-09-15 09:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (order_number, organization_id) DO UPDATE SET
        status = EXCLUDED.status,
        total_amount = EXCLUDED.total_amount;

    INSERT INTO purchase_order_items (
        id, quantity, received_quantity, unit_price, tax_rate, discount_rate,
        line_total, description, purchase_order_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '61111111-1111-4111-8111-111111111101'::uuid, 100, 100, 350.00, 0.00, 0.00,
        35000.00, '[DEMO DATA] Spun wool material batches',
        v_po1_id, v_prod1_id, v_org_id, '2026-09-15 09:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO purchase_orders (
        id, order_number, order_date, expected_delivery_date, actual_delivery_date,
        status, subtotal, tax_amount, discount_amount, total_amount, notes,
        shipping_address, supplier_id, organization_id, created_by, approved_by, approved_at,
        created_at, updated_at, version
    ) VALUES (
        v_po2_id, 'PO-DEMO-2026-002', '2026-10-05'::date, '2026-10-15'::date, '2026-10-14'::date,
        'RECEIVED', 18000.00, 0.00, 0.00, 18000.00,
        '[DEMO DATA] Knitwear fabric and vest materials PO',
        'Main Warehouse, Industrial Area, Ludhiana, Punjab',
        v_supp2_id, v_org_id, v_user_id, v_user_id, '2026-10-05 11:00:00+00'::timestamptz,
        '2026-10-05 10:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (order_number, organization_id) DO UPDATE SET
        status = EXCLUDED.status,
        total_amount = EXCLUDED.total_amount;

    INSERT INTO purchase_order_items (
        id, quantity, received_quantity, unit_price, tax_rate, discount_rate,
        line_total, description, purchase_order_id, product_id,
        organization_id, created_at, updated_at, version
    ) VALUES (
        '61111111-1111-4111-8111-111111111102'::uuid, 50, 50, 280.00, 0.00, 0.00,
        14000.00, '[DEMO DATA] Knitted Woollen Vest production lot',
        v_po2_id, v_prod4_id, v_org_id, '2026-10-05 10:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 10. SUPPLIER INVOICES & ITEMS
    -- Exact InvoiceStatus: DRAFT, PROCESSING, VERIFIED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
    -- Exact OcrStatus: PENDING, PROCESSING, COMPLETED, FAILED, VERIFIED
    -- ------------------------------------------------------------------------
    INSERT INTO supplier_invoices (
        id, invoice_number, invoice_date, due_date, status, subtotal, tax_amount,
        discount_amount, total_amount, paid_amount, outstanding_amount, notes,
        document_url, ocr_status, ocr_confidence, ocr_raw_data, supplier_id,
        organization_id, verified_by, verified_at, created_at, updated_at, version
    ) VALUES (
        v_sinv1_id, 'INV-PWS-2026-089', '2026-09-30'::date, '2026-10-30'::date, 'PARTIALLY_PAID',
        35000.00, 0.00, 0.00, 35000.00, 20000.00, 15000.00,
        '[DEMO DATA] Spun wool bulk delivery invoice verified against PO-DEMO-2026-001',
        '/storage/invoices/demo_inv_pws_089.pdf', 'COMPLETED', 0.98,
        '{"supplier":"Punjab Woollen Suppliers","total":35000,"dueDate":"2026-10-30"}'::jsonb,
        v_supp1_id, v_org_id, v_user_id, '2026-10-01 10:00:00+00'::timestamptz,
        '2026-09-30 16:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (invoice_number, organization_id) DO UPDATE SET
        status = EXCLUDED.status,
        ocr_status = EXCLUDED.ocr_status,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        outstanding_amount = EXCLUDED.outstanding_amount;

    INSERT INTO supplier_invoice_items (
        id, quantity, unit_price, tax_rate, discount_rate, line_total,
        description, invoice_id, product_id, organization_id, created_at, updated_at, version
    ) VALUES (
        '51111111-1111-4111-8111-111111111101'::uuid, 100, 350.00, 0.00, 0.00, 35000.00,
        '[DEMO DATA] Spun wool material batches line',
        v_sinv1_id, v_prod1_id, v_org_id, '2026-09-30 16:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO supplier_invoices (
        id, invoice_number, invoice_date, due_date, status, subtotal, tax_amount,
        discount_amount, total_amount, paid_amount, outstanding_amount, notes,
        document_url, ocr_status, ocr_confidence, ocr_raw_data, supplier_id,
        organization_id, verified_by, verified_at, created_at, updated_at, version
    ) VALUES (
        v_sinv2_id, 'INV-NTD-2026-104', '2026-10-15'::date, '2026-11-08'::date, 'VERIFIED',
        18000.00, 0.00, 0.00, 18000.00, 10000.00, 8000.00,
        '[DEMO DATA] Knitted fabric roll batch invoice verified against PO-DEMO-2026-002',
        '/storage/invoices/demo_inv_ntd_104.pdf', 'COMPLETED', 0.96,
        '{"supplier":"Northern Textile Distributors","total":18000,"dueDate":"2026-11-08"}'::jsonb,
        v_supp2_id, v_org_id, v_user_id, '2026-10-16 11:30:00+00'::timestamptz,
        '2026-10-15 14:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (invoice_number, organization_id) DO UPDATE SET
        status = EXCLUDED.status,
        ocr_status = EXCLUDED.ocr_status,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        outstanding_amount = EXCLUDED.outstanding_amount,
        due_date = EXCLUDED.due_date;

    INSERT INTO supplier_invoice_items (
        id, quantity, unit_price, tax_rate, discount_rate, line_total,
        description, invoice_id, product_id, organization_id, created_at, updated_at, version
    ) VALUES (
        '51111111-1111-4111-8111-111111111102'::uuid, 50, 280.00, 0.00, 0.00, 14000.00,
        '[DEMO DATA] Knitted Woollen Vest fabric',
        v_sinv2_id, v_prod4_id, v_org_id, '2026-10-15 14:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 11. SUPPLIER PAYMENTS
    -- ------------------------------------------------------------------------
    INSERT INTO payments (
        id, payment_number, payment_type, payment_method, payment_date, amount,
        reference_number, notes, supplier_id, supplier_invoice_id, organization_id,
        recorded_by, reconciled, reconciled_at, reconciled_by, created_at, updated_at, version
    ) VALUES (
        v_pay4_id, 'PAY-DEMO-SUPP-001', 'SUPPLIER_PAYMENT', 'BANK_TRANSFER', '2026-10-15'::date, 20000.00,
        'NEFT/HDFC/20261015/008812', '[DEMO DATA] Partial disbursement for Invoice INV-PWS-2026-089',
        v_supp1_id, v_sinv1_id, v_org_id, v_user_id, true, CURRENT_TIMESTAMP, v_user_id,
        '2026-10-15 15:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (payment_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        reconciled = EXCLUDED.reconciled;

    INSERT INTO payments (
        id, payment_number, payment_type, payment_method, payment_date, amount,
        reference_number, notes, supplier_id, supplier_invoice_id, organization_id,
        recorded_by, reconciled, reconciled_at, reconciled_by, created_at, updated_at, version
    ) VALUES (
        v_pay5_id, 'PAY-DEMO-SUPP-002', 'SUPPLIER_PAYMENT', 'BANK_TRANSFER', '2026-10-25'::date, 10000.00,
        'RTGS/ICIC/20261025/773341', '[DEMO DATA] Partial disbursement for Invoice INV-NTD-2026-104',
        v_supp2_id, v_sinv2_id, v_org_id, v_user_id, true, CURRENT_TIMESTAMP, v_user_id,
        '2026-10-25 17:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0
    ) ON CONFLICT (payment_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        reconciled = EXCLUDED.reconciled;

    -- ------------------------------------------------------------------------
    -- 12. EXPENSES
    -- ------------------------------------------------------------------------
    INSERT INTO expenses (
        id, expense_number, category, expense_date, amount, payment_method,
        vendor_name, reference_number, description, is_recurring, organization_id,
        recorded_by, approved, approved_by, approved_at, created_at, updated_at, version
    ) VALUES
    (v_exp1_id, 'EXP-DEMO-2026-001', 'RENT', '2026-10-01'::date, 25000.00, 'BANK_TRANSFER', 'Ludhiana Industrial Estates', 'REF-RENT-1026', '[DEMO DATA] Factory floor and warehouse lease - Oct 2026', true, v_org_id, v_user_id, true, v_user_id, CURRENT_TIMESTAMP, '2026-10-01 10:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0),
    (v_exp2_id, 'EXP-DEMO-2026-002', 'TRANSPORT', '2026-10-12'::date, 6500.00, 'UPI', 'Punjab Express Freight', 'UPI-FRT-9921', '[DEMO DATA] Yarn and garment dispatch logistics to regional distributors', false, v_org_id, v_user_id, true, v_user_id, CURRENT_TIMESTAMP, '2026-10-12 11:30:00+00'::timestamptz, CURRENT_TIMESTAMP, 0),
    (v_exp3_id, 'EXP-DEMO-2026-003', 'UTILITIES', '2026-10-18'::date, 4200.00, 'BANK_TRANSFER', 'PSPCL Power Corporation', 'BILL-PWR-4819', '[DEMO DATA] Commercial power connection tariff for knitting machinery', false, v_org_id, v_user_id, true, v_user_id, CURRENT_TIMESTAMP, '2026-10-18 14:00:00+00'::timestamptz, CURRENT_TIMESTAMP, 0),
    (v_exp4_id, 'EXP-DEMO-2026-004', 'PACKAGING', '2026-10-24'::date, 3800.00, 'CASH', 'Standard Cartons & Bags', 'CSH-PKG-0821', '[DEMO DATA] Corrugated export boxes and garment polybags', false, v_org_id, v_user_id, true, v_user_id, CURRENT_TIMESTAMP, '2026-10-24 16:15:00+00'::timestamptz, CURRENT_TIMESTAMP, 0)
    ON CONFLICT (expense_number, organization_id) DO UPDATE SET
        payment_method = EXCLUDED.payment_method,
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        description = EXCLUDED.description;

    -- ------------------------------------------------------------------------
    -- 13. ALERTS
    -- Exact AlertSeverity: CRITICAL, WARNING, INFO
    -- ------------------------------------------------------------------------
    INSERT INTO alerts (
        id, alert_type, severity, status, title, message, entity_type, entity_id,
        supporting_data, action_url, action_label, organization_id, assigned_user_id,
        created_at, updated_at, version
    ) VALUES
    (v_alt1_id, 'LOW_STOCK', 'CRITICAL', 'UNREAD', 'Low Stock Alert: Ladies Winter Cardigan (TP-CDG-003)', 'Available inventory is 5 pieces, which has reached or breached the minimum threshold of 10 pieces. Immediate purchase order recommended.', 'PRODUCT', v_prod3_id, '{"sku":"TP-CDG-003","availableQuantity":5,"minStockLevel":10}'::jsonb, '/inventory', 'View Inventory', v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, 0),
    (v_alt2_id, 'CUSTOMER_OVERDUE', 'CRITICAL', 'UNREAD', 'Severe Receivables Overdue: Sharma Garments', 'Sharma Garments has an overdue balance of ₹13,000 exceeding 60 days past the due date (1 September 2026). Action Center collection recommended.', 'CUSTOMER', v_cust1_id, '{"customerId":"d1111111-1111-4111-8111-111111111101","outstanding":13000,"overdueDays":64,"dueDate":"2026-09-01"}'::jsonb, '/customers', 'Review Customer', v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 0),
    (v_alt3_id, 'PAYMENT_DUE', 'WARNING', 'UNREAD', 'Supplier Invoice Payment Due: Northern Textile Distributors', 'Invoice INV-NTD-2026-104 for ₹8,000 is due on 8 November 2026. Schedule disbursement.', 'SUPPLIER_INVOICE', v_sinv2_id, '{"invoiceId":"a4444444-4444-4444-8444-444444444402","amount":8000,"dueDate":"2026-11-08"}'::jsonb, '/invoices', 'View Invoice', v_org_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP, 0)
    ON CONFLICT (id) DO UPDATE SET
        severity = EXCLUDED.severity,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        status = EXCLUDED.status;

    -- ------------------------------------------------------------------------
    -- 14. REMINDERS
    -- Exact ReminderPriority: LOW, MEDIUM, HIGH, URGENT
    -- ------------------------------------------------------------------------
    INSERT INTO reminders (
        id, reminder_type, priority, status, title, description, due_date,
        entity_type, entity_id, action_url, organization_id, assigned_user_id,
        created_by, created_at, updated_at, version
    ) VALUES
    (v_rem1_id, 'CUSTOMER_PAYMENT_FOLLOWUP', 'HIGH', 'PENDING', 'Overdue Follow-up: Sharma Garments (₹13,000)', 'Contact accounts manager at Sharma Garments regarding overdue payment past 60 days. Dispatch WhatsApp collection notice.', '2026-11-05'::date, 'CUSTOMER', v_cust1_id, '/customers', v_org_id, v_user_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 0),
    (v_rem2_id, 'LOW_STOCK_REORDER', 'HIGH', 'PENDING', 'Reorder Ladies Winter Cardigan (TP-CDG-003)', 'Stock at 5 units. Prepare PO for 15 units with Punjab Woollen Suppliers.', '2026-11-06'::date, 'PRODUCT', v_prod3_id, '/inventory', v_org_id, v_user_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 0),
    (v_rem3_id, 'SUPPLIER_PAYMENT_DUE', 'MEDIUM', 'PENDING', 'Disburse payment to Northern Textile Distributors', 'Process payment of ₹8,000 for Invoice INV-NTD-2026-104 prior to 8 Nov 2026 maturity.', '2026-11-08'::date, 'SUPPLIER_INVOICE', v_sinv2_id, '/invoices', v_org_id, v_user_id, v_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 0)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        due_date = EXCLUDED.due_date,
        status = EXCLUDED.status;

END $$;

COMMIT;
