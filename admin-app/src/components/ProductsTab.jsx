import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Upload, X, Check, Package, EyeOff, CheckSquare } from 'lucide-react';
import { getAdminProducts } from '../services/adminService';
import { getCategories } from '../services/adminService';
import { createProduct, updateProduct, deleteProduct } from '../services/productService';
import api from '../services/api';
import { getImageUrl } from '../config';

/**
 * ProductsTab — Full product management with all new fields:
 * name, description, category, price, discount, sizes, colors, stock, images, isActive
 * Uses /api/admin/products to list ALL products (including inactive).
 * Only products where isActive=true appear on the customer storefront.
 * Supports bulk selection with Delete / Make Inactive bulk actions.
 */
const ProductsTab = ({ showToast, confirmDialog, backendUrl }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Bulk selection state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', discount: '0',
    stock: '50', isActive: true
  });
  const [prodSizes, setProdSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [sizeStockMap, setSizeStockMap] = useState({ 'S': 10, 'M': 10, 'L': 10, 'XL': 10, 'XXL': 10 });
  const [bulkStockVal, setBulkStockVal] = useState('10');
  const [prodColors, setProdColors] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [keepImages, setKeepImages] = useState([]);

  const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminProducts(params);
      setProducts(data);
      setSelectedIds([]); // clear selection on reload
    } catch { showToast('Failed to load products', 'error'); }
    finally { setLoading(false); }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    getCategories(false).then(setCategories).catch(() => {});
  }, []);

  const resetForm = () => {
    const defSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const defMap = {};
    defSizes.forEach(s => { defMap[s] = 10; });
    setForm({ name: '', description: '', category: categories[0]?.name || '', price: '', discount: '0', stock: '50', isActive: true });
    setProdSizes(defSizes);
    setSizeStockMap(defMap);
    setProdColors([]);
    setColorInput('');
    setNewImages([]);
    setKeepImages([]);
  };

  const openAdd = () => { setEditing(null); resetForm(); setShowModal(true); };

  const openEdit = (prod) => {
    setEditing(prod);
    setForm({
      name: prod.name, description: prod.description,
      category: prod.category, price: String(prod.price),
      discount: String(prod.discount || 0), stock: String(prod.stock),
      isActive: prod.isActive !== false
    });

    const initialMap = {};
    if (prod.sizeStock && prod.sizeStock.length > 0) {
      prod.sizeStock.forEach(item => {
        initialMap[item.size] = item.stock;
      });
      setProdSizes(prod.sizeStock.map(s => s.size));
    } else {
      const sizes = prod.sizes?.length ? prod.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
      const base = Math.floor((prod.stock || 0) / sizes.length);
      const rem = (prod.stock || 0) % sizes.length;
      sizes.forEach((sz, idx) => {
        initialMap[sz] = base + (idx === 0 ? rem : 0);
      });
      setProdSizes(sizes);
    }
    setSizeStockMap(initialMap);
    setProdColors(prod.colors || []);
    setColorInput('');
    setNewImages([]);
    setKeepImages(prod.images || []);
    setShowModal(true);
  };

  const toggleSize = (sz) => {
    setProdSizes(prev => {
      if (prev.includes(sz)) {
        const next = prev.filter(s => s !== sz);
        setSizeStockMap(m => {
          const c = { ...m };
          delete c[sz];
          const newTotal = Object.values(c).reduce((a, b) => a + Number(b || 0), 0);
          setForm(f => ({ ...f, stock: String(newTotal) }));
          return c;
        });
        return next;
      } else {
        const next = [...prev, sz];
        setSizeStockMap(m => {
          const c = { ...m, [sz]: 10 };
          const newTotal = Object.values(c).reduce((a, b) => a + Number(b || 0), 0);
          setForm(f => ({ ...f, stock: String(newTotal) }));
          return c;
        });
        return next;
      }
    });
  };

  const handleSizeStockChange = (sz, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSizeStockMap(prev => {
      const updated = { ...prev, [sz]: num };
      const total = Object.values(updated).reduce((a, b) => a + Number(b || 0), 0);
      setForm(f => ({ ...f, stock: String(total) }));
      return updated;
    });
  };

  const applyBulkStock = () => {
    const num = Math.max(0, parseInt(bulkStockVal, 10) || 0);
    const updated = {};
    prodSizes.forEach(s => {
      updated[s] = num;
    });
    setSizeStockMap(updated);
    setForm(f => ({ ...f, stock: String(prodSizes.length * num) }));
    showToast(`Set ${num} units for each size (${prodSizes.length * num} total)`, 'success');
  };

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !prodColors.includes(c)) { setProdColors(prev => [...prev, c]); }
    setColorInput('');
  };

  const removeColor = (c) => setProdColors(prev => prev.filter(x => x !== c));
  const removeKeepImage = (img) => setKeepImages(prev => prev.filter(i => i !== img));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, category, price, discount } = form;
    if (!name || !description || !category || !price) {
      showToast('Please fill all required fields', 'warning'); return;
    }
    if (prodSizes.length === 0) {
      showToast('Please select at least one available size', 'warning'); return;
    }

    const sizeStockArray = prodSizes.map(sz => ({
      size: sz,
      stock: Math.max(0, Number(sizeStockMap[sz]) || 0)
    }));
    const totalStock = sizeStockArray.reduce((acc, curr) => acc + curr.stock, 0);

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description);
      fd.append('category', category);
      fd.append('price', price);
      fd.append('discount', discount || '0');
      fd.append('stock', String(totalStock));
      fd.append('isActive', form.isActive);
      fd.append('sizes', JSON.stringify(prodSizes));
      fd.append('sizeStock', JSON.stringify(sizeStockArray));
      fd.append('colors', JSON.stringify(prodColors));
      newImages.forEach(f => fd.append('images', f));
      if (editing) fd.append('keepImages', JSON.stringify(keepImages));

      if (editing) {
        await updateProduct(editing._id, fd);
        showToast('Product updated successfully!', 'success');
      } else {
        await createProduct(fd);
        showToast('Product added successfully!', 'success');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (prod) => {
    confirmDialog(
      `Delete "${prod.name}"?`,
      'This will permanently delete the product and all its reviews.',
      async () => {
        try {
          await deleteProduct(prod._id);
          showToast('Product deleted successfully', 'success');
          loadProducts();
        } catch (err) { showToast(err.response?.data?.message || 'Delete failed', 'error'); }
      }, 'Delete'
    );
  };

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    confirmDialog(
      `Delete ${selectedIds.length} product(s)?`,
      'This will permanently delete all selected products and their reviews.',
      async () => {
        setBulkLoading(true);
        try {
          await Promise.all(selectedIds.map(id => deleteProduct(id)));
          showToast(`${selectedIds.length} product(s) deleted successfully`, 'success');
          loadProducts();
        } catch (err) {
          showToast('Some deletions failed', 'error');
          loadProducts();
        } finally { setBulkLoading(false); }
      }, 'Delete All'
    );
  };

  // Bulk make inactive
  const handleBulkMakeInactive = () => {
    if (selectedIds.length === 0) return;
    confirmDialog(
      `Make ${selectedIds.length} product(s) Inactive?`,
      'Selected products will be hidden from the customer storefront.',
      async () => {
        setBulkLoading(true);
        try {
          await Promise.all(selectedIds.map(id => {
            const fd = new FormData();
            fd.append('isActive', 'false');
            return api.put(`/products/${id}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }));
          showToast(`${selectedIds.length} product(s) set to Inactive`, 'success');
          loadProducts();
        } catch {
          showToast('Some updates failed', 'error');
          loadProducts();
        } finally { setBulkLoading(false); }
      }, 'Make Inactive'
    );
  };

  // Bulk make active
  const handleBulkMakeActive = () => {
    if (selectedIds.length === 0) return;
    confirmDialog(
      `Make ${selectedIds.length} product(s) Active?`,
      'Selected products will be visible on the customer storefront.',
      async () => {
        setBulkLoading(true);
        try {
          await Promise.all(selectedIds.map(id => {
            const fd = new FormData();
            fd.append('isActive', 'true');
            return api.put(`/products/${id}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }));
          showToast(`${selectedIds.length} product(s) set to Active`, 'success');
          loadProducts();
        } catch {
          showToast('Some updates failed', 'error');
          loadProducts();
        } finally { setBulkLoading(false); }
      }, 'Make Active'
    );
  };

  const inputStyle = {
    padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '0.88rem', width: '100%', outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Product Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
            {products.length} products — only <strong>Active</strong> products appear on the customer site
          </p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px',
          borderRadius: '10px', backgroundColor: '#b76e79', color: '#fff',
          border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
          boxShadow: '0 2px 8px rgba(183,110,121,0.35)'
        }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#fff' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#fff' }}>
          <option value="">All Status</option>
          <option value="active">Active (On Site)</option>
          <option value="inactive">Inactive (Hidden)</option>
        </select>
      </div>

      {/* ── Bulk Action Bar ─────────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          padding: '12px 16px', borderRadius: '12px',
          backgroundColor: '#fdf0f2', border: '1.5px solid #f3c4cd',
          boxShadow: '0 2px 8px rgba(183,110,121,0.12)'
        }}>
          <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#b76e79' }}>
            <CheckSquare size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div style={{ height: '20px', width: '1px', backgroundColor: '#f3c4cd' }} />
          <button
            onClick={handleBulkMakeInactive}
            disabled={bulkLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px',
              backgroundColor: '#fef3c7', border: '1px solid #fde68a',
              color: '#92400e', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            <EyeOff size={14} /> Make Inactive
          </button>
          <button
            onClick={handleBulkMakeActive}
            disabled={bulkLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px',
              backgroundColor: '#d1fae5', border: '1px solid #a7f3d0',
              color: '#065f46', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            <Check size={14} /> Make Active
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px',
              backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
              color: '#dc2626', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            <Trash2 size={14} /> Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds([])}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: '#9ca3af', padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Products Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <Package size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No products found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdf0f2', borderBottom: '2px solid #f3e4e7' }}>
                  {/* Checkbox column */}
                  <th style={{ padding: '12px 14px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#b76e79' }}
                      title="Select all"
                    />
                  </th>
                  {['Image', 'Product', 'SKU', 'Category', 'Price', 'Discount', 'Stock', 'Status', 'Visibility', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#7f1d1d', fontSize: '0.76rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const isChecked = selectedIds.includes(prod._id);
                  return (
                    <tr key={prod._id} style={{
                      borderBottom: '1px solid #f9fafb',
                      backgroundColor: isChecked ? '#fff5f7' : (!prod.isActive ? '#f9f9f9' : '#fff'),
                      opacity: prod.isActive ? 1 : 0.7,
                      transition: 'background-color 0.15s'
                    }}>
                      {/* Row checkbox */}
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(prod._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#b76e79' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ width: '42px', height: '50px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                          {prod.images?.[0]
                            ? <img src={getImageUrl(prod.images[0])} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Package size={16} color="#d1d5db" style={{ margin: '17px auto', display: 'block' }} />
                          }
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1f2937', maxWidth: '140px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                        {prod.colors?.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                            {prod.colors.slice(0, 3).map(c => (
                              <span key={c} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.76rem', color: '#6b7280' }}>{prod.sku || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{prod.category}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#b76e79' }}>{formatPrice(prod.price)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {prod.discount > 0 ? (
                          <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem' }}>{prod.discount}% OFF</span>
                        ) : <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: prod.stock === 0 ? '#dc2626' : prod.stock <= 10 ? '#d97706' : '#059669' }}>
                          {prod.stock} units
                        </div>
                        {prod.sizeStock && prod.sizeStock.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px', maxWidth: '140px' }}>
                            {prod.sizeStock.map(s => (
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
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.76rem',
                          backgroundColor: prod.stock === 0 ? '#fee2e2' : prod.stock <= 10 ? '#fef3c7' : '#d1fae5',
                          color: prod.stock === 0 ? '#dc2626' : prod.stock <= 10 ? '#d97706' : '#059669'
                        }}>
                          {prod.stock === 0 ? 'Out of Stock' : prod.stock <= 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.76rem',
                          backgroundColor: prod.isActive ? '#d1fae5' : '#f3f4f6',
                          color: prod.isActive ? '#059669' : '#6b7280'
                        }}>
                          {prod.isActive ? '✓ Live' : '✗ Hidden'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEdit(prod)} style={{ padding: '6px 10px', borderRadius: '7px', backgroundColor: '#ede9fe', border: 'none', cursor: 'pointer', color: '#5b21b6' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(prod)} style={{ padding: '6px 10px', borderRadius: '7px', backgroundColor: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px', width: '90%', maxWidth: '640px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{editing ? 'Edit Product' : 'Add New Product'}</h3>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>
                  {editing ? 'Update product details below' : 'Fill in the details — product will appear on customer site if set to Active'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '6px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Elegant Silk Saree" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#b76e79'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detailed product description..." rows={3} required
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#b76e79'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, backgroundColor: '#fff' }}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Price + Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#b76e79'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Discount (%)</label>
                  <input type="number" min="0" max="100" value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    placeholder="0" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#b76e79'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              </div>

              {/* Available Sizes Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>
                    Available Sizes *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Click to toggle sizes
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SIZE_OPTIONS.map(sz => (
                    <button key={sz} type="button" onClick={() => toggleSize(sz)} style={{
                      padding: '6px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer',
                      backgroundColor: prodSizes.includes(sz) ? '#b76e79' : '#f3f4f6',
                      color: prodSizes.includes(sz) ? '#fff' : '#374151',
                      border: `1px solid ${prodSizes.includes(sz) ? '#b76e79' : '#e5e7eb'}`,
                      transition: 'all 0.15s'
                    }}>{sz}</button>
                  ))}
                </div>
              </div>

              {/* Stock Quantity Per Size */}
              <div style={{
                backgroundColor: '#fff5f6',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: '700', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} /> Stock Quantity Per Size
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#4b5563' }}>
                      Set individual inventory quantity for each size
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#ffe4e6',
                      color: '#9f1239',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: '700'
                    }}>
                      Total Stock: {form.stock || 0}
                    </span>
                  </div>
                </div>

                {/* Bulk fill tool */}
                {prodSizes.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px dashed #f43f5e'
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#4b5563' }}>Quick Set:</span>
                    <input
                      type="number"
                      min="0"
                      value={bulkStockVal}
                      onChange={e => setBulkStockVal(e.target.value)}
                      placeholder="Qty"
                      style={{
                        width: '60px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.8rem',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      type="button"
                      onClick={applyBulkStock}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#b76e79',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}
                    >
                      Apply to All Sizes
                    </button>
                  </div>
                )}

                {/* Individual Size Inputs */}
                {prodSizes.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#9f1239', padding: '6px 0' }}>
                    ⚠️ Please select at least one size above.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '10px'
                  }}>
                    {prodSizes.map(sz => {
                      const qty = sizeStockMap[sz] ?? 0;
                      return (
                        <div key={sz} style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1f2937' }}>
                              Size {sz}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              color: qty === 0 ? '#dc2626' : qty <= 5 ? '#d97706' : '#059669'
                            }}>
                              {qty === 0 ? 'Out of stock' : `${qty} left`}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              value={sizeStockMap[sz] ?? ''}
                              onChange={e => handleSizeStockChange(sz, e.target.value)}
                              placeholder="0"
                              required
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                              onFocus={e => e.target.style.borderColor = '#b76e79'}
                              onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Colors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Available Colors</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                    placeholder="Type color and press Enter or Add..."
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = '#b76e79'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  <button type="button" onClick={addColor} style={{
                    padding: '9px 16px', borderRadius: '8px', backgroundColor: '#ede9fe',
                    border: 'none', cursor: 'pointer', color: '#5b21b6', fontWeight: '600', fontSize: '0.82rem'
                  }}>Add</button>
                </div>
                {prodColors.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {prodColors.map(c => (
                      <span key={c} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem',
                        backgroundColor: '#fdf0f2', color: '#b76e79', fontWeight: '600', border: '1px solid #f3d5da'
                      }}>
                        {c}
                        <button type="button" onClick={() => removeColor(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#b76e79', lineHeight: 1 }}><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Product Images (up to 5)</label>

                {/* Existing images (edit mode) */}
                {keepImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {keepImages.map(img => (
                      <div key={img} style={{ position: 'relative', width: '64px', height: '72px' }}>
                        <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        <button type="button" onClick={() => removeKeepImage(img)} style={{
                          position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px',
                          borderRadius: '50%', backgroundColor: '#dc2626', color: '#fff', border: 'none',
                          cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '28px', border: '2px dashed #e5e7eb', borderRadius: '10px',
                  cursor: 'pointer', backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '0.85rem',
                  transition: 'border-color 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#b76e79'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <Upload size={18} />
                  {newImages.length > 0 ? `${newImages.length} file(s) selected` : 'Click to upload images (JPG, PNG, WebP)'}
                  <input type="file" multiple accept="image/*" onChange={e => setNewImages(Array.from(e.target.files))} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Active/Inactive Toggle */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} style={{
                  width: '48px', height: '26px', borderRadius: '13px',
                  backgroundColor: form.isActive ? '#b76e79' : '#e5e7eb',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff',
                    position: 'absolute', top: '3px',
                    left: form.isActive ? '25px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </button>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1f2937' }}>
                    {form.isActive ? '✓ Active — Visible on customer site' : '✗ Inactive — Hidden from customer site'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '2px' }}>
                    Toggle to control whether this product appears to customers
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 24px', borderRadius: '8px', border: '1px solid #e5e7eb',
                  backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600'
                }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{
                  padding: '10px 28px', borderRadius: '8px', border: 'none',
                  backgroundColor: submitting ? '#e5e7eb' : '#b76e79',
                  color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(183,110,121,0.35)'
                }}>
                  {submitting ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
