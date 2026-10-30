import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Handshake,
  MessageSquare,
  Building,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
  Users,
  Wheat,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  submitPartnershipInquiry,
  buildWhatsAppInquiryUrl,
  PARTNERSHIP_TYPES,
} from '../../lib/partnershipService';

export default function PartnerWithUsSection() {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [partnershipType, setPartnershipType] = useState('grain_supply');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    contactName: string;
    organizationName: string;
    partnershipType: string;
    message: string;
    phone: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await submitPartnershipInquiry({
      organization_name: orgName,
      contact_name: contactName,
      phone,
      email,
      partnership_type: partnershipType,
      message,
    });

    setSubmittedData({
      contactName,
      organizationName: orgName,
      partnershipType,
      message,
      phone,
    });

    setSubmitting(false);
  };

  const handleReset = () => {
    setSubmittedData(null);
    setOrgName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  const directWhatsAppGeneralUrl = buildWhatsAppInquiryUrl({
    contactName: 'Prospective Partner',
    organizationName: 'Agribusiness / NGO Stakeholder',
    partnershipType: 'general',
    message: 'Hello Turashoboye Team, I would like to discuss an institutional partnership with your leadership.',
  });

  return (
    <section id="partner" className="scroll-mt-20 py-16 bg-gradient-to-b from-gray-50 via-emerald-50/20 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-bold tracking-wide border border-emerald-200">
            <Handshake size={14} className="text-[#2E7D32]" />
            Expand Agriculture & Food Security
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Partner With Us to Grow Resilient Livestock Production
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            As Turashoboye Feeds expands its milling capacity and outreach across Mahama and the Eastern Province, we invite cooperatives, development agencies, distributors, and impact partners to join hands with us.
          </p>
        </div>

        {/* 4 Partnership Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-[#2E7D32] transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Wheat size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Grain Farmer Cooperatives</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Guaranteed off-take contracts and fair pricing for dried maize, whole soya, and sunflower cake from local grower groups.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-[#2E7D32] transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Humanitarian & Development Agencies</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Operational partner aligning with MINEMA, UNHCR, GIZ, and WFP livelihoods initiatives, refugee self-reliance, and livestock nutrition projects in Mahama.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-[#2E7D32] transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Building size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Wholesale & Agro-dealers</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Regional distribution agreements with dedicated stock reserves, bulk discounts, and co-branded promotional support.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-[#2E7D32] transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Impact Investors & Donors</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Transparent enterprise governance, verified social metrics, and capital allocation for solar milling and warehouse expansion.
            </p>
          </div>
        </div>

        {/* Main Dual Box: Direct WhatsApp vs Recorded Platform Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quick WhatsApp Connect & Direct Leadership Channel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#2E7D32] via-emerald-800 to-green-950 text-white p-7 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <span className="text-emerald-300 font-bold uppercase tracking-wider text-xs block">
                  Fast Direct Channel
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Direct Executive Dialogue
                </h3>
                <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                  Need a rapid discussion on supply agreements or institutional programs? Reach out directly via WhatsApp to our executive operations desk.
                </p>
              </div>

              <div className="space-y-3 pt-2 relative z-10">
                <a
                  href={directWhatsAppGeneralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm shadow-md transition-transform hover:scale-[1.02]"
                >
                  <MessageSquare size={18} />
                  Chat on WhatsApp Directly <ExternalLink size={14} />
                </a>

                <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-xs text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <ShieldCheck size={15} className="text-emerald-300" />
                    Record Keeping & Governance
                  </div>
                  <p>
                    Every inquiry submitted through the form on the right is permanently registered in our management portal for review by both the <strong>Business Owner</strong> and <strong>Super Admin</strong>.
                  </p>
                </div>
              </div>

              {/* Decorative background circle */}
              <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
            </div>

            {/* Direct contact notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-xs text-gray-600 space-y-2">
              <span className="font-bold text-gray-900 block">Upcoming Email Inquiries:</span>
              <p>
                When our dedicated domain DNS is completed, all submitted inquiries will automatically dispatch copies to <strong>partnerships@turashoboye.rw</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Platform Inquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            {submittedData ? (
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-gray-900">
                    Partnership Inquiry Logged!
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Murakoze, <strong>{submittedData.contactName}</strong>! Your collaboration proposal on behalf of <strong>{submittedData.organizationName}</strong> has been registered on the Turashoboye platform for owner and admin review.
                  </p>
                </div>

                {/* Direct WhatsApp follow-up button with exact inquiry details */}
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 max-w-md mx-auto space-y-3">
                  <p className="text-xs font-semibold text-emerald-900">
                    Would you like to send a direct copy to our leadership via WhatsApp right now?
                  </p>
                  <a
                    href={buildWhatsAppInquiryUrl(submittedData)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition"
                  >
                    <MessageSquare size={16} />
                    Open WhatsApp With My Inquiry <ExternalLink size={13} />
                  </a>
                </div>

                <div>
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-[#2E7D32] hover:underline"
                  >
                    Submit another partnership proposal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Submit a Partnership Proposal
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Logged directly into the platform so our executive leadership can coordinate and follow up.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Organization / Cooperative / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Kirehe Grain Producers Co-op"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Person Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Marie Claire Uwase"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +250 788 123 456"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@cooperative.rw"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partnership Category *
                  </label>
                  <select
                    value={partnershipType}
                    onChange={(e) => setPartnershipType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    {Object.entries(PARTNERSHIP_TYPES).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partnership Details & Scope *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your organization, available volumes or requirements, proposed collaboration structure, or specific support needed..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Logging Inquiry to Platform...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Partnership Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
