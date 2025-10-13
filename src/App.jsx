import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from '../src/pages/RegisterPage.jsx';

function App() {

  return (
    //<AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    //</AuthProvider>
  )
}

export default App
