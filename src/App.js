import './App.css';
import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';
import Home from './Components/Home';
import Editorpage from './Components/Editorpage';
import {Toaster} from 'react-hot-toast';
import Login from './Components/Login';
import Signup from './Components/Signup';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
function App() {
  const { token } = useContext(AuthContext);

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
         <Route 
            path="/login" 
            element={!token ? <Login /> : <Navigate to="/home" />} 
          />
            <Route 
            path="/signup" 
            element={!token ? <Signup /> : <Navigate to="/home" />} 
          />
           <Route 
            path="/home" 
            element={token ? <Home /> : <Navigate to="/login" />} 
          />
  <Route 
            path="/editor/:roomId" 
            element={token ? <Editorpage /> : <Navigate to="/login" />} 
          />        </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
