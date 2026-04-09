import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeInfo, setActiveInfo] = useState(null);
  
  // State for all dashboard endpoints
  const [data, setData] = useState({
    overview: { totalUsers: 0, totalRooms: 0, totalMessages: 0, totalCodeRuns: 0 },
    roomJoins: [],
    roomVolume: [],
    roomCodeRuns: [],
    recentSessions: []
  });

  // State for the specific room drill-down
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomActivity, setRoomActivity] = useState([]);
  const [roomCodeActivity, setRoomCodeActivity] = useState([]); 
  const [loadingActivity, setLoadingActivity] = useState(false);

  // 🔥 NEW: State for the search filter
  const [searchTerm, setSearchTerm] = useState("");

  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", "auth-token": token };

  const fetchDashboardData = async () => {
    try {
      const [overview, roomJoins, roomVolume, roomCodeRuns, recentSessions] = await Promise.all([
        fetch(`${base}/api/analytics/overview`, { headers }).then(r => r.json()),
        fetch(`${base}/api/analytics/rooms/joins`, { headers }).then(r => r.json()),
        fetch(`${base}/api/analytics/rooms/volume`, { headers }).then(r => r.json()),
        fetch(`${base}/api/analytics/rooms/code-runs`, { headers }).then(r => r.json()),
        fetch(`${base}/api/analytics/recent-sessions`, { headers }).then(r => r.json())
      ]);

      setData({ overview, roomJoins, roomVolume, roomCodeRuns, recentSessions });
    } catch (err) {
      toast.error("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomActivity = async (roomId) => {
    setSelectedRoom(roomId);
    setLoadingActivity(true);
    try {
      const [chatData, codeData] = await Promise.all([
        fetch(`${base}/api/analytics/rooms/${roomId}/user-activity`, { headers }).then(r => r.json()),
        fetch(`${base}/api/analytics/rooms/${roomId}/code-activity`, { headers }).then(r => r.json())
      ]);
      
      setRoomActivity(chatData);
      setRoomCodeActivity(codeData);
    } catch (err) {
      toast.error("Failed to load room activity");
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveInfo(null);
    if (activeInfo) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeInfo]);

  const toggleInfo = (e, id) => {
    e.stopPropagation();
    setActiveInfo(activeInfo === id ? null : id);
  };

  // 🔥 NEW: Filter logic for the sessions table
  const filteredSessions = data.recentSessions.filter(session => {
    const search = searchTerm.toLowerCase();
    const usernameMatch = (session.username || "Anonymous").toLowerCase().includes(search);
    const emailMatch = (session.email || "").toLowerCase().includes(search);
    const roomMatch = (session.roomId || "").toLowerCase().includes(search);
    return usernameMatch || emailMatch || roomMatch;
  });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="css-spinner"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">Room: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-data" style={{ color: entry.color }}>
              {entry.name}: <span className="fw-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        
        <header className="dashboard-header">
          <h2 className="dashboard-title">System Analytics</h2>
          <p className="dashboard-subtitle">Overview of users, rooms, message activity, and code executions</p>
        </header>

        {/* BASIC OVERVIEW (KPI CARDS) */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <h6 className="kpi-title">Total Users</h6>
            <h4 className="kpi-value text-blue">{data.overview.totalUsers || 0}</h4>
          </div>
          <div className="kpi-card">
            <h6 className="kpi-title">Total Unique Rooms</h6>
            <h4 className="kpi-value text-purple">{data.overview.totalRooms || 0}</h4>
          </div>
          <div className="kpi-card">
            <h6 className="kpi-title">Total Messages Sent</h6>
            <h4 className="kpi-value text-green">{data.overview.totalMessages || 0}</h4>
          </div>
          <div className="kpi-card">
            <h6 className="kpi-title">Total Code Executions</h6>
            <h4 className="kpi-value text-orange">{data.overview.totalCodeRuns || 0}</h4>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="charts-grid">
          
          <div className="chart-card">
            <div className="card-header-flex">
              <h6 className="card-heading no-border">Users Per Room</h6>
              <div className="info-menu-container">
                <button className="icon-btn" onClick={(e) => toggleInfo(e, 'joins')}>⋮</button>
                {activeInfo === 'joins' && (
                  <div className="info-popover"><strong>Room Joins Info:</strong> Visualizes the total number of users who have connected to each specific room, sorted by popularity.</div>
                )}
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roomJoins.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: "Room ID", position: "insideBottom", offset: -15, fill: "#64748b", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="totalUsersJoined" name="Users Joined" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header-flex">
              <h6 className="card-heading no-border">High Volume Rooms (Messages)</h6>
              <div className="info-menu-container">
                <button className="icon-btn" onClick={(e) => toggleInfo(e, 'volume')}>⋮</button>
                {activeInfo === 'volume' && (
                  <div className="info-popover"><strong>Message Volume Info:</strong> Displays the top 10 most active rooms based strictly on the total number of messages sent inside them.</div>
                )}
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roomVolume} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: "Room ID", position: "insideBottom", offset: -15, fill: "#64748b", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="totalMessages" name="Total Messages" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header-flex">
              <h6 className="card-heading no-border">Top Rooms by Code Runs</h6>
              <div className="info-menu-container">
                <button className="icon-btn" onClick={(e) => toggleInfo(e, 'code')}>⋮</button>
                {activeInfo === 'code' && (
                  <div className="info-popover"><strong>Code Runs Info:</strong> Shows the top 10 rooms where code is executed the most frequently.</div>
                )}
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roomCodeRuns} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: "Room ID", position: "insideBottom", offset: -15, fill: "#64748b", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="totalRuns" name="Code Executions" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* TABLES GRID (Top 10s) */}
        <div className="tables-grid">
          
          <div className="table-card">
            <h6 className="card-heading">Top Rooms by Joins</h6>
            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Room ID</th><th className="text-right">Total Joins</th></tr></thead>
                <tbody>
                  {data.roomJoins.map((r, i) => (
                    <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                      <td><span className="code-badge">{r._id}</span></td>
                      <td className="text-right fw-bold text-blue">{r.totalUsersJoined}</td>
                    </tr>
                  ))}
                  {data.roomJoins.length === 0 && <tr><td colSpan="2" className="text-center text-muted">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card">
            <h6 className="card-heading">Top Rooms by Messages</h6>
            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Room ID</th><th className="text-right">Total Messages</th></tr></thead>
                <tbody>
                  {data.roomVolume.map((r, i) => (
                    <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                      <td><span className="code-badge">{r._id}</span></td>
                      <td className="text-right fw-bold text-green">{r.totalMessages}</td>
                    </tr>
                  ))}
                  {data.roomVolume.length === 0 && <tr><td colSpan="2" className="text-center text-muted">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card">
            <h6 className="card-heading">Top Rooms by Code Runs</h6>
            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Room ID</th><th className="text-right">Total Executions</th></tr></thead>
                <tbody>
                  {data.roomCodeRuns.map((r, i) => (
                    <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                      <td><span className="code-badge">{r._id}</span></td>
                      <td className="text-right fw-bold text-orange">{r.totalRuns}</td>
                    </tr>
                  ))}
                  {data.roomCodeRuns.length === 0 && <tr><td colSpan="2" className="text-center text-muted">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MASTER USER SESSION LOGS WITH FILTER */}
        <div className="table-card mt-4 user-activity-card">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
            <h6 className="card-heading no-border mb-0 d-flex align-items-center gap-2">
              Global Session Logs 
              <span className="badge bg-light text-dark border fw-normal py-1 px-2">Click row to drill down</span>
            </h6>
            
            {/* 🔥 NEW: The Search Filter Input */}
            <div className="search-wrapper">
              <input 
                type="text" 
                className="dashboard-search-input" 
                placeholder="Filter by user, email, or room ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Pilot (User)</th>
                  <th>Room ID</th>
                  <th className="text-right">Messages Sent</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session, i) => (
                  <tr key={i} onClick={() => fetchRoomActivity(session.roomId)} className="clickable-row">
                    <td>
                      <div className="fw-semibold text-dark">
                        {new Date(session.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="text-muted small">
                        {new Date(session.joinedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{session.username || "Anonymous"}</div>
                      {session.email && <div className="text-muted small">{session.email}</div>}
                    </td>
                    <td><span className="code-badge">{session.roomId}</span></td>
                    <td className="text-right fw-bold text-green">{session.messagesSent || 0}</td>
                  </tr>
                ))}
                
                {/* Handled Empty States depending on search or total data */}
                {data.recentSessions.length > 0 && filteredSessions.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-5 text-muted">No sessions found matching "{searchTerm}".</td></tr>
                )}
                {data.recentSessions.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-5 text-muted">No sessions logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DRILL DOWN MODAL/SECTION */}
        {selectedRoom && (
          <div className="table-card mt-4 border-primary border-top" style={{ borderTopWidth: "4px" }}>
            <h6 className="card-heading d-flex justify-content-between align-items-center">
              <span>Deep Dive: Room <span className="text-blue">{selectedRoom}</span></span>
              <button className="btn-close-custom" onClick={() => setSelectedRoom(null)}>✕ Close</button>
            </h6>
            
            {loadingActivity ? (
              <div className="text-center py-4"><div className="css-spinner inline-spinner"></div></div>
            ) : (
              <div className="drilldown-grid">
                
                {/* Chat Activity Box */}
                <div className="drilldown-section">
                  <h6 className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>💬 Chat Activity</h6>
                  <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    <table className="data-table">
                      <thead><tr><th>User</th><th className="text-right">Messages Sent</th></tr></thead>
                      <tbody>
                        {roomActivity.map((u, i) => (
                          <tr key={i}>
                            <td>
                              <div className="fw-semibold text-dark">{u.username || "Unknown User"}</div>
                              {u.email && <div className="text-muted small">{u.email}</div>}
                            </td>
                            <td className="text-right fw-bold text-green">{u.messagesSent}</td>
                          </tr>
                        ))}
                        {roomActivity.length === 0 && <tr><td colSpan="2" className="text-center text-muted py-3">No messages found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Code Activity Box */}
                <div className="drilldown-section border-start ps-4">
                  <h6 className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>⚡ Code Execution Activity</h6>
                  <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    <table className="data-table">
                      <thead><tr><th>User</th><th>Languages</th><th className="text-right">Executions</th></tr></thead>
                      <tbody>
                        {roomCodeActivity.map((u, i) => (
                          <tr key={i}>
                            <td>
                              <div className="fw-semibold text-dark">{u._id || "Unknown User"}</div>
                              {u.email && <div className="text-muted small">{u.email}</div>}
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {u.languagesUsed?.map(lang => (
                                  <span key={lang} className="lang-badge">{lang}</span>
                                ))}
                              </div>
                            </td>
                            <td className="text-right fw-bold text-orange">{u.totalExecutions}</td>
                          </tr>
                        ))}
                        {roomCodeActivity.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-3">No code executions found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* CORE CSS STYLES */}
      <style>{`
        .admin-dashboard { background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; padding: 2rem 1rem; }
        .dashboard-container { max-width: 1400px; margin: 0 auto; }
        
        .dashboard-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem 0; }
        .dashboard-subtitle { font-size: 0.875rem; color: #64748b; margin: 0 0 2rem 0; }
        .card-heading { font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; }
        .card-heading.no-border { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .fw-bold { font-weight: 700; }
        .fw-semibold { font-weight: 600; }
        .small { font-size: 0.75rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        
        .text-blue { color: #3b82f6; }
        .text-purple { color: #8b5cf6; }
        .text-green { color: #10b981; }
        .text-orange { color: #f97316; }
        .text-muted { color: #64748b; }
        .text-dark { color: #0f172a; }
        
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
        .info-menu-container { position: relative; }
        .icon-btn { background: none; border: none; font-size: 1.25rem; font-weight: bold; color: #94a3b8; cursor: pointer; padding: 0 0.5rem; border-radius: 4px; }
        .icon-btn:hover { color: #0f172a; background: #f1f5f9; }
        .info-popover { position: absolute; right: 0; top: 30px; width: 220px; background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.4; z-index: 50; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .tables-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .drilldown-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; }
        
        .kpi-card, .chart-card, .table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .kpi-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 0.5rem 0; }
        .kpi-value { font-size: 2rem; font-weight: 700; margin: 0; }
        
        .chart-wrapper { height: 280px; width: 100%; }
        .chart-tooltip { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .tooltip-label { font-weight: 600; color: #0f172a; margin: 0 0 8px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
        .tooltip-data { margin: 0 0 4px 0; font-size: 0.875rem; }

        .table-responsive::-webkit-scrollbar { width: 6px; }
        .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { padding: 0.75rem 1rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; background: #fff; z-index: 10; }
        .data-table td { padding: 0.875rem 1rem; color: #334155; font-size: 0.875rem; border-bottom: 1px solid #f8fafc; }
        .clickable-row { cursor: pointer; transition: background 0.2s; }
        .clickable-row:hover { background-color: #f1f5f9; }
        
        .code-badge { background-color: #f1f5f9; color: #475569; padding: 0.25rem 0.5rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; border: 1px solid #e2e8f0; }
        .lang-badge { background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* 🔥 NEW: Filter styling */
        .dashboard-search-input { width: 100%; min-width: 280px; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .dashboard-search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .btn-close-custom { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-close-custom:hover { background: #e2e8f0; color: #0f172a; }

        .loader-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .css-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        .inline-spinner { width: 24px; height: 24px; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 992px) {
          .drilldown-grid { grid-template-columns: 1fr; }
          .border-start { border-left: none !important; padding-left: 0 !important; margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
        }
        @media (max-width: 768px) {
          .charts-grid { grid-template-columns: 1fr; }
          .dashboard-search-input { min-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;