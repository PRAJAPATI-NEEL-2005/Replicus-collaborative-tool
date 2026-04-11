import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Components/Home';
import Editorpage from './Components/Editorpage';
import { Toaster } from 'react-hot-toast';
import Login from './Components/Login';
import Signup from './Components/Signup';
import { useContext } from 'react';
import AnalyticsDashboard from './Components/AnalyticsDashboard';
import { AuthContext } from './context/AuthContext';

function App() {
  const { token } = useContext(AuthContext);
  
  // Retrieve the user's role from local storage
  const role = localStorage.getItem("role");

  // Helper variable to determine where logged-in users should be redirected
  const defaultDashboard = role === "admin" ? "/analytics" : "/home";

  return (
    <>
      <div>
        <Toaster
          position="top-left"
          reverseOrder={false}
        />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 🔥 ROLE-BASED ADMIN ROUTE 🔥 */}
          {/* Checks if they are logged in AND have the admin role. 
              If logged in but NOT an admin, bounces them to /home.
              If not logged in at all, bounces to /login. */}
          <Route 
            path="/analytics" 
            element={
              token && role === "admin" ? <AnalyticsDashboard /> : 
              token && role !== "admin" ? <Navigate to="/home" /> : 
              <Navigate to="/login" />
            } 
          />

          {/* AUTH ROUTES */}
          {/* If already logged in, redirect them to their respective dashboard */}
          <Route 
            path="/login" 
            element={!token ? <Login /> : <Navigate to={defaultDashboard} />} 
          />
          <Route 
            path="/signup" 
            element={!token ? <Signup /> : <Navigate to={defaultDashboard} />} 
          />

          {/* NORMAL USER ROUTES */}
          <Route 
            path="/home" 
            element={token ? <Home /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/editor/:roomId" 
            element={token ? <Editorpage /> : <Navigate to="/login" />} 
          />
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;