import { ShieldCheck, Landmark, Users2, Award } from 'lucide-react';

export interface PartnerOrg {
  name: string;
  shortName: string;
  role: string;
  description: string;
  focusArea: string;
  category: 'humanitarian' | 'government' | 'development' | 'finance_enterprise';
  badgeColor: string;
  accentBorder: string;
}

export const PARTNERS_LIST: PartnerOrg[] = [
  {
    name: 'UNHCR Rwanda',
    shortName: 'UNHCR',
    role: 'UN Refugee Agency',
    description: 'Leading humanitarian protection and livelihood coordination across Mahama Camp, fostering self-reliance and economic inclusion through market-based farming.',
    focusArea: 'Refugee Livelihoods & Self-Reliance',
    category: 'humanitarian',
    badgeColor: 'bg-blue-600 text-white',
    accentBorder: 'hover:border-blue-500',
  },
  {
    name: 'MINEMA',
    shortName: 'MINEMA',
    role: 'Ministry in Charge of Emergency Management',
    description: 'Rwandan government authority governing Mahama Refugee Camp and steering the national Joint Strategy on Economic Inclusion for refugees and host communities.',
    focusArea: 'Camp Governance & National Inclusion Policy',
    category: 'government',
    badgeColor: 'bg-emerald-800 text-white',
    accentBorder: 'hover:border-emerald-600',
  },
  {
    name: 'GIZ Rwanda',
    shortName: 'GIZ',
    role: 'German Development Cooperation',
    description: 'Implementing programs for economic participation of refugees and host communities, technical vocational training, and resilient agri-food value chains.',
    focusArea: 'Agri-value Chains & Technical Skills',
    category: 'development',
    badgeColor: 'bg-red-700 text-white',
    accentBorder: 'hover:border-red-500',
  },
  {
    name: 'World Food Programme',
    shortName: 'WFP',
    role: 'United Nations Food Assistance',
    description: 'Championing food security, cash-for-livelihoods, and post-harvest market linkages for local farmer cooperatives supplying quality grains in Kirehe.',
    focusArea: 'Food Security & Smallholder Market Linkages',
    category: 'humanitarian',
    badgeColor: 'bg-sky-600 text-white',
    accentBorder: 'hover:border-sky-500',
  },
  {
    name: 'Inkomoko',
    shortName: 'INKOMOKO',
    role: 'African Entrepreneur Collective',
    description: 'Delivering business coaching, enterprise acceleration, and micro-loan financing to refugee-led and host-community agribusinesses and cooperatives in Mahama.',
    focusArea: 'Agribusiness Advisory & Micro-Enterprise Growth',
    category: 'finance_enterprise',
    badgeColor: 'bg-amber-600 text-white',
    accentBorder: 'hover:border-amber-500',
  },
  {
    name: 'Caritas Rwanda (Kibungo)',
    shortName: 'CARITAS',
    role: 'Socio-Economic Development Agency',
    description: 'Executing community livestock development, small animal husbandry (poultry & swine), and household nutrition programs in Mahama Camp.',
    focusArea: 'Livestock Husbandry & Vulnerable Households',
    category: 'development',
    badgeColor: 'bg-rose-700 text-white',
    accentBorder: 'hover:border-rose-500',
  },
  {
    name: 'ADRA Rwanda',
    shortName: 'ADRA',
    role: 'Adventist Development & Relief Agency',
    description: 'Strengthening community resilience, adolescent vocational pathways, and community kitchen garden initiatives in Mahama refugee settlement.',
    focusArea: 'Community Resilience & Youth Programs',
    category: 'humanitarian',
    badgeColor: 'bg-teal-700 text-white',
    accentBorder: 'hover:border-teal-500',
  },
  {
    name: 'Kirehe District Administration',
    shortName: 'KIREHE DISTRICT',
    role: 'Akarere ka Kirehe (Local Government)',
    description: 'Local government partner promoting agricultural modernizations, grain farmer cooperatives, veterinary inspections, and peaceful host-refugee community integration.',
    focusArea: 'Cooperative Registration & District Development',
    category: 'government',
    badgeColor: 'bg-slate-800 text-white',
    accentBorder: 'hover:border-slate-600',
  },
];

interface Props {
  condensed?: boolean;
}

export default function PartnersSection({ condensed = false }: Props) {
  return (
    <section id="partners" className="scroll-mt-20 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Landmark size={14} className="text-blue-700" />
            Institutional Ecosystem & Collaboration
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Our Partners & Stakeholders in Mahama
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Operating in Mahama Refugee Camp and Kirehe District requires deep synergy with international humanitarian agencies, the Government of Rwanda, and development partners working to build resilient livelihoods and food security.
          </p>
        </div>

        {/* Quick Logo / Acronym Trust Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center mb-4">
            Aligned with the Joint Strategic Framework for Refugee Self-Reliance in Rwanda
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {PARTNERS_LIST.map((p) => (
              <div
                key={p.shortName}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200/80 shadow-xs text-xs font-bold text-gray-800"
              >
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${p.badgeColor}`}>
                  {p.shortName}
                </span>
                <span className="text-gray-700 text-xs hidden sm:inline">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Partner Cards (If not condensed) */}
        {!condensed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTNERS_LIST.map((partner) => (
              <div
                key={partner.shortName}
                className={`bg-white rounded-3xl p-6 border border-gray-200 shadow-xs transition duration-200 flex flex-col justify-between space-y-4 ${partner.accentBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black tracking-wide ${partner.badgeColor}`}>
                      {partner.shortName}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {partner.category.replace('_', ' & ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                      {partner.name}
                    </h3>
                    <span className="text-xs font-semibold text-[#2E7D32] block mt-0.5">
                      {partner.role}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {partner.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                  <ShieldCheck size={14} className="text-[#2E7D32] shrink-0" />
                  <span className="truncate">{partner.focusArea}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Commitment Callout */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Award size={15} />
              Commitment to Humanitarian & Agricultural Standards
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              Driving Local Economic Inclusion & Traceable Nutrition
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Turashoboye Feeds collaborates alongside MINEMA, UNHCR, GIZ, WFP, and local cooperatives to ensure humanitarian feed interventions deliver verified nutrition, fair farm-gate prices, and sustainable self-reliance for refugee and host communities alike.
            </p>
          </div>

          <a
            href="#partner"
            className="px-5 py-3 rounded-xl bg-white text-[#2E7D32] hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition shrink-0 inline-flex items-center gap-2"
          >
            <Users2 size={16} />
            Collaborate With Us
          </a>
        </div>
      </div>
    </section>
  );
}
