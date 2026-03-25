import { useState, useEffect, useCallback } from 'react';
import { createGrievance, getGrievances } from '../../api';
import { Send, Search, Clock, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

const STATUS_STYLES = {
  submitted: { label: 'Submitted', icon: AlertCircle, color: '#D97706', bg: '#FEF3C7' },
  assigned: { label: 'Assigned', icon: Clock, color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', icon: Clock, color: '#4F46E5', bg: '#E0E7FF' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: '#059669', bg: '#D1FAE5' },
};

export default function CitizenDashboard({ currentUser, boothId }) {
  const [tab, setTab] = useState('submit');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [trackPhone, setTrackPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const result = await createGrievance({
        description,
        category: category || undefined,
        voter_name: voterName || 'Anonymous Citizen',
        booth_id: boothId
      });
      setSubmitted(result);
      setDescription('');
      setCategory('');
      setVoterName('');
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleTrack = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGrievances({ booth_id: boothId });
      setGrievances(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => {
    if (tab === 'track') handleTrack();
  }, [tab, handleTrack]);

  return (
    <div data-testid="citizen-dashboard">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'submit', label: 'Submit Issue', icon: Send },
          { key: 'track', label: 'Track Status', icon: Search }
        ].map(t => (
          <button key={t.key} data-testid={`citizen-tab-${t.key}`}
            onClick={() => { setTab(t.key); setSubmitted(null); }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key ? 'bg-[#1B2A4A] text-white shadow-md' : 'bg-white text-[#5A6B80] hover:bg-gray-100'
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="max-w-lg">
          {submitted ? (
            <div data-testid="submit-success" className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold text-lg text-green-800 mb-2">Issue Submitted!</h3>
              <p className="text-sm text-green-700 mb-4">
                Your grievance #{submitted.id} has been registered. Category: <strong>{submitted.category}</strong>
              </p>
              {submitted.ai_sentiment && (
                <p className="text-xs text-green-600 mb-4">AI detected sentiment: {submitted.ai_sentiment}</p>
              )}
              <button data-testid="submit-another-btn" onClick={() => setSubmitted(null)}
                className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                Submit Another
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
              <h3 className="font-semibold text-lg mb-4 text-[#1B2A4A]">Report a Problem</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Your Name (optional)</label>
                  <input data-testid="citizen-name-input" value={voterName} onChange={e => setVoterName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#FF6B00]/30 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Category</label>
                  <select data-testid="citizen-category-select" value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:ring-2 focus:ring-[#FF6B00]/30 outline-none">
                    <option value="">Auto-detect</option>
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
                  <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Describe the Issue *</label>
                  <textarea data-testid="citizen-description-input" value={description} onChange={e => setDescription(e.target.value)}
                    rows={5} placeholder="Tell us about the problem in detail..."
                    className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#FF6B00]/30 outline-none resize-none" />
                </div>
                <button data-testid="citizen-submit-btn" onClick={handleSubmit} disabled={submitting || !description.trim()}
                  className="w-full py-3 rounded-xl bg-[#FF6B00] text-white text-sm font-semibold hover:bg-[#FF8C33] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Grievance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'track' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1B2A4A]">All Grievances ({grievances.length})</h3>
            <button onClick={handleTrack} data-testid="citizen-refresh" className="p-2.5 rounded-full bg-white hover:bg-gray-100">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-[#8899AA]">Loading...</div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-12 text-[#8899AA]">
                <FileText size={36} className="mx-auto mb-3 text-[#CBD5E1]" />
                No grievances found for this booth
              </div>
            ) : grievances.map(g => {
              const s = STATUS_STYLES[g.status] || STATUS_STYLES.submitted;
              const SIcon = s.icon;
              return (
                <div key={g.id} data-testid={`citizen-grievance-${g.id}`}
                  className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#8899AA]">#{g.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">{g.category}</span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: s.bg, color: s.color }}>
                      <SIcon size={12} /> {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#1B2A4A] mb-1">{g.description}</p>
                  <p className="text-xs text-[#8899AA]">
                    {new Date(g.created_at).toLocaleDateString()}
                    {g.assigned_worker && ` | Assigned to: ${g.assigned_worker}`}
                    {g.resolution_note && ` | Resolution: ${g.resolution_note}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
