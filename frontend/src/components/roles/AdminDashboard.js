import { useState, useEffect, useCallback } from 'react';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { AlertCircle, CheckCircle2, Clock, UserPlus, RefreshCw, ChevronDown } from 'lucide-react';

const STATUS_MAP = {
  submitted: { label: 'New', bg: '#FEF3C7', text: '#D97706', icon: AlertCircle },
  assigned: { label: 'Assigned', bg: '#DBEAFE', text: '#2563EB', icon: UserPlus },
  in_progress: { label: 'In Progress', bg: '#E0E7FF', text: '#4F46E5', icon: Clock },
  resolved: { label: 'Resolved', bg: '#D1FAE5', text: '#059669', icon: CheckCircle2 },
};

const CATEGORY_COLORS = {
  water: '#0EA5E9', road: '#8B5CF6', electricity: '#F59E0B',
  sanitation: '#10B981', healthcare: '#EF4444', education: '#6366F1', other: '#6B7280'
};

export default function AdminDashboard({ currentUser, boothId }) {
  const [grievances, setGrievances] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [g, w] = await Promise.all([
        getGrievances({ booth_id: boothId }),
        getUsersByRole('worker')
      ]);
      setGrievances(g);
      setWorkers(w);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async () => {
    if (!assignModal || !selectedWorker) return;
    try {
      await updateGrievance({
        id: assignModal.id,
        assigned_worker: selectedWorker,
        status: 'assigned'
      });
      setAssignModal(null);
      setSelectedWorker('');
      loadData();
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? grievances : grievances.filter(g => g.status === filter);

  const statusCounts = grievances.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div data-testid="admin-dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_MAP).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <div key={key} data-testid={`admin-stat-${key}`}
              onClick={() => setFilter(key === filter ? 'all' : key)}
              className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                filter === key ? 'border-[#1B2A4A] shadow-md' : 'border-transparent bg-white hover:shadow-sm'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} style={{ color: val.text }} />
                <span className="text-xs font-medium" style={{ color: val.text }}>{val.label}</span>
              </div>
              <p className="text-2xl font-bold text-[#1B2A4A]">{statusCounts[key] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1B2A4A]">
          Grievances {filter !== 'all' && `(${STATUS_MAP[filter]?.label})`}
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="ml-2 text-xs text-[#FF6B00] hover:underline">Show all</button>
          )}
        </h3>
        <button onClick={loadData} data-testid="admin-refresh" className="p-2.5 rounded-full bg-white hover:bg-gray-100 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grievance List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[#8899AA]">Loading grievances...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#8899AA]">No grievances found</div>
        ) : filtered.map(g => {
          const s = STATUS_MAP[g.status] || STATUS_MAP.submitted;
          const SIcon = s.icon;
          return (
            <div key={g.id} data-testid={`grievance-card-${g.id}`}
              className="bg-white rounded-xl p-4 border border-[#E2E8F0] hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${CATEGORY_COLORS[g.category]}20`, color: CATEGORY_COLORS[g.category] }}>
                      {g.category}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: s.bg, color: s.text }}>
                      <SIcon size={12} /> {s.label}
                    </span>
                    {g.sentiment && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        g.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                        g.sentiment === 'positive' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                      }`}>{g.sentiment}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#1B2A4A] mb-1">{g.description}</p>
                  <p className="text-xs text-[#8899AA]">
                    ID: #{g.id} | {new Date(g.created_at).toLocaleDateString()}
                    {g.assigned_worker && ` | Worker: ${g.assigned_worker}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {g.status !== 'resolved' && (
                    <button data-testid={`assign-btn-${g.id}`}
                      onClick={() => { setAssignModal(g); setSelectedWorker(''); }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-[#1B2A4A] text-white hover:bg-[#2D3E5C] transition-all flex items-center gap-1">
                      <UserPlus size={13} /> {g.assigned_worker ? 'Reassign' : 'Assign'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" data-testid="assign-modal">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-1">Assign Worker</h3>
            <p className="text-sm text-[#8899AA] mb-4">Grievance #{assignModal.id}: {assignModal.description?.slice(0, 60)}...</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Select Worker</label>
                <select data-testid="worker-select" value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:ring-2 focus:ring-[#FF6B00]/30 outline-none">
                  <option value="">Choose worker...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Booth {w.booth_id})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button data-testid="assign-cancel-btn" onClick={() => setAssignModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F7F8FA] text-[#5A6B80] text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button data-testid="assign-confirm-btn" onClick={handleAssign} disabled={!selectedWorker}
                  className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] text-white text-sm font-medium hover:bg-[#2D3E5C] disabled:opacity-50">
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
