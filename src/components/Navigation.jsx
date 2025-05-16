import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav className="main-nav">
      <button 
        className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        Home
      </button>
      <button 
        className={`nav-button ${location.pathname === '/buyer' ? 'active' : ''}`}
        onClick={() => navigate('/buyer')}
      >
        Buyer
      </button>
      <button 
        className={`nav-button ${location.pathname === '/seller' ? 'active' : ''}`}
        onClick={() => navigate('/seller')}
      >
        Seller
      </button>
      <button 
        className={`nav-button ${location.pathname === '/swap' ? 'active' : ''}`}
        onClick={() => navigate('/swap')}
      >
        Swap
      </button>
      <button 
        className={`nav-button ${location.pathname === '/validator' ? 'active' : ''}`}
        onClick={() => navigate('/validator')}
      >
        Validator
      </button>
    </nav>
  );
};

export default Navigation;
