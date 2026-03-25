import { useState, useEffect, useCallback } from 'react';
import { getVoters, updateVoter, getCalls, createCall, createGrievance, getUsersByRole } from '../../api';
import { Phone, PhoneOff, PhoneMissed, UserCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertTriangle, CheckCircle, Search, RefreshCw } from 'lucide-react';

const SENTIMENT_COLORS = {
  positive: { bg: '#ECFDF5', text: '#059669', icon: ArrowUpCircle },
  neutral: { bg: '#F0F9FF', text: '#0284C7', icon: MinusCircle },
  negative: { bg: '#FEF2F2', text: '#DC2626', icon: ArrowDownCircle },
};

const CALL_STATUS_ICONS = { answered: Phone, no_answer: PhoneMissed, pending: PhoneOff };

export default function PannaDashboard({ currentUser, boothId }) {
  const [voters, setVoters] = useState([]);
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('voters');
  const [callModal, setCallModal] = useState(null);
  const [grievanceModal, setGrievanceModal] = useState(null);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState('answered');
  const [grievanceDesc, setGrievanceDesc] = useState('');
  const [grievanceCat, setGrievanceCat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c] = await Promise.all([getVoters(boothId), getCalls(boothId)]);
      setVoters(v);
      setCalls(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSentimentUpdate = async (voterId, sentiment) => {
    try {
      await updateVoter({ id: voterId, sentiment });
      setVoters(prev => prev.map(v => v.id === voterId ? { ...v, sentiment } : v));
    } catch (e) { console.error(e); }
  };

  const handleLogCall = async () => {
    if (!callModal) return;
    setSubmitting(true);
    try {
      await createCall({
        voter_id: callModal.id,
        voter_name: callModal.name,
        status: callStatus,
        notes: callNotes,
        booth_id: boothId
      });
      setCallModal(null);
      setCallNotes('');
      setCallStatus('answered');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleCreateGrievance = async () => {
    if (!grievanceModal || !grievanceDesc.trim()) return;
    setSubmitting(true);
    try {
      await createGrievance({
        voter_id: grievanceModal.id,
        voter_name: grievanceModal.name,
        description: grievanceDesc,
        category: grievanceCat || undefined,
        booth_id: boothId
      });
      setGrievanceModal(null);
      setGrievanceDesc('');
      setGrievanceCat('');
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const filtered = voters.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.includes(search)
  );

  return (
    <div data-testid="panna-dashboard">
      {/* Tab Header */}
      <div className="flex gap-2 mb-6">
        {['voters', 'calls'].map(t => (
          <button key={t} data-testid={`panna-tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              tab === t ? 'bg-[#1B2A4A] text-white shadow-md' : 'bg-white text-[#5A6B80] hover:bg-gray-100'
            }`}>
            {t === 'voters' ? `Voters (${voters.length})` : `Calls (${calls.length})`}
          </button>
        ))}
        <button onClick={loadData} data-testid="panna-refresh" className="ml-auto p-2.5 rounded-full bg-white hover:bg-gray-100 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {tab === 'voters' && (
        <>
          {/* Search */}
          <div className="relative mb-5">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8899AA]" />
            <input data-testid="voter-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] outline-none text-sm" />
          </div>

          {/* Voter List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-[#8899AA]">Loading voters...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[#8899AA]">No voters found</div>
            ) : filtered.slice(0, 50).map(voter => {
              const s = SENTIMENT_COLORS[voter.sentiment] || SENTIMENT_COLORS.neutral;
              const SIcon = s.icon;
              return (
                <div key={voter.id} data-testid={`voter-card-${voter.id}`}
                  className="bg-white rounded-xl p-4 border border-[#E2E8F0] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center">
                        <UserCircle size={22} className="text-[#0284C7]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{voter.name}</p>
                        <p className="text-xs text-[#8899AA]">{voter.phone} | {voter.segment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Sentiment badge */}
                      <span style={{ background: s.bg, color: s.text }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium">
                        <SIcon size={13} /> {voter.sentiment}
                      </span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                    {['positive', 'neutral', 'negative'].map(s => (
                      <button key={s} data-testid={`sentiment-${s}-${voter.id}`}
                        onClick={() => handleSentimentUpdate(voter.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          voter.sentiment === s
                            ? 'bg-[#1B2A4A] text-white'
                            : 'bg-[#F7F8FA] text-[#5A6B80] hover:bg-[#E2E8F0]'
                        }`}>
                        {s}
                      </button>
                    ))}
                    <button data-testid={`call-voter-${voter.id}`}
                      onClick={() => setCallModal(voter)}
                      className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF6B00] text-white hover:bg-[#FF8C33] transition-all flex items-center gap-1">
                      <Phone size={12} /> Call
                    </button>
                    <button data-testid={`report-issue-${voter.id}`}
                      onClick={() => setGrievanceModal(voter)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1">
                      <AlertTriangle size={12} /> Report
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length > 50 && (
              <p className="text-center text-sm text-[#8899AA] py-3">Showing 50 of {filtered.length} voters</p>
            )}
          </div>
        </>
      )}

      {tab === 'calls' && (
        <div className="space-y-3">
          {calls.length === 0 ? (
            <div className="text-center py-12 text-[#8899AA]">No calls logged yet</div>
          ) : calls.map(call => {
            const CIcon = CALL_STATUS_ICONS[call.status] || Phone;
            return (
              <div key={call.id} data-testid={`call-entry-${call.id}`}
                className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CIcon size={18} className={call.status === 'answered' ? 'text-green-600' : 'text-red-400'} />
                    <div>
                      <p className="font-medium text-sm">{call.voter_name}</p>
                      <p className="text-xs text-[#8899AA]">{call.status} | {new Date(call.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {call.sentiment && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      call.sentiment === 'positive' ? 'bg-green-50 text-green-700' :
                      call.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>{call.sentiment}</span>
                  )}
                </div>
                {call.notes && <p className="mt-2 text-xs text-[#5A6B80] bg-[#F7F8FA] p-2 rounded-lg">{call.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Call Modal */}
      {callModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" data-testid="call-modal">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-1">Log Call</h3>
            <p className="text-sm text-[#8899AA] mb-4">{callModal.name} - {callModal.phone}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Call Status</label>
                <div className="flex gap-2">
                  {['answered', 'no_answer'].map(s => (
                    <button key={s} data-testid={`call-status-${s}`}
                      onClick={() => setCallStatus(s)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        callStatus === s ? 'bg-[#1B2A4A] text-white' : 'bg-[#F7F8FA] text-[#5A6B80]'
                      }`}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Notes</label>
                <textarea data-testid="call-notes-input" value={callNotes} onChange={e => setCallNotes(e.target.value)}
                  rows={3} placeholder="Call notes..."
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#FF6B00]/30 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button data-testid="call-cancel-btn" onClick={() => { setCallModal(null); setCallNotes(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#F7F8FA] text-[#5A6B80] text-sm font-medium hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button data-testid="call-submit-btn" onClick={handleLogCall} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-medium hover:bg-[#FF8C33] transition-all disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Log Call'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grievance Modal */}
      {grievanceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" data-testid="grievance-modal">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-1">Report Issue</h3>
            <p className="text-sm text-[#8899AA] mb-4">For: {grievanceModal.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Category</label>
                <select data-testid="grievance-category-select" value={grievanceCat} onChange={e => setGrievanceCat(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:ring-2 focus:ring-[#FF6B00]/30 outline-none">
                  <option value="">Auto-detect (AI)</option>
                  <option value="water">Water</option>
                  <option value="road">Road</option>
                  <option value="electricity">Electricity</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Description</label>
                <textarea data-testid="grievance-desc-input" value={grievanceDesc} onChange={e => setGrievanceDesc(e.target.value)}
                  rows={4} placeholder="Describe the issue..."
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#FF6B00]/30 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button data-testid="grievance-cancel-btn" onClick={() => { setGrievanceModal(null); setGrievanceDesc(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#F7F8FA] text-[#5A6B80] text-sm font-medium hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button data-testid="grievance-submit-btn" onClick={handleCreateGrievance} disabled={submitting || !grievanceDesc.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
