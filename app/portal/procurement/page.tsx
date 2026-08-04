'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { suppliersApi, requisitionsApi, rfqsApi, lposApi, grnsApi, inventoryApi, departmentsApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';
import { toast } from 'sonner';

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
  const [departments, setDepartments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedRfqForQuotation, setSelectedRfqForQuotation] = useState<any>(null);
  const [quotationData, setQuotationData] = useState<any>({});

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
    departmentsApi.getAll().then(r => setDepartments(Array.isArray(r.data) ? r.data : [])).catch(() => setDepartments([]));
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
      if (tab === 'suppliers') suppliersApi.getAll().then(r => setSuppliers(r.data?.suppliers || []));
      if (tab === 'requisitions') requisitionsApi.getAll().then(r => setRequisitions(r.data?.requisitions || []));
      if (tab === 'rfqs') rfqsApi.getAll().then(r => setRfqs(r.data?.rfqs || []));
      if (tab === 'lpos') lposApi.getAll().then(r => setLpos(r.data?.lpos || []));
      if (tab === 'grns') grnsApi.getAll().then(r => setGrns(r.data?.grns || []));
      if (tab === 'inventory') inventoryApi.getAll().then(r => setInventory(r.data?.items || []));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete');
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
        suppliersApi.getAll().then(r => setSuppliers(r.data?.suppliers || []));
      } else if (tab === 'requisitions') {
        // Transform form data to match backend API expectations
        const requisitionData = {
          department_id: formData.department_id,
          priority: formData.priority || 'MEDIUM',
          justification: formData.justification,
          items: [{
            item_name: formData.item_name,
            description: formData.description,
            quantity: parseInt(formData.quantity),
            unit_price: parseFloat(formData.unit_price),
            specifications: formData.specifications,
          }],
        };
        if (editingItem) {
          await requisitionsApi.update(editingItem.id, requisitionData);
        } else {
          await requisitionsApi.create(requisitionData);
        }
        requisitionsApi.getAll().then(r => setRequisitions(r.data?.requisitions || []));
      } else if (tab === 'rfqs') {
        const rfqData = {
          requisition_id: formData.requisition_id,
          title: formData.title,
          description: formData.description,
          opening_date: formData.opening_date,
          closing_date: formData.closing_date,
          supplier_ids: formData.supplier_ids || [],
        };
        if (editingItem) {
          await rfqsApi.update(editingItem.id, rfqData);
        } else {
          await rfqsApi.create(rfqData);
        }
        rfqsApi.getAll().then(r => setRfqs(r.data?.rfqs || []));
      } else if (tab === 'lpos') {
        const lpoData = {
          rfq_id: formData.rfq_id,
          supplier_id: formData.supplier_id,
          department_id: formData.department_id,
          delivery_date: formData.delivery_date,
          payment_terms: formData.payment_terms,
          items: [], // Items will be populated from RFQ
        };
        if (editingItem) {
          await lposApi.update(editingItem.id, lpoData);
        } else {
          await lposApi.create(lpoData);
        }
        lposApi.getAll().then(r => setLpos(r.data?.lpos || []));
      } else if (tab === 'grns') {
        const grnData = {
          lpo_id: formData.lpo_id,
          notes: formData.notes,
          discrepancies: formData.discrepancies,
          items: [], // Items will be populated from LPO
        };
        if (editingItem) {
          await grnsApi.update(editingItem.id, grnData);
        } else {
          await grnsApi.create(grnData);
        }
        grnsApi.getAll().then(r => setGrns(r.data?.grns || []));
      } else if (tab === 'inventory') {
        if (editingItem) {
          await inventoryApi.update(editingItem.id, formData);
        } else {
          await inventoryApi.create(formData);
        }
        inventoryApi.getAll().then(r => setInventory(r.data?.items || []));
      }
      setShowModal(false);
      setFormData({});
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, api: any) => {
    try {
      if (tab === 'requisitions') {
        await api.approve(id, { status: 'APPROVED' });
      } else {
        await api.approve(id);
      }
      // Refresh data
      if (tab === 'suppliers') suppliersApi.getAll().then(r => setSuppliers(r.data?.suppliers || []));
      if (tab === 'requisitions') requisitionsApi.getAll().then(r => setRequisitions(r.data?.requisitions || []));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve');
    }
  };

  const handleSelectQuotation = async (rfqId: string, quotationId: string) => {
    try {
      await rfqsApi.award(rfqId, { quotation_id: quotationId });
      rfqsApi.getAll().then(r => setRfqs(r.data?.rfqs || []));
      toast.success('Quotation selected successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to select quotation');
    }
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rfqsApi.submitQuotation(selectedRfqForQuotation.id, quotationData);
      rfqsApi.getAll().then(r => setRfqs(r.data?.rfqs || []));
      setShowQuotationModal(false);
      setQuotationData({});
      setSelectedRfqForQuotation(null);
      toast.success('Quotation submitted successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit quotation');
    }
  };

  const handleApproveLPO = async (id: string) => {
    try {
      await lposApi.approve(id);
      lposApi.getAll().then(r => setLpos(r.data?.lpos || []));
      toast.success('LPO approved successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve LPO');
    }
  };

  const handleIssueLPO = async (id: string) => {
    try {
      await lposApi.issue(id);
      lposApi.getAll().then(r => setLpos(r.data?.lpos || []));
      toast.success('LPO issued successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to issue LPO');
    }
  };

  const handleDownloadLPO = async (id: string) => {
    try {
      window.open(`/api/lpos/${id}/pdf`, '_blank');
    } catch (err: any) {
      toast.error('Failed to download PDF');
    }
  };

  const handleVerifyGRN = async (id: string, status: string) => {
    try {
      await grnsApi.verify(id, { status });
      grnsApi.getAll().then(r => setGrns(r.data?.grns || []));
      toast.success(`GRN ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Failed to ${status.toLowerCase()} GRN`);
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
            {(tab === 'suppliers' || tab === 'requisitions' || tab === 'inventory' || tab === 'rfqs' || tab === 'lpos' || tab === 'grns') && (
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
                        <span className={`px-2 py-0.5 rounded-full ${s.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {s.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!s.is_approved && (
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
                      <div className="font-semibold text-brand-dark">{r.requisition_no}</div>
                      <div className="text-sm text-stone">{r.department?.name} • {r.items?.length || 0} items • KES {r.total_amount?.toLocaleString()}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : r.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' : r.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-stone/20 text-stone'}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'DRAFT' && (
                        <button onClick={() => requisitionsApi.submit(r.id).then(() => requisitionsApi.getAll().then(res => setRequisitions(res.data?.requisitions || [])))} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                          Submit
                        </button>
                      )}
                      {r.status === 'PENDING_APPROVAL' && (
                        <button onClick={() => handleApprove(r.id, requisitionsApi)} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">
                          Approve
                        </button>
                      )}
                      {r.status === 'DRAFT' && (
                        <>
                          <button onClick={() => handleEdit(r)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(r.id, requisitionsApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                            Delete
                          </button>
                        </>
                      )}
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
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-brand-dark">{r.rfq_no || r.title}</div>
                        <div className="text-sm text-stone">{r.requisition?.department?.name} • {r.requisition?.items?.length || 0} items</div>
                        <div className="text-xs text-stone">Closing: {r.closing_date ? new Date(r.closing_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div className="flex gap-2">
                        {r.status === 'OPEN' && (
                          <>
                            <button onClick={() => { setSelectedRfqForQuotation(r); setShowQuotationModal(true); setQuotationData({}); }} className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 text-sm hover:bg-purple-200 transition">Submit Quotation</button>
                            <button onClick={() => handleEdit(r)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">Edit</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs mt-1 mb-3">
                      <span className={`px-2 py-0.5 rounded-full ${r.status === 'CLOSED' ? 'bg-red-100 text-red-800' : r.status === 'AWARDED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.quotations && r.quotations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone/10">
                        <div className="text-sm font-medium text-brand-dark mb-2">Quotations</div>
                        <div className="space-y-2">
                          {r.quotations.map((q: any) => (
                            <div key={q.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone/10">
                              <div>
                                <div className="text-sm font-medium">{q.supplier?.name}</div>
                                <div className="text-xs text-stone">KES {q.amount?.toLocaleString()}</div>
                              </div>
                              {r.status === 'OPEN' && (
                                <button onClick={() => handleSelectQuotation(r.id, q.id)} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">Select</button>
                              )}
                              {q.is_selected && (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">Selected</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'lpos' && (
            <div className="space-y-4">
              {lpos.length === 0 ? <p className="text-stone">No LPOs found</p> :
                lpos.map(l => (
                  <div key={l.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{l.lpo_no}</div>
                      <div className="text-sm text-stone">{l.supplier?.name} • {l.department?.name}</div>
                      <div className="text-sm text-stone">KES {l.total_amount?.toLocaleString()}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${l.status === 'ISSUED' ? 'bg-green-100 text-green-800' : l.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {l.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {l.status === 'DRAFT' && (
                        <button onClick={() => handleApproveLPO(l.id)} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">Approve</button>
                      )}
                      {l.status === 'APPROVED' && (
                        <button onClick={() => handleIssueLPO(l.id)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">Issue</button>
                      )}
                      {l.status === 'APPROVED' && (
                        <button onClick={() => handleDownloadLPO(l.id)} className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 text-sm hover:bg-purple-200 transition">PDF</button>
                      )}
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
                  <div key={g.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{g.grn_no}</div>
                      <div className="text-sm text-stone">{g.lpo?.lpo_no} • {g.lpo?.supplier?.name}</div>
                      <div className="text-sm text-stone">{g.items?.length || 0} items</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${g.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : g.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {g.status === 'PENDING' && (
                        <button onClick={() => handleVerifyGRN(g.id, 'VERIFIED')} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">Verify</button>
                      )}
                      {g.status === 'PENDING' && (
                        <button onClick={() => handleVerifyGRN(g.id, 'REJECTED')} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">Reject</button>
                      )}
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
                      <div className="font-semibold text-brand-dark">{i.name || i.item_name}</div>
                      <div className="text-sm text-stone">Stock: {i.current_stock || i.quantity} • Location: {i.location}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${(i.current_stock || i.quantity) > i.reorder_level ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {(i.current_stock || i.quantity) > i.reorder_level ? 'In Stock' : 'Low Stock'}
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
            <h2 className="font-display text-xl text-brand-dark mb-4">{editingItem ? 'Edit' : 'Create'} {tab === 'inventory' ? 'Inventory Item' : tab === 'rfqs' ? 'RFQ' : tab === 'lpos' ? 'LPO' : tab === 'grns' ? 'GRN' : tab.slice(0, -1)}</h2>
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
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department</label>
                    <select name="department_id" value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
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
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department *</label>
                    <select name="department_id" required value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Item Name *</label>
                    <input name="item_name" required value={formData.item_name || ''} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                    <input name="description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Quantity *</label>
                      <input name="quantity" type="number" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Unit Price (KES) *</label>
                      <input name="unit_price" type="number" required value={formData.unit_price || ''} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Specifications</label>
                    <textarea name="specifications" value={formData.specifications || ''} onChange={(e) => setFormData({...formData, specifications: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Priority</label>
                    <select name="priority" value={formData.priority || 'MEDIUM'} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Justification</label>
                    <textarea name="justification" value={formData.justification || ''} onChange={(e) => setFormData({...formData, justification: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                </>
              )}
              {tab === 'rfqs' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Requisition *</label>
                    <select name="requisition_id" required value={formData.requisition_id || ''} onChange={(e) => setFormData({...formData, requisition_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Approved Requisition</option>
                      {requisitions.filter(r => r.status === 'APPROVED').map(r => <option key={r.id} value={r.id}>{r.requisition_no} - {r.department?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Title *</label>
                    <input name="title" required value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                    <textarea name="description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Opening Date *</label>
                      <input name="opening_date" type="date" required value={formData.opening_date || ''} onChange={(e) => setFormData({...formData, opening_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Closing Date *</label>
                      <input name="closing_date" type="date" required value={formData.closing_date || ''} onChange={(e) => setFormData({...formData, closing_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Invite Suppliers</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-stone/25 rounded-xl p-3">
                      {suppliers.filter(s => s.is_approved).map(s => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={formData.supplier_ids?.includes(s.id)} onChange={(e) => {
                            const ids = formData.supplier_ids || [];
                            if (e.target.checked) {
                              setFormData({...formData, supplier_ids: [...ids, s.id]});
                            } else {
                              setFormData({...formData, supplier_ids: ids.filter((id: string) => id !== s.id)});
                            }
                          }} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {tab === 'lpos' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">RFQ *</label>
                    <select name="rfq_id" required value={formData.rfq_id || ''} onChange={(e) => setFormData({...formData, rfq_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Awarded RFQ</option>
                      {rfqs.filter(r => r.status === 'AWARDED').map(r => <option key={r.id} value={r.id}>{r.rfq_no || r.title} - {r.requisition?.department?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Supplier *</label>
                    <select name="supplier_id" required value={formData.supplier_id || ''} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Supplier</option>
                      {suppliers.filter(s => s.is_approved).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department *</label>
                    <select name="department_id" required value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Delivery Date</label>
                    <input name="delivery_date" type="date" value={formData.delivery_date || ''} onChange={(e) => setFormData({...formData, delivery_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Payment Terms</label>
                    <textarea name="payment_terms" value={formData.payment_terms || ''} onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                </>
              )}
              {tab === 'grns' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">LPO *</label>
                    <select name="lpo_id" required value={formData.lpo_id || ''} onChange={(e) => setFormData({...formData, lpo_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                      <option value="">Select Issued LPO</option>
                      {lpos.filter(l => l.status === 'ISSUED' || l.status === 'APPROVED').map(l => <option key={l.id} value={l.id}>{l.lpo_no} - {l.supplier?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Notes</label>
                    <textarea name="notes" value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Discrepancies</label>
                    <textarea name="discrepancies" value={formData.discrepancies || ''} onChange={(e) => setFormData({...formData, discrepancies: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} />
                  </div>
                </>
              )}
              {tab === 'inventory' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Item Code *</label>
                      <input name="item_code" required value={formData.item_code || ''} onChange={(e) => setFormData({...formData, item_code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Item Name *</label>
                      <input name="name" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Current Stock</label>
                    <input name="current_stock" type="number" value={formData.current_stock || ''} onChange={(e) => setFormData({...formData, current_stock: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
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
      {showQuotationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone/10">
              <h3 className="text-xl font-bold text-brand-dark">Submit Quotation</h3>
              <p className="text-sm text-stone mt-1">RFQ: {selectedRfqForQuotation?.rfq_no || selectedRfqForQuotation?.title}</p>
            </div>
            <form onSubmit={handleSubmitQuotation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Supplier *</label>
                <select required value={quotationData.supplier_id || ''} onChange={(e) => setQuotationData({...quotationData, supplier_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="">Select Supplier</option>
                  {suppliers.filter(s => s.is_approved).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Quotation Number *</label>
                <input required type="text" value={quotationData.quotation_no || ''} onChange={(e) => setQuotationData({...quotationData, quotation_no: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="e.g., QT-2024-001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Amount (KES) *</label>
                <input required type="number" value={quotationData.amount || ''} onChange={(e) => setQuotationData({...quotationData, amount: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Currency</label>
                <select value={quotationData.currency || 'KES'} onChange={(e) => setQuotationData({...quotationData, currency: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Validity Period (days)</label>
                <input type="number" value={quotationData.validity_period || ''} onChange={(e) => setQuotationData({...quotationData, validity_period: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="e.g., 30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Notes</label>
                <textarea value={quotationData.notes || ''} onChange={(e) => setQuotationData({...quotationData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={2} placeholder="Additional details..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowQuotationModal(false)} className="flex-1 py-3 rounded-xl border border-stone/25 text-stone font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">
                  Submit Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
