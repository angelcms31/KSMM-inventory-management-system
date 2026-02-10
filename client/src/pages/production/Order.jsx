import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, HiOutlinePencil, HiOutlineClipboardList, 
  HiChevronLeft, HiChevronRight, HiX 
} from 'react-icons/hi';

export default function Order() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(0);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [userName, setUserName] = useState("");
  
  const loggedInUserId = localStorage.getItem("userId");
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    supplier_id: '',
    material_id: '',
    ordered_quantity: '',
    total_amount: '',
    expected_delivery: '',
    status: 'Pending'
  });

  const fetchUserName = async () => {
    if (!loggedInUserId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/user/name/${loggedInUserId}`);
      setUserName(res.data.name || "User");
    } catch (err) {
      setUserName("User");
    }
  };

  const fetchData = async () => {
    try {
      const [resOrders, resSuppliers, resMaterials] = await Promise.all([
        axios.get("http://localhost:5000/api/all_orders"),
        axios.get("http://localhost:5000/api/suppliers"),
        axios.get("http://localhost:5000/api/materials")
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

  const getStatusStyle = (status) => {
    switch (status) {
      case "Received": 
      case "Delivered": return "bg-emerald-500"; 
      case "Pending": return "bg-amber-500"; 
      case "Approved": return "bg-blue-600"; 
      case "Draft": return "bg-slate-400";
      case "Cancelled": return "bg-rose-500";
      default: return "bg-slate-400";
    }
  };

  const filteredOrders = orders.filter(order => {
    const sTerm = searchTerm.toLowerCase();
    const poString = `PO-${order.purchase_order_id}`.toLowerCase();
    const matchesSearch = 
      poString.includes(sTerm) ||
      order.purchase_order_id?.toString().includes(sTerm) ||
      (order.supplier_name || "").toLowerCase().includes(sTerm) ||
      (order.material_name || "").toLowerCase().includes(sTerm) ||
      (order.requisitioner_name || "").toLowerCase().includes(sTerm);
    const matchesStatus = statusFilter === "All Status" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentOrders = filteredOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const activeSuppliers = suppliers.filter(s => s.status === 'Active');

  const handleReceiveOrder = async (id) => {
    if (window.confirm("Mark this order as Received?")) {
      try {
        await axios.patch(`http://localhost:5000/api/orders/receive/${id}`);
        fetchData();
      } catch (err) {
        alert("Error updating order");
      }
    }
  };

  const handleEditClick = (order) => {
    setIsEdit(true);
    setSelectedOrderId(order.purchase_order_id);
    setFormData({
      supplier_id: order.supplier_id || '',
      material_id: order.material_id || '',
      ordered_quantity: order.ordered_quantity || '',
      total_amount: order.total_amount || '',
      status: order.status || 'Pending',
      expected_delivery: order.expected_delivery ? new Date(order.expected_delivery).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loggedInUserId) {
      alert("Error: User session not found.");
      return;
    }
    const payload = { ...formData, user_id: loggedInUserId };
    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/orders/${selectedOrderId}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/create_order", payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert("Action failed.");
    }
  };

  const resetForm = () => {
    setIsEdit(false);
    setSelectedOrderId(null);
    setFormData({
      supplier_id: '',
      material_id: '',
      ordered_quantity: '',
      total_amount: '',
      expected_delivery: '',
      status: 'Pending'
    });
  };

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center">
        <div className="relative flex-1 group">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700" 
            value={searchTerm} 
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}} 
          />
        </div>
        <select 
          className="bg-[#F8F9FA] border-none rounded-2xl py-3.5 px-6 font-bold text-slate-600 outline-none cursor-pointer min-w-[180px] text-xs uppercase tracking-wider" 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Received</option>
          <option>Approved</option>
          <option>Draft</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col mb-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Purchase Orders</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Procurement Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 mr-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} 
                disabled={currentPage === 0} 
                className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"
              >
                <HiChevronLeft size={20}/>
              </button>
              <button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) - 1} 
                className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"
              >
                <HiChevronRight size={20}/>
              </button>
            </div>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }} 
              className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all"
            >
              + Create PO
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b">
                <th className="pb-4">PO #</th>
                <th className="pb-4">Supplier</th>
                <th className="pb-4">Material</th>
                <th className="pb-4 text-center">Expected Arrival</th>
                <th className="pb-4">Requisitioner</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700">
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order.purchase_order_id} className="hover:bg-slate-50 transition-all group">
                    <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 text-sm font-black text-slate-900">
                      PO-{order.purchase_order_id}
                    </td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 truncate max-w-[150px]">
                      {order.supplier_name || "N/A"}
                    </td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 truncate max-w-[150px]">
                      {order.material_name || "N/A"}
                    </td>
                    <td className="py-4 text-slate-400 text-[11px] border-y border-transparent group-hover:border-slate-100 text-center">
                      {order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString('en-CA') : '--'}
                    </td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100 text-sm italic">
                      {order.requisitioner_name || userName}
                    </td>
                    <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                      <span className={`px-4 py-1 rounded-lg text-[8px] uppercase font-black text-white shadow-sm ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                      <div className="flex justify-end gap-2">
                        {order.status === 'Pending' && (
                          <button onClick={() => handleReceiveOrder(order.purchase_order_id)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100">
                            <HiOutlineClipboardList size={18} />
                          </button>
                        )}
                        <button onClick={() => handleEditClick(order)} className="p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100">
                          <HiOutlinePencil size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-slate-400">
                    No Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl animate-in zoom-in duration-300 text-left">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiX size={28}/></button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-4 tracking-tighter leading-none">{isEdit ? "Modify PO" : "Create PO"}</h2>
            <p className="text-sm text-slate-500 mb-8 font-semibold uppercase tracking-widest">Logged as: <span className="text-black font-black">{userName}</span></p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assign Supplier</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                    <option value="">Choose Supplier...</option>
                    {activeSuppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Raw Material</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={formData.material_id} onChange={e => setFormData({...formData, material_id: e.target.value})}>
                    <option value="">Choose Material...</option>
                    {materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Quantity Needed</label>
                  <input type="number" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={formData.ordered_quantity} onChange={e => setFormData({...formData, ordered_quantity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Expected Arrival</label>
                  <input type="date" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={formData.expected_delivery} onChange={e => setFormData({...formData, expected_delivery: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Total Cost (₱)</label>
                  <input type="number" step="0.01" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Status</label>
                  <select 
                    className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Received">Received</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 justify-end">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">{isEdit ? "Save Changes" : "Confirm PO"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}