import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Truck,
  Sparkles,
  Wheat,
  Factory,
  Users,
  Award,
  Handshake,
} from 'lucide-react';
import PartnerWithUsSection from '../../components/public/PartnerWithUsSection';
import PartnersSection from '../../components/public/PartnersSection';

const CATEGORIES = [
  {
    name: 'Poultry Feed (Broiler & Layer)',
    slug: 'poultry-feed',
    description: 'Scientifically balanced broiler starter, grower, finisher, and layer mashes formulated for fast, healthy flock growth and high egg production.',
    tag: 'Poultry',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-800 border-amber-200',
    stats: '19-21% Crude Protein',
  },
  {
    name: 'Pig Feed (Grower & Sow)',
    slug: 'pig-feed',
    description: 'Energy-dense mashes and grower rations designed for piglet vitality, optimal daily weight gain, and sow lactation support.',
    tag: 'Swine',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    color: 'from-rose-500/10 to-red-500/10 text-rose-800 border-rose-200',
    stats: 'High Digestible Energy',
  },
  {
    name: 'Cattle & Dairy Feed',
    slug: 'cattle-feed',
    description: 'High-protein dairy meal concentrates and mineral premixes supporting high milk yields, body condition, and ruminant rumen health.',
    tag: 'Cattle',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 border-emerald-200',
    stats: '16-18% Balanced Protein',
  },
  {
    name: 'Raw Ingredients & Meals',
    slug: 'raw-ingredients',
    description: 'Freshly milled whole maize, toasted soya meal, sunflower cake, and wheat bran available in wholesale 25kg & 50kg bags.',
    tag: 'Ingredients',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    color: 'from-blue-500/10 to-cyan-500/10 text-blue-800 border-blue-200',
    stats: '100% Locally Sourced',
  },
];

const OUR_WORKS = [
  {
    title: '1. Local Cooperative Grain Sourcing',
    description: 'We purchase whole maize, soya beans, and bran directly from smallholder farmer cooperatives across Kirehe District, guaranteeing fair farm-gate prices and rapid cash flow to rural growers.',
    icon: Wheat,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    title: '2. Scientific Formulation & Precision Milling',
    description: 'Our Mahama milling facility utilizes calibrated hammers, dust extractors, and batch mixers. Each formula is formulated to meet precise crude protein, calcium, and phosphorus standards for Rwandan breeds.',
    icon: Factory,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    title: '3. Full Batch Traceability & Honest Weights',
    description: 'Every single bag is assigned a unique batch number recorded in our digital ledger. Our certified scales ensure farmers get every single gram they paid for, free from adulteration or sand fillers.',
    icon: ShieldCheck,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    title: '4. Community Impact & Refugee Self-Reliance',
    description: 'Rooted in Mahama, Turashoboye bridges refugee and host community livelihoods through skilled employment, affordable poultry feeding programs, and hands-on livestock nutrition advisory.',
    icon: Users,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
];

const ADVANTAGES = [
  {
    title: 'Verifiable Batch Traceability',
    description: 'Every bag of feed produced carries a unique batch identifier traceable to verified grain sources and production dates.',
    icon: ShieldCheck,
  },
  {
    title: 'Staff-Assisted & WhatsApp Ordering',
    description: 'Order in person at our depot or instantly via phone and WhatsApp. No technical complexity required for customers.',
    icon: Phone,
  },
  {
    title: 'Accurate Packaging & Weight',
    description: 'Available in genuine 50kg, 25kg, and 10kg bags, as well as customized packaging tailored to your farm size.',
    icon: CheckCircle2,
  },
  {
    title: 'Transparent Pricing in RWF',
    description: 'Honest prices without hidden markups. We support smallholders and commercial livestock farmers across Kirehe District.',
    icon: Truck,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold tracking-wide border border-emerald-600/60 shadow-xs">
              <Sparkles size={14} className="text-emerald-300" />
              Mahama Agro-Processing & Feed Operations • Rwanda
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Quality Animal Feed for Healthy, High-Yield Livestock
            </h1>

            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed max-w-2xl">
              Turashoboye Feeds manufactures balanced, scientifically formulated feeds for poultry, swine, and dairy cattle in Mahama. Sourced from local cooperative grains and milled to guaranteed nutrient density.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#2E7D32] font-bold text-sm shadow-md hover:bg-emerald-50 transition"
              >
                <ShoppingBag size={18} />
                Explore Feed Catalogue
              </Link>
              <a
                href="#partner"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm border border-emerald-500/50 transition"
              >
                <Handshake size={18} />
                Partner With Us
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 font-semibold text-sm border border-emerald-700/60 transition"
              >
                <Phone size={16} />
                Depot & Contact
              </Link>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-12 w-64 h-64 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Live Performance & Operational Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block">Farmers & Breeders</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 mt-1 block">500+ Served</span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Across Kirehe District</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block">Batch Traceability</span>
            <span className="text-xl sm:text-2xl font-black text-[#2E7D32] mt-1 block">100% Verified</span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Unique lot & bag identifiers</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block">Formulation Standards</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 mt-1 block">4 Formulations</span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Poultry, Swine, Cattle, Grains</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block">Packaging Sizes</span>
            <span className="text-xl sm:text-2xl font-black text-purple-900 mt-1 block">10, 25 & 50 kg</span>
            <span className="text-[11px] text-purple-700 font-semibold mt-0.5 block">Calibrated honest weights</span>
          </div>
        </div>
      </section>

      {/* "Our Works & Production Process" Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#2E7D32] text-xs font-bold border border-emerald-200">
            <Award size={13} />
            Agro-Processing in Action
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            How We Produce Quality Feed in Mahama
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            From local grain farm gates to livestock troughs, our end-to-end operation is built on accountability, fair prices, and rigorous nutritional consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OUR_WORKS.map((work) => {
            const Icon = work.icon;
            return (
              <div
                key={work.title}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border ${work.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {work.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {work.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feed Solutions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Our Animal Feed Solutions
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Formulated specifically for the nutritional and metabolic requirements of local livestock breeds.
            </p>
          </div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2E7D32] hover:text-emerald-800"
          >
            View all feeds & prices <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalogue?category=${cat.slug}`}
              className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-[#2E7D32] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="h-44 w-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-xs bg-white/95 ${cat.color}`}>
                    {cat.tag}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-900/80 text-white backdrop-blur-xs">
                    {cat.stats}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2E7D32] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-0 flex items-center gap-1 text-xs font-bold text-[#2E7D32]">
                <span>Check bag sizes & pricing</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Operational Principles */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Why Mahama Farmers Rely on Turashoboye
            </h2>
            <p className="text-sm text-gray-600">
              Operating with full accountability, honest weights, and verifiable batch traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVANTAGES.map((adv) => {
              const Icon = adv.icon;
              return (
                <div key={adv.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    {adv.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {adv.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Institutional Partners in Mahama */}
      <PartnersSection />

      {/* Partner With Us Interactive Section */}
      <PartnerWithUsSection />

      {/* Ordering Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 sm:p-12 shadow-xs">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Ready to Order Animal Feed for Your Farm?
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We make ordering accessible for everyone in Mahama, Kirehe, and surrounding sectors. You can check current pricing in our catalogue and order directly by calling our staff, chatting on WhatsApp, or visiting our depot.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/catalogue"
                className="px-6 py-3 rounded-xl bg-[#2E7D32] text-white font-bold text-sm hover:bg-[#256b29] shadow-xs transition"
              >
                View Available Feeds
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-bold text-sm hover:bg-gray-50 transition"
              >
                Depot Location & Contact Numbers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
