import { useState, useEffect, useCallback } from 'react';
import { getGrievances, updateGrievance } from '../../api';
import { Wrench, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_MAP = {
  submitted: { label: 'New', bg: '#FEF3C7', text: '#D97706' },
  assigned: { label: 'Assigned', bg: '#DBEAFE', text: '#2563EB' },
  in_progress: { label: 'In Progress', bg: '#E0E7FF', text: '#4F46E5' },
  resolved: { label: 'Resolved', bg: '#D1FAE5', text: '#059669' },
};

export default function WorkerDashboard({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGrievances({ assigned_to: currentUser.id });
      setTasks(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentUser.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartWork = async (taskId) => {
    try {
      await updateGrievance({ id: taskId, status: 'in_progress' });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setSubmitting(true);
    try {
      await updateGrievance({
        id: resolveModal.id,
        status: 'resolved',
        resolution_note: resolutionNote || 'Issue resolved by field worker'
      });
      setResolveModal(null);
      setResolutionNote('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const pending = tasks.filter(t => t.status !== 'resolved');
  const resolved = tasks.filter(t => t.status === 'resolved');

  return (
    <div data-testid="worker-dashboard">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <p className="text-xs text-[#8899AA] mb-1">Active Tasks</p>
          <p className="text-2xl font-bold text-[#1B2A4A]" data-testid="worker-active-count">{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <p className="text-xs text-[#8899AA] mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-600" data-testid="worker-resolved-count">{resolved.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <p className="text-xs text-[#8899AA] mb-1">Total</p>
          <p className="text-2xl font-bold text-[#5A6B80]">{tasks.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1B2A4A]">My Tasks</h3>
        <button onClick={loadData} data-testid="worker-refresh" className="p-2.5 rounded-full bg-white hover:bg-gray-100">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[#8899AA]">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-[#8899AA]">
            <Wrench size={36} className="mx-auto mb-3 text-[#CBD5E1]" />
            No tasks assigned to you yet
          </div>
        ) : tasks.map(task => {
          const s = STATUS_MAP[task.status] || STATUS_MAP.assigned;
          return (
            <div key={task.id} data-testid={`worker-task-${task.id}`}
              className="bg-white rounded-xl p-4 border border-[#E2E8F0] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
                  {task.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
                  {s.label}
                </span>
              </div>
              <p className="text-sm text-[#1B2A4A] mb-2">{task.description}</p>
              <p className="text-xs text-[#8899AA] mb-3">
                #{task.id} | {new Date(task.created_at).toLocaleDateString()}
                {task.resolution_note && ` | Note: ${task.resolution_note}`}
              </p>
              {task.status !== 'resolved' && (
                <div className="flex gap-2 pt-3 border-t border-[#F1F5F9]">
                  {task.status === 'assigned' && (
                    <button data-testid={`start-work-${task.id}`} onClick={() => handleStartWork(task.id)}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-1">
                      <Clock size={13} /> Start Work
                    </button>
                  )}
                  <button data-testid={`resolve-btn-${task.id}`} onClick={() => setResolveModal(task)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-1">
                    <CheckCircle2 size={13} /> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" data-testid="resolve-modal">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-1">Resolve Issue</h3>
            <p className="text-sm text-[#8899AA] mb-4">#{resolveModal.id}: {resolveModal.description?.slice(0, 80)}...</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5A6B80] mb-1.5 block">Resolution Note</label>
                <textarea data-testid="resolution-note-input" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                  rows={3} placeholder="What was done to resolve the issue..."
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-green-300 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setResolveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F7F8FA] text-[#5A6B80] text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button data-testid="resolve-confirm-btn" onClick={handleResolve} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                  {submitting ? 'Resolving...' : 'Confirm Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
