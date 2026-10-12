import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Tag, RefreshCw, Image } from 'lucide-react';
import {
  getCategories, createCategory, updateCategory, deleteCategory
} from '../services/adminService';

/**
 * CategoryTab — Full CRUD for product categories.
 * Categories control what product types appear in the storefront.
 */
const CategoryTab = ({ showToast, confirmDialog, backendUrl }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  // Form state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState('');
  const [catActive, setCatActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories(false);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAddForm = () => {
    setEditingCat(null);
    setCatName(''); setCatDesc(''); setCatImage(null); setCatImagePreview(''); setCatActive(true);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatImage(null);
    setCatImagePreview(cat.image ? `${backendUrl}${cat.image}` : '');
    setCatActive(cat.isActive);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatImage(file);
      setCatImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!catName.trim()) { showToast('Category name is required', 'warning'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', catName.trim());
      fd.append('description', catDesc);
      fd.append('isActive', catActive);
      if (catImage) fd.append('image', catImage);

      if (editingCat) {
        await updateCategory(editingCat._id, fd);
        showToast('Category updated successfully!', 'success');
      } else {
        await createCategory(fd);
        showToast('Category created successfully!', 'success');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cat) => {
    confirmDialog(
      `Delete "${cat.name}"?`,
      'This action cannot be undone. Products using this category will remain but may become uncategorised.',
      async () => {
        try {
          await deleteCategory(cat._id);
          showToast('Category deleted successfully', 'success');
          fetchCategories();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete category', 'error');
        }
      },
      'Delete'
    );
  };

  const toggleActive = async (cat) => {
    try {
      const fd = new FormData();
      fd.append('name', cat.name);
      fd.append('isActive', !cat.isActive);
      await updateCategory(cat._id, fd);
      showToast(`Category ${!cat.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchCategories();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Category Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
            Manage product categories — {categories.length} total, {categories.filter(c => c.isActive).length} active
          </p>
        </div>
        <button
          onClick={openAddForm}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 20px', borderRadius: '10px',
            backgroundColor: '#b76e79', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
            boxShadow: '0 2px 8px rgba(183,110,121,0.35)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#9f5a65'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#b76e79'}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px', padding: '2rem',
            width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>
                {editingCat ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Image Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Category Image (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '10px',
                    border: '2px dashed #e5e7eb', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    {catImagePreview
                      ? <img src={catImagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Image size={22} color="#d1d5db" />
                    }
                  </div>
                  <label style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#f3f4f6', fontSize: '0.82rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Category Name *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="e.g., Sarees, Kurtis..."
                  required
                  style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#b76e79'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Description</label>
                <textarea
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={3}
                  style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.88rem', resize: 'vertical', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#b76e79'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Active Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCatActive(!catActive)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    backgroundColor: catActive ? '#b76e79' : '#e5e7eb',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff',
                    position: 'absolute', top: '3px',
                    left: catActive ? '23px' : '3px', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </button>
                <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500' }}>
                  {catActive ? 'Active (visible on site)' : 'Inactive (hidden from site)'}
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '9px 20px', borderRadius: '8px', border: '1px solid #e5e7eb',
                  backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{
                  padding: '9px 24px', borderRadius: '8px', border: 'none',
                  backgroundColor: submitting ? '#e5e7eb' : '#b76e79', color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.88rem'
                }}>
                  {submitting ? 'Saving...' : editingCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Loading categories...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {categories.map(cat => (
            <div key={cat._id} style={{
              backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden',
              border: `1px solid ${cat.isActive ? '#f3f4f6' : '#fde68a'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
            >
              {/* Category image or placeholder */}
              <div style={{ height: '80px', backgroundColor: '#fdf0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {cat.image
                  ? <img src={`${backendUrl}${cat.image}`} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Tag size={32} color="#dba9b0" />
                }
                {/* Active badge */}
                <span style={{
                  position: 'absolute', top: '8px', right: '8px',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '700',
                  backgroundColor: cat.isActive ? '#d1fae5' : '#fef3c7',
                  color: cat.isActive ? '#065f46' : '#78350f'
                }}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{cat.name}</h4>
                {cat.description && (
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '12px', lineHeight: '1.4' }}>{cat.description}</p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button
                    onClick={() => openEditForm(cat)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      padding: '6px', borderRadius: '7px', backgroundColor: '#ede9fe',
                      border: 'none', cursor: 'pointer', color: '#5b21b6', fontWeight: '600', fontSize: '0.78rem'
                    }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(cat)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      padding: '6px', borderRadius: '7px',
                      backgroundColor: cat.isActive ? '#fef3c7' : '#d1fae5',
                      border: 'none', cursor: 'pointer',
                      color: cat.isActive ? '#78350f' : '#065f46',
                      fontWeight: '600', fontSize: '0.78rem'
                    }}
                  >
                    {cat.isActive ? <X size={12} /> : <Check size={12} />}
                    {cat.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    style={{
                      padding: '6px 10px', borderRadius: '7px', backgroundColor: '#fee2e2',
                      border: 'none', cursor: 'pointer', color: '#dc2626'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTab;
