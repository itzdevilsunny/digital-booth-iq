import { useState, useEffect, useCallback } from 'react';
import { getAnalytics } from '../../api';
import { BarChart3, Users, AlertTriangle, CheckCircle2, PhoneCall, Lightbulb, RefreshCw } from 'lucide-react';

export default function AnalystDashboard({ currentUser, boothId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnalytics(boothId);
      setStats(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="text-center py-20 text-[#8899AA]" data-testid="analyst-loading">Loading analytics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-[#8899AA]">Failed to load analytics</div>;
  }

  const sentTotal = Object.values(stats.sentiment_distribution).reduce((a, b) => a + b, 0);
  const sentPcts = Object.entries(stats.sentiment_distribution).map(([k, v]) => ({
    key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
  }));

  const SENTIMENT_COLORS = { positive: '#10B981', neutral: '#3B82F6', negative: '#EF4444' };

  return (
    <div data-testid="analyst-dashboard">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button onClick={loadData} data-testid="analyst-refresh" className="p-2.5 rounded-full bg-white hover:bg-gray-100">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Voters', value: stats.total_voters, icon: Users, color: '#3B82F6' },
          { label: 'Total Issues', value: stats.total_issues, icon: AlertTriangle, color: '#F59E0B' },
          { label: 'Resolved', value: stats.resolved_issues, icon: CheckCircle2, color: '#10B981' },
          { label: 'Total Calls', value: stats.total_calls, icon: PhoneCall, color: '#8B5CF6' },
        ].map(kpi => (
          <div key={kpi.label} data-testid={`kpi-${kpi.label.toLowerCase().replace(' ', '-')}`}
            className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1B2A4A]">{kpi.value}</p>
            <p className="text-xs text-[#8899AA]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Sentiment & Categories Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]" data-testid="sentiment-chart">
          <h4 className="font-semibold text-sm text-[#1B2A4A] mb-4">Voter Sentiment</h4>
          <div className="space-y-3">
            {sentPcts.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium" style={{ color: SENTIMENT_COLORS[s.key] }}>{s.key}</span>
                  <span className="text-[#8899AA]">{s.value} ({s.pct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, background: SENTIMENT_COLORS[s.key] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]" data-testid="category-chart">
          <h4 className="font-semibold text-sm text-[#1B2A4A] mb-4">Issue Categories</h4>
          {Object.keys(stats.category_breakdown).length === 0 ? (
            <p className="text-sm text-[#8899AA] text-center py-6">No issues reported yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.category_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const catColors = {
                    water: '#0EA5E9', road: '#8B5CF6', electricity: '#F59E0B',
                    sanitation: '#10B981', healthcare: '#EF4444', education: '#6366F1', other: '#6B7280'
                  };
                  const pct = stats.total_issues > 0 ? ((count / stats.total_issues) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize font-medium">{cat}</span>
                        <span className="text-[#8899AA]">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#F1F5F9] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: catColors[cat] || '#6B7280' }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] mb-6" data-testid="resolution-rate">
        <h4 className="font-semibold text-sm text-[#1B2A4A] mb-3">Resolution Rate</h4>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center"
            style={{
              borderColor: stats.total_issues > 0
                ? `${((stats.resolved_issues / stats.total_issues) * 100) > 60 ? '#10B981' : '#F59E0B'}`
                : '#E2E8F0'
            }}>
            <span className="text-xl font-bold text-[#1B2A4A]">
              {stats.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}%
            </span>
          </div>
          <div>
            <p className="text-sm text-[#1B2A4A]">{stats.resolved_issues} of {stats.total_issues} issues resolved</p>
            <p className="text-xs text-[#8899AA]">{stats.pending_issues} pending</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]" data-testid="ai-insights">
        <h4 className="font-semibold text-sm text-[#1B2A4A] mb-3 flex items-center gap-2">
          <Lightbulb size={16} className="text-[#FF6B00]" /> AI Insights
        </h4>
        <div className="space-y-2">
          {stats.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[#5A6B80] bg-[#FFF7ED] p-3 rounded-lg border border-orange-100">
              <span className="text-[#FF6B00] font-bold shrink-0">*</span>
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
