import { useState, useEffect } from 'react';
import {
  Handshake,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  UserCheck,
  Save,
  Building,
} from 'lucide-react';
import {
  fetchPartnershipInquiries,
  updateInquiryStatus,
  PARTNERSHIP_TYPES,
  buildWhatsAppInquiryUrl,
} from '../../lib/partnershipService';
import type { PartnershipInquiry } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  currentRole: 'owner' | 'super_admin';
}

export default function PartnershipInquiriesManager({ currentRole }: Props) {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const actorName = user?.profile?.displayName || (currentRole === 'owner' ? 'Business Owner' : 'Super Admin');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchPartnershipInquiries();
    setInquiries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: 'new' | 'in_review' | 'contacted' | 'partnered' | 'archived'
  ) => {
    await updateInquiryStatus({
      id,
      status: newStatus,
      handled_by: actorName,
      handled_by_role: currentRole,
    });
    setFeedbackNotice(`Status updated to "${newStatus.replace('_', ' ')}" by ${actorName}`);
    setTimeout(() => setFeedbackNotice(null), 3000);
    await loadData();
  };

  const handleSaveNotes = async (id: string) => {
    await updateInquiryStatus({
      id,
      status: 'in_review',
      handled_by: actorName,
      handled_by_role: currentRole,
      notes: notesDraft,
    });
    setEditingNotesId(null);
    setFeedbackNotice('Internal notes saved successfully');
    setTimeout(() => setFeedbackNotice(null), 3000);
    await loadData();
  };

  const filtered = inquiries.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.partnership_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const countNew = inquiries.filter((i) => i.status === 'new').length;
  const countInReview = inquiries.filter((i) => i.status === 'in_review').length;
  const countHandled = inquiries.filter((i) => i.status === 'contacted' || i.status === 'partnered').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <Handshake size={14} className="text-[#2E7D32]" />
              Partnership & Growth Inquiries
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Cooperative, Supplier & Investor Leads
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Public inquiries submitted on the home page or via WhatsApp. Shared between Business Owner & Super Admin for strategic follow-up.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition flex items-center gap-1.5"
            >
              Refresh Leads
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Total Inquiries</span>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">{inquiries.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
              <Clock size={13} /> Needs Review
            </span>
            <p className="text-xl font-extrabold text-amber-900 mt-0.5">{countNew}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs text-blue-800 font-semibold flex items-center gap-1">
              <MessageSquare size={13} /> In Progress
            </span>
            <p className="text-xl font-extrabold text-blue-900 mt-0.5">{countInReview}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Contacted / Partnered
            </span>
            <p className="text-xl font-extrabold text-[#2E7D32] mt-0.5">{countHandled}</p>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by organization, contact person, phone, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
        >
          <option value="all">All Statuses</option>
          <option value="new">New / Unhandled</option>
          <option value="in_review">In Review</option>
          <option value="contacted">Contacted</option>
          <option value="partnered">Partnered</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
        >
          <option value="all">All Partnership Types</option>
          {Object.entries(PARTNERSHIP_TYPES).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Inquiry List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading partner inquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-2">
            <Handshake className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No inquiries match your filter criteria.</p>
            <p className="text-xs text-gray-500">Public inquiries submitted on the home page will appear here.</p>
          </div>
        ) : (
          filtered.map((inquiry) => {
            const isNew = inquiry.status === 'new';
            const whatsappUrl = buildWhatsAppInquiryUrl({
              phone: inquiry.phone,
              contactName: inquiry.contact_name,
              organizationName: inquiry.organization_name,
              partnershipType: inquiry.partnership_type,
              message: inquiry.message,
            });

            return (
              <div
                key={inquiry.id}
                className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                  isNew ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-gray-900">
                          {inquiry.organization_name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Building size={12} />
                          {PARTNERSHIP_TYPES[inquiry.partnership_type] || inquiry.partnership_type}
                        </span>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                            New Lead
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap pt-0.5">
                        <span className="font-semibold text-gray-800">
                          Contact: {inquiry.contact_name}
                        </span>
                        <span>•</span>
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="text-[#2E7D32] hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone size={11} /> {inquiry.phone}
                        </a>
                        {inquiry.email && (
                          <>
                            <span>•</span>
                            <a
                              href={`mailto:${inquiry.email}`}
                              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            >
                              <Mail size={11} /> {inquiry.email}
                            </a>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {inquiry.created_at
                            ? new Date(inquiry.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>

                    {/* Status selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Status:</label>
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value as any)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${
                          inquiry.status === 'new'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : inquiry.status === 'in_review'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : inquiry.status === 'partnered'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : inquiry.status === 'contacted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="contacted">Contacted</option>
                        <option value="partnered">Partnered</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Proposal / Message Card */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {inquiry.message}
                  </div>

                  {/* Handling & Collaboration Footer */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 text-xs border-t border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500">
                      {inquiry.handled_by ? (
                        <span className="flex items-center gap-1 text-gray-700">
                          <UserCheck size={14} className="text-[#2E7D32]" />
                          Followed up by: <strong className="text-gray-900">{inquiry.handled_by}</strong>{' '}
                          ({inquiry.handled_by_role === 'owner' ? 'Business Owner' : 'Super Admin'})
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          ⚠️ Not yet assigned to a handler.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* WhatsApp Direct Action */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition"
                        title="Open WhatsApp chat with prefilled partnership reply"
                      >
                        <MessageSquare size={13} />
                        WhatsApp Chat <ExternalLink size={11} />
                      </a>

                      {/* Email Action */}
                      {inquiry.email && (
                        <a
                          href={`mailto:${inquiry.email}?subject=Turashoboye%20Feeds%20Partnership%20Discussion&body=Hello%20${encodeURIComponent(
                            inquiry.contact_name
                          )},%0A%0AThank%20you%20for%20reaching%20out%20to%20Turashoboye%20Feeds%20regarding%20${encodeURIComponent(
                            PARTNERSHIP_TYPES[inquiry.partnership_type] || inquiry.partnership_type
                          )}.`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs border border-gray-200 transition"
                        >
                          <Mail size={13} />
                          Send Email
                        </a>
                      )}

                      {/* Notes Toggle */}
                      <button
                        onClick={() => {
                          if (editingNotesId === inquiry.id) {
                            setEditingNotesId(null);
                          } else {
                            setEditingNotesId(inquiry.id);
                            setNotesDraft(inquiry.notes || '');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition"
                      >
                        {editingNotesId === inquiry.id ? 'Close Notes' : inquiry.notes ? 'Edit Notes' : '+ Add Note'}
                      </button>
                    </div>
                  </div>

                  {/* Notes Editor (Visible when opened or has existing notes) */}
                  {(editingNotesId === inquiry.id || inquiry.notes) && (
                    <div className="pt-2">
                      {editingNotesId === inquiry.id ? (
                        <div className="space-y-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                          <label className="text-[11px] font-bold text-emerald-950 uppercase">
                            Internal Coordination Notes (Owner & Admin):
                          </label>
                          <textarea
                            rows={2}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="e.g. Discussed pricing for 50 tonnes of maize; owner to meet cooperative chair next Monday..."
                            className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNotes(inquiry.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold text-xs"
                            >
                              <Save size={12} /> Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        inquiry.notes && (
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-600">
                            <span className="font-bold text-gray-700">Internal Note: </span>
                            {inquiry.notes}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
