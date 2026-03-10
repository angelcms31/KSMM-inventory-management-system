import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineClipboardList,
  HiOutlinePhotograph, HiChevronLeft, HiChevronRight, HiX
} from 'react-icons/hi';

export default function PurchaseOrder() {
  const { onCompose } = useOutletContext() || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(0);
  const [lowStockPage, setLowStockPage] = useState(0);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [userName, setUserName] = useState('');
  const [suggestedQty, setSuggestedQty] = useState(null);

  // Deliver modal state
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliverOrderId, setDeliverOrderId] = useState(null);
  const [deliverTotalAmount, setDeliverTotalAmount] = useState('');

  const itemsPerPage = 5;
  const lowStockPerPage = 4;

  const loggedInUserId = localStorage.getItem('user_id');

  const [formData, setFormData] = useState({
    supplier_id: '',
    material_id: '',
    ordered_quantity: '',
    expected_delivery: '',
    status: 'Pending'
  });

  const fetchUserName = async () => {
    if (!loggedInUserId) { setUserName('Guest'); return; }
    try {
      const res = await axios.get(`http://localhost:5000/api/user/name/${loggedInUserId}`);
      setUserName(res.data.name || 'User');
    } catch {
      setUserName('User');
    }
  };

  const fetchData = async () => {
    try {
      const [resOrders, resSuppliers, resMaterials] = await Promise.all([
        axios.get('http://localhost:5000/api/all_orders'),
        axios.get('http://localhost:5000/api/suppliers'),
        axios.get('http://localhost:5000/api/materials')
      ]);
      setOrders(resOrders.data || []);
      setSuppliers(resSuppliers.data || []);
      setMaterials(resMaterials.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserName();
  }, []);

  const activeSuppliers = suppliers.filter(s => s.status === 'Active');

  const lowStockMaterials = materials.filter(m => {
    const isLow = parseInt(m.stock_quantity) <= parseInt(m.reorder_threshold);
    const hasActivePO = orders.some(o =>
      parseInt(o.material_id) === parseInt(m.material_id) &&
      (o.status === 'Ongoing' || o.status === 'Pending')
    );
    return isLow && !hasActivePO;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500';
      case 'Pending': return 'bg-amber-500';
      case 'Ongoing': return 'bg-blue-600';
      default: return 'bg-slate-400';
    }
  };

  const filteredOrders = orders.filter(order => {
    const sTerm = searchTerm.toLowerCase();
    const poString = `PO-${order.assignment_id}`.toLowerCase();
    const matchesSearch =
      poString.includes(sTerm) ||
      (order.supplier_name || '').toLowerCase().includes(sTerm) ||
      (order.material_name || '').toLowerCase().includes(sTerm) ||
      (order.requisitioner_name || '').toLowerCase().includes(sTerm);
    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentOrders = filteredOrders.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Open deliver modal — user enters actual total amount upon delivery
  const handleReceiveClick = (order) => {
    setDeliverOrderId(order.assignment_id);
    setDeliverTotalAmount('');
    setShowDeliverModal(true);
  };

  const handleConfirmDeliver = async () => {
    if (!deliverTotalAmount || isNaN(deliverTotalAmount) || parseFloat(deliverTotalAmount) <= 0) {
      alert('Please enter a valid total amount.');
      return;
    }
    try {
      await axios.patch(`http://localhost:5000/api/orders/receive/${deliverOrderId}`, {
        total_amount: deliverTotalAmount
      });
      setShowDeliverModal(false);
      setDeliverOrderId(null);
      setDeliverTotalAmount('');
      fetchData();
    } catch {
      alert('Error updating order');
    }
  };

  const handleEditClick = (order) => {
    setIsEdit(true);
    setSelectedOrderId(order.assignment_id);
    setSuggestedQty(null);
    setFormData({
      supplier_id: order.supplier_id || '',
      material_id: order.material_id || '',
      ordered_quantity: order.ordered_quantity || '',
      status: order.status || 'Ongoing',
      expected_delivery: order.expected_delivery
        ? new Date(order.expected_delivery).toISOString().split('T')[0]
        : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, user_id: loggedInUserId };
    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/orders/${selectedOrderId}`, payload);
      } else {
        const res = await axios.post('http://localhost:5000/api/create_order', { ...payload, status: 'Ongoing' });

        const supplier = suppliers.find(s => parseInt(s.supplier_id) === parseInt(formData.supplier_id));
        const material = materials.find(m => parseInt(m.material_id) === parseInt(formData.material_id));

        if (supplier?.email && onCompose) {
          const deliveryDate = formData.expected_delivery
            ? new Date(formData.expected_delivery).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—';

          const defaultBody = `Dear ${supplier.name},\n\n` +
            `We would like to place the following purchase order:\n\n` +
            `Material: ${material?.material_name || '—'}\n` +
            `Quantity: ${formData.ordered_quantity}\n` +
            `Expected Delivery: ${deliveryDate}\n\n` +
            `Please confirm receipt of this order.\n\n` +
            `Best regards,\n` +
            `Matthew & Melka Team`;

          onCompose({
            to: supplier.email,
            subject: `Purchase Order - Matthew & Melka`,
            body: defaultBody,
          });
        }
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch {
      alert('Action failed.');
    }
  };

  const resetForm = () => {
    setIsEdit(false);
    setSelectedOrderId(null);
    setSuggestedQty(null);
    setFormData({
      supplier_id: '',
      material_id: '',
      ordered_quantity: '',
      expected_delivery: '',
      status: 'Pending'
    });
  };

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 text-left">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center text-left">
        <div className="relative flex-1 text-left">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-left" size={20} />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 text-left"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
        <select
          className="bg-[#F8F9FA] border-none rounded-2xl py-3.5 px-6 font-bold text-slate-600 outline-none cursor-pointer min-w-[180px] text-xs uppercase tracking-wider text-left"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Ongoing</option>
          <option>Delivered</option>
        </select>
      </div>

      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 mb-8 text-left">
        <div className="flex justify-between items-center mb-8 px-2 text-left">
          <div className="text-left">
            <div className="flex items-center gap-3 text-left">
              <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter text-left">
                Restock Queue
              </h1>
              {lowStockMaterials.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider text-left">
                  {lowStockMaterials.length} Critical
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-left">
              Materials requiring immediate replenishment
            </p>
          </div>
          <div className="flex gap-2 text-left">
            <button onClick={() => setLowStockPage(p => Math.max(p - 1, 0))} disabled={lowStockPage === 0} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all text-left"><HiChevronLeft size={20} /></button>
            <button onClick={() => setLowStockPage(p => p + 1)} disabled={lowStockPage >= Math.ceil(lowStockMaterials.length / lowStockPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all text-left"><HiChevronRight size={20} /></button>
          </div>
        </div>

        {lowStockMaterials.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 text-left">
            <HiOutlineClipboardList size={40} className="text-slate-200 mb-2 text-left" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Inventory is healthy. No low stock materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 text-left">
            {lowStockMaterials.slice(lowStockPage * lowStockPerPage, (lowStockPage + 1) * lowStockPerPage).map(m => {
              const suggested = Math.max(m.reorder_threshold * 2 - m.stock_quantity, m.reorder_threshold);
              return (
                <div key={m.material_id} className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left">
                  <div className="flex justify-between items-start mb-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-left">
                      <span className="text-rose-600 text-[9px] font-black uppercase text-left">Low</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-slate-50 flex items-center justify-center shadow-sm text-left">
                      {m.material_image ? <img src={m.material_image} className="w-full h-full object-cover text-left" alt="" /> : <HiOutlinePhotograph size={20} className="text-slate-200 text-left" />}
                    </div>
                  </div>
                  <div className="mb-1 w-full text-left">
                    <p className="font-black text-sm text-slate-900 leading-tight truncate uppercase text-left">{m.material_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 text-left">{m.unique_code}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 my-3 text-[10px] font-black uppercase text-slate-500 tracking-tighter text-left">
                    Current: <span className="text-rose-500 text-left">{m.stock_quantity}</span> / Min: {m.reorder_threshold}
                  </div>
                  <button
                    onClick={() => {
                      resetForm();
                      setSuggestedQty(suggested);
                      setFormData(prev => ({
                        ...prev,
                        material_id: String(m.material_id),
                        ordered_quantity: String(suggested),
                        status: 'Pending'
                      }));
                      setShowModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-black text-white text-[9px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto shadow-md justify-center flex items-center gap-2 text-left"
                  >
                    Create Purchase Order
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col mb-10 text-left">
        <div className="flex justify-between items-center mb-10 px-2 text-left">
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter text-left">Procurement List</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-left">Active and Completed POs</p>
          </div>
          <div className="flex gap-2 text-left">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all text-left"><HiChevronLeft size={20} /></button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all text-left"><HiChevronRight size={20} /></button>
          </div>
        </div>

        <div className="overflow-x-auto text-left">
          <table className="w-full text-center border-separate border-spacing-y-2 text-left">
            <thead className="text-left">
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b text-left">
                <th className="pb-4 text-left">PO ID</th>
                <th className="pb-4 text-left">Supplier</th>
                <th className="pb-4 text-left">Material</th>
                <th className="pb-4 text-center">Arrival Date</th>
                <th className="pb-4 text-left">Requisitioner</th>
                <th className="pb-4 text-left">Status</th>
                <th className="pb-4 text-right pr-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700 text-left">
              {currentOrders.length > 0 ? currentOrders.map((order) => {
                const isDelivered = order.status === 'Delivered';
                return (
                  <tr key={order.assignment_id} className="hover:bg-slate-50 transition-all group text-left">
                    <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 text-sm font-black text-slate-900 uppercase text-left">PO-{order.assignment_id}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 truncate max-w-[120px] uppercase text-xs text-left">{order.supplier_name || 'N/A'}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 truncate max-w-[120px] uppercase text-xs text-left">{order.material_name || 'N/A'}</td>
                    <td className="py-4 text-slate-400 text-[11px] border-y border-transparent group-hover:border-slate-100 text-center uppercase text-left">{order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString('en-CA') : '--'}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 text-[11px] italic text-slate-500 uppercase text-left">{order.requisitioner_name || 'Admin'}</td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className={`px-4 py-1 rounded-lg text-[8px] uppercase font-black text-white shadow-sm ${getStatusStyle(order.status)} text-left`}>
                        {order.status === 'Approved' ? 'Ongoing' : order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 text-left">
                      <div className="flex justify-end gap-2 text-left">
                        {!isDelivered && (
                          <button onClick={() => handleReceiveClick(order)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 shadow-sm text-left"><HiOutlineClipboardList size={18} /></button>
                        )}
                        <button onClick={() => handleEditClick(order)} disabled={isDelivered} className={`p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100 ${isDelivered ? 'opacity-30 cursor-not-allowed' : ''} text-left`}><HiOutlinePencil size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr className="text-left"><td colSpan="7" className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-slate-400 text-xs text-left">No active orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark as Delivered Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-12 relative shadow-2xl">
            <button onClick={() => { setShowDeliverModal(false); setDeliverOrderId(null); setDeliverTotalAmount(''); }} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full"><HiX size={28} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Mark as Delivered</h2>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Confirm the final total amount upon delivery</p>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black block">Final Total Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-xl text-emerald-600 shadow-sm"
                value={deliverTotalAmount}
                onChange={e => setDeliverTotalAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmDeliver()}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button onClick={() => { setShowDeliverModal(false); setDeliverOrderId(null); setDeliverTotalAmount(''); }} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleConfirmDeliver} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl uppercase text-[11px] font-black shadow-xl hover:bg-emerald-700 transition-all tracking-widest">Confirm Delivery</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl text-left">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full text-left"><HiX size={28} /></button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-2 tracking-tighter leading-none text-left">Execute Order</h2>
            <p className="text-xs text-slate-400 mb-8 font-black uppercase tracking-widest text-left">Processing for: <span className="text-black text-left">{userName}</span></p>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-2 gap-6 font-bold text-left">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black text-left">Vendor</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm text-left" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                    <option value="">Select Supplier...</option>
                    {activeSuppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black text-left">Raw Material</label>
                  {/* Locked when editing — material cannot be changed after PO is created */}
                  <div className="w-full bg-slate-100 rounded-2xl p-4 font-bold text-sm text-slate-400 cursor-not-allowed border border-slate-200">
                    {materials.find(m => parseInt(m.material_id) === parseInt(formData.material_id))?.material_name || '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 font-bold text-left items-end">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black text-left">
                    Quantity {suggestedQty !== null && (
                      <span className="text-amber-500 normal-case font-bold tracking-normal text-left">(suggested: {suggestedQty})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm text-left"
                    value={formData.ordered_quantity}
                    onChange={e => setFormData({ ...formData, ordered_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black text-left">Expected Arrival</label>
                  <input type="date" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm text-left" value={formData.expected_delivery} onChange={e => setFormData({ ...formData, expected_delivery: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 justify-end text-left">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all text-left">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl hover:bg-stone-800 transition-all tracking-widest text-left">Confirm & Process</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}