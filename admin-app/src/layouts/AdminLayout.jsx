import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, MessageSquare,
  Tag, Package, BarChart2, TrendingUp, TrendingDown, Bell, Menu, X, ChevronRight, LogOut, Settings, ShieldCheck, Sparkles
} from 'lucide-react';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { getLowStockAlerts } from '../services/adminService';
import logo from '../assets/images/logo.png';

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { admin, logout } = useContext(AdminAuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getLowStockAlerts(10)
      .then(data => setLowStockCount(data.count || 0))
      .catch(() => {});
  }, [activeTab]);

  const navSections = [
    {
      label: 'MAIN',
      items: [
        { id: 'overview',   label: 'Dashboard',       icon: <LayoutDashboard size={17} /> },
        { id: 'products',   label: 'Products',        icon: <ShoppingBag size={17} /> },
        { id: 'categories', label: 'Categories',      icon: <Tag size={17} /> },
        { id: 'inventory',  label: 'Inventory',       icon: <Package size={17} />, badge: lowStockCount > 0 ? lowStockCount : null },
        { id: 'orders',     label: 'Orders',          icon: <ShoppingCart size={17} /> },
        { id: 'customers',  label: 'Customers',       icon: <Users size={17} /> },
        { id: 'reviews',    label: 'Reviews',         icon: <MessageSquare size={17} /> },
        { id: 'festival-sales', label: 'Festival Sales',  icon: <Sparkles size={17} /> }
      ]
    },
    {
      label: 'ANALYTICS',
      items: [
        { id: 'reports',      label: 'Sales Reports',     icon: <BarChart2 size={17} /> },
        { id: 'top-selling',  label: 'Top Selling',       icon: <TrendingUp size={17} /> },
        { id: 'least-selling',label: 'Least Selling',     icon: <TrendingDown size={17} /> },
        { id: 'low-stock',    label: 'Low Stock Alerts',  icon: <Bell size={17} />, badge: lowStockCount > 0 ? lowStockCount : null, badgeType: 'danger' }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings size={17} /> }
      ]
    }
  ];

  const currentLabel = navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fb' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '250px' : '0px',
        flexShrink: 0,
        backgroundColor: '#2D1B69',
        color: '#fff',
        overflow: 'hidden',
        transition: 'width 0.28s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        borderRight: '1px solid rgba(155,89,214,0.25)'
      }}>
        {/* Sidebar Header Brand */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(155,89,214,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          whiteSpace: 'nowrap'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #9B59D6, #4A7C59)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(155,89,214,0.4)'
          }}>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>E</span>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>EVAAS ADMIN</div>
            <div style={{ fontSize: '0.72rem', color: '#C79AF0' }}>Seller & Operations Hub</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.85rem' }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#9B59D6', letterSpacing: '1.5px', padding: '0 0.75rem', marginBottom: '8px' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '3px',
                      backgroundColor: isActive ? 'rgba(155,89,214,0.25)' : 'transparent',
                      color: isActive ? '#E2C8FF' : '#C4B5D8',
                      border: isActive ? '1px solid rgba(155,89,214,0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: isActive ? '700' : '500',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(155,89,214,0.12)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        padding: '0 6px',
                        backgroundColor: item.badgeType === 'danger' ? '#ef4444' : '#f59e0b',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User info */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(155,89,214,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1A0E42',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#fff',
              flexShrink: 0
            }}>
              {admin?.name ? admin.name.charAt(0) : 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f3f4f6', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {admin?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Super Admin</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Bar Header */}
        <header style={{
          padding: '0.9rem 2rem',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                padding: '6px',
                display: 'flex',
                borderRadius: '6px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
              <span>Seller Central</span>
              <ChevronRight size={12} />
              <span style={{ fontWeight: '700', color: '#111827' }}>{currentLabel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('low-stock')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.8rem'
                }}
              >
                <Bell size={14} />
                {lowStockCount} Low Stock Alert{lowStockCount > 1 ? 's' : ''}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: '#e5e7eb' }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Tab Content Canvas */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%' }}>
          {children}
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
