import { Link } from 'react-router-dom';
import { ShoppingBag, Phone, ShieldCheck, CheckCircle2, ArrowRight, Truck, Sparkles } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Poultry Feed',
    slug: 'poultry-feed',
    description: 'High-protein broiler starter, finisher, and layer feeds formulated for healthy flock growth and egg production.',
    tag: 'Poultry',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-800 border-amber-200',
  },
  {
    name: 'Pig Feed',
    slug: 'pig-feed',
    description: 'Energy-dense mashes and grower rations designed for piglet vitality, optimal weight gain, and sow maintenance.',
    tag: 'Swine',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    color: 'from-rose-500/10 to-red-500/10 text-rose-800 border-rose-200',
  },
  {
    name: 'Cattle & Dairy Feed',
    slug: 'cattle-feed',
    description: 'Balanced dairy meal concentrates supporting milk yield and ruminant digestive health.',
    tag: 'Cattle',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 border-emerald-200',
  },
  {
    name: 'Raw Ingredients & Meals',
    slug: 'raw-ingredients',
    description: 'Freshly milled whole maize, soya meal, sunflower cake, and wheat bran available in wholesale bags.',
    tag: 'Ingredients',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    color: 'from-blue-500/10 to-cyan-500/10 text-blue-800 border-blue-200',
  },
];


const ADVANTAGES = [
  {
    title: 'Verifiable Batch Traceability',
    description: 'Every bag of feed produced at our Mahama depot carries a unique batch identifier traceable to verified ingredient sources.',
    icon: ShieldCheck,
  },
  {
    title: 'Staff-Assisted Ordering',
    description: 'Order in person at our depot or by phone and WhatsApp. No smartphone or online account required for customers.',
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
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold tracking-wide border border-emerald-700/60">
              <Sparkles size={14} className="text-emerald-300" />
              Mahama Agro-Processing & Feed Operations
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Quality Animal Feed for Healthy, Productive Livestock
            </h1>

            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed">
              Turashoboye Feeds produces balanced poultry, pig, and cattle feed formulations right here in Mahama. We grind and mix quality grains and supplements to help local farmers maximize yield and animal health.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#2E7D32] font-bold text-sm shadow-md hover:bg-emerald-50 transition-colors"
              >
                <ShoppingBag size={18} />
                Explore Feed Catalogue
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-sm border border-emerald-600/50 transition-colors"
              >
                <Phone size={18} />
                Order via Phone / WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feed Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Our Animal Feed Solutions
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Formulated specifically for the nutritional requirements of local livestock breeds.
            </p>
          </div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E7D32] hover:text-emerald-800"
          >
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalogue?category=${cat.slug}`}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#2E7D32] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="h-40 w-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-xs bg-white/90 ${cat.color}`}>
                    {cat.tag}
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
                <span>Browse feed options</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Operational Principles */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Why Mahama Farmers Rely on Turashoboye
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Operating with accountability, transparent weights, and batch traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ADVANTAGES.map((adv) => {
              const Icon = adv.icon;
              return (
                <div key={adv.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {adv.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {adv.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ordering Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 sm:p-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900">
              Ready to Order Feed for Your Animals?
            </h2>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              We make ordering accessible for everyone in Mahama and surrounding sectors. You can check current pricing in our catalogue and order directly by calling our staff or visiting our primary depot in Mahama.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/catalogue"
                className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white font-medium text-sm hover:bg-[#256b29] shadow-xs transition-colors"
              >
                View Available Feeds
              </Link>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium text-sm hover:bg-gray-50 transition-colors"
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
