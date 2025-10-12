import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import Login from './pages/LoginPage.jsx';
import Register from './pages/RegisterPage.jsx';

function App() {

  return (
    //<AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    //</AuthProvider>
  )
}

export default App
