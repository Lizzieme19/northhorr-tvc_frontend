'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { suppliersApi, requisitionsApi, rfqsApi, lposApi, grnsApi, inventoryApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

export default function ProcurementDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tab, setTab] = useState<'suppliers' | 'requisitions' | 'rfqs' | 'lpos' | 'grns' | 'inventory'>('suppliers');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [lpos, setLpos] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'PROCUREMENT')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    suppliersApi.getAll().then(r => setSuppliers(r.data?.suppliers || [])).catch(() => setSuppliers([]));
    requisitionsApi.getAll().then(r => setRequisitions(r.data?.requisitions || [])).catch(() => setRequisitions([]));
    rfqsApi.getAll().then(r => setRfqs(r.data?.rfqs || [])).catch(() => setRfqs([]));
    lposApi.getAll().then(r => setLpos(r.data?.lpos || [])).catch(() => setLpos([]));
    grnsApi.getAll().then(r => setGrns(r.data?.grns || [])).catch(() => setGrns([]));
    inventoryApi.getAll().then(r => setInventory(r.data?.items || [])).catch(() => setInventory([]));
  }, []);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string, api: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(id);
      // Refresh data
      if (tab === 'suppliers') suppliersApi.getAll().then(r => setSuppliers(r.data || []));
      if (tab === 'requisitions') requisitionsApi.getAll().then(r => setRequisitions(r.data || []));
      if (tab === 'rfqs') rfqsApi.getAll().then(r => setRfqs(r.data || []));
      if (tab === 'lpos') lposApi.getAll().then(r => setLpos(r.data || []));
      if (tab === 'grns') grnsApi.getAll().then(r => setGrns(r.data || []));
      if (tab === 'inventory') inventoryApi.getAll().then(r => setInventory(r.data || []));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === 'suppliers') {
        if (editingItem) {
          await suppliersApi.update(editingItem.id, formData);
        } else {
          await suppliersApi.create(formData);
        }
        suppliersApi.getAll().then(r => setSuppliers(r.data || []));
      } else if (tab === 'requisitions') {
        if (editingItem) {
          await requisitionsApi.update(editingItem.id, formData);
        } else {
          await requisitionsApi.create(formData);
        }
        requisitionsApi.getAll().then(r => setRequisitions(r.data || []));
      } else if (tab === 'inventory') {
        if (editingItem) {
          await inventoryApi.update(editingItem.id, formData);
        } else {
          await inventoryApi.create(formData);
        }
        inventoryApi.getAll().then(r => setInventory(r.data || []));
      }
      setShowModal(false);
      setFormData({});
      setEditingItem(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, api: any) => {
    try {
      await api.approve(id);
      // Refresh data
      if (tab === 'suppliers') suppliersApi.getAll().then(r => setSuppliers(r.data || []));
      if (tab === 'requisitions') requisitionsApi.getAll().then(r => setRequisitions(r.data || []));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to approve');
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">Procurement Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">PROCUREMENT</span>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'suppliers', label: `🏢 Suppliers (${suppliers.length})` },
          { key: 'requisitions', label: `📝 Requisitions (${requisitions.length})` },
          { key: 'rfqs', label: `📋 RFQs (${rfqs.length})` },
          { key: 'lpos', label: `📄 LPOs (${lpos.length})` },
          { key: 'grns', label: `✅ GRNs (${grns.length})` },
          { key: 'inventory', label: `📦 Inventory (${inventory.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-5 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showPasswordChange && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-stone/10 shadow-sm">
            <h2 className="font-display text-xl text-brand-dark mb-4">Change Password</h2>
            <ChangePassword />
            <button onClick={() => setShowPasswordChange(false)} className="mt-4 text-sm text-stone hover:text-brand transition">Cancel</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-dark capitalize">{tab}</h2>
            {(tab === 'suppliers' || tab === 'requisitions' || tab === 'inventory') && (
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">
                + Add New
              </button>
            )}
          </div>
          {tab === 'suppliers' && (
            <div className="space-y-4">
              {suppliers.length === 0 ? <p className="text-stone">No suppliers found</p> : 
                suppliers.map(s => (
                  <div key={s.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{s.name}</div>
                      <div className="text-sm text-stone">{s.email} • {s.phone}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${s.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {s.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!s.approved && (
                        <button onClick={() => handleApprove(s.id, suppliersApi)} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">
                          Approve
                        </button>
                      )}
                      <button onClick={() => handleEdit(s)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s.id, suppliersApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'requisitions' && (
            <div className="space-y-4">
              {requisitions.length === 0 ? <p className="text-stone">No requisitions found</p> :
                requisitions.map(r => (
                  <div key={r.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{r.item_name}</div>
                      <div className="text-sm text-stone">Qty: {r.quantity} • Budget: KES {r.budget}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-stone/20 text-stone'}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'PENDING' && (
                        <button onClick={() => handleApprove(r.id, requisitionsApi)} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">
                          Approve
                        </button>
                      )}
                      <button onClick={() => handleEdit(r)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(r.id, requisitionsApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'rfqs' && (
            <div className="space-y-4">
              {rfqs.length === 0 ? <p className="text-stone">No RFQs found</p> :
                rfqs.map(r => (
                  <div key={r.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                    <div className="font-semibold text-brand-dark">{r.title}</div>
                    <div className="text-sm text-stone">Deadline: {new Date(r.deadline).toLocaleDateString()}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${r.status === 'CLOSED' ? 'bg-red-100 text-red-800' : r.status === 'AWARDED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'lpos' && (
            <div className="space-y-4">
              {lpos.length === 0 ? <p className="text-stone">No LPOs found</p> :
                lpos.map(l => (
                  <div key={l.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                    <div className="font-semibold text-brand-dark">LPO-{l.po_number}</div>
                    <div className="text-sm text-stone">Supplier: {l.supplier?.name} • KES {l.total_amount}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${l.status === 'ISSUED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'grns' && (
            <div className="space-y-4">
              {grns.length === 0 ? <p className="text-stone">No GRNs found</p> :
                grns.map(g => (
                  <div key={g.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                    <div className="font-semibold text-brand-dark">GRN-{g.grn_number}</div>
                    <div className="text-sm text-stone">LPO: {g.lpo_number} • Verified: {g.verified ? 'Yes' : 'No'}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${g.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {g.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'inventory' && (
            <div className="space-y-4">
              {inventory.length === 0 ? <p className="text-stone">No inventory items found</p> :
                inventory.map(i => (
                  <div key={i.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{i.item_name}</div>
                      <div className="text-sm text-stone">Stock: {i.quantity} • Location: {i.location}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${i.quantity > i.reorder_level ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {i.quantity > i.reorder_level ? 'In Stock' : 'Low Stock'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(i)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(i.id, inventoryApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-4">{editingItem ? 'Edit' : 'Create'} {tab.slice(0, -1)}</h2>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
              {tab === 'suppliers' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Name *</label>
                    <input name="name" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email *</label>
                    <input name="email" type="email" required value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone *</label>
                    <input name="phone" required value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Address</label>
                    <input name="address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category</label>
                    <input name="category" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </>
              )}
              {tab === 'requisitions' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Item Name *</label>
                    <input name="item_name" required value={formData.item_name || ''} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Quantity *</label>
                    <input name="quantity" type="number" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Budget (KES) *</label>
                    <input name="budget" type="number" required value={formData.budget || ''} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department ID</label>
                    <input name="department_id" value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </>
              )}
              {tab === 'inventory' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Item Name *</label>
                    <input name="item_name" required value={formData.item_name || ''} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Quantity *</label>
                    <input name="quantity" type="number" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Location *</label>
                    <input name="location" required value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Reorder Level</label>
                    <input name="reorder_level" type="number" value={formData.reorder_level || ''} onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-stone/25 text-stone font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
