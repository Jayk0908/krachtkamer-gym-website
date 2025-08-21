import React, { useState, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import LoginModal from '../Components/cms/LoginModal';

const AdminAccess = () => {
  const { isAuthenticated, user } = useCMS();
  const [showLoginModal, setShowLoginModal] = useState(!isAuthenticated);

  useEffect(() => {
    // If already authenticated, redirect to main site with admin flag
    if (isAuthenticated) {
      // Set admin session flag
      localStorage.setItem('cmsAdminSession', 'true');
      
      // Redirect to main site after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            ✅
          </div>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
            Welcome, {user?.firstName}!
          </h2>
          <p style={{ margin: '0 0 20px 0', opacity: 0.9 }}>
            Admin access granted. Redirecting to main site...
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'white',
              borderRadius: '2px',
              animation: 'slideIn 2s ease-in-out'
            }} />
          </div>
          
          <style jsx>{`
            @keyframes slideIn {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 16px 0'
          }}>
            Krachtkamer CMS
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            margin: 0
          }}>
            Administrative Access Portal
          </p>
        </div>

        {/* Security Badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            Secure Access Required
          </h3>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
            This page is only accessible to authorized administrators
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={() => setShowLoginModal(true)}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '300px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
          }}
        >
          Access CMS Dashboard
        </button>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          fontSize: '12px',
          opacity: 0.7
        }}>
          <p>Krachtkamer Content Management System</p>
          <p>Unauthorized access is prohibited</p>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
};

export default AdminAccess;