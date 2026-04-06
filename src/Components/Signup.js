import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react"; 
import toast from "react-hot-toast";
import logo from "./logo.png"; // Ensure the path matches your project structure

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 }
};

const Signup = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok && data.token) {
        login(data.token);
        toast.success("Account Created Successfully! 🚀");
        navigate("/home"); // Usually better to send them straight home if logged in
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
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
            <Col lg={4} md={6} sm={10} className="z-index-1">
              <motion.div initial="initial" animate="animate" variants={fadeInUp}>
                <Card className="glass-card shadow-2xl border-0">
                  <Card.Body className="p-5 text-center">
                    
                    <motion.img 
                      src={logo} 
                      alt="Replicus Logo" 
                      className="mb-4"
                      style={{ width: "90px" }}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />

                    <h2 className="fw-bold mb-1">Get Started</h2>
                    <p className="text-muted mb-4 small">Create your Replicus developer account.</p>

                    <Form onSubmit={handleSubmit}>
                      {/* Name Field */}
                      <Form.Group className="mb-3 text-start">
                        <Form.Label className="small fw-bold text-muted ps-1">Full Name</Form.Label>
                        <div className="custom-input-group d-flex align-items-center">
                          <User size={18} className="ms-3 text-muted" />
                          <Form.Control
                            type="text"
                            placeholder="John Doe"
                            className="custom-input"
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                          />
                        </div>
                      </Form.Group>

                      {/* Email Field */}
                      <Form.Group className="mb-3 text-start">
                        <Form.Label className="small fw-bold text-muted ps-1">Email Address</Form.Label>
                        <div className="custom-input-group d-flex align-items-center">
                          <Mail size={18} className="ms-3 text-muted" />
                          <Form.Control
                            type="email"
                            placeholder="name@example.com"
                            className="custom-input"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                          />
                        </div>
                      </Form.Group>

                      {/* Password Field */}
                      <Form.Group className="mb-4 text-start">
                        <Form.Label className="small fw-bold text-muted ps-1">Password</Form.Label>
                        <InputGroup className="custom-input-group">
                          <div className="d-flex align-items-center w-100">
                            <Lock size={18} className="ms-3 text-muted" />
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="custom-input"
                              onChange={(e) => setForm({ ...form, password: e.target.value })}
                              required
                            />
                            <Button 
                              variant="outline-secondary" 
                              className="password-toggle-btn"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Button>
                          </div>
                        </InputGroup>
                      </Form.Group>

                      <div className="d-grid">
                        <Button type="submit" className="btn-main py-2" disabled={loading}>
                          {loading ? <Spinner animation="border" size="sm" /> : "Create Account"}
                        </Button>
                      </div>
                    </Form>

                    <div className="mt-4">
                      <p className="text-muted small">
                        Already have an account?{" "}
                        <span className="gradient-text fw-bold" onClick={() => navigate("/login")} style={{ cursor: 'pointer' }}>
                          Log In
                        </span>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
          <footer className="text-center pb-4 text-muted small position-relative">
            Join the Replicus Network • Secure SSL Encryption
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
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            border-radius: 50%;
            z-index: 0;
            filter: blur(60px);
          }
          .blob-1 { top: -150px; left: -150px; }
          .blob-2 { bottom: -150px; right: -150px; background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, rgba(255, 255, 255, 0) 70%); }

          .glass-card {
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 28px;
          }

          .custom-input-group {
            background: rgba(241, 245, 249, 0.5);
            border-radius: 12px;
            transition: 0.3s ease;
            border: 2px solid transparent;
          }
          
          .custom-input-group:focus-within {
            background: white;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          }

          .custom-input {
            background: transparent !important;
            border: none !important;
            padding: 12px 10px !important;
            box-shadow: none !important;
          }

          .password-toggle-btn {
            background: transparent !important;
            border: none !important;
            color: #64748b !important;
            padding-right: 15px !important;
          }
          
          .password-toggle-btn:hover { color: #2563eb !important; }

          .btn-main {
            background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
            border: none !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
            transition: 0.3s;
          }
          .btn-main:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4); }

          .gradient-text {
            background: linear-gradient(90deg, #2563eb, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .z-index-1 { position: relative; z-index: 1; }
        `}</style>
      </div>
    </>
  );
};

export default Signup;