import React, { useState } from "react";

import io from "socket.io-client";

import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "./logo.png";

// Animation Variants
const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};


const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000");


function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId || !username) {
      toast.error("Room ID and Username are required");
      return;
    }
    socket.emit("check-username", { roomId, username });

  socket.once("username-error", (message) => {
    toast.error(message);
  });

  socket.once("username-ok", () => {
    navigate(`/editor/${roomId}`, { state: { username } });
  });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("New Workspace Created! 🚀");
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
      
      <div className="main-wrapper">
        {/* Animated Background Blobs */}
        <div className="blob-bg blob-1"></div>
        <div className="blob-bg blob-2"></div>

        <Container>
          <Row className="align-items-center justify-content-center min-vh-100 py-5">
            
            {/* LEFT SIDE - LOGIN CARD */}
            <Col lg={5} md={6} sm={12} className="z-index-1">
              <motion.div initial="initial" animate="animate" variants={fadeInUp}>
                <Card className="glass-card shadow-2xl border-0">
                  <Card.Body className="p-5 text-center">
                    <motion.img 
                      src={logo} 
                      alt="Logo" 
                      className="mb-4"
                      style={{ width: "120px" }}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />

                    <p className="text-muted mb-4 small">Collaborative Coding Reimagined.</p>

                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Workspace ID"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="custom-input"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Control
                          type="text"
                          placeholder="Your Name"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="custom-input"
                          onKeyUp={(e) => e.key === "Enter" && handleJoin()}
                        />
                      </Form.Group>

                      <div className="d-grid gap-3">
                        <Button onClick={handleJoin} className="btn-main py-2">
                          Join Workspace
                        </Button>
                        <div className="separator text-muted">or</div>
                        <Button variant="link" onClick={handleCreate} className="btn-secondary-custom">
                          Create New Workspace
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            {/* RIGHT SIDE - FEATURES */}
            <Col lg={6} md={6} className="ps-lg-5 mt-5 mt-md-0 z-index-1">
              <motion.div initial="initial" animate="animate" variants={staggerContainer}>
                <motion.h1 variants={fadeInUp} className="display-5 fw-bold mb-4 text-dark-emphasis">
                  Build together, <br /> 
                  <span className="gradient-text">anywhere.</span>
                </motion.h1>

                <Row className="g-3">
                  {[
                    { title: "⚡ Real-time Sync", desc: "Global edge-sync technology." },
                    { title: "💬 Team Chat", desc: "Contextual chat in-editor." },
                    { title: "▶ Execution", desc: "Instant JDoodle runtime." },
                    { title: "🌍 Multi-lang", desc: "15+ Languages supported." },
                    {title:"👥 Live Cursor Tracking",desc:"See where teammates are editing."},
                    {title:"🔁 I/O Sync",
                    desc: "Synchronized I/P and O/P sharing."
                    }
                  ].map((feat, idx) => (
                    <Col sm={6} key={idx}>
                      <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }}>
                        <FeatureCard title={feat.title} desc={feat.desc} />
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            </Col>
          </Row>

          <footer className="text-center pb-4 text-muted small">
            Built with ❤️ • Powered by Socket.io
          </footer>
        </Container>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');

          .main-wrapper {
            background-color: #f8fafc;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }

          .blob-bg {
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            border-radius: 50%;
            z-index: 0;
            filter: blur(50px);
          }

          .blob-1 { top: -100px; right: -100px; }
          .blob-2 { bottom: -100px; left: -100px; }

          .glass-card {
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4) !important;
            border-radius: 24px;
          }

          .gradient-text {
            background: linear-gradient(90deg, #2563eb, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .custom-input {
            background: rgba(241, 245, 249, 0.5);
            border: 2px solid transparent;
            border-radius: 12px;
            padding: 12px;
            transition: 0.3s;
          }

          .custom-input:focus {
            background: white;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          }

          .btn-main {
            background: linear-gradient(90deg, #2563eb, #4f46e5);
            border: none;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
            transition: 0.3s;
          }

          .btn-main:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
          }

          .btn-secondary-custom {
            color: #64748b;
            text-decoration: none;
            font-weight: 600;
          }

          .btn-secondary-custom:hover {
            color: #2563eb;
          }

          .separator {
            display: flex;
            align-items: center;
            text-align: center;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .separator::before, .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #e2e8f0;
          }

          .separator:not(:empty)::before { margin-right: 1em; }
          .separator:not(:empty)::after { margin-left: 1em; }

          .z-index-1 { position: relative; z-index: 1; }
        `}</style>
      </div>
    </>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <Card className="border-0 shadow-sm p-3 h-100" style={{ borderRadius: "20px" }}>
      <Card.Body className="p-2">
        <h6 className="fw-bold mb-1">{title}</h6>
        <p className="text-muted small mb-0">{desc}</p>
      </Card.Body>
    </Card>
  );
}

export default Home;