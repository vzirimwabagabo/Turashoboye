import { useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [feedInterest, setFeedInterest] = useState('poultry');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Contact & Ordering Inquiries
        </h1>
        <p className="text-sm text-gray-600">
          Reach our operations team in Mahama directly by phone, WhatsApp, or through the contact form below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Direct Contact & Depot
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Depot Location</span>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Sector Mahama, Kirehe District, Eastern Province, Rwanda
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    (Close to camp commercial zone — ask for Turashoboye Feeds Depot)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center flex-shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Phone & WhatsApp</span>
                  <p className="text-gray-600 text-xs mt-0.5">+250 780 000 000</p>
                  <p className="text-gray-500 text-xs">Direct staff order assistance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Email Inquiries</span>
                  <p className="text-gray-600 text-xs mt-0.5">contact@turashoboye.rw</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Operating Hours</span>
                  <p className="text-gray-600 text-xs mt-0.5">Monday – Saturday: 7:00 AM – 5:30 PM</p>
                  <p className="text-gray-500 text-xs">Sunday: Closed for maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Enquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Send an Order Inquiry
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Fill out this form and our sales staff will call you back with product availability and total price in RWF.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#2E7D32] mx-auto" />
                <h3 className="text-base font-bold text-gray-900">Inquiry Received!</h3>
                <p className="text-sm text-gray-600">
                  Murakoze! Our staff will call you at <strong>{phone}</strong> to confirm your feed requirements.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setPhone('');
                    setMessage('');
                  }}
                  className="mt-2 text-xs font-semibold text-[#2E7D32] underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jean Pierre"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 078XXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Feed Category of Interest
                  </label>
                  <select
                    value={feedInterest}
                    onChange={(e) => setFeedInterest(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    <option value="poultry">Poultry Feed (Broiler / Layer)</option>
                    <option value="pig">Pig Feed (Grower / Sow)</option>
                    <option value="cattle">Dairy Cattle Concentrates</option>
                    <option value="raw_ingredients">Raw Ingredients (Soya / Maize / Bran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Message / Quantity Needed
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how many bags you need, your livestock count, or if you require collection assistance..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#2E7D32] text-white text-sm font-bold shadow-xs hover:bg-[#256b29] transition-colors"
                >
                  <Send size={16} />
                  Submit Feed Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
