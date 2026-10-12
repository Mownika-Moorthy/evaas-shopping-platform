import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Edit2, Check, X, AlertTriangle, PackageX, Package } from 'lucide-react';
import { getInventory, updateInventoryStock } from '../services/adminService';

/**
 * InventoryTab — Dedicated Inventory Management
 * Displays product inventory with SKU, stock status, units sold.
 * Allows inline stock quantity editing with threshold-based status detection.
 */
const InventoryTab = ({ showToast, backendUrl }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [threshold, setThreshold] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [categories, setCategories] = useState([]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { threshold };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.stockStatus = statusFilter;
      const data = await getInventory(params);
      setInventory(data.inventory);
      // Extract unique categories
      const cats = [...new Set(data.inventory.map(i => i.category))].filter(Boolean);
      setCategories(cats);
    } catch (err) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, threshold]);

  const [editSizeStockMap, setEditSizeStockMap] = useState({});

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleEditStock = (item) => {
    setEditingId(item._id);
    const map = {};
    if (item.sizeStock && item.sizeStock.length > 0) {
      item.sizeStock.forEach(s => {
        map[s.size] = s.stock;
      });
    } else {
      const sizes = item.sizes?.length ? item.sizes : ['Free Size'];
      sizes.forEach(s => { map[s] = Math.floor(item.stock / sizes.length); });
    }
    setEditSizeStockMap(map);
  };

  const handleSaveStock = async (id) => {
    const sizeStockArray = Object.entries(editSizeStockMap).map(([size, stock]) => ({
      size,
      stock: Math.max(0, parseInt(stock, 10) || 0)
    }));
    const total = sizeStockArray.reduce((acc, curr) => acc + curr.stock, 0);

    try {
      await updateInventoryStock(id, { sizeStock: sizeStockArray, stock: total });
      showToast('Inventory stock updated successfully!', 'success');
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update stock', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditSizeStockMap({});
  };

  const getStatusBadge = (status) => {
    const styles = {
      'In Stock': { bg: '#d1fae5', color: '#065f46', icon: <Package size={12} /> },
      'Low Stock': { bg: '#fef3c7', color: '#78350f', icon: <AlertTriangle size={12} /> },
      'Out of Stock': { bg: '#fee2e2', color: '#7f1d1d', icon: <PackageX size={12} /> }
    };
    const s = styles[status] || styles['In Stock'];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px',
        backgroundColor: s.bg, color: s.color,
        fontSize: '0.75rem', fontWeight: '600'
      }}>
        {s.icon} {status}
      </span>
    );
  };

  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  const totalInStock = inventory.filter(i => i.stockStatus === 'In Stock').length;
  const totalLowStock = inventory.filter(i => i.stockStatus === 'Low Stock').length;
  const totalOutOfStock = inventory.filter(i => i.stockStatus === 'Out of Stock').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Inventory Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
            Monitor stock levels and update quantities
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '500' }}>Low Stock Threshold:</label>
          <input
            type="number"
            min="1"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value) || 10)}
            style={{
              width: '70px', padding: '6px 10px', borderRadius: '8px',
              border: '1px solid #e5e7eb', fontSize: '0.85rem', textAlign: 'center'
            }}
          />
          <button
            onClick={fetchInventory}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px',
              backgroundColor: '#b76e79', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600'
            }}
          >
            <RefreshCw size={14} /> Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Products', value: inventory.length, bg: '#ede9fe', color: '#5b21b6' },
          { label: 'In Stock', value: totalInStock, bg: '#d1fae5', color: '#065f46' },
          { label: 'Low Stock', value: totalLowStock, bg: '#fef3c7', color: '#78350f' },
          { label: 'Out of Stock', value: totalOutOfStock, bg: '#fee2e2', color: '#7f1d1d' }
        ].map((card) => (
          <div key={card.label} style={{
            padding: '1rem 1.25rem', borderRadius: '12px',
            backgroundColor: card.bg, color: card.color
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.8, marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 8px 8px 34px',
              border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem'
            }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#b76e79' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Loading inventory...</div>
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
            <Package size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div>No inventory items found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdf0f2', borderBottom: '2px solid #f3e4e7' }}>
                  {['Product', 'SKU', 'Category', 'Price', 'Stock Qty', 'Units Sold', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#7f1d1d', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: '1px solid #f9fafb',
                      backgroundColor: item.stockStatus === 'Out of Stock' ? '#fff8f8' : item.stockStatus === 'Low Stock' ? '#fffdf0' : '#fff',
                      transition: 'background 0.2s'
                    }}
                  >
                    {/* Product */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f9fafb', flexShrink: 0 }}>
                          {item.image ? (
                            <img src={`${backendUrl}${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={16} color="#d1d5db" />
                            </div>
                          )}
                        </div>
                        <span style={{ fontWeight: '600', color: '#1f2937', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </div>
                    </td>
                    {/* SKU */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6b7280' }}>{item.sku}</td>
                    {/* Category */}
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{item.category}</td>
                    {/* Price */}
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#b76e79' }}>{formatPrice(item.price)}</td>
                    {/* Stock Qty — per-size inline edit */}
                    <td style={{ padding: '12px 16px' }}>
                      {editingId === item._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '170px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {Object.entries(editSizeStockMap).map(([sz, qty]) => (
                              <div key={sz} style={{
                                display: 'flex', alignItems: 'center', gap: '3px',
                                backgroundColor: '#fff', border: '1px solid #d1d5db',
                                borderRadius: '4px', padding: '2px 4px'
                              }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>{sz}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={qty}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    setEditSizeStockMap(prev => ({ ...prev, [sz]: val }));
                                  }}
                                  style={{
                                    width: '44px', padding: '2px 4px', fontSize: '0.75rem',
                                    textAlign: 'center', border: '1px solid #b76e79', borderRadius: '3px'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#b76e79', fontWeight: '700' }}>
                            Total: {Object.values(editSizeStockMap).reduce((a, b) => a + Number(b || 0), 0)} units
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: item.stockStatus === 'Out of Stock' ? '#dc2626' : item.stockStatus === 'Low Stock' ? '#d97706' : '#059669',
                            fontSize: '0.9rem'
                          }}>
                            {item.stock} units
                          </div>
                          {item.sizeStock && item.sizeStock.length > 0 && (
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px', maxWidth: '160px' }}>
                              {item.sizeStock.map(s => (
                                <span key={s.size} style={{
                                  fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px',
                                  backgroundColor: s.stock === 0 ? '#fee2e2' : s.stock <= 3 ? '#fef3c7' : '#f3f4f6',
                                  color: s.stock === 0 ? '#dc2626' : s.stock <= 3 ? '#b45309' : '#374151',
                                  fontWeight: '600'
                                }}>
                                  {s.size}:{s.stock}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Units Sold */}
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>{item.unitsSold}</td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(item.stockStatus)}</td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      {editingId === item._id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveStock(item._id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px',
                              backgroundColor: '#d1fae5', border: 'none', cursor: 'pointer', color: '#059669'
                            }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px',
                              backgroundColor: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStock(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '6px',
                            backgroundColor: '#ede9fe', border: 'none',
                            cursor: 'pointer', color: '#5b21b6', fontSize: '0.78rem', fontWeight: '600'
                          }}
                        >
                          <Edit2 size={12} /> Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTab;
