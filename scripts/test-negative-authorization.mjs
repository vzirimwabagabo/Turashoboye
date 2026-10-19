// scripts/test-negative-authorization.mjs
/**
 * Turashoboye Feeds — Direct Negative Authorization & RLS Vulnerability Test Suite
 * 
 * Tests direct database access, RLS policies, and RPC functions across 5 distinct auth states:
 * 1. Anonymous (Unauthenticated)
 * 2. Farmer / Customer (farmer@turashoboye.rw, role: public)
 * 3. Depot Manager (manager@turashoboye.rw, role: manager)
 * 4. Business Owner (owner@turashoboye.rw, role: owner)
 * 5. Super Admin (superadmin@turashoboye.rw, role: super_admin)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://snmxdfsijmgukhwtuict.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const PASSWORD = 'turashoboye2026';

async function getClientForUser(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  if (email && password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(`Failed to sign in as ${email}: ${error.message}`);
    }
  }
  return client;
}

const results = [];

function recordResult(testId, name, actor, expected, actual, passed, details = '') {
  results.push({ testId, name, actor, expected, actual, passed, details });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL / VULNERABILITY FOUND]';
  console.log(`${icon} [${testId}] ${name}`);
  console.log(`     Actor:    ${actor}`);
  console.log(`     Expected: ${expected}`);
  console.log(`     Actual:   ${actual}`);
  if (details) console.log(`     Details:  ${details}`);
  console.log('');
}

async function runNegativeAuthorizationSuite() {
  console.log('========================================================================');
  console.log('   TURASHOBOYE FEEDS — DIRECT BACKEND NEGATIVE AUTHORIZATION SUITE      ');
  console.log('========================================================================\n');

  // Initialize clients
  const anonClient = await getClientForUser(null, null);
  const farmerClient = await getClientForUser('farmer@turashoboye.rw', PASSWORD);
  const managerClient = await getClientForUser('manager@turashoboye.rw', PASSWORD);
  const ownerClient = await getClientForUser('owner@turashoboye.rw', PASSWORD);
  const superAdminClient = await getClientForUser('superadmin@turashoboye.rw', PASSWORD);

  // Fetch current user profiles for reference
  const { data: farmerProf } = await farmerClient.rpc('get_my_profile');
  const { data: managerProf } = await managerClient.rpc('get_my_profile');
  const { data: ownerProf } = await ownerClient.rpc('get_my_profile');
  const { data: superProf } = await superAdminClient.rpc('get_my_profile');

  // ---------------------------------------------------------------------------
  // SUITE 1: ANONYMOUS ATTACKS
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: Anonymous (Unauthenticated) Direct Access Tests ---');

  // 1.1 Anon cannot select from profiles
  const { data: anonProfiles, error: anonProfilesErr } = await anonClient.from('profiles').select('id, email, role');
  recordResult(
    'SEC-ANON-01',
    'Anonymous user cannot read profiles',
    'Anonymous',
    'Empty array or RLS error',
    anonProfilesErr ? anonProfilesErr.message : `Returned ${anonProfiles?.length || 0} rows`,
    !anonProfiles || anonProfiles.length === 0,
    anonProfiles?.length ? 'Leaked profile data to unauthenticated request' : 'Protected by RLS'
  );

  // 1.2 Anon cannot select from customers
  const { data: anonCustomers } = await anonClient.from('customers').select('*');
  recordResult(
    'SEC-ANON-02',
    'Anonymous user cannot read customer records',
    'Anonymous',
    '0 rows returned',
    `${anonCustomers?.length || 0} rows returned`,
    !anonCustomers || anonCustomers.length === 0,
    'Customer records isolated'
  );

  // 1.3 Anon cannot select from payments
  const { data: anonPayments } = await anonClient.from('payments').select('*');
  recordResult(
    'SEC-ANON-03',
    'Anonymous user cannot read financial payments',
    'Anonymous',
    '0 rows returned',
    `${anonPayments?.length || 0} rows returned`,
    !anonPayments || anonPayments.length === 0,
    'Payment records isolated'
  );

  // 1.4 Anon cannot create inventory movement
  const { error: anonMovErr } = await anonClient.from('inventory_movements').insert({
    variant_id: '00000000-0000-0000-0000-000000000000',
    location_id: '00000000-0000-0000-0000-000000000000',
    type: 'adjustment',
    quantity: 100,
    reason: 'Malicious anon injection'
  });
  recordResult(
    'SEC-ANON-04',
    'Anonymous user cannot insert inventory movement',
    'Anonymous',
    'RLS policy rejection (error)',
    anonMovErr ? `Rejected: ${anonMovErr.code}` : 'INSERT succeeded (CRITICAL)',
    !!anonMovErr,
    anonMovErr?.message
  );

  // ---------------------------------------------------------------------------
  // SUITE 2: FARMER / CUSTOMER ATTACKS
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Farmer / Customer (Role: public) Privilege Attacks ---');

  // 2.1 Farmer cannot read other users profiles
  const { data: otherProfiles } = await farmerClient
    .from('profiles')
    .select('id, email, role')
    .neq('id', farmerProf.id);
  recordResult(
    'SEC-FARMER-01',
    'Farmer cannot read profiles of other users',
    'Farmer (public)',
    '0 rows returned',
    `${otherProfiles?.length || 0} rows returned`,
    !otherProfiles || otherProfiles.length === 0,
    'Profile isolation verified'
  );

  // 2.2 Farmer cannot elevate own role to super_admin via direct UPDATE
  const { data: farmerElevateData, error: farmerElevateErr } = await farmerClient
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', farmerProf.id)
    .select();
  recordResult(
    'SEC-FARMER-02',
    'Farmer cannot elevate role to super_admin via direct UPDATE',
    'Farmer (public)',
    'Rejected by trigger / RLS error or 0 rows updated',
    farmerElevateErr ? `Rejected with error: ${farmerElevateErr.message}` : `Updated ${farmerElevateData?.length || 0} rows`,
    !!farmerElevateErr || !farmerElevateData || farmerElevateData.length === 0,
    'Trigger enforce_profile_role_integrity check'
  );

  // 2.3 Farmer cannot elevate role via RPC admin_set_user_role
  const { error: farmerRpcErr } = await farmerClient.rpc('admin_set_user_role', {
    target_profile_id: farmerProf.id,
    new_role: 'super_admin'
  });
  recordResult(
    'SEC-FARMER-03',
    'Farmer cannot call admin_set_user_role RPC',
    'Farmer (public)',
    'Exception: Unauthorized',
    farmerRpcErr ? `Rejected: ${farmerRpcErr.message}` : 'Call succeeded (CRITICAL)',
    !!farmerRpcErr,
    farmerRpcErr?.message
  );

  // 2.4 Farmer cannot create arbitrary inventory movements
  const { error: farmerMovErr } = await farmerClient.from('inventory_movements').insert({
    variant_id: '00000000-0000-0000-0000-000000000000',
    location_id: '00000000-0000-0000-0000-000000000000',
    type: 'adjustment',
    quantity: 500,
    reason: 'Malicious farmer adjustment'
  });
  recordResult(
    'SEC-FARMER-04',
    'Farmer cannot insert into inventory_movements',
    'Farmer (public)',
    'Rejected by RLS policy',
    farmerMovErr ? `Rejected: ${farmerMovErr.code}` : 'INSERT succeeded (CRITICAL)',
    !!farmerMovErr,
    farmerMovErr?.message
  );

  // 2.5 Farmer cannot call record_inventory_adjustment RPC
  const { error: farmerAdjRpcErr } = await farmerClient.rpc('record_inventory_adjustment', {
    p_variant_id: '00000000-0000-0000-0000-000000000000',
    p_location_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 10,
    p_reason: 'Unauthorized test adjustment'
  });
  recordResult(
    'SEC-FARMER-05',
    'Farmer cannot execute record_inventory_adjustment RPC',
    'Farmer (public)',
    'Exception: Unauthorized (Only staff)',
    farmerAdjRpcErr ? `Rejected: ${farmerAdjRpcErr.message}` : 'RPC executed (CRITICAL)',
    !!farmerAdjRpcErr && farmerAdjRpcErr.message.includes('Unauthorized'),
    farmerAdjRpcErr?.message
  );

  // 2.6 Farmer cannot view internal audit logs
  const { data: farmerAudit } = await farmerClient.from('audit_logs').select('*');
  recordResult(
    'SEC-FARMER-06',
    'Farmer cannot view internal audit logs',
    'Farmer (public)',
    '0 rows returned',
    `${farmerAudit?.length || 0} rows returned`,
    !farmerAudit || farmerAudit.length === 0,
    'Audit logs hidden from customers'
  );

  // 2.7 Farmer cannot claim another user's auth_user_id in customers table (IDOR)
  const { data: idorCustData, error: idorCustErr } = await farmerClient
    .from('customers')
    .insert({
      name: 'Forged Identity Customer',
      auth_user_id: ownerProf.auth_user_id, // Forged owner identity
      phone: '+250 788 999 000'
    })
    .select();
  recordResult(
    'SEC-FARMER-07',
    'Farmer cannot insert customer row claiming another auth_user_id',
    'Farmer (public)',
    'Rejected by RLS WITH CHECK policy',
    idorCustErr ? `Rejected: ${idorCustErr.code} - ${idorCustErr.message}` : `Inserted row: ${idorCustData?.[0]?.id}`,
    !!idorCustErr,
    idorCustErr?.message
  );

  // 2.8 Farmer cannot delete customer records
  const { data: farmerDelCust, error: farmerDelCustErr } = await farmerClient
    .from('customers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();
  recordResult(
    'SEC-FARMER-08',
    'Farmer cannot delete customer records',
    'Farmer (public)',
    '0 rows deleted or RLS rejection',
    farmerDelCustErr ? `Rejected: ${farmerDelCustErr.message}` : `Deleted ${farmerDelCust?.length || 0} rows`,
    !!farmerDelCustErr || !farmerDelCust || farmerDelCust.length === 0,
    'Delete policy restricted to owner'
  );

  // ---------------------------------------------------------------------------
  // SUITE 3: DEPOT MANAGER PRIVILEGE BOUNDARIES
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Depot Manager Privilege Boundary Tests ---');

  // 3.1 Manager cannot elevate themselves to owner or super_admin
  const { data: managerElevateData, error: managerElevateErr } = await managerClient
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', managerProf.id)
    .select();
  recordResult(
    'SEC-MGR-01',
    'Manager cannot elevate self to owner via UPDATE',
    'Depot Manager',
    'Rejected by trigger enforce_profile_role_integrity',
    managerElevateErr ? `Rejected: ${managerElevateErr.message}` : `Updated ${managerElevateData?.length || 0} rows`,
    !!managerElevateErr || !managerElevateData || managerElevateData.length === 0,
    'Role elevation prevented'
  );

  // 3.2 Manager cannot promote anyone via admin_set_user_role
  const { error: mgrRpcErr } = await managerClient.rpc('admin_set_user_role', {
    target_profile_id: managerProf.id,
    new_role: 'owner'
  });
  recordResult(
    'SEC-MGR-02',
    'Manager cannot promote roles via admin_set_user_role',
    'Depot Manager',
    'Exception: Unauthorized',
    mgrRpcErr ? `Rejected: ${mgrRpcErr.message}` : 'Call succeeded (CRITICAL)',
    !!mgrRpcErr,
    mgrRpcErr?.message
  );

  // 3.3 Manager cannot alter system settings (Owner only)
  const { data: mgrSettingsData, error: mgrSettingsErr } = await managerClient
    .from('settings')
    .update({ value: { hacked: true } })
    .eq('key', 'currency')
    .select();
  recordResult(
    'SEC-MGR-03',
    'Manager cannot modify system settings table',
    'Depot Manager',
    '0 rows updated or RLS error (Owner only)',
    mgrSettingsErr ? `Rejected: ${mgrSettingsErr.code}` : `Updated ${mgrSettingsData?.length || 0} rows`,
    !!mgrSettingsErr || !mgrSettingsData || mgrSettingsData.length === 0,
    'Settings manageable by owner only'
  );

  // ---------------------------------------------------------------------------
  // SUITE 4: BUSINESS OWNER BOUNDARIES & FINANCIAL INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Business Owner Boundary & Tamper-Resistance Tests ---');

  // 4.1 Owner cannot promote anyone to super_admin via admin_set_user_role
  const { error: ownerSuperErr } = await ownerClient.rpc('admin_set_user_role', {
    target_profile_id: ownerProf.id,
    new_role: 'super_admin'
  });
  recordResult(
    'SEC-OWNER-01',
    'Owner cannot promote self to super_admin via admin_set_user_role',
    'Business Owner',
    'Exception: Only an existing Super Administrator can assign Super Admin privilege',
    ownerSuperErr ? `Rejected: ${ownerSuperErr.message}` : 'Promotion succeeded (CRITICAL PRIVILEGE ESCALATION)',
    !!ownerSuperErr && ownerSuperErr.message.includes('Super Administrator'),
    ownerSuperErr?.message
  );

  // 4.2 Test obsolete/backdoor set_user_role RPC has been dropped
  const { error: ownerSetUserRoleErr } = await ownerClient.rpc('set_user_role', {
    p_target_auth_user_id: ownerProf.auth_user_id,
    p_new_role: 'super_admin'
  });
  const isFunctionDropped = !!ownerSetUserRoleErr && (
    ownerSetUserRoleErr.message.includes('Could not find the function') ||
    ownerSetUserRoleErr.message.includes('not exist')
  );
  recordResult(
    'SEC-OWNER-02',
    'Owner cannot use legacy set_user_role (dropped)',
    'Business Owner',
    'Function does not exist',
    ownerSetUserRoleErr ? `Rejected: ${ownerSetUserRoleErr.message}` : 'VULNERABILITY: Legacy function executed!',
    isFunctionDropped,
    ownerSetUserRoleErr?.message
  );

  // 4.3 Owner direct UPDATE profiles SET role = 'super_admin' blocked by trigger
  const { data: ownerDirectData, error: ownerDirectErr } = await ownerClient
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', ownerProf.id)
    .select();
  recordResult(
    'SEC-OWNER-03',
    'Owner cannot elevate self to super_admin via direct UPDATE',
    'Business Owner',
    'Rejected by enforce_profile_role_integrity trigger',
    ownerDirectErr ? `Rejected: ${ownerDirectErr.message}` : `Updated ${ownerDirectData?.length || 0} rows`,
    !!ownerDirectErr || !ownerDirectData || ownerDirectData.length === 0,
    ownerDirectErr?.message || 'Protected'
  );

  // 4.4 Owner/Manager cannot delete from inventory_movements (Immutable Ledger)
  const { data: delMovData, error: delMovErr } = await ownerClient
    .from('inventory_movements')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();
  recordResult(
    'SEC-LEDGER-01',
    'Owner cannot delete from inventory_movements',
    'Business Owner',
    '0 rows deleted or trigger exception',
    delMovErr ? `Rejected: ${delMovErr.message || delMovErr.code}` : `Deleted ${delMovData?.length || 0} rows`,
    !!delMovErr || !delMovData || delMovData.length === 0,
    'Immutable movement ledger protected'
  );

  // 4.5 Owner/Manager cannot update inventory_movements (Immutable Ledger)
  const { data: updateMovData, error: updateMovErr } = await ownerClient
    .from('inventory_movements')
    .update({ quantity: 999999 })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();
  recordResult(
    'SEC-LEDGER-02',
    'Owner cannot alter quantity in inventory_movements',
    'Business Owner',
    '0 rows updated or trigger exception',
    updateMovErr ? `Rejected: ${updateMovErr.message || updateMovErr.code}` : `Updated ${updateMovData?.length || 0} rows`,
    !!updateMovErr || !updateMovData || updateMovData.length === 0,
    'Movement quantity immutable'
  );

  // 4.6 Owner/Manager cannot delete audit_logs
  const { data: delAuditData, error: delAuditErr } = await ownerClient
    .from('audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();
  recordResult(
    'SEC-LEDGER-03',
    'Owner cannot delete audit logs',
    'Business Owner',
    '0 rows deleted or trigger exception',
    delAuditErr ? `Rejected: ${delAuditErr.message || delAuditErr.code}` : `Deleted ${delAuditData?.length || 0} rows`,
    !!delAuditErr || !delAuditData || delAuditData.length === 0,
    'Audit logs immutable'
  );

  // 4.7 Alteration of Posted Payments Test
  console.log('Testing financial payment tampering protection...');
  let paymentTestPassed = false;
  let paymentTestActual = '';

  // Ensure a test customer and order exist
  let targetOrderId = null;
  const { data: existingOrder } = await ownerClient.from('sales_orders').select('id').limit(1).maybeSingle();
  if (existingOrder) {
    targetOrderId = existingOrder.id;
  } else {
    const { data: loc } = await ownerClient.from('inventory_locations').select('id').limit(1).single();
    let { data: cust } = await ownerClient.from('customers').select('id').limit(1).maybeSingle();
    if (!cust) {
      const { data: newCust } = await ownerClient.from('customers').insert({
        name: 'Jean-Paul Habimana',
        phone: '+250 788 123 456',
        auth_user_id: farmerProf.auth_user_id
      }).select().single();
      cust = newCust;
    }
    const { data: newOrder } = await ownerClient.from('sales_orders').insert({
      order_number: 'ORD-TEST-AUDIT-001',
      customer_id: cust.id,
      location_id: loc.id,
      status: 'confirmed',
      total_amount_rwf: 25000,
      recorded_by: ownerProf.id
    }).select().single();
    targetOrderId = newOrder?.id;
  }

  if (targetOrderId) {
    // Insert a confirmed test payment
    const { data: insertedPayment, error: insertPayErr } = await ownerClient.from('payments').insert({
      order_id: targetOrderId,
      method: 'cash',
      amount_rwf: 25000,
      payment_date: new Date().toISOString().split('T')[0],
      reference: 'Security Audit Test Payment',
      status: 'confirmed',
      idempotency_key: crypto.randomUUID(),
      recorded_by: ownerProf.id
    }).select().maybeSingle();

    if (insertedPayment) {
      const testPaymentId = insertedPayment.id;
      // Attempt to tamper with payment amount
      const { error: alterPayErr } = await ownerClient
        .from('payments')
        .update({ amount_rwf: 1000 })
        .eq('id', testPaymentId);

      if (alterPayErr && alterPayErr.message.includes('Security Violation: Cannot alter the financial amount')) {
        paymentTestPassed = true;
        paymentTestActual = `Rejected by trigger: "${alterPayErr.message}"`;
      } else if (alterPayErr) {
        paymentTestPassed = true;
        paymentTestActual = `Rejected: ${alterPayErr.message}`;
      } else {
        paymentTestPassed = false;
        paymentTestActual = 'VULNERABILITY: Payment amount was modified!';
      }

      // Attempt to delete payment
      const { error: delPayErr } = await ownerClient
        .from('payments')
        .delete()
        .eq('id', testPaymentId);

      if (delPayErr && delPayErr.message.includes('cannot be deleted')) {
        console.log('  Payment delete also successfully rejected by trigger.');
      }
    } else {
      paymentTestActual = insertPayErr ? `Could not seed test payment: ${insertPayErr.message}` : 'Failed to seed';
    }
  } else {
    paymentTestActual = 'Could not establish test sales order.';
  }

  recordResult(
    'SEC-FIN-01',
    'Confirmed payment amounts cannot be modified (Tamper-Resistance)',
    'Business Owner / Manager',
    'Trigger rejection: Security Violation: Cannot alter the financial amount of a confirmed payment record.',
    paymentTestActual,
    paymentTestPassed,
    'Payment ledger immutability verified'
  );

  console.log('\n========================================================================');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`   SUITE SUMMARY: ${passCount}/${results.length} AUTHORIZATION TESTS PASSED`);
  console.log('========================================================================\n');
}

runNegativeAuthorizationSuite();
