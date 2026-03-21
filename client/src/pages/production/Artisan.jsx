import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  HiMagnifyingGlass, HiPlusSmall, HiXMark, HiPhoto, HiPencil,
  HiChevronLeft, HiChevronRight, HiTrash, HiShieldCheck
} from 'react-icons/hi2';

const UNIT_OPTIONS = [
  { value: '', label: '---' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'inches', label: 'Inches (in)' },
  { value: 'meters', label: 'Meters (m)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'yards', label: 'Yards (yd)' },
  { value: 'grams', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (mL)' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'sheets', label: 'Sheets' },
  { value: 'pairs', label: 'Pairs' },
];

export default function Artisan() {
  const [artisans, setArtisans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInvStatus, setFilterInvStatus] = useState('All Inventory');
  const [showMatModal, setShowMatModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isUpdateMat, setIsUpdateMat] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState(null);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentMatPage, setCurrentMatPage] = useState(0);
  const [movingToQC, setMovingToQC] = useState(null);
  const matsPerPage = 5;
  const cardWidth = 240;
  const gap = 16;

  const woScrollRef = useRef(null);
  const ipScrollRef = useRef(null);

  const [assignForm, setAssignForm] = useState({
    artisan_id: '', target_date: '', quantity_needed: '', selectedMaterials: []
  });

  const [matForm, setMatForm] = useState({
    unique_code: '', cost_per_unit: '', stock_quantity: '',
    reorder_threshold: '', material_image: null, material_name: '', category: '', stock_unit: ''
  });

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

  useEffect(() => {
    if (showMatModal && !isUpdateMat) {
      const code = `MAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setMatForm(prev => ({ ...prev, unique_code: code }));
    }
  }, [showMatModal, isUpdateMat]);

  const pendingOrders = workOrders.filter(wo => wo.status === 'Pending' || wo.status === 'pending');
  const inProductionOrders = workOrders.filter(wo => wo.status === 'In Production');

  const filteredPendingOrders = pendingOrders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (
      (order.sku || '').toLowerCase().includes(s) ||
      getProductName(order.sku).toLowerCase().includes(s)
    );
  });

  const filteredIPOrders = inProductionOrders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (
      (order.sku || '').toLowerCase().includes(s) ||
      getProductName(order.sku).toLowerCase().includes(s) ||
      (order.first_name || '').toLowerCase().includes(s) ||
      (order.last_name || '').toLowerCase().includes(s)
    );
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
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to move to QC.');
    } finally {
      setMovingToQC(null);
    }
  };

  const handleOpenAssign = (order) => {
    setSelectedPendingOrder(order);
    setAssignForm({
      artisan_id: '',
      target_date: '',
      quantity_needed: order.quantity_needed,
      selectedMaterials: []
    });
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

  const calculateAssignSubtotal = () =>
    assignForm.selectedMaterials.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handleAssignOrder = async (e) => {
    e.preventDefault();
    const validMaterials = assignForm.selectedMaterials.filter(m => m.material_id !== '' && Number(m.qty) > 0);
    if (!assignForm.artisan_id) { alert('Please select an artisan.'); return; }
    if (validMaterials.length === 0) { alert('Please add at least one raw material.'); return; }
    const payload = {
      sku: selectedPendingOrder.sku,
      quantity: parseInt(assignForm.quantity_needed),
      category: selectedPendingOrder.category || selectedPendingOrder.department || '',
      target_date: assignForm.target_date,
      artisan_id: parseInt(assignForm.artisan_id),
      status: 'In Production',
      total_cost: calculateAssignSubtotal(),
      product_image: selectedPendingOrder.product_image || null,
      selectedMaterials: validMaterials.map(m => ({ material_id: parseInt(m.material_id), qty: parseInt(m.qty), cost: Number(m.cost) }))
    };
    try {
      await axios.put(`http://localhost:5000/api/work_orders/${selectedPendingOrder.work_order_id}`, payload);
      setShowAssignModal(false);
      setSelectedPendingOrder(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign order.');
    }
  };

  const handleMatSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...matForm,
      stock_quantity: parseInt(matForm.stock_quantity),
      reorder_threshold: parseInt(matForm.reorder_threshold),
      cost_per_unit: parseFloat(matForm.cost_per_unit),
      stock_unit: matForm.stock_unit || null,
    };
    try {
      if (isUpdateMat) {
        await axios.put(`http://localhost:5000/api/materials/${selectedMatId}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/add_material', payload);
      }
      setShowMatModal(false);
      setImagePreview(null);
      setMatForm({ unique_code: '', cost_per_unit: '', stock_quantity: '', reorder_threshold: '', material_image: null, material_name: '', category: '', stock_unit: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); setMatForm({ ...matForm, material_image: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const getStatusStyle = (stock, threshold) =>
    parseInt(stock) > parseInt(threshold) ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white';

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.unique_code.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowStock = parseInt(m.stock_quantity) <= parseInt(m.reorder_threshold);
    const matchesInvStatus = filterInvStatus === 'All Inventory' || (filterInvStatus === 'Low Stock' ? isLowStock : !isLowStock);
    return matchesSearch && matchesInvStatus;
  });

  const currentMaterials = filteredMaterials.slice(currentMatPage * matsPerPage, (currentMatPage + 1) * matsPerPage);

  const PendingCard = ({ order }) => (
    <div
      className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left flex-shrink-0"
      style={{ width: `${cardWidth}px` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-600 text-[8px] font-black uppercase">New</span>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0 flex items-center justify-center">
          {order.product_image ? <img src={order.product_image} className="w-full h-full object-cover" alt="Product" /> : <HiPhoto size={18} className="text-slate-200" />}
        </div>
      </div>
      <div className="mb-1 w-full overflow-hidden">
        <p className="font-black text-xs text-slate-900 leading-tight truncate" title={getProductName(order.sku)}>{getProductName(order.sku)}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">{order.sku}</p>
      </div>
      <div className="w-fit px-2.5 py-0.5 rounded-lg text-[8px] font-bold text-white mb-2 bg-amber-500">Pending</div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-[10px]">
        <p className="text-slate-700 font-semibold">Qty: <span className="font-black text-slate-900">{order.quantity_needed} units</span></p>
        <p className="text-slate-400 text-[9px] uppercase font-bold mt-0.5">WO-{order.work_order_id}</p>
      </div>
      <button
        onClick={() => handleOpenAssign(order)}
        className="w-full py-2 rounded-xl bg-black text-white text-[8px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto"
      >
        Assign Artisan & Materials
      </button>
    </div>
  );

  const ProductionCard = ({ order }) => (
    <div
      className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left flex-shrink-0"
      style={{ width: `${cardWidth}px` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600 text-[8px] font-black uppercase">Prod</span>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0 flex items-center justify-center">
          {order.product_image ? <img src={order.product_image} className="w-full h-full object-cover" alt="Product" /> : <HiPhoto size={18} className="text-slate-200" />}
        </div>
      </div>
      <div className="mb-1 w-full overflow-hidden">
        <p className="font-black text-xs text-slate-900 leading-tight truncate" title={getProductName(order.sku)}>{getProductName(order.sku)}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">{order.sku}</p>
      </div>
      <div className="w-fit px-2.5 py-0.5 rounded-lg text-[8px] font-bold text-white mb-2 bg-[#1D7A1D]">In Production</div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-[10px]">
        <p className="text-slate-700 font-semibold">Qty: <span className="font-black text-slate-900">{order.quantity_needed} units</span></p>
        {order.first_name && (
          <p className="text-slate-500 text-[9px] font-bold truncate mt-0.5">{order.first_name} {order.last_name}</p>
        )}
        <p className="text-slate-400 text-[9px] uppercase font-bold mt-0.5">WO-{order.work_order_id}</p>
      </div>
      <button
        onClick={() => handleMoveToQC(order)}
        disabled={movingToQC === order.work_order_id}
        className="w-full py-2 rounded-xl bg-black text-white text-[8px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <HiShieldCheck size={12} />
        {movingToQC === order.work_order_id ? 'Moving...' : 'Move to Quality Control'}
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      <div className="flex-shrink-0 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentMatPage(0); }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-10 min-h-0">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-5 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black uppercase text-slate-900 leading-none tracking-tighter">Work Order Requests</h2>
                  {pendingOrders.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {pendingOrders.length} Pending
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Assign Artisan & Materials</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => scroll(woScrollRef, -1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all">
                  <HiChevronLeft size={16} />
                </button>
                <button onClick={() => scroll(woScrollRef, 1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all">
                  <HiChevronRight size={16} />
                </button>
              </div>
            </div>

            {filteredPendingOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-slate-300 font-black uppercase text-[9px] tracking-widest">
                No Pending Work Order Requests
              </div>
            ) : (
              <div
                ref={woScrollRef}
                className="flex gap-4 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredPendingOrders.map(order => <PendingCard key={order.work_order_id} order={order} />)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-5 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black uppercase text-slate-900 leading-none tracking-tighter">In Production</h2>
                  {inProductionOrders.length > 0 && (
                    <span className="bg-[#1D7A1D] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {inProductionOrders.length} Active
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Move to Quality Control when ready</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => scroll(ipScrollRef, -1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all">
                  <HiChevronLeft size={16} />
                </button>
                <button onClick={() => scroll(ipScrollRef, 1)} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all">
                  <HiChevronRight size={16} />
                </button>
              </div>
            </div>

            {filteredIPOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-slate-300 font-black uppercase text-[9px] tracking-widest">
                No Orders In Production
              </div>
            ) : (
              <div
                ref={ipScrollRef}
                className="flex gap-4 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredIPOrders.map(order => <ProductionCard key={order.work_order_id} order={order} />)}
              </div>
            )}
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex justify-between items-center mb-10 text-slate-900 px-2">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-left">Raw Materials</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-left">Inventory Management</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                className="bg-[#F8F9FA] border-none rounded-xl py-2 px-3 font-bold text-slate-500 outline-none text-xs cursor-pointer"
                value={filterInvStatus}
                onChange={(e) => setFilterInvStatus(e.target.value)}
              >
                <option>All Inventory</option>
                <option>In Stock</option>
                <option>Low Stock</option>
              </select>
              <div className="flex gap-2 mr-4">
                <button onClick={() => setCurrentMatPage(p => Math.max(p - 1, 0))} disabled={currentMatPage === 0} className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"><HiChevronLeft size={20} /></button>
                <button onClick={() => setCurrentMatPage(p => p + 1)} disabled={currentMatPage >= Math.ceil(filteredMaterials.length / matsPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"><HiChevronRight size={20} /></button>
              </div>
              <button onClick={() => { setIsUpdateMat(false); setShowMatModal(true); }} className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
                + Add Material
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b">
                  <th className="pb-4">Image</th>
                  <th className="pb-4">Material</th>
                  <th className="pb-4">Code</th>
                  <th className="pb-4">Stock</th>
                  <th className="pb-4">Unit</th>
                  <th className="pb-4">Cost</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {currentMaterials.map((m) => (
                  <tr key={m.material_id} className="hover:bg-slate-50 transition-all group">
                    <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">
                      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                        {m.material_image ? <img src={m.material_image} className="w-full h-full object-cover" alt="Material" /> : <HiPhoto className="text-slate-300" size={20} />}
                      </div>
                    </td>
                    <td className="py-4 uppercase text-slate-900 font-black border-y border-transparent group-hover:border-slate-100 truncate max-w-[150px]">{m.material_name}</td>
                    <td className="py-4 text-slate-400 text-[11px] font-bold border-y border-transparent group-hover:border-slate-100">{m.unique_code}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                      <div className="flex flex-col items-center">
                        <span className="text-[14px] text-slate-900 font-black leading-none">{m.stock_quantity}</span>
                        <span className="text-[8px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">Min: {m.reorder_threshold}</span>
                      </div>
                    </td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide">
                        {m.stock_unit || '---'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-900 font-black border-y border-transparent group-hover:border-slate-100">₱{Number(m.cost_per_unit).toFixed(2)}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                      <span className={`px-4 py-1 rounded-lg text-[8px] uppercase font-black ${getStatusStyle(m.stock_quantity, m.reorder_threshold)}`}>
                        {parseInt(m.stock_quantity) > parseInt(m.reorder_threshold) ? 'In Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedMatId(m.material_id);
                          setMatForm({ ...m, stock_unit: m.stock_unit || '' });
                          setIsUpdateMat(true);
                          setShowMatModal(true);
                        }}
                        className="p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100"
                      >
                        <HiPencil size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showAssignModal && selectedPendingOrder && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Assign Work Order</h2>
                <p className="text-slate-400 font-bold mt-1 text-xs uppercase tracking-wider">WO-{selectedPendingOrder.work_order_id} · {selectedPendingOrder.sku} · {getProductName(selectedPendingOrder.sku)}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-300 hover:text-black bg-slate-50 p-2 rounded-full shadow-sm"><HiXMark size={24} /></button>
            </div>
            <form onSubmit={handleAssignOrder} className="flex-1 flex flex-col min-h-0 space-y-6 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assign Artisan</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs" value={assignForm.artisan_id} onChange={e => setAssignForm({ ...assignForm, artisan_id: e.target.value })}>
                    <option value="">Select Artisan...</option>
                    {artisans.filter(a => a.status === 'Active').map(a => (
                      <option key={a.artisan_id} value={a.artisan_id}>{a.first_name} {a.last_name} — {a.department}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Date</label>
                  <input type="date" required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-bold text-xs" value={assignForm.target_date} onChange={e => setAssignForm({ ...assignForm, target_date: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Quantity Needed</label>
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2 ml-2">
                     <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Suggested: {selectedPendingOrder.quantity_needed}</span>
                   </div>
                   <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    required 
                    className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none font-black text-sm border-2 border-transparent focus:border-slate-200 transition-all" 
                    value={assignForm.quantity_needed} 
                    onChange={e => setAssignForm({ ...assignForm, quantity_needed: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Raw Materials</h3>
                  <button type="button" onClick={addMaterialToAssign} className="bg-black text-white p-1.5 rounded-lg hover:scale-110 transition-all shadow-lg"><HiPlusSmall size={20} /></button>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-y-auto bg-white max-h-[200px]">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black border-b sticky top-0 z-10">
                      <tr>
                        <th className="p-2">Material</th>
                        <th className="p-2 text-center w-16">Qty</th>
                        <th className="p-2 text-center w-16">Unit</th>
                        <th className="p-2 text-center w-20">Cost/Unit</th>
                        <th className="p-2 text-center w-16">Stock</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {assignForm.selectedMaterials.map((item, index) => {
                        const mat = materials.find(m => m.material_id === parseInt(item.material_id));
                        return (
                          <tr key={index} className="text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                            <td className="p-2 text-left">
                              <select className="bg-transparent outline-none w-full font-black cursor-pointer text-slate-900 text-[11px]" value={item.material_id} onChange={e => handleAssignMaterialChange(index, 'material_id', e.target.value)}>
                                <option value="">Choose...</option>
                                {materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <input type="number" min="1" step="1" className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 outline-none font-black text-[11px]" value={item.qty} onChange={e => handleAssignMaterialChange(index, 'qty', e.target.value)} />
                            </td>
                            <td className="p-2 text-center text-[10px] font-black text-slate-400 uppercase">
                              {mat?.stock_unit || '---'}
                            </td>
                            <td className="p-2 text-center text-slate-400 font-black text-[10px]">₱{(Number(item.cost) || 0).toFixed(2)}</td>
                            <td className="p-2 text-center text-[10px] font-black">
                              {mat ? (
                                <span className={parseInt(mat.stock_quantity) < item.qty ? 'text-rose-500' : 'text-emerald-500'}>{mat.stock_quantity}</span>
                              ) : (
                                <span className="text-slate-300">---</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => setAssignForm({ ...assignForm, selectedMaterials: assignForm.selectedMaterials.filter((_, i) => i !== index) })}>
                                <HiTrash className="text-rose-400 hover:text-rose-600 transition-colors" size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {assignForm.selectedMaterials.length === 0 && (
                        <tr><td colSpan="6" className="py-6 text-center text-slate-300 font-black text-[10px] uppercase">Add materials to proceed</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Total Cost</span>
                  <span className="text-2xl font-black text-emerald-600 tracking-tighter">₱{calculateAssignSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-8 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" className="px-10 py-3 bg-black text-white rounded-xl uppercase text-[10px] font-black shadow-xl hover:bg-stone-800 transition-all tracking-widest">Confirm & Start Production</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMatModal && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
            <button onClick={() => { setShowMatModal(false); setImagePreview(null); }} className="absolute top-10 right-10 text-gray-400 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm">
              <HiXMark size={28} />
            </button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">
              {isUpdateMat ? 'Modify Material' : 'Register Material'}
            </h2>
            <form onSubmit={handleMatSubmit} className="space-y-6 overflow-y-auto no-scrollbar flex-1 pr-2">
              <div className="flex flex-col items-center mb-10 flex-shrink-0">
                <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                  {imagePreview
                    ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    : matForm.material_image
                      ? <img src={matForm.material_image} className="w-full h-full object-cover" alt="Material" />
                      : <HiPhoto size={40} className="text-slate-200" />
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-[10px] font-black uppercase text-center">Upload Photo</p>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 font-bold text-left">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Material Name</label>
                  <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm" placeholder="Leather" value={matForm.material_name} onChange={e => setMatForm({ ...matForm, material_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Unique Code</label>
                  <input disabled className="w-full bg-[#F3F4F6] rounded-2xl p-4 opacity-50 outline-none cursor-not-allowed font-black text-sm" value={matForm.unique_code} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 font-black">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Current Stock</label>
                  <input type="number" min="0" step="1" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none text-sm" value={matForm.stock_quantity} onChange={e => setMatForm({ ...matForm, stock_quantity: e.target.value })} />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Unit</label>
                  <select className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none text-sm font-black" value={matForm.stock_unit} onChange={e => setMatForm({ ...matForm, stock_unit: e.target.value })}>
                    {UNIT_OPTIONS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Min Threshold</label>
                  <input type="number" min="0" step="1" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none text-sm" value={matForm.reorder_threshold} onChange={e => setMatForm({ ...matForm, reorder_threshold: e.target.value })} />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Unit Price</label>
                  <input type="number" step="0.01" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none text-sm" value={matForm.cost_per_unit} onChange={e => setMatForm({ ...matForm, cost_per_unit: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-1 justify-end flex-shrink-0">
                <button type="button" onClick={() => { setShowMatModal(false); setImagePreview(null); }} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">Confirm Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}