import React, { useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import { Container, Row, Col, Card, Form, Button, Dropdown, Spinner, Badge } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, ShieldCheck, Zap, Layers, MessageSquare, Monitor, Users } from "lucide-react"; 
import { AuthContext } from "../context/AuthContext";
import logo from "./logo.png";

const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000");

// Animation Variants
const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 }
};

function Home() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      const res = await fetch("http://localhost:5000/api/auth/getuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token 
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setUsername(data.name); 
      } else {
        handleLogout();
      }
    } catch (err) {
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getUser(); }, []);

  const handleLogout = () => {
const confirmLogout = window.confirm("Are you sure you want to log out?");
  
  if (!confirmLogout) return;

  logout();
  toast.success("Logged out successfully");
  navigate("/login");

  };

  const handleJoin = () => {
    if (!roomId || !username) {
      toast.error("Room ID and Username are required");
      return;
    }
    socket.emit("check-username", { roomId, username });
    socket.once("username-error", (message) => toast.error(message));
    socket.once("username-ok", () => {
      navigate(`/editor/${roomId}`, { state: { username } });
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Workspace Created!");
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
      
      <div className="main-wrapper">
        <div className="blob-bg blob-1"></div>
        <div className="blob-bg blob-2"></div>

        {/* --- NAV BAR --- */}
        <nav className="top-nav">
          <Container className="d-flex justify-content-between align-items-center h-100">
            <div className="brand-box">
              <img src={logo} alt="Logo" className="logo-img" />
              <span className="brand-text">REPLICUS</span>
            </div>

            <Dropdown align="end">
              <Dropdown.Toggle as="div" className="profile-trigger">
                <div className="avatar-wrapper">
                   {user ? user.name.charAt(0).toUpperCase() : <Spinner size="sm" variant="light" />}
                   <div className="online-indicator"></div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="glass-dropdown animate-dropdown border-0 shadow-xl">
                <div className="dropdown-header-custom">
                   <p className="user-name">{user?.name || "Initializing..."}</p>
                   <p className="user-email">{user?.email || "Fetching session..."}</p>
                </div>
                <Dropdown.Divider className="divider-custom" />
                <Dropdown.Item onClick={handleLogout} className="dropdown-item-custom text-danger">
                  <LogOut size={16} className="me-2" /> Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Container>
        </nav>

        <Container>
          <Row className="align-items-center justify-content-center min-vh-100 py-5">
            
            {/* LEFT: WORKSPACE CONTROL */}
            <Col lg={5} md={6} className="z-index-1">
              <motion.div initial="initial" animate="animate" variants={fadeInUp}>
                <Card className="main-card border-0">
                  <Card.Body className="p-5">
                    <div className="text-center mb-4">
                        <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">V2.4 Active</Badge>
                        <h3 className="fw-bold text-dark">Workspace</h3>
                        <p className="text-muted small">Synchronize with your team in real-time.</p>
                    </div>

                    <Form>
                      <Form.Group className="mb-3">
                        <div className="input-group-custom">
                           <Layers size={18} className="input-icon" />
                           <Form.Control
                            type="text" placeholder="Workspace ID" value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <div className="input-group-custom">
                           <User size={18} className="input-icon" />
                           <Form.Control
                            type="text" placeholder="Display Name" value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyUp={(e) => e.key === "Enter" && handleJoin()}
                          />
                        </div>
                      </Form.Group>

                      <div className="d-grid gap-3">
                        <Button onClick={handleJoin} className="btn-primary-custom">
                          Join Terminal
                        </Button>
                        <div className="or-divider">OR</div>
                        <Button onClick={handleCreate} className="btn-outline-custom">
                          <Zap size={16} className="me-2" /> Generate New ID
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            {/* RIGHT: WELCOME & FEATURES */}
            <Col lg={6} md={6} className="ps-lg-5 mt-5 mt-md-0 z-index-1">
               <motion.div initial="initial" animate="animate" variants={fadeInUp}>
                  <div className="welcome-section mb-4">
                     <h5 className="text-primary fw-bold mb-1">Welcome back,</h5>
                     <h1 className="display-4 fw-bold text-dark-emphasis mb-3">
                        {user ? user.name.split(' ')[0] : "Developer"}
                     </h1>
                     <p className="text-muted lead">Your collaborative coding environment is ready for the next deployment.</p>
                  </div>

                  <Row className="g-3">
                    {[
                      { title: "Real-time Sync", desc: "Sub-10ms latency.", icon: <Zap size={20}/> },
                      { title: "Contextual Chat", desc: "Chat while you code.", icon: <MessageSquare size={20}/> },
                      { title: "JDoodle Runtime", desc: "15+ languages.", icon: <Monitor size={20}/> },
                      { title: "Live Presence", desc: "Track teammates.", icon: <Users size={20}/> },
                    ].map((feat, idx) => (
                      <Col sm={6} key={idx}>
                        <FeatureCard icon={feat.icon} title={feat.title} desc={feat.desc} />
                      </Col>
                    ))}
                  </Row>
               </motion.div>
            </Col>
          </Row>
        </Container>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          :root {
            --pjs-font: 'Plus Jakarta Sans', sans-serif;
            --brand-blue: #2563eb;
            --brand-purple: #7c3aed;
          }

          .main-wrapper {
            background-color: #f8fafc;
            min-height: 100vh;
            font-family: var(--pjs-font);
            overflow-x: hidden;
          }

          /* --- Fixed Navigation --- */
          .top-nav {
            position: fixed;
            top: 0;
            width: 100%;
            height: 80px;
            z-index: 2000; /* Highest priority */
            background: rgba(248, 250, 252, 0.8);
            backdrop-filter: blur(10px);
          }

          .brand-box { display: flex; align-items: center; }
          .logo-img { width: 32px; height: auto; }
          .brand-text { font-weight: 800; font-size: 1.2rem; letter-spacing: 2px; margin-left: 10px; background: linear-gradient(90deg, var(--brand-blue), var(--brand-purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

          /* --- Avatar & Profile --- */
          .avatar-wrapper {
            width: 44px; height: 44px;
            background: linear-gradient(135deg, var(--brand-blue), var(--brand-purple));
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; cursor: pointer;
            position: relative; box-shadow: 0 8px 20px -5px rgba(37, 99, 235, 0.4);
            transition: 0.3s;
          }
          .avatar-wrapper:hover { transform: translateY(-2px); }
          .online-indicator { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: #10b981; border: 2px solid #f8fafc; border-radius: 50%; }

          .glass-dropdown {
            z-index: 3000 !important;
            padding: 12px !important;
            border-radius: 20px !important;
            background: white !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
            margin-top: 15px !important;
          }
          .dropdown-header-custom { padding: 8px 12px; }
          .user-name { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.95rem; }
          .user-email { color: #64748b; font-size: 0.75rem; margin: 0; }
          .dropdown-item-custom { padding: 10px 15px !important; font-size: 0.85rem; border-radius: 12px !important; transition: 0.2s; font-weight: 500; }
          .dropdown-item-custom:hover { background: #f1f5f9 !important; color: var(--brand-blue) !important; }

          /* --- Workspace Card --- */
          .main-card {
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 1) !important;
            border-radius: 32px;
            box-shadow: 0 30px 60px -12px rgba(0,0,0,0.08);
          }

          .input-group-custom {
            display: flex; align-items: center; background: #f1f5f9;
            border-radius: 16px; padding: 5px 15px; border: 2px solid transparent;
            transition: 0.3s;
          }
          .input-group-custom:focus-within { background: white; border-color: var(--brand-blue); box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
          .input-icon { color: #94a3b8; margin-right: 12px; }
          .input-group-custom input { border: none !important; background: transparent !important; padding: 10px 0 !important; font-weight: 500; font-size: 0.95rem; }
          .input-group-custom input:focus { box-shadow: none !important; }

          .btn-primary-custom {
            background: linear-gradient(90deg, var(--brand-blue), var(--brand-purple)) !important;
            border: none !important; border-radius: 16px !important; padding: 14px !important;
            font-weight: 700 !important; transition: 0.3s; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
          }
          .btn-primary-custom:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5); }

          .btn-outline-custom {
            border: 2px solid #e2e8f0 !important; color: #64748b !important;
            border-radius: 16px !important; padding: 12px !important; font-weight: 600 !important; background: transparent !important;
          }
          .btn-outline-custom:hover { border-color: var(--brand-blue) !important; color: var(--brand-blue) !important; }

          .or-divider { display: flex; align-items: center; text-align: center; color: #94a3b8; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; margin: 10px 0; }
          .or-divider::before, .or-divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
          .or-divider::before { margin-right: 1.5em; } .or-divider::after { margin-left: 1.5em; }

          /* --- Right Side UI --- */
          .feature-card-custom {
            background: white; border-radius: 20px; padding: 20px;
            border: 1px solid #f1f5f9; transition: 0.3s;
          }
          .feature-card-custom:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.04); }
          .icon-box { width: 40px; height: 40px; background: #eff6ff; color: var(--brand-blue); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }

          /* --- Background Decorations --- */
          .blob-bg { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.4; }
          .blob-1 { top: -200px; left: -100px; background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%); }
          .blob-2 { bottom: -200px; right: -100px; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); }
          .z-index-1 { position: relative; z-index: 1; }
        `}</style>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card-custom h-100">
      <div className="icon-box">{icon}</div>
      <h6 className="fw-bold text-dark mb-1">{title}</h6>
      <p className="text-muted small mb-0">{desc}</p>
    </div>
  );
}

export default Home;