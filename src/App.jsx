import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Web3Provider } from './contexts/Web3Context';
import Home from './pages/Home';
import Buyer from './pages/Buyer';
import Seller from './pages/Seller';
import Swap from './pages/Swap';
import Validator from './pages/Validator';

function App() {
  return (
    <Router>
      <Web3Provider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buyer" element={<Buyer />} />
            <Route path="/seller" element={<Seller />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/validator" element={<Validator />} />
          </Routes>
        </div>
      </Web3Provider>
    </Router>
  );
}

export default App;
