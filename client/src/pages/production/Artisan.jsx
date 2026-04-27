import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  HiMagnifyingGlass, HiPlusSmall, HiXMark, HiPhoto,
  HiChevronLeft, HiChevronRight, HiTrash, HiShieldCheck,
  HiCheckCircle, HiXCircle
} from 'react-icons/hi2';

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in duration-300">
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess ? <HiCheckCircle size={44} className="text-emerald-500" /> : <HiXCircle size={44} className="text-rose-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className="text-slate-800 font-bold text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg
            ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}
        >
          Got it
        </button>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </div>
    </div>
  );
};

export default function Artisan() {
  const [artisans, setArtisans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
  const [movingToQC, setMovingToQC] = useState(null);
  const [alert, setAlert] = useState(null);

  const cardWidth = 240;
  const gap = 16;
  const woScrollRef = useRef(null);
  const ipScrollRef = useRef(null);

  const [assignForm, setAssignForm] = useState({
    artisan_id: '', target_date: '', quantity_needed: '', selectedMaterials: []
  });

  const showAlert = useCallback((message, type = 'success') => setAlert({ message, type }), []);
  const closeAlert = useCallback(() => setAlert(null), []);

  const fetchData = async () => {
    try {
      const [artRes, matRes, fgRes, woRes] = await Promise.all([
        axios.get('http://localhost:5000/api/artisans'),
        axios.get('http://localhost:5000/api/materials'),
        axios.get('http://localhost:5000/api/finished_goods'),
        axios.get('http://localhost:5000/api/artisan_work_orders'),
      ]);
      setArtisans(artRes.data.artisans || []);
      setMaterials(matRes.data || []);
      setFinishedGoods(fgRes.data || []);
      setWorkOrders(woRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getProductName = (sku) => {
    const product = finishedGoods.find(fg => fg.sku === sku);
    return product ? product.name : 'Unknown Product';
  };

  useEffect(() => { fetchData(); }, []);

  const pendingOrders = workOrders.filter(wo => wo.status === 'Pending' || wo.status === 'pending');
  const inProductionOrders = workOrders.filter(wo => wo.status === 'In Production');

  const filteredPendingOrders = pendingOrders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (order.sku || '').toLowerCase().includes(s) || getProductName(order.sku).toLowerCase().includes(s);
  });

  const filteredIPOrders = inProductionOrders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (order.sku || '').toLowerCase().includes(s) || getProductName(order.sku).toLowerCase().includes(s) || (order.first_name || '').toLowerCase().includes(s) || (order.last_name || '').toLowerCase().includes(s);
  });

  const scroll = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * (cardWidth + gap) * 2, behavior: 'smooth' });
    }
  };

  const handleMoveToQC = async (order) => {
    setMovingToQC(order.work_order_id);
    try {
      await axios.put(`http://localhost:5000/api/work_orders/${order.work_order_id}`, {
        status: 'Quality Control',
        artisan_id: order.artisan_id,
        quantity: order.quantity_needed,
        sku: order.sku,
        target_date: order.target_date?.split('T')[0] || '',
        product_image: order.product_image || null,
        selectedMaterials: [],
      });
      await fetchData();
      showAlert(`Work Order WO-${order.work_order_id} moved to Quality Control!`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to move to QC.', 'error');
    } finally {
      setMovingToQC(null);
    }
  };

  const handleOpenAssign = (order) => {
    setSelectedPendingOrder(order);
    setAssignForm({ artisan_id: '', target_date: '', quantity_needed: order.quantity_needed, selectedMaterials: [] });
    setShowAssignModal(true);
  };

  const addMaterialToAssign = () => {
    setAssignForm({ ...assignForm, selectedMaterials: [...assignForm.selectedMaterials, { material_id: '', qty: 0, cost: 0, total: 0 }] });
  };

  const handleAssignMaterialChange = (index, field, value) => {
    const updated = [...assignForm.selectedMaterials];
    if (field === 'qty') {
      updated[index].qty = Number(value) || 0;
    } else if (field === 'material_id') {
      updated[index].material_id = value;
      const mat = materials.find(m => m.material_id === parseInt(value));
      updated[index].cost = mat ? Number(mat.cost_per_unit) : 0;
    }
    updated[index].total = Number(updated[index].qty) * Number(updated[index].cost);
    setAssignForm({ ...assignForm, selectedMaterials: updated });
  };

  const calculateAssignSubtotal = () => assignForm.selectedMaterials.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handleAssignOrder = async (e) => {
    e.preventDefault();
    const validMaterials = assignForm.selectedMaterials.filter(m => m.material_id !== '' && Number(m.qty) > 0);

    if (!assignForm.artisan_id) { showAlert('Please select an artisan.', 'error'); return; }
    if (validMaterials.length === 0) { showAlert('Please add materials.', 'error'); return; }

    const payload = {
      sku: selectedPendingOrder.sku,
      quantity: parseInt(assignForm.quantity_needed),
      category: selectedPendingOrder.category || selectedPendingOrder.department || '',
      target_date: assignForm.target_date,
      artisan_id: parseInt(assignForm.artisan_id),
      status: 'In Production',
      product_image: selectedPendingOrder.product_image || null,
      selectedMaterials: validMaterials.map(m => ({
        material_id: parseInt(m.material_id),
        qty: Number(m.qty),
        cost: Number(m.cost)
      }))
    };

    try {
      await axios.put(`http://localhost:5000/api/work_orders/${selectedPendingOrder.work_order_id}`, payload);
      setShowAssignModal(false);
      fetchData();
      showAlert(`Work Order WO-${selectedPendingOrder.work_order_id} assigned successfully!`, 'success');
    } catch (err) {
  const raw = err.response?.data?.error || err.message || '';
  if (raw.startsWith('INSUFFICIENT_STOCK::')) {
    const [, name, needed, available] = raw.split('::');
    showAlert(`Not enough stock for "${name}". Needed: ${needed}, Available: ${available}.`, 'error');
  } else {
    showAlert(raw || 'Failed to assign.', 'error');
  }
  };
} 
  const PendingCard = ({ order }) => (
    <div className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left flex-shrink-0" style={{ width: `${cardWidth}px` }}>
      <div className="flex justify-between items-start mb-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-600 text-[8px] font-black uppercase">New</span>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0 flex items-center justify-center">
          {order.product_image ? <img src={order.product_image} className="w-full h-full object-cover" alt="Product" /> : <HiPhoto size={18} className="text-slate-200" />}
        </div>
      </div>
      <div className="mb-1 w-full overflow-hidden text-left">
        <p className="font-black text-xs text-slate-900 leading-tight truncate" title={getProductName(order.sku)}>{getProductName(order.sku)}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">{order.sku}</p>
      </div>
      <div className="w-fit px-2.5 py-0.5 rounded-lg text-[8px] font-bold text-white mb-2 bg-amber-500 uppercase tracking-widest">Pending</div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-[10px] text-left">
        <p className="text-slate-700 font-semibold">Qty: <span className="font-black text-slate-900">{order.quantity_needed} units</span></p>
        <p className="text-slate-400 text-[9px] uppercase font-bold mt-0.5">WO-{order.work_order_id}</p>
      </div>
      <button onClick={() => handleOpenAssign(order)} className="w-full py-2 rounded-xl bg-black text-white text-[8px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto shadow-sm">
        Assign Artisan & Materials
      </button>
    </div>
  );

  const ProductionCard = ({ order }) => (
    <div className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left flex-shrink-0" style={{ width: `${cardWidth}px` }}>
      <div className="flex justify-between items-start mb-3 text-left">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-left">
          <span className="text-emerald-600 text-[8px] font-black uppercase">Prod</span>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0 flex items-center justify-center">
          {order.product_image ? <img src={order.product_image} className="w-full h-full object-cover" alt="Product" /> : <HiPhoto size={18} className="text-slate-200" />}
        </div>
      </div>
      <div className="mb-1 w-full overflow-hidden text-left">
        <p className="font-black text-xs text-slate-900 leading-tight truncate uppercase" title={getProductName(order.sku)}>{getProductName(order.sku)}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">{order.sku}</p>
      </div>
      <div className="w-fit px-2.5 py-0.5 rounded-lg text-[8px] font-bold text-white mb-2 bg-[#1D7A1D] uppercase tracking-widest">In Production</div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-[10px] text-left">
        <p className="text-slate-700 font-semibold">Qty: <span className="font-black text-slate-900">{order.quantity_needed} units</span></p>
        {order.first_name && <p className="text-slate-500 text-[9px] font-black truncate mt-0.5 uppercase tracking-tighter">{order.first_name} {order.last_name}</p>}
        <p className="text-slate-400 text-[9px] uppercase font-bold mt-0.5">WO-{order.work_order_id}</p>
      </div>
      <button
        onClick={() => handleMoveToQC(order)}
        disabled={movingToQC === order.work_order_id}
        className="w-full py-2 rounded-xl bg-black text-white text-[8px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
      >
        <HiShieldCheck size={12} />
        {movingToQC === order.work_order_id ? 'Moving...' : 'Move to QC'}
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden text-left">
      <AlertDialog alert={alert} onClose={closeAlert} />

      <div className="flex-shrink-0 bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-4 lg:mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search work orders, artisans, or SKU..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3 lg:py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 text-sm shadow-none focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6 pb-24 lg:pb-10 min-h-0 text-left">
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm p-4 lg:p-6 flex flex-col min-h-0 text-left">
            <div className="flex justify-between items-center mb-4 lg:mb-5 flex-shrink-0">
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap text-left">
                  <h2 className="text-base lg:text-xl font-black uppercase text-slate-900 leading-none tracking-tighter">Work Order Requests</h2>
                  {pendingOrders.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{pendingOrders.length} Pending</span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Setup Production Pipeline</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => scroll(woScrollRef, -1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all"><HiChevronLeft size={16} /></button>
                <button onClick={() => scroll(woScrollRef, 1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all"><HiChevronRight size={16} /></button>
              </div>
            </div>
            {filteredPendingOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-slate-300 font-black uppercase text-[9px] tracking-widest italic">No requests available</div>
            ) : (
              <div ref={woScrollRef} className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                {filteredPendingOrders.map(order => <PendingCard key={order.work_order_id} order={order} />)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm p-4 lg:p-6 flex flex-col min-h-0 text-left">
            <div className="flex justify-between items-center mb-4 lg:mb-5 flex-shrink-0 text-left">
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap text-left">
                  <h2 className="text-base lg:text-xl font-black uppercase text-slate-900 leading-none tracking-tighter">In Production</h2>
                  {inProductionOrders.length > 0 && (
                    <span className="bg-[#1D7A1D] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{inProductionOrders.length} Active</span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Ongoing Artisan Craftsmanship</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => scroll(ipScrollRef, -1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all"><HiChevronLeft size={16} /></button>
                <button onClick={() => scroll(ipScrollRef, 1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all"><HiChevronRight size={16} /></button>
              </div>
            </div>
            {filteredIPOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-slate-300 font-black uppercase text-[9px] tracking-widest italic">No active production</div>
            ) : (
              <div ref={ipScrollRef} className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                {filteredIPOrders.map(order => <ProductionCard key={order.work_order_id} order={order} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && selectedPendingOrder && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-4 lg:p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] w-full max-w-2xl p-6 lg:p-10 relative shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden text-left">
            <div className="flex justify-between items-start mb-4 lg:mb-6 flex-shrink-0 text-left">
              <div className="text-left">
                <h2 className="text-xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Assign Work Order</h2>
                <p className="text-slate-400 font-black mt-2 text-[10px] uppercase tracking-[0.15em]">WO-{selectedPendingOrder.work_order_id} · {selectedPendingOrder.sku}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-300 hover:text-black bg-slate-50 p-2 rounded-full shadow-sm"><HiXMark size={24} /></button>
            </div>
            <form onSubmit={handleAssignOrder} className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-6 overflow-y-auto pr-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assign Artisan</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs border-none shadow-none" value={assignForm.artisan_id} onChange={e => setAssignForm({ ...assignForm, artisan_id: e.target.value })}>
                    <option value="">Select Personnel...</option>
                    {artisans.filter(a => a.status === 'Active').map(a => (
                      <option key={a.artisan_id} value={a.artisan_id}>{a.first_name} {a.last_name} — {a.department}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Date</label>
                  <input type="date" required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs border-none shadow-none" value={assignForm.target_date} onChange={e => setAssignForm({ ...assignForm, target_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Output Quantity</label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-2">Required: {selectedPendingOrder.quantity_needed} Units</span>
                  <input type="number" min="1" step="1" required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-black text-sm border-none shadow-none" value={assignForm.quantity_needed} onChange={e => setAssignForm({ ...assignForm, quantity_needed: e.target.value })} />
                </div>
              </div>
              <div className="text-left">
                <div className="flex justify-between items-center mb-2 text-left">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Material Allocation</h3>
                  <button type="button" onClick={addMaterialToAssign} className="bg-black text-white p-1.5 rounded-lg hover:bg-stone-800 transition-all shadow-md"><HiPlusSmall size={18} /></button>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-y-auto bg-white max-h-[180px]">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black sticky top-0 z-10 text-left">
                      <tr>
                        <th className="p-3">Resource</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-center">In-Stock</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-left">
                      {assignForm.selectedMaterials.map((item, index) => {
                        const mat = materials.find(m => m.material_id === parseInt(item.material_id));
                        return (
                          <tr key={index} className="text-slate-600 font-bold hover:bg-slate-50 transition-colors text-left">
                            <td className="p-3 text-left">
                              <select className="bg-transparent outline-none w-full font-black cursor-pointer text-slate-900 text-[11px] border-none" value={item.material_id} onChange={e => handleAssignMaterialChange(index, 'material_id', e.target.value)}>
                                <option value="">Select Resource...</option>
                                    {materials
                                      .sort((a, b) => (a.material_name || "").localeCompare(b.material_name || ""))
                                      .map(m => (
                                        <option key={m.material_id} value={m.material_id}>
                                          {m.material_name}
                                        </option>
                                    ))}                              
                                    </select>
                            </td>
                            <td className="p-3 text-center">
                              <input type="number" min="1" step="1" className="w-12 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-black text-[11px]" value={item.qty} onChange={e => handleAssignMaterialChange(index, 'qty', e.target.value)} />
                            </td>
                            <td className="p-3 text-center text-[10px] font-black text-slate-400 uppercase">{mat?.stock_unit || '---'}</td>
                            <td className="p-3 text-center text-[10px] font-black">
                              {mat ? <span className={parseInt(mat.stock_quantity) < item.qty ? 'text-rose-500' : 'text-emerald-500'}>{mat.stock_quantity}</span> : '---'}
                            </td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => setAssignForm({ ...assignForm, selectedMaterials: assignForm.selectedMaterials.filter((_, i) => i !== index) })}>
                                <HiTrash className="text-rose-400 hover:text-rose-600" size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {assignForm.selectedMaterials.length === 0 && (
                        <tr><td colSpan="5" className="py-10 text-center text-slate-300 font-black text-[9px] uppercase tracking-widest italic">Inventory list is empty</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 mt-auto flex-shrink-0 gap-4 text-left">
                <div className="flex flex-col text-left">
                  <span className="text-slate-400 font-black uppercase text-[8px] tracking-[0.2em]">Estimated Overhead</span>
                  <span className="text-2xl font-black text-emerald-600 tracking-tighter leading-none">₱{calculateAssignSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto text-left">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 sm:flex-none px-6 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                  <button type="submit" className="flex-1 sm:flex-none px-8 py-3 bg-black text-white rounded-xl uppercase text-[10px] font-black shadow-xl hover:bg-stone-800 transition-all tracking-widest active:scale-95">Assign WO</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}