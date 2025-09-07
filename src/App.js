import './App.css';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Home from './Components/Home';
import Editorpage from './Components/Editorpage';
function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/> 
        <Route path='/editor/:roomId' element={<Editorpage/>}/>   
        </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
