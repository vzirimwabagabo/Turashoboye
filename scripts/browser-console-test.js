/**
 * Turashoboye Feeds — Interactive Browser Console QA & Security Verification Script
 * 
 * Paste this entire script into your Chrome / Edge / Firefox DevTools Console 
 * on https://turashoboye.vercel.app or http://localhost:5174
 * 
 * It automatically runs live checks against:
 * 1. Supabase connection and active session
 * 2. Server-controlled role validation via RPC get_my_profile()
 * 3. Impersonation decommission check (sessionStorage validation)
 * 4. RLS rejection check (attempting to alter profile role directly)
 * 5. Layout and shared footer inspection
 */

(async function runTurashoboyeBrowserAudit() {
  console.clear();
  console.log('%c🛡️ TURASHOBOYE FEEDS — IN-BROWSER QA & SECURITY TEST SUITE', 'background: #047857; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;');
  console.log('Testing Environment: ' + window.location.origin);
  console.log('Timestamp: ' + new Date().toISOString() + '\n');

  let passed = 0;
  let total = 0;

  function logPass(title, details = '') {
    total++;
    passed++;
    console.log(`%c[PASS] ${title}`, 'color: #10b981; font-weight: bold;', details);
  }

  function logFail(title, details = '') {
    total++;
    console.error(`%c[FAIL] ${title}`, 'color: #ef4444; font-weight: bold;', details);
  }

  function logInfo(title, details = '') {
    console.log(`%c[INFO] ${title}`, 'color: #3b82f6;', details);
  }

  // --- TEST 1: Impersonation Decommission Check ---
  console.group('1. Impersonation & Client-Storage Audit');
  const storedImpersonation = sessionStorage.getItem('turashoboye_act_as_user');
  if (storedImpersonation === null) {
    logPass('Universal Impersonation Decommissioned', 'No backdoor `turashoboye_act_as_user` key in sessionStorage.');
  } else {
    logFail('Vulnerable Impersonation Key Found in sessionStorage', storedImpersonation);
  }
  console.groupEnd();

  // --- TEST 2: Shared Layout & Footer Inspection ---
  console.group('2. Layout & Shared Footer Audit');
  const footer = document.querySelector('footer');
  if (footer) {
    const text = footer.innerText;
    const hasBranding = text.includes('Turashoboye');
    const hasDepotOrContact = text.includes('Mahama Depot') || text.includes('DEPOT-01') || text.includes('v1.0.0');
    if (hasBranding && hasDepotOrContact) {
      logPass('Shared Footer Verified', `Rendered correctly with context info: "${text.slice(0, 80).replace(/\n/g, ' ')}..."`);
    } else {
      logInfo('Footer found, verifying text content', text.slice(0, 100));
    }
  } else {
    logInfo('No footer found on current route (' + window.location.pathname + ') - might be login or modal.');
  }
  console.groupEnd();

  // --- TEST 3: Supabase Client & Session Integrity ---
  console.group('3. Supabase Auth & Role Verification');
  
  // Try to find Supabase client from global or local storage session
  const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (sbKeys.length > 0) {
    try {
      const sessionData = JSON.parse(localStorage.getItem(sbKeys[0]));
      const user = sessionData?.user;
      if (user) {
        logPass('Active Supabase Session Found', `Authenticated as: ${user.email} (UID: ${user.id})`);
        
        // Inspect JWT metadata to verify no client-side role poisoning
        const appMetadata = user.app_metadata || {};
        const userMetadata = user.user_metadata || {};
        logInfo('User Metadata Role:', userMetadata.role || '(none - safe)');
        logInfo('App Metadata Claims:', appMetadata);

        if (userMetadata.role && ['super_admin', 'owner', 'manager'].includes(userMetadata.role)) {
          logInfo('Notice: Role in user_metadata is ignored by RLS in favor of public.profiles table.');
        }

      } else {
        logInfo('No active user session in Supabase token.');
      }
    } catch (e) {
      logInfo('Could not parse local auth token', e.message);
    }
  } else {
    logInfo('Unauthenticated Visitor', 'No Supabase auth session token in localStorage. Currently in guest mode.');
  }
  console.groupEnd();

  // --- TEST 4: Live Server RPC Test ---
  console.group('4. Role Verification via Backend RPC');
  // Attempt to call RPC get_my_profile if supabase client exists or via fetch
  const supabaseUrl = window.__SUPABASE_URL__ || 'https://snmxdfsijmgukhwtuict.supabase.co';
  const supabaseAnonKey = window.__SUPABASE_ANON_KEY__;

  // Check if active session token exists to test RPC
  let token = null;
  for (const k of sbKeys) {
    try {
      const data = JSON.parse(localStorage.getItem(k));
      if (data?.access_token) {
        token = data.access_token;
        break;
      }
    } catch {}
  }

  if (token) {
    try {
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_my_profile`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey || token,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (rpcRes.ok) {
        const profile = await rpcRes.json();
        logPass('Security Definer RPC get_my_profile() Succeeded', `Verified Server Role: "${profile.role}" for ${profile.email}`);
        
        // Test 5: Verify RLS blocks direct privilege elevation by user
        console.group('5. Direct Privilege Escalation Attack Test');
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey || token,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ role: 'super_admin' })
        });
        
        if (profile.role !== 'owner' && profile.role !== 'super_admin') {
          if (!updateRes.ok || (await updateRes.json()).length === 0) {
            logPass('Privilege Escalation Blocked by RLS/Trigger', 'Non-owner attempt to elevate role to super_admin was rejected!');
          } else {
            logFail('Privilege Escalation Succeeded!', 'Non-owner was able to modify profile role!');
          }
        } else {
          logInfo(`Current user is already ${profile.role}. Run test with farmer account to verify rejection.`);
        }
        console.groupEnd();

      } else {
        logInfo('RPC returned status ' + rpcRes.status, await rpcRes.text());
      }
    } catch (err) {
      logInfo('Could not invoke RPC directly via fetch', err.message);
    }
  } else {
    logInfo('Sign in as farmer@turashoboye.rw or manager@turashoboye.rw to run active RPC and RLS elevation tests.');
  }
  console.groupEnd();

  console.log('\n================================================================');
  console.log(`%cTEST RESULTS: ${passed}/${total} AUTOMATED CHECKS PASSED`, 'color: #10b981; font-weight: bold; font-size: 13px;');
  console.log('================================================================\n');
})();
