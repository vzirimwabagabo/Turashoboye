import { supabase } from './supabase';
import type { PartnershipInquiry } from '../types/database';

export const PARTNERSHIP_TYPES: Record<string, string> = {
  grain_supply: 'Raw Grain / Feedstock Supply (Maize, Soya, Bran)',
  distribution: 'Distribution, Retail & Agro-Dealer Network',
  ngo_livelihood: 'NGO / Humanitarian Livelihood Program (Mahama / Kirehe)',
  investment: 'Growth Investment & Production Expansion',
  veterinary_tech: 'Veterinary, Nutrition & Agronomic Tech Services',
  other: 'General Partnership / Institutional Collaboration',
};

const LOCAL_STORAGE_KEY = 'turashoboye_partnership_inquiries';

// Fallback seed data so owner/admin immediately have reference inquiries to view
const SEED_INQUIRIES: PartnershipInquiry[] = [
  {
    id: 'seed-inquiry-001',
    organization_name: 'Mahama Grain Growers Cooperative (KOPAMA)',
    contact_name: 'Jean-Baptiste Kayitare',
    email: 'kayitare@kopama-kirehe.org',
    phone: '+250 788 452 119',
    partnership_type: 'grain_supply',
    message: 'We are a cooperative of 240 maize and soya farmers adjacent to Mahama. We can supply up to 35 tonnes of Grade-A dried maize monthly directly to Turashoboye depot at competitive farm-gate contract pricing.',
    status: 'new',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'seed-inquiry-002',
    organization_name: 'Eastern Agribusiness Livestock Hub',
    contact_name: 'Beata Mukandayisenga',
    email: 'bmukanda@eastagrihub.rw',
    phone: '+250 783 910 244',
    partnership_type: 'distribution',
    message: 'Interested in becoming the exclusive wholesale distributor for Turashoboye 50kg Broiler Finisher and Dairy Concentrates across Nyakarambi and Rusumo centers.',
    status: 'in_review',
    handled_by: 'Aline Mugisha',
    handled_by_role: 'owner',
    notes: 'Owner scheduled initial phone discussion to review distribution margin requirements.',
    created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
  },
];

function getLocalInquiries(): PartnershipInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_INQUIRIES));
      return SEED_INQUIRIES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INQUIRIES;
  }
}

function saveLocalInquiries(inquiries: PartnershipInquiry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inquiries));
  } catch (err) {
    console.warn('Could not save inquiries to localStorage', err);
  }
}

/**
 * Generate formatted WhatsApp message URL for direct partner inquiry
 */
export function buildWhatsAppInquiryUrl(params: {
  phone?: string;
  contactName: string;
  organizationName: string;
  partnershipType: string;
  message: string;
}): string {
  // Primary Turashoboye leadership contact number (Rwanda +250)
  const targetPhone = (params.phone || '250788000000').replace(/[^0-9]/g, '');
  
  const text = 
`*TURASHOBOYE FEEDS - PARTNERSHIP INQUIRY*
━━━━━━━━━━━━━━━━━━━━━
🏢 *Organization:* ${params.organizationName}
👤 *Contact Person:* ${params.contactName}
🤝 *Partnership Focus:* ${PARTNERSHIP_TYPES[params.partnershipType] || params.partnershipType}

📝 *Proposal / Details:*
${params.message}

━━━━━━━━━━━━━━━━━━━━━
_Sent via Turashoboye Public Portal for immediate leadership review._`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Submit a new partnership inquiry.
 * Writes to Supabase and synchronizes to local storage.
 */
export async function submitPartnershipInquiry(data: {
  organization_name: string;
  contact_name: string;
  email?: string;
  phone: string;
  partnership_type: string;
  message: string;
}): Promise<{ success: boolean; id: string; error?: string }> {
  const newInquiry: PartnershipInquiry = {
    id: crypto.randomUUID(),
    organization_name: data.organization_name.trim(),
    contact_name: data.contact_name.trim(),
    email: data.email?.trim() || undefined,
    phone: data.phone.trim(),
    partnership_type: (data.partnership_type || 'other') as any,
    message: data.message.trim(),
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Always store locally first for resilient record keeping
  const locals = getLocalInquiries();
  saveLocalInquiries([newInquiry, ...locals]);

  // 2. Attempt Supabase insertion
  try {
    const { data: inserted, error } = await supabase
      .from('partnership_inquiries')
      .insert({
        id: newInquiry.id,
        organization_name: newInquiry.organization_name,
        contact_name: newInquiry.contact_name,
        email: newInquiry.email || null,
        phone: newInquiry.phone,
        partnership_type: newInquiry.partnership_type,
        message: newInquiry.message,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert note (fallback active):', error.message);
    } else if (inserted) {
      newInquiry.id = inserted.id;
    }
  } catch (err) {
    console.warn('Network/Supabase error during inquiry submission (stored locally):', err);
  }

  return { success: true, id: newInquiry.id };
}

/**
 * Fetch all partnership inquiries for Owners and Super Admins.
 */
export async function fetchPartnershipInquiries(): Promise<PartnershipInquiry[]> {
  try {
    const { data, error } = await supabase
      .from('partnership_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge with any offline/local submissions
      const locals = getLocalInquiries();
      const existingIds = new Set(data.map((d) => d.id));
      const unmergedLocals = locals.filter((l) => !existingIds.has(l.id));
      const combined = [...data, ...unmergedLocals].sort(
        (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      saveLocalInquiries(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Could not fetch from Supabase, loading local records:', err);
  }

  return getLocalInquiries();
}

/**
 * Update an inquiry's status, handler, or notes (Owner / Super Admin)
 */
export async function updateInquiryStatus(params: {
  id: string;
  status: 'new' | 'in_review' | 'contacted' | 'partnered' | 'archived';
  handled_by?: string;
  handled_by_role?: 'owner' | 'super_admin';
  notes?: string;
}): Promise<boolean> {
  // Update local storage
  const locals = getLocalInquiries();
  const updatedLocals = locals.map((item) => {
    if (item.id === params.id) {
      return {
        ...item,
        status: params.status,
        handled_by: params.handled_by ?? item.handled_by,
        handled_by_role: params.handled_by_role ?? item.handled_by_role,
        notes: params.notes ?? item.notes,
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });
  saveLocalInquiries(updatedLocals);

  // Update Supabase if available
  try {
    await supabase
      .from('partnership_inquiries')
      .update({
        status: params.status,
        handled_by: params.handled_by,
        handled_by_role: params.handled_by_role,
        notes: params.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);
  } catch (err) {
    console.warn('Could not update Supabase inquiry, saved locally:', err);
  }

  return true;
}
