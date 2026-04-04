import { useEffect, useState } from 'react';
import { analyticsAPI, inventoryAPI } from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Package,
} from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, trendRes, topRes, healthRes] = await Promise.allSettled([
          analyticsAPI.get(`/analytics/kpis/${storeId}?period=30d`),
          analyticsAPI.get(`/analytics/daily-trend/${storeId}?days=30`),
          analyticsAPI.get(`/analytics/top-products/${storeId}?limit=5&period=30d`),
          analyticsAPI.get(`/analytics/inventory-health/${storeId}`),
        ]);

        if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data);
        if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.trend || []);
        if (topRes.status === 'fulfilled') setTopProducts(topRes.value.data.top_products || []);
        if (healthRes.status === 'fulfilled') setHealthSummary(healthRes.value.data.summary || null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [storeId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  const rankColors = ['gold', 'silver', 'bronze', 'default', 'default'];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-icon blue"><DollarSign size={22} /></div>
          </div>
          <div className="kpi-value">
            ₹{(kpis?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-sub">Last 30 days</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Transactions</span>
            <div className="kpi-icon green"><ShoppingBag size={22} /></div>
          </div>
          <div className="kpi-value">{kpis?.total_transactions || 0}</div>
          <div className="kpi-sub">Completed orders</div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-label">Avg Basket</span>
            <div className="kpi-icon amber"><TrendingUp size={22} /></div>
          </div>
          <div className="kpi-value">
            ₹{(kpis?.avg_basket_size || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-sub">Per transaction</div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-header">
            <span className="kpi-label">Low Stock</span>
            <div className="kpi-icon red"><AlertTriangle size={22} /></div>
          </div>
          <div className="kpi-value">{healthSummary?.low_stock || 0}</div>
          <div className="kpi-sub">
            {healthSummary?.out_of_stock || 0} out of stock
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Healthy Stock</span>
            <div className="kpi-icon purple"><Package size={22} /></div>
          </div>
          <div className="kpi-value">{healthSummary?.healthy || 0}</div>
          <div className="kpi-sub">Products in good shape</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-grid">
        {/* Revenue Trend */}
        <div className="chart-panel">
          <h3><span className="chart-dot" /> Revenue Trend (30 Days)</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,80,130,0.15)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#556380', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(56,80,130,0.2)' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  tick={{ fill: '#556380', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(56,80,130,0.2)' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f1935',
                    border: '1px solid rgba(56,80,130,0.3)',
                    borderRadius: 8,
                    color: '#e8ecf4',
                    fontSize: 13,
                  }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>No sales data yet. Create a sale in the POS.</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="chart-panel">
          <h3><span className="chart-dot" /> Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="top-product-list">
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="top-product-item">
                  <div className={`top-product-rank ${rankColors[i]}`}>{i + 1}</div>
                  <div className="top-product-info">
                    <div className="top-product-name">{p.name}</div>
                    <div className="top-product-category">{p.category || 'Uncategorized'}</div>
                  </div>
                  <div className="top-product-qty">{p.total_qty_sold} sold</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <p>No product data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
