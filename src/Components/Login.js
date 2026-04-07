import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Key, ArrowLeft } from "lucide-react"; 
import toast from "react-hot-toast";
import logo from "./logo.png";

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.4 }
};

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Multi-step state: 1 = Login, 2 = Forgot Pass Email, 3 = Verify OTP, 4 = Reset Pass
  const [step, setStep] = useState(1); 
  
  // Form states
  const [form, setForm] = useState({ email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- STEP 1: Handle Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok && data.token) {
        login(data.token);
        toast.success("Welcome back to Replicus! 🚀");
        navigate("/home");
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch (err) {
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: Handle Forgot Password (Send OTP) ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Reset OTP sent to your email! 📩");
        setStep(3);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: Verify Reset OTP ---
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-character OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("OTP Verified. Please enter a new password.");
        setStep(4);
      } else {
        toast.error(data.error || "Invalid or expired OTP");
      }
    } catch (err) {
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 4: Reset Password ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Password updated successfully! You can now log in.");
        setStep(1); // Go back to login
        setForm({ ...form, password: "" }); // Clear old password
        setOtp("");
        setNewPassword("");
      } else {
        toast.error(data.error || "Failed to reset password");
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
        <div className="blob-bg blob-1"></div>
        <div className="blob-bg blob-2"></div>

        <Container>
          <Row className="align-items-center justify-content-center min-vh-100 py-5">
            <Col lg={4} md={6} sm={10} className="z-index-1">
              <Card className="glass-card shadow-2xl border-0 overflow-hidden">
                <Card.Body className="p-5 text-center position-relative">
                  
                  <motion.img 
                    src={logo} 
                    alt="Replicus Logo" 
                    className="mb-4"
                    style={{ width: "90px" }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />

                  <AnimatePresence mode="wait">
                    
                    {/* ===== STEP 1: LOGIN ===== */}
                    {step === 1 && (
                      <motion.div key="step1" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <h2 className="fw-bold mb-2">Welcome Back</h2>
                        <p className="text-muted mb-4 small">Login to access your Replicus terminal.</p>

                        <Form onSubmit={handleLoginSubmit}>
                          <Form.Group className="mb-3 text-start">
                            <Form.Label className="small fw-bold text-muted ps-1">Email Address</Form.Label>
                            <Form.Control
                              type="email" placeholder="name@example.com" className="custom-input"
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-4 text-start">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <Form.Label className="small fw-bold text-muted ps-1 mb-0">Password</Form.Label>
                              <span 
                                className="small text-primary fw-bold" 
                                style={{ cursor: "pointer", fontSize: "0.75rem" }}
                                onClick={() => setStep(2)}
                              >
                                Forgot password?
                              </span>
                            </div>
                            <InputGroup className="custom-input-group">
                              <Form.Control
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="custom-input border-end-0"
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                              />
                              <Button 
                                variant="outline-secondary" className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </Button>
                            </InputGroup>
                          </Form.Group>

                          <div className="d-grid">
                            <Button type="submit" className="btn-main py-2" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Sign In to Workspace"}
                            </Button>
                          </div>
                        </Form>

                        <div className="mt-4">
                          <p className="text-muted small">
                            Don't have an account?{" "}
                            <span className="gradient-text fw-bold" onClick={() => navigate("/signup")} style={{ cursor: 'pointer' }}>
                              Sign Up
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ===== STEP 2: FORGOT PASSWORD REQUEST ===== */}
                    {step === 2 && (
                      <motion.div key="step2" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper">
                              <Key size={32} className="text-primary" />
                           </div>
                        </div>
                        <h2 className="fw-bold mb-1">Reset Password</h2>
                        <p className="text-muted mb-4 small">Enter your email and we'll send a code.</p>

                        <Form onSubmit={handleForgotPassword}>
                          <Form.Group className="mb-4 text-start">
                            <div className="custom-input-group d-flex align-items-center">
                              <Mail size={18} className="ms-3 text-muted" />
                              <Form.Control
                                type="email" placeholder="name@example.com" className="custom-input"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required autoFocus
                              />
                            </div>
                          </Form.Group>
                          <div className="d-grid gap-3">
                            <Button type="submit" className="btn-main py-2" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Send Reset Link"}
                            </Button>
                            <Button variant="link" className="text-muted small text-decoration-none" onClick={() => setStep(1)} disabled={loading}>
                              <ArrowLeft size={16} className="me-2" /> Back to Login
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                    {/* ===== STEP 3: OTP VERIFICATION ===== */}
                    {step === 3 && (
                      <motion.div key="step3" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper">
                              <ShieldCheck size={32} className="text-primary" />
                           </div>
                        </div>
                        <h2 className="fw-bold mb-1">Enter OTP</h2>
                        <p className="text-muted mb-4 small">Sent to <span className="fw-bold text-dark">{resetEmail}</span></p>

                        <Form onSubmit={handleVerifyResetOtp}>
                          <Form.Group className="mb-4 text-center">
                            <Form.Control
                              type="text" maxLength="6" placeholder="Enter 6-digit code" className="custom-input otp-input"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} 
                              required autoFocus
                            />
                          </Form.Group>
                          <div className="d-grid gap-3">
                            <Button type="submit" className="btn-main py-2" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Verify Code"}
                            </Button>
                            <Button variant="link" className="text-muted small text-decoration-none" onClick={() => setStep(2)} disabled={loading}>
                              <ArrowLeft size={16} className="me-2" /> Wrong email? Go back
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                    {/* ===== STEP 4: CREATE NEW PASSWORD ===== */}
                    {step === 4 && (
                      <motion.div key="step4" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper">
                              <Lock size={32} className="text-primary" />
                           </div>
                        </div>
                        <h2 className="fw-bold mb-1">New Password</h2>
                        <p className="text-muted mb-4 small">Your identity has been verified.</p>

                        <Form onSubmit={handleResetPassword}>
                          <Form.Group className="mb-4 text-start">
                            <InputGroup className="custom-input-group">
                              <div className="d-flex align-items-center w-100">
                                <Lock size={18} className="ms-3 text-muted" />
                                <Form.Control
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter new password"
                                  className="custom-input border-end-0"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required autoFocus minLength="6"
                                />
                                <Button 
                                  variant="outline-secondary" className="password-toggle-btn"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                              </div>
                            </InputGroup>
                          </Form.Group>
                          <div className="d-grid">
                            <Button type="submit" className="btn-main py-2" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Update Password"}
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                  </AnimatePresence>

                </Card.Body>
              </Card>
            </Col>
          </Row>
          <footer className="text-center pb-4 text-muted small position-relative">
            Built with ❤️ • Replicus Security Protocol Active
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
            position: absolute; width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            border-radius: 50%; z-index: 0; filter: blur(60px);
          }
          .blob-1 { top: -150px; right: -150px; }
          .blob-2 { bottom: -150px; left: -150px; background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, rgba(255, 255, 255, 0) 70%); }

          .glass-card {
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 28px;
          }

          .custom-input-group {
            background: rgba(241, 245, 249, 0.5);
            border-radius: 12px; overflow: hidden;
            transition: 0.3s ease; border: 2px solid transparent;
          }
          .custom-input-group:focus-within {
            background: white; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          }
          .custom-input {
            background: transparent !important; border: none !important;
            padding: 12px 15px !important; box-shadow: none !important;
          }

          .otp-input {
            text-align: center; font-size: 1.5rem !important;
            letter-spacing: 0.5rem; font-weight: 700;
            background: rgba(241, 245, 249, 0.8) !important; border-radius: 12px !important;
          }
          .otp-input:focus {
            background: white !important; border: 2px solid #2563eb !important;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
          }

          .icon-shield-wrapper {
             width: 64px; height: 64px; border-radius: 50%;
             background: rgba(37, 99, 235, 0.1);
             display: flex; align-items: center; justify-content: center;
          }

          .password-toggle-btn {
            background: transparent !important; border: none !important;
            color: #64748b !important; padding-right: 15px !important; transition: 0.2s;
          }
          .password-toggle-btn:hover { color: #2563eb !important; }

          .btn-main {
            background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
            border: none !important; border-radius: 12px !important; font-weight: 600 !important;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); transition: 0.3s;
          }
          .btn-main:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4); }

          .gradient-text { background: linear-gradient(90deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .z-index-1 { position: relative; z-index: 1; }
        `}</style>
      </div>
    </>
  );
};

export default Login;