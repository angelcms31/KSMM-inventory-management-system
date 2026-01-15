import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';

const Sidebar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  // Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Artisan', path: '/artisan' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Audit Logs', path: '/audit-logs' },
    { name: 'Users', path: '/users' },
  ];

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: '#292929',
    color: 'white',
    width: '250px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    position: 'fixed',
    left: 0,
    top: 0
  };

  return (
    <div style={sidebarStyle}>
      {/* Header Section */}
      <div style={{ marginBottom: '30px', borderBottom: '1px solid #444', paddingBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Welcome back, Name</h3>
        <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
          Last Update: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* NavLinks */}
      <nav style={{ flexGrow: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menuItems.map((item) => (
            <li key={item.name} style={{ marginBottom: '10px' }}>
              <Link
                to={item.path}
                style={{
                  color: location.pathname === item.path ? '#fff' : '#bbb',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  display: 'block',
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: location.pathname === item.path ? '#3d3d3d' : 'transparent'
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div style={{ borderTop: '1px solid #444', paddingTop: '20px' }}>
        <button 
          onClick={() => console.log('Logging out...')}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4d4d',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '10px'
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;