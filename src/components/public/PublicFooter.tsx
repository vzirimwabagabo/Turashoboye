import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2E7D32] text-white font-bold text-sm">
                TF
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Turashoboye</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Dependable animal feed production and nutrition services for poultry, pig, and cattle farmers in Mahama and Kirehe District, Rwanda.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
              <ShieldCheck size={14} />
              Quality Verified Batch Traceability
            </div>
          </div>

          {/* Feed Products */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Animal Feeds
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalogue?category=poultry-feed" className="hover:text-white transition-colors">
                  Poultry Broiler & Layer Feed
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=pig-feed" className="hover:text-white transition-colors">
                  Pig Grower & Sow Feed
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=cattle-feed" className="hover:text-white transition-colors">
                  Dairy & Cattle Feed
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=raw-ingredients" className="hover:text-white transition-colors">
                  Raw Grains & Milled Meals
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Company & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Turashoboye
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Ordering & Collection
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Notice
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Mahama Depot Contact
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#A5D6A7] mt-0.5 flex-shrink-0" />
                <span>Sector Mahama, Kirehe District, Eastern Province, Rwanda</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#A5D6A7] flex-shrink-0" />
                <span>+250 780 000 000 (Orders & Support)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#A5D6A7] flex-shrink-0" />
                <span>contact@turashoboye.rw</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock size={16} className="text-[#A5D6A7] flex-shrink-0" />
                <span>Mon – Sat: 7:00 AM – 5:30 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; 2026 Turashoboye Feeds. All rights reserved.</p>
          <p>Built with verifiable batch traceability, fair pricing, and farmer-first support.</p>
        </div>
      </div>
    </footer>
  );
}
