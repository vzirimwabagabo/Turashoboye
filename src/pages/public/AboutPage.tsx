import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, Award, Factory, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-bold uppercase tracking-wider">
          Our Story & Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Supporting Farmers & Food Security in Mahama
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          Turashoboye Feeds was founded to solve a critical bottleneck facing poultry, pig, and dairy farmers in the Mahama refugee camp area and Kirehe District: dependable access to affordable, quality animal feed.
        </p>
      </div>

      {/* Main Narrative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <h2 className="text-xl font-bold text-gray-900">
            From Raw Grain to High-Performance Feed
          </h2>
          <p>
            Livestock farming provides vital income and nutrition for refugee households and host-community farmers in Eastern Rwanda. However, purchasing commercial feeds transported from distant urban centers often leads to inflated transport costs, erratic stockouts, and unpredictable feed quality.
          </p>
          <p>
            Turashoboye bridges this gap by procuring quality raw ingredients—including clean yellow maize, roasted soya bean meal, sunflower cake, and essential vitamin-mineral premixes—and performing controlled milling, grinding, and batch mixing locally.
          </p>
          <p>
            By producing feeds locally, we keep overhead low, pass savings directly to farmers, and guarantee that every bag sold has been recently processed for maximum freshness.
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-lg font-bold text-gray-900">
            Our Operational Commitments
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <ShieldCheck className="text-[#2E7D32] flex-shrink-0 mt-0.5" size={18} />
              <span><strong>Verifiable Traceability:</strong> We track all ingredient supplier lots and finished production batches.</span>
            </li>
            <li className="flex items-start gap-3">
              <Factory className="text-[#2E7D32] flex-shrink-0 mt-0.5" size={18} />
              <span><strong>Freshness & Quality:</strong> Regular grinding runs prevent prolonged storage and maintain feed palatability.</span>
            </li>
            <li className="flex items-start gap-3">
              <HeartHandshake className="text-[#2E7D32] flex-shrink-0 mt-0.5" size={18} />
              <span><strong>Accessible Sales:</strong> Walk-in purchasing and phone orders without mandatory digital barriers for farmers.</span>
            </li>
            <li className="flex items-start gap-3">
              <Award className="text-[#2E7D32] flex-shrink-0 mt-0.5" size={18} />
              <span><strong>Rwanda Standards Alignment:</strong> Designed to meet RSB feed guidelines and RICA safety requirements.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Depot Information Banner */}
      <div className="bg-gray-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Visit Our Mahama Depot</h3>
          <p className="text-sm text-gray-300 max-w-lg">
            Our team is available six days a week to advise on feed rations, arrange pickup, or discuss bulk ingredient procurement.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold transition-colors flex-shrink-0"
        >
          Get Directions & Contact <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
