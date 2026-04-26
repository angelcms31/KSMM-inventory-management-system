import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  HiMagnifyingGlass, HiPlusSmall, HiXMark, HiPhoto, HiPencil, HiTrash, HiCheckCircle
} from 'react-icons/hi2';

export default function Inventory() {
  const [workOrders, setWorkOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [completeOrder, setCompleteOrder] = useState(null);
  const [completeActuals, setCompleteActuals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    sku: '', quantity: '', category: '', target_date: '',
    artisan_id: '', status: '', product_image: null, selectedMaterials: []
  });

  const fetchData = async () => {
    try {
      const [woRes, matRes, artRes, fgRes] = await Promise.all([
        axios.get('http://localhost:5000/api/artisan_work_orders'),
        axios.get('http://localhost:5000/api/materials'),
        axios.get('http://localhost:5000/api/artisans'),
        axios.get('http://localhost:5000/api/finished_goods')
      ]);
      setWorkOrders(woRes.data || []);
      setMaterials(matRes.data || []);
      setArtisans(artRes.data.artisans || []);
      setFinishedGoods(fgRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductName = (sku) => {
    const product = finishedGoods.find(fg => fg.sku === sku);
    return product ? (product.name || product.collection) : 'Unknown Product';
  };

  const getCategoryBySku = (sku) => {
    const product = finishedGoods.find(fg => fg.sku === sku);
    return product ? product.category : null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, product_image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleOpenComplete = async (order) => {
    setCompleteOrder(order);
    try {
      const res = await axios.get(`http://localhost:5000/api/work_order_materials/${order.work_order_id}`);
      const orderMaterials = res.data || [];
      const mapped = orderMaterials.map(m => {
        const baseMat = materials.find(bm => bm.material_id === m.material_id);
        return {
          material_id: m.material_id,
          material_name: baseMat?.material_name || m.material_name || 'Unknown',
          expected_qty: Number(m.material_qty) || 0,
          actual_qty: Number(m.material_qty) || 0,
          cost: baseMat ? Number(baseMat.cost_per_unit) : 0
        };
      });
      setCompleteActuals(mapped);
    } catch {
      setCompleteActuals([]);
    }
    setShowCompleteModal(true);
  };

const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (completeActuals.length === 0) {
      alert('No materials found for this work order.');
      return;
    }

    const hasInvalid = completeActuals.some(m => !m.actual_qty || parseInt(m.actual_qty) < 1);
    if (hasInvalid) {
      alert('All actual quantities must be at least 1.');
      return;
    }

    const currentUserId = localStorage.getItem("user_id");

    setSubmitting(true);
    try {
      await axios.put(`http://localhost:5000/api/work_orders/${completeOrder.work_order_id}/complete`, {
          actualMaterials: completeActuals.map(m => ({
            material_id: m.material_id,
            expected_qty: Number(m.expected_qty),
            actual_qty: parseInt(m.actual_qty)
          })),
          userId: currentUserId 
        });
      
      setShowCompleteModal(false);
      setCompleteOrder(null);
      setCompleteActuals([]);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = async (order) => {
    if (order.status === 'Complete') return;
    setSelectedOrder(order);
    try {
      const res = await axios.get(`http://localhost:5000/api/work_order_materials/${order.work_order_id}`);
      const orderMaterials = res.data || [];
      const mapped = orderMaterials.map(m => {
        const qty = Number(m.material_qty) || 0;
        const baseMat = materials.find(bm => bm.material_id === m.material_id);
        const cost = baseMat ? Number(baseMat.cost_per_unit) : (Number(m.subtotal) / qty || 0);
        return { material_id: m.material_id, qty, cost, total: Number(m.subtotal) || (qty * cost) };
      });
      setEditForm({
        sku: order.sku || '', quantity: order.quantity_needed || '',
        category: getCategoryBySku(order.sku) || order.department || '',
        target_date: order.target_date?.split('T')[0] || '',
        artisan_id: order.artisan_id || '', status: order.status || 'In Production',
        product_image: order.product_image || null, selectedMaterials: mapped
      });
    } catch {
      setEditForm({
        sku: order.sku || '', quantity: order.quantity_needed || '',
        category: getCategoryBySku(order.sku) || order.department || '',
        target_date: order.target_date?.split('T')[0] || '',
        artisan_id: order.artisan_id || '', status: order.status || 'In Production',
        product_image: order.product_image || null, selectedMaterials: []
      });
    }
    setShowEditModal(true);
  };

  const addMaterialRow = () => {
    setEditForm(prev => ({
      ...prev,
      selectedMaterials: [...prev.selectedMaterials, { material_id: '', qty: 0, cost: 0, total: 0 }]
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...editForm.selectedMaterials];
    if (field === 'qty') {
      updated[index].qty = parseInt(value) || 0;
    } else if (field === 'material_id') {
      updated[index].material_id = value;
      const mat = materials.find(m => m.material_id === parseInt(value));
      updated[index].cost = mat ? Number(mat.cost_per_unit) : 0;
    }
    updated[index].total = (parseInt(updated[index].qty) || 0) * (Number(updated[index].cost) || 0);
    setEditForm({ ...editForm, selectedMaterials: updated });
  };

  const calculateSubtotal = () =>
    editForm.selectedMaterials.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const validMaterials = editForm.selectedMaterials.filter(
      (m) => m.material_id !== '' && Number(m.qty) > 0
    );

    if (validMaterials.length === 0) {
      alert('Please add at least one raw material with a valid quantity.');
      return;
    }

    const payload = {
      status: editForm.status,
      artisan_id: parseInt(editForm.artisan_id),
      quantity: parseInt(editForm.quantity),
      sku: editForm.sku,
      target_date: editForm.target_date,
      product_image: editForm.product_image,
      selectedMaterials: validMaterials.map((m) => ({
        material_id: parseInt(m.material_id),
        qty: Number(m.qty),
        cost: Number(m.cost),
      })),
    };

    try {
      const res = await axios.put(
        `http://localhost:5000/api/work_orders/${selectedOrder.work_order_id}`,
        payload
      );

      if (res.data.success) {
        setShowEditModal(false);
        fetchData();
      }
    } catch (err) {
  const raw = err.response?.data?.error || err.message || '';
  if (raw.startsWith('INSUFFICIENT_STOCK::')) {
    const [, name, needed, available] = raw.split('::');
    alert(`Not enough stock for "${name}".\nNeeded: ${needed} | Available: ${available}`);
  } else {
    alert('Update failed: ' + raw);
  }
  };
} 

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete': return 'bg-[#002B5B]';
      case 'Quality Control': return 'bg-black';
      case 'In Production': return 'bg-[#1D7A1D]';
      default: return 'bg-slate-400';
    }
  };

  const activeOrders = workOrders.filter(o =>
    o.status === 'In Production' || o.status === 'Quality Control' || o.status === 'Complete'
  );

  const filteredOrders = activeOrders.filter(order => {
    const cat = getCategoryBySku(order.sku) || order.department || '';
    const searchString = `${order.sku} ${order.first_name || ''} ${order.last_name || ''} ${cat} ${getProductName(order.sku)}`.toLowerCase();
    const searchMatch = searchString.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'All Status' || order.status === statusFilter;
    return searchMatch && statusMatch;
  });

  return (
    <div className="w-full h-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      <div className="flex-shrink-0 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search SKU, Artisan, or Product..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-black/5 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-[#F8F9FA] border-none rounded-2xl py-3.5 px-6 font-bold text-slate-600 outline-none cursor-pointer min-w-[200px] text-xs uppercase tracking-wider"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="In Production">In Production</option>
          <option value="Quality Control">Quality Control</option>
          <option value="Complete">Complete</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 min-h-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col text-left">
          <div className="flex justify-between items-center mb-8 px-2 flex-shrink-0">
            <div>
              <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Production Orders</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Active Work Orders</p>
            </div>
            <div className="flex gap-2 text-[10px] font-black uppercase">
              <span className="px-3 py-1.5 rounded-lg bg-[#1D7A1D] text-white">
                {workOrders.filter(o => o.status === 'In Production').length} In Production
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-black text-white">
                {workOrders.filter(o => o.status === 'Quality Control').length} QC
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#002B5B] text-white">
                {workOrders.filter(o => o.status === 'Complete').length} Complete
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                  <th className="pb-2 text-left pl-6 w-[28%]">Product Details</th>
                  <th className="pb-2 text-left w-[16%]">Artisan</th>
                  <th className="pb-2 text-left w-[10%]">Category</th>
                  <th className="pb-2 text-center w-[13%]">Status</th>
                  <th className="pb-2 text-center w-[11%]">Total Cost</th>
                  <th className="pb-2 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {filteredOrders.map((order) => {
                  const isComplete = order.status === 'Complete';
                  const isQC = order.status === 'Quality Control';
                  const displayCategory = getCategoryBySku(order.sku) || order.department || 'N/A';
                  return (
                    <tr key={order.work_order_id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="py-4 pl-6 rounded-l-[2rem] text-left border-y border-l border-transparent group-hover:border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                            {order.product_image
                              ? <img src={order.product_image} className="w-full h-full object-cover" alt="Product" />
                              : <HiPhoto size={24} className="text-slate-200" />
                            }
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className="text-slate-900 font-black uppercase text-xs mb-0.5 truncate max-w-[200px]">
                              {getProductName(order.sku)}
                            </span>
                            <div className="flex items-center gap-1.5 max-w-[200px]">
                              <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider truncate max-w-[120px]">{order.sku}</span>
                              <span className="text-slate-300 text-[10px] flex-shrink-0">•</span>
                              <span className="text-slate-400 text-[10px] font-bold uppercase whitespace-nowrap flex-shrink-0">{order.quantity_needed} Units</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-left text-slate-700 text-sm border-y border-transparent group-hover:border-slate-100">
                        {order.first_name && order.last_name
                          ? `${order.first_name} ${order.last_name}`
                          : <span className="text-slate-300 italic text-xs">Unassigned</span>
                        }
                      </td>
                      <td className="py-4 text-left text-slate-400 text-[10px] uppercase font-black border-y border-transparent group-hover:border-slate-100 tracking-widest">
                        {displayCategory}
                      </td>
                      <td className="py-4 text-center border-y border-transparent group-hover:border-slate-100">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] uppercase font-black text-white shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-center font-black text-emerald-600 border-y border-transparent group-hover:border-slate-100">
                        ₱{Number(order.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 pr-8 rounded-r-[2rem] text-right border-y border-r border-transparent group-hover:border-slate-100">
                        <div className="flex justify-end gap-2">
                          {isQC && (
                            <button
                              onClick={() => handleOpenComplete(order)}
                              title="Mark as Complete"
                              className="p-3 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-100"
                            >
                              <HiCheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(order)}
                            disabled={isComplete}
                            className={`p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100 ${isComplete ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <HiPencil size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                      No Work Orders Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCompleteModal && completeOrder && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Complete Work Order</h2>
                <p className="text-slate-400 font-bold mt-1 text-xs uppercase tracking-wider truncate max-w-[420px]">
                  WO-{completeOrder.work_order_id} · {completeOrder.sku.length > 20 ? completeOrder.sku.slice(0, 20) + '...' : completeOrder.sku} · {getProductName(completeOrder.sku).length > 25 ? getProductName(completeOrder.sku).slice(0, 25) + '...' : getProductName(completeOrder.sku)}
                </p>
              </div>
              <button
                onClick={() => { setShowCompleteModal(false); setCompleteOrder(null); setCompleteActuals([]); }}
                className="text-slate-300 hover:text-black bg-slate-50 p-2 rounded-full shadow-sm"
              >
                <HiXMark size={24} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 mb-6 flex gap-6 flex-shrink-0">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">Product</p>
                <p className="text-sm font-black text-slate-900 truncate max-w-[160px]">{getProductName(completeOrder.sku)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">Artisan</p>
                <p className="text-sm font-black text-slate-900">{completeOrder.first_name} {completeOrder.last_name}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">Qty to Add to Stock</p>
                <p className="text-sm font-black text-emerald-600">+{completeOrder.quantity_needed} units</p>
              </div>
            </div>

            <form onSubmit={handleCompleteSubmit} className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
              <div className="mb-3">
                <div className="mb-2">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Actual Materials Used</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Variance = Actual − Expected. Positive means over-used, negative means saved.
                  </p>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Material</th>
                        <th className="p-3 text-center w-24">Expected</th>
                        <th className="p-3 text-center w-28">Actual Used</th>
                        <th className="p-3 text-center w-28">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {completeActuals.map((item, index) => {
                        const actualQty = parseInt(item.actual_qty) || 0;
                        const expectedQty = Number(item.expected_qty) || 0;
                        const variance = actualQty - expectedQty;
                        const isOver = variance > 0;
                        return (
                          <tr key={index} className="text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-black text-slate-900 text-[11px]">{item.material_name}</td>
                            <td className="p-3 text-center text-slate-400 font-black text-[11px]">{expectedQty}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 outline-none font-black text-[11px] focus:border-black transition-colors"
                                value={item.actual_qty}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  const updated = [...completeActuals];
                                  updated[index].actual_qty = isNaN(val) ? '' : Math.max(1, val);
                                  setCompleteActuals(updated);
                                }}
                              />
                            </td>
                            <td className="p-3 text-center">
                              {variance === 0 ? (
                                <span className="text-[11px] font-black text-slate-400">—</span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${isOver ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {isOver ? `+${variance} over` : `${variance} saved`}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {completeActuals.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">
                            No materials found for this work order
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex gap-3 flex-wrap">
                  {completeActuals.some(m => (parseInt(m.actual_qty) - Number(m.expected_qty)) > 0) && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0"></span>
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Overage detected — extra stock will be deducted</span>
                    </div>
                  )}
                  {completeActuals.some(m => (parseInt(m.actual_qty) - Number(m.expected_qty)) < 0) && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Under usage — unused materials returned to stock</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest max-w-[220px] leading-relaxed">
                  Only the variance is applied to stock. Expected qty was already deducted on assignment.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowCompleteModal(false); setCompleteOrder(null); setCompleteActuals([]); }}
                    className="px-8 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 py-3 bg-[#002B5B] text-white rounded-xl uppercase text-[10px] font-black shadow-xl hover:bg-blue-900 transition-all tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Completing...' : 'Confirm & Complete'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-8 relative shadow-2xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Update Record</h2>
                <p className="text-slate-400 font-bold mt-1 tracking-tight text-xs uppercase truncate max-w-[400px]">WO-{selectedOrder?.work_order_id} · {selectedOrder?.sku?.length > 25 ? selectedOrder.sku.slice(0, 25) + '...' : selectedOrder?.sku}</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className={`${getStatusColor(editForm.status)} text-white px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] outline-none cursor-pointer border-none shadow-lg tracking-widest`}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="In Production">In Production</option>
                </select>
                <button onClick={() => setShowEditModal(false)} className="text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm">
                  <HiXMark size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-2 gap-8 mb-6 overflow-y-auto pr-2 no-scrollbar flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Product SKU & Name</label>
                      <select
                        required
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs"
                        value={editForm.sku}
                        onChange={e => {
                          const newSku = e.target.value;
                          setEditForm({ ...editForm, sku: newSku, category: getCategoryBySku(newSku) || '' });
                        }}
                      >
                        <option value="">Select Product...</option>
                        {finishedGoods.map(fg => (
                          <option key={fg.sku} value={fg.sku}>{fg.sku} - {fg.name || fg.collection}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Quantity</label>
                      <input
                        type="number" min="1" step="1" required
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs"
                        value={editForm.quantity}
                        onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Category</label>
                      <select
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs"
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="">Select category...</option>
                        <option>Earrings</option>
                        <option>Necklace</option>
                        <option>Bracelets</option>
                        <option>Bag</option>
                        <option>Accessory</option>
                      </select>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Date</label>
                      <input
                        type="date"
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs"
                        value={editForm.target_date}
                        onChange={e => setEditForm({ ...editForm, target_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assigned Artisan</label>
                    <select
                      className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs"
                      value={editForm.artisan_id}
                      onChange={e => setEditForm({ ...editForm, artisan_id: e.target.value })}
                    >
                      <option value="">Select Artisan...</option>
                      {artisans.filter(a => a.status === 'Active').map(a => (
                        <option key={a.artisan_id} value={a.artisan_id}>{a.first_name} {a.last_name} — {a.department}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-center mb-4 flex-shrink-0">
                    <div className="w-28 h-28 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                      {editForm.product_image
                        ? <img src={editForm.product_image} className="w-full h-full object-cover" alt="Product" />
                        : <HiPhoto size={40} className="text-slate-200" />
                      }
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <p className="text-white text-[9px] font-black uppercase text-center px-1">Change Photo</p>
                      </div>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-tighter">Raw Materials</h3>
                      <button type="button" onClick={addMaterialRow} className="bg-black text-white p-1.5 rounded-lg hover:scale-110 transition-all shadow-lg">
                        <HiPlusSmall size={20} />
                      </button>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-y-auto no-scrollbar bg-white flex-1 max-h-[180px]">
                      <table className="w-full text-left text-xs border-separate border-spacing-0">
                        <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black border-b sticky top-0 z-10">
                          <tr>
                            <th className="p-2">Material</th>
                            <th className="p-2 text-center w-16">Qty</th>
                            <th className="p-2 text-center w-20">Cost</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {editForm.selectedMaterials.map((item, index) => (
                            <tr key={index} className="text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                              <td className="p-2 text-left">
                                <select
                                  className="bg-transparent outline-none w-full font-black cursor-pointer text-slate-900 text-[11px]"
                                  value={item.material_id}
                                  onChange={e => handleMaterialChange(index, 'material_id', e.target.value)}
                                >
                                  <option value="">Choose...</option>
                                  {materials.map(m => (
                                    <option key={m.material_id} value={m.material_id}>{m.material_name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number" min="1" step="1"
                                  className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 outline-none font-black text-[11px]"
                                  value={item.qty}
                                  onChange={e => handleMaterialChange(index, 'qty', e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center text-slate-400 font-black text-[10px]">
                                ₱{(Number(item.cost) || 0).toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setEditForm({ ...editForm, selectedMaterials: editForm.selectedMaterials.filter((_, i) => i !== index) })}
                                >
                                  <HiTrash className="text-rose-400 hover:text-rose-600 transition-colors" size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {editForm.selectedMaterials.length === 0 && (
                            <tr>
                              <td colSpan="4" className="py-6 text-center text-slate-300 font-black text-[10px] uppercase">No materials added</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-6">
                  <span className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Estimated Cost</span>
                  <span className="text-3xl font-black text-emerald-600 tracking-tighter italic">
                    ₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-8 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 bg-black text-white rounded-xl uppercase text-[10px] font-black shadow-2xl hover:bg-stone-800 transition-all tracking-widest"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}