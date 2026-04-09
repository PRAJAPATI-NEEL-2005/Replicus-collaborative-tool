import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";
import { LayoutDashboard, FolderKanban, Users, X, MessageSquare, Terminal, Activity } from "lucide-react";

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 🔥 NEW: Navigation state
  const [activeInfo, setActiveInfo] = useState(null);
  
  // State for all dashboard endpoints
  const [data, setData] = useState({
    overview: { totalUsers: 0, totalRooms: 0, totalMessages: 0, totalCodeRuns: 0 },
    roomJoins: [],
    roomVolume: [],
    roomCodeRuns: [],
    recentSessions: []
  });

  // State for the specific room drill-down (Modal)
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomActivity, setRoomActivity] = useState([]);
  const [roomCodeActivity, setRoomCodeActivity] = useState([]); 
  const [loadingActivity, setLoadingActivity] = useState(false);

  // State for the search filter
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedRoom) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedRoom]);

  const toggleInfo = (e, id) => {
    e.stopPropagation();
    setActiveInfo(activeInfo === id ? null : id);
  };

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

  // 🔥 TAB RENDERER
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="fade-in">
            {/* KPI CARDS */}
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
                    {activeInfo === 'joins' && <div className="info-popover">Visualizes the total number of users connected to each room.</div>}
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
                    {activeInfo === 'volume' && <div className="info-popover">Displays the top 10 most active rooms based on chat volume.</div>}
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
                    {activeInfo === 'code' && <div className="info-popover">Shows the top 10 rooms where code is executed the most.</div>}
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
          </div>
        );

      case "rooms":
        return (
          <div className="fade-in tables-grid">
            <div className="table-card">
              <h6 className="card-heading">Top Rooms by Joins</h6>
              <p className="text-muted small mb-3">Click a row to view user activity</p>
              <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Room ID</th><th className="text-right">Total Joins</th></tr></thead>
                  <tbody>
                    {data.roomJoins.map((r, i) => (
                      <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                        <td><span className="code-badge">{r._id}</span></td>
                        <td className="text-right fw-bold text-blue">{r.totalUsersJoined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-card">
              <h6 className="card-heading">Top Rooms by Messages</h6>
              <p className="text-muted small mb-3">Click a row to view user activity</p>
              <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Room ID</th><th className="text-right">Total Messages</th></tr></thead>
                  <tbody>
                    {data.roomVolume.map((r, i) => (
                      <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                        <td><span className="code-badge">{r._id}</span></td>
                        <td className="text-right fw-bold text-green">{r.totalMessages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-card">
              <h6 className="card-heading">Top Rooms by Code Runs</h6>
              <p className="text-muted small mb-3">Click a row to view user activity</p>
              <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Room ID</th><th className="text-right">Total Executions</th></tr></thead>
                  <tbody>
                    {data.roomCodeRuns.map((r, i) => (
                      <tr key={i} onClick={() => fetchRoomActivity(r._id)} className="clickable-row">
                        <td><span className="code-badge">{r._id}</span></td>
                        <td className="text-right fw-bold text-orange">{r.totalRuns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "sessions":
        return (
          <div className="fade-in table-card user-activity-card" style={{ minHeight: "60vh" }}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <h6 className="card-heading no-border mb-0 d-flex align-items-center gap-2">
                Audit Log
                <span className="badge bg-light text-dark border fw-normal py-1 px-2">Click row to drill down</span>
              </h6>
              <div className="search-wrapper">
                <input 
                  type="text" 
                  className="dashboard-search-input" 
                  placeholder="Filter by user, email, or room..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
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
                        <div className="fw-semibold text-dark">{new Date(session.joinedAt).toLocaleDateString()}</div>
                        <div className="text-muted small">{new Date(session.joinedAt).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{session.username || "Anonymous"}</div>
                        {session.email && <div className="text-muted small">{session.email}</div>}
                      </td>
                      <td><span className="code-badge">{session.roomId}</span></td>
                      <td className="text-right fw-bold text-green">{session.messagesSent || 0}</td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No sessions found matching your criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        
        {/* HEADER & NAVBAR */}
        <div className="dashboard-header-wrapper">
          <header className="dashboard-header">
            <h2 className="dashboard-title"><Activity className="title-icon"/> System Analytics</h2>
            <p className="dashboard-subtitle">Monitor platform performance, rooms, and code executions</p>
          </header>

          <nav className="dashboard-nav">
            <button 
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} /> Overview
            </button>
            <button 
              className={`nav-btn ${activeTab === 'rooms' ? 'active' : ''}`} 
              onClick={() => setActiveTab('rooms')}
            >
              <FolderKanban size={18} /> Workspaces
            </button>
            <button 
              className={`nav-btn ${activeTab === 'sessions' ? 'active' : ''}`} 
              onClick={() => setActiveTab('sessions')}
            >
              <Users size={18} /> Session Logs
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="dashboard-content">
          {renderTabContent()}
        </div>

        {/* 🔥 PROPER MODAL FOR DRILL DOWN */}
        {selectedRoom && (
          <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
            <div className="modal-content-box fade-in-up" onClick={(e) => e.stopPropagation()}>
              
              <div className="modal-header">
                <div>
                  <h4 className="modal-title">Workspace Deep Dive</h4>
                  <p className="modal-subtitle">Room ID: <span className="code-badge">{selectedRoom}</span></p>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedRoom(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                {loadingActivity ? (
                  <div className="text-center py-5"><div className="css-spinner inline-spinner"></div></div>
                ) : (
                  <div className="drilldown-grid">
                    
                    {/* Chat Activity Box */}
                    <div className="drilldown-section border rounded p-4 bg-white shadow-sm">
                      <h6 className="d-flex align-items-center gap-2 mb-3 text-dark">
                        <MessageSquare size={18} className="text-primary"/> Chat Activity
                      </h6>
                      <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
                        <table className="data-table">
                          <thead><tr><th>User</th><th className="text-right">Messages</th></tr></thead>
                          <tbody>
                            {roomActivity.map((u, i) => (
                              <tr key={i}>
                                <td>
                                  <div className="fw-semibold text-dark">{u.username || "Unknown User"}</div>
                                  {u.email && <div className="text-muted small">{u.email}</div>}
                                </td>
                                <td className="text-right fw-bold text-primary">{u.messagesSent}</td>
                              </tr>
                            ))}
                            {roomActivity.length === 0 && <tr><td colSpan="2" className="text-center text-muted py-3">No messages found.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Code Activity Box */}
                    <div className="drilldown-section border rounded p-4 bg-white shadow-sm">
                      <h6 className="d-flex align-items-center gap-2 mb-3 text-dark">
                        <Terminal size={18} className="text-orange"/> Code Executions
                      </h6>
                      <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
                        <table className="data-table">
                          <thead><tr><th>User</th><th>Languages</th><th className="text-right">Runs</th></tr></thead>
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
            </div>
          </div>
        )}

      </div>

      {/* CORE CSS STYLES */}
      <style>{`
        /* Global & Layout */
        .admin-dashboard { background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; padding: 2rem 1rem; }
        .dashboard-container { max-width: 1300px; margin: 0 auto; }
        
        /* Headers & Nav */
        .dashboard-header-wrapper { margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
        .dashboard-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.02em; }
        .title-icon { color: #3b82f6; }
        .dashboard-subtitle { font-size: 0.95rem; color: #64748b; margin: 0 0 1.5rem 0; }
        
        .dashboard-nav { display: flex; gap: 1.5rem; }
        .nav-btn { background: none; border: none; font-size: 0.95rem; font-weight: 600; color: #64748b; padding: 0.5rem 0; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-btn:hover { color: #0f172a; }
        .nav-btn.active { color: #2563eb; border-bottom-color: #2563eb; }
        
        /* Animations */
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Typography & Utils */
        .card-heading { font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; }
        .card-heading.no-border { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .fw-bold { font-weight: 700; }
        .fw-semibold { font-weight: 600; }
        .small { font-size: 0.75rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        
        .text-blue { color: #3b82f6; }
        .text-purple { color: #8b5cf6; }
        .text-green { color: #10b981; }
        .text-orange { color: #f97316; }
        .text-primary { color: #2563eb; }
        .text-muted { color: #64748b; }
        .text-dark { color: #0f172a; }
        
        /* Cards & Grids */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .tables-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        
        .kpi-card, .chart-card, .table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .kpi-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 0.5rem 0; letter-spacing: 0.05em; }
        .kpi-value { font-size: 2rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
        
        /* Charts */
        .chart-wrapper { height: 280px; width: 100%; margin-top: 1rem; }
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
        .icon-btn { background: none; border: none; font-size: 1.25rem; font-weight: bold; color: #94a3b8; cursor: pointer; padding: 0 0.5rem; border-radius: 4px; }
        .icon-btn:hover { color: #0f172a; background: #f1f5f9; }
        
        .info-menu-container { position: relative; }
        .info-popover { position: absolute; right: 0; top: 30px; width: 220px; background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.4; z-index: 50; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
        .chart-tooltip { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .tooltip-label { font-weight: 600; color: #0f172a; margin: 0 0 8px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
        .tooltip-data { margin: 0 0 4px 0; font-size: 0.875rem; }

        /* Tables */
        .table-responsive::-webkit-scrollbar { width: 6px; }
        .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { padding: 0.75rem 1rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; background: #fff; z-index: 10; letter-spacing: 0.05em; }
        .data-table td { padding: 0.875rem 1rem; color: #334155; font-size: 0.875rem; border-bottom: 1px solid #f8fafc; }
        .clickable-row { cursor: pointer; transition: background 0.2s; }
        .clickable-row:hover { background-color: #f8fafc; }
        
        .code-badge { background-color: #f1f5f9; color: #475569; padding: 0.25rem 0.5rem; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; border: 1px solid #e2e8f0; }
        .lang-badge { background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .dashboard-search-input { width: 100%; min-width: 300px; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.875rem; outline: none; transition: all 0.2s; background: #f8fafc; }
        .dashboard-search-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

        /* 🔥 MODAL STYLES */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 1rem; }
        .modal-content-box { background: #f8fafc; width: 100%; max-width: 1000px; max-height: 90vh; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; overflow: hidden; }
        .fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .modal-header { padding: 1.5rem 2rem; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .modal-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem 0; }
        .modal-subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }
        .modal-close-btn { background: #f1f5f9; color: #64748b; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s; }
        .modal-close-btn:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        
        .modal-body { padding: 2rem; overflow-y: auto; background: #f8fafc; flex-grow: 1; }
        .drilldown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

        /* Loading */
        .loader-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .css-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        .inline-spinner { width: 24px; height: 24px; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 992px) {
          .drilldown-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .charts-grid { grid-template-columns: 1fr; }
          .dashboard-nav { overflow-x: auto; padding-bottom: 0.5rem; }
          .modal-body { padding: 1rem; }
          .modal-header { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;