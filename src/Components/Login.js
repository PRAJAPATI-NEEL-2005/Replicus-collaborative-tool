import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, Key, ArrowLeft, Zap, Users, BarChart3 } from "lucide-react"; 
import toast from "react-hot-toast";
import logo from "./logo.png";

// Animation Variants
const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.2 }
  }
};

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_BACKEND_URL; 

  // --- Unified View State ---
  // Views: 'LOGIN', 'SIGNUP', 'FORGOT_PASSWORD', 'VERIFY_RESET_OTP', 'NEW_PASSWORD', 'VERIFY_SIGNUP_OTP'
  const [currentView, setCurrentView] = useState('LOGIN'); 
  
  // --- Form States ---
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Helper to safely switch views and clear sensitive mid-step data
  const switchView = (view) => {
    setOtp("");
    setShowPassword(false);
    setShowNewPassword(false);
    setCurrentView(view);
  };

  // ==========================================
  //               LOGIN FLOW
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill in all fields");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        login(data.token);
        const userRole = data.user?.role || "user";
        localStorage.setItem("role", userRole);
        toast.success("Welcome back to Replicus! 🚀");
        if (userRole === "admin") navigate("/analytics"); 
        else navigate("/home");      
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  // ==========================================
  //               SIGNUP FLOW
  // ==========================================
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("All fields are required");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("OTP sent to your email! 📩");
        switchView('VERIFY_SIGNUP_OTP');
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Verification successful! Please log in. 🚀");
        switchView('LOGIN'); 
      } else {
        toast.error(data.error || "Invalid or expired OTP");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  // ==========================================
  //          PASSWORD RESET FLOW
  // ==========================================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Please enter your email address");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Reset OTP sent to your email! 📩");
        switchView('VERIFY_RESET_OTP');
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Please enter a valid 6-character OTP");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("OTP Verified. Please enter a new password.");
        switchView('NEW_PASSWORD');
      } else {
        toast.error(data.error || "Invalid or expired OTP");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Password updated successfully! You can now log in.");
        setForm({ ...form, password: "" });
        setNewPassword("");
        switchView('LOGIN'); 
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err) { toast.error("Server connection failed"); } 
    finally { setLoading(false); }
  };

  const features = [
    { icon: <Zap size={24} />, title: "Lightning Fast Performance", desc: "Experience zero latency in your daily workflow." },
    { icon: <ShieldCheck size={24} />, title: "Enterprise-Grade Security", desc: "Your data is encrypted and protected 24/7." },
    { icon: <BarChart3 size={24} />, title: "Advanced Analytics", desc: "Gain actionable insights with real-time dashboards." },
    { icon: <Users size={24} />, title: "Seamless Collaboration", desc: "Work together with your team without boundaries." }
  ];

  const isSignupFlow = currentView === 'SIGNUP' || currentView === 'VERIFY_SIGNUP_OTP';

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
      
      <div className="main-wrapper">
        <Row className="m-0 min-vh-100">
          
          {/* ================= LEFT PANEL (FEATURES) ================= */}
          <Col lg={6} className="d-none d-lg-flex flex-column feature-panel position-relative p-5">
            <div className="feature-bg-overlay"></div>
            <div className="feature-grid-pattern"></div>
            
            <div className="position-relative z-index-1 d-flex flex-column h-100">
              <div className="mb-auto">
                <div className="d-flex align-items-center gap-3">
                  <motion.img 
                    src={logo} 
                    alt="Replicus Logo" 
                    style={{ width: "85px", filter: "drop-shadow(0 0 15px rgba(96, 165, 250, 0.4))" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  />
                  <h2 className="text-white fw-bold mb-0 tracking-tight">Replicus</h2>
                </div>
              </div>

              <div className="py-5">
                <motion.h1 
                  key={isSignupFlow ? "signup-title" : "login-title"}
                  className="text-white fw-bold display-4 mb-4"
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                  style={{ lineHeight: "1.1" }}
                >
                  {isSignupFlow ? "Join the" : "Elevate your"} <br />
                  <span className="text-highlight">Digital Workspace.</span>
                </motion.h1>
                
                <motion.p className="text-white-50 fs-5 mb-5" variants={fadeInUp} initial="initial" animate="animate">
                  Everything you need to manage, scale, and secure your infrastructure in one unified platform.
                </motion.p>

                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="d-flex flex-column gap-4">
                  {features.map((item, idx) => (
                    <motion.div key={idx} variants={fadeInUp} className="d-flex align-items-start gap-3 feature-item">
                      <div className="feature-icon-box">{item.icon}</div>
                      <div>
                        <h5 className="text-white fw-semibold mb-1">{item.title}</h5>
                        <p className="text-white-50 mb-0 small">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="mt-auto pt-4 text-white-50 small">
                © {new Date().getFullYear()} Replicus Inc. All rights reserved.
              </div>
            </div>
          </Col>

          {/* ================= RIGHT PANEL (AUTH FORMS) ================= */}
          <Col lg={6} xs={12} className="auth-panel d-flex align-items-center justify-content-center p-4 position-relative">
            
            <div className="ambient-blob blob-top-right"></div>
            <div className="ambient-blob blob-bottom-left"></div>
            <div className="ambient-blob blob-center"></div>

            <div className="w-100 position-relative z-index-1" style={{ maxWidth: "460px" }}>
              
              {/* Mobile Logo */}
              <div className="d-lg-none text-center mb-4">
                 <motion.img 
                    src={logo} alt="Replicus Logo" style={{ width: "90px" }}
                    animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}
                  />
              </div>

              <Card className="glass-card border-0 overflow-hidden">
                <Card.Body className="p-5 text-center position-relative">
                  
                  <AnimatePresence mode="wait">
                    
                    {/* ===== 1. LOGIN VIEW ===== */}
                    {currentView === 'LOGIN' && (
                      <motion.div key="login" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <h2 className="fw-bold mb-2 text-dark">Welcome Back</h2>
                        <p className="text-muted mb-4 small">Login to access your Replicus terminal.</p>

                        <Form onSubmit={handleLoginSubmit}>
                          <Form.Group className="mb-3 text-start">
                            <Form.Label className="small fw-bold text-muted ps-1">Email Address</Form.Label>
                            <Form.Control
                              type="email" placeholder="name@example.com" className="custom-input"
                              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                            />
                          </Form.Group>

                          <Form.Group className="mb-4 text-start">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <Form.Label className="small fw-bold text-muted ps-1 mb-0">Password</Form.Label>
                              <span 
                                className="small fw-bold text-main-blue cursor-pointer" 
                                style={{ fontSize: "0.75rem" }} onClick={() => switchView('FORGOT_PASSWORD')}
                              >
                                Forgot password?
                              </span>
                            </div>
                            <InputGroup className="custom-input-group">
                              <Form.Control
                                type={showPassword ? "text" : "password"} placeholder="Enter your password"
                                className="custom-input border-end-0"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                              />
                              <Button variant="outline-secondary" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </Button>
                            </InputGroup>
                          </Form.Group>

                          <div className="d-grid mt-3">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Sign In to Workspace"}
                            </Button>
                          </div>
                        </Form>

                        <div className="mt-4 pt-3 border-top border-light">
                          <p className="text-muted small mb-0">
                            Don't have an account?{" "}
                            <span className="gradient-text fw-bold cursor-pointer ms-1" onClick={() => switchView('SIGNUP')}>
                              Create one now
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ===== 2. SIGNUP VIEW ===== */}
                    {currentView === 'SIGNUP' && (
                      <motion.div key="signup" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <h2 className="fw-bold mb-2 text-dark">Get Started</h2>
                        <p className="text-muted mb-4 small">Create your Replicus developer account.</p>

                        <Form onSubmit={handleSignupSubmit}>
                          <Form.Group className="mb-3 text-start">
                            <Form.Label className="small fw-bold text-muted ps-1">Full Name</Form.Label>
                            <div className="custom-input-group d-flex align-items-center">
                              <User size={18} className="ms-3 text-muted" />
                              <Form.Control
                                type="text" placeholder="John Doe" className="custom-input"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                              />
                            </div>
                          </Form.Group>

                          <Form.Group className="mb-3 text-start">
                            <Form.Label className="small fw-bold text-muted ps-1">Email Address</Form.Label>
                            <div className="custom-input-group d-flex align-items-center">
                              <Mail size={18} className="ms-3 text-muted" />
                              <Form.Control
                                type="email" placeholder="name@example.com" className="custom-input"
                                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                              />
                            </div>
                          </Form.Group>

                          <Form.Group className="mb-4 text-start">
                            <Form.Label className="small fw-bold text-muted ps-1">Password</Form.Label>
                            <InputGroup className="custom-input-group">
                              <div className="d-flex align-items-center w-100">
                                <Lock size={18} className="ms-3 text-muted" />
                                <Form.Control
                                  type={showPassword ? "text" : "password"} placeholder="Create a strong password"
                                  className="custom-input border-end-0"
                                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                                />
                                <Button variant="outline-secondary" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                              </div>
                            </InputGroup>
                          </Form.Group>

                          <div className="d-grid mt-3">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Continue to Verification"}
                            </Button>
                          </div>
                        </Form>

                        <div className="mt-4 pt-3 border-top border-light">
                          <p className="text-muted small mb-0">
                            Already have an account?{" "}
                            <span className="gradient-text fw-bold cursor-pointer ms-1" onClick={() => switchView('LOGIN')}>
                              Log In
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ===== 3. VERIFY SIGNUP OTP ===== */}
                    {currentView === 'VERIFY_SIGNUP_OTP' && (
                      <motion.div key="verify-signup" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper"><ShieldCheck size={32} className="text-main-blue" /></div>
                        </div>
                        <h2 className="fw-bold mb-1 text-dark">Verify Email</h2>
                        <p className="text-muted mb-4 small">We sent a 6-digit code to <br/><span className="fw-bold text-dark">{form.email}</span></p>

                        <Form onSubmit={handleVerifySignupOtp}>
                          <Form.Group className="mb-4 text-center">
                            <Form.Control
                              type="text" maxLength="6" placeholder="000000" className="custom-input otp-input"
                              value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} required autoFocus
                            />
                          </Form.Group>
                          <div className="d-grid gap-3">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Verify & Complete Setup"}
                            </Button>
                            <Button variant="link" className="text-muted small text-decoration-none d-flex align-items-center justify-content-center" onClick={() => switchView('SIGNUP')} disabled={loading}>
                              <ArrowLeft size={16} className="me-2" /> Wrong email? Go back
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                    {/* ===== 4. FORGOT PASSWORD REQUEST ===== */}
                    {currentView === 'FORGOT_PASSWORD' && (
                      <motion.div key="forgot-password" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper"><Key size={32} className="text-main-blue" /></div>
                        </div>
                        <h2 className="fw-bold mb-1 text-dark">Reset Password</h2>
                        <p className="text-muted mb-4 small">Enter your email and we'll send a code.</p>

                        <Form onSubmit={handleForgotPassword}>
                          <Form.Group className="mb-4 text-start">
                            <div className="custom-input-group d-flex align-items-center">
                              <Mail size={18} className="ms-3 text-muted" />
                              <Form.Control
                                type="email" placeholder="name@example.com" className="custom-input"
                                value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required autoFocus
                              />
                            </div>
                          </Form.Group>
                          <div className="d-grid gap-3">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Send Reset Link"}
                            </Button>
                            <Button variant="link" className="text-muted small text-decoration-none" onClick={() => switchView('LOGIN')} disabled={loading}>
                              <ArrowLeft size={16} className="me-2" /> Back to Login
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                    {/* ===== 5. VERIFY RESET OTP ===== */}
                    {currentView === 'VERIFY_RESET_OTP' && (
                      <motion.div key="verify-reset" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper"><ShieldCheck size={32} className="text-main-blue" /></div>
                        </div>
                        <h2 className="fw-bold mb-1 text-dark">Enter OTP</h2>
                        <p className="text-muted mb-4 small">Sent to <span className="fw-bold text-dark">{resetEmail}</span></p>

                        <Form onSubmit={handleVerifyResetOtp}>
                          <Form.Group className="mb-4 text-center">
                            <Form.Control
                              type="text" maxLength="6" placeholder="000000" className="custom-input otp-input"
                              value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} required autoFocus
                            />
                          </Form.Group>
                          <div className="d-grid gap-3">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Verify Code"}
                            </Button>
                            <Button variant="link" className="text-muted small text-decoration-none" onClick={() => switchView('FORGOT_PASSWORD')} disabled={loading}>
                              <ArrowLeft size={16} className="me-2" /> Wrong email? Go back
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                    {/* ===== 6. CREATE NEW PASSWORD ===== */}
                    {currentView === 'NEW_PASSWORD' && (
                      <motion.div key="new-password" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
                        <div className="mb-4 d-flex justify-content-center">
                           <div className="icon-shield-wrapper"><Lock size={32} className="text-main-blue" /></div>
                        </div>
                        <h2 className="fw-bold mb-1 text-dark">New Password</h2>
                        <p className="text-muted mb-4 small">Your identity has been verified.</p>

                        <Form onSubmit={handleResetPassword}>
                          <Form.Group className="mb-4 text-start">
                            <InputGroup className="custom-input-group">
                              <div className="d-flex align-items-center w-100">
                                <Lock size={18} className="ms-3 text-muted" />
                                <Form.Control
                                  type={showNewPassword ? "text" : "password"} placeholder="Enter new password" className="custom-input border-end-0"
                                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoFocus minLength="6"
                                />
                                <Button variant="outline-secondary" className="password-toggle-btn" onClick={() => setShowNewPassword(!showNewPassword)}>
                                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                              </div>
                            </InputGroup>
                          </Form.Group>
                          <div className="d-grid">
                            <Button type="submit" className="btn-main py-3" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" /> : "Update Password"}
                            </Button>
                          </div>
                        </Form>
                      </motion.div>
                    )}

                  </AnimatePresence>

                </Card.Body>
              </Card>

              <div className="text-center mt-5 text-muted small d-lg-none">
                Built with ❤️ • Replicus Security Active
              </div>

            </div>
          </Col>
        </Row>

        {/* --- GLOBAL STYLES --- */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          .main-wrapper {
            background-color: #f8fafc; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden;
          }

          .feature-panel { background-color: #0b1121; border-right: 1px solid rgba(255, 255, 255, 0.05); }

          .feature-bg-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.25) 0%, rgba(11, 17, 33, 0) 50%),
                        radial-gradient(circle at 90% 80%, rgba(124, 58, 237, 0.15) 0%, rgba(11, 17, 33, 0) 50%); z-index: 0;
          }

          .feature-grid-pattern {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 32px 32px; z-index: 0;
          }

          .text-highlight {
            background: linear-gradient(135deg, #60a5fa, #c084fc, #60a5fa); background-size: 200% auto;
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: textShine 4s linear infinite;
          }
          @keyframes textShine { to { background-position: 200% center; } }

          .feature-item { padding: 14px; border-radius: 18px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; cursor: default; }
          .feature-item:hover { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); transform: translateX(12px); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
          .feature-icon-box {
            background: rgba(37, 99, 235, 0.15); color: #60a5fa; width: 52px; height: 52px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center; border: 1px solid rgba(96, 165, 250, 0.2); box-shadow: inset 0 2px 10px rgba(96, 165, 250, 0.1);
          }

          .auth-panel {
            background-color: #f4f7fb; position: relative; overflow: hidden;
            background-image: radial-gradient(at 80% 0%, hsla(228,100%,74%,0.15) 0px, transparent 40%), radial-gradient(at 0% 50%, hsla(263,100%,74%,0.12) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(210,100%,74%,0.15) 0px, transparent 40%);
          }

          .ambient-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; z-index: 0; animation: float 10s ease-in-out infinite alternate; }
          .blob-top-right { width: 300px; height: 300px; top: -50px; right: -50px; background: rgba(96, 165, 250, 0.2); }
          .blob-bottom-left { width: 400px; height: 400px; bottom: -100px; left: -100px; background: rgba(167, 139, 250, 0.2); animation-delay: -5s; }
          .blob-center { width: 250px; height: 250px; top: 40%; left: 30%; background: rgba(56, 189, 248, 0.15); animation-delay: -2s; }
          @keyframes float { 0% { transform: translateY(0px) scale(1); } 100% { transform: translateY(30px) scale(1.05); } }

          .glass-card {
            background: rgba(255, 255, 255, 0.75) !important; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.8) !important; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }

          .custom-input-group { background: rgba(241, 245, 249, 0.7); border-radius: 14px; overflow: hidden; transition: all 0.3s ease; border: 2px solid transparent; }
          .custom-input-group:focus-within { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); }
          .custom-input { background: transparent !important; border: none !important; padding: 16px 18px !important; box-shadow: none !important; font-size: 0.95rem; color: #1e293b; }
          .custom-input::placeholder { color: #94a3b8; }
          
          .otp-input { text-align: center; font-size: 2rem !important; letter-spacing: 0.75rem; font-weight: 800; background: rgba(241, 245, 249, 0.8) !important; border-radius: 16px !important; padding: 20px !important; }
          .otp-input:focus { background: #ffffff !important; border: 2px solid #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important; }

          .icon-shield-wrapper {
             width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
             border: 1px solid rgba(59, 130, 246, 0.2); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.1);
          }

          .password-toggle-btn { background: transparent !important; border: none !important; color: #64748b !important; padding-right: 18px !important; transition: 0.2s; }
          .password-toggle-btn:hover { color: #3b82f6 !important; }
          .text-main-blue { color: #3b82f6; }
          .cursor-pointer { cursor: pointer; transition: 0.2s; }
          .cursor-pointer:hover { opacity: 0.8; }

          .btn-main {
            background: linear-gradient(135deg, #2563eb, #4f46e5) !important; border: none !important; border-radius: 14px !important; font-weight: 600 !important;
            box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.4); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 1rem !important;
          }
          .btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -4px rgba(37, 99, 235, 0.5); }
          .btn-main:active { transform: translateY(0px); }
          .gradient-text { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .z-index-1 { position: relative; z-index: 1; }
        `}</style>
      </div>
    </>
  );
};

export default Login;