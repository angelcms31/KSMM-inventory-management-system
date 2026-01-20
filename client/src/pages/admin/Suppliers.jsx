import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiOutlineSearch, 
  HiDotsHorizontal, HiOutlineTruck, HiOutlineClipboardList, 
  HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineExternalLink 
} from "react-icons/hi";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierHistory, setSupplierHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const initialFormState = { name: '', email: '', phone: '' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      const resSuppliers = await axios.get(`http://localhost:5000/api/suppliers`, { 
        params: { search: searchTerm } 
      });
      setSuppliers(resSuppliers.data || []);

      const resOrders = await axios.get(`http://localhost:5000/api/all_orders`);
      setOrders(resOrders.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error("Data fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [searchTerm]);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add_supplier", formData);
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchData();
      alert("Supplier added successfully!");
    } catch (err) { 
      alert("Error adding supplier"); 
    }
  };

  const openHistory = async (sup) => {
    setSelectedSupplier(sup);
    try {
      const res = await axios.get(`http://localhost:5000/api/supplier/orders/${sup.supplier_id}`);
      setSupplierHistory(res.data || []);
      setShowHistoryModal(true);
    } catch (err) {
      console.error("History fetch error:", err);
      setSupplierHistory([]);
      setShowHistoryModal(true);
    }
  };

  const totalExpenditure = orders.reduce((acc, curr) => acc + parseFloat(curr.total_value || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'In Transit').length;

  if (loading && searchTerm === "") {
    return <div className="h-screen flex items-center justify-center font-bold text-gray-500 animate-pulse">Loading Suppliers...</div>;
  }

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden text-sm">
      <div className="flex-1 overflow-y-auto px-10 pt-6 pb-6 custom-scrollbar">
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Suppliers</h1>
            <p className="text-gray-400 text-xs">Procurement and Supplier Relationship Management</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-md hover:scale-105 transition-all">
            <HiOutlinePlus size={16} /> Add Supplier
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Suppliers", val: suppliers.length, icon: <HiOutlineTruck />, color: "text-blue-500" },
            { label: "Total Orders", val: orders.length, icon: <HiOutlineClipboardList />, color: "text-purple-500" },
            { label: "Pending Orders", val: pendingOrdersCount, icon: <HiOutlineClock />, color: "text-orange-500" },
            { label: "Expenditure", val: `₱${totalExpenditure.toLocaleString()}`, icon: <HiOutlineCurrencyDollar />, color: "text-green-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{stat.label}</p>
              <h2 className="text-xl font-black mt-1 text-gray-800">{stat.val}</h2>
              <div className={`absolute top-3 right-3 text-lg opacity-20 ${stat.color}`}>{stat.icon}</div>
            </div>
          ))}
        </div>

        <div className="relative mb-4 max-w-sm">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search company or email..." 
            className="w-full bg-white border border-gray-100 rounded-xl py-2 pl-10 pr-4 outline-none text-xs shadow-sm focus:ring-1 ring-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm relative group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 text-gray-300">
                    <HiOutlineTruck size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-800 truncate">{sup.name}</h3>
                    <span className="bg-green-100 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase">Active Partner</span>
                  </div>
                  <button className="text-gray-300 hover:text-black"><HiDotsHorizontal size={18} /></button>
                </div>

                <div className="bg-[#FBFBFB] rounded-xl p-3 mb-3 text-[10px]">
                  <div className="flex justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="text-gray-400 font-bold uppercase tracking-tighter">ID: SUP-{sup.supplier_id}</span>
                    <span className="text-gray-600 font-black">Dept. Lead</span>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-gray-500 truncate"><HiOutlineMail size={14}/> {sup.email}</p>
                    <p className="flex items-center gap-2 text-gray-600 font-bold"><HiOutlinePhone size={14}/> {sup.contact_no}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openHistory(sup)} className="flex-1 bg-gray-100 text-gray-600 text-[9px] font-black py-2 rounded-lg uppercase tracking-wider hover:bg-black hover:text-white transition-all">
                    View History
                  </button>
                  <button className="p-2 bg-gray-50 text-gray-300 rounded-lg hover:text-black">
                    <HiOutlineExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm overflow-hidden">
            <h3 className="text-xs font-black mb-4 text-gray-400 uppercase tracking-widest">Recent Procurement</h3>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Supplier</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-gray-700">
                  {orders.map((order, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-none">
                      <td className="py-3 text-gray-400">ORD-{order.order_id}</td>
                      <td className="py-3">{order.supplier_name || 'N/A'}</td>
                      <td className="py-3 text-right font-black">₱{parseFloat(order.total_value).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${order.status === 'Received' ? 'bg-green-500' : 'bg-orange-400'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl overflow-hidden">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black"><HiX size={24}/></button>
            <h2 className="text-2xl font-black mb-6 text-gray-900 tracking-tighter">New Partner</h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 ml-1 uppercase">Company Name</label>
                <input required className="w-full bg-[#EEEEEE] rounded-lg p-2 outline-none text-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 ml-1 uppercase">Email Address</label>
                <input required type="email" className="w-full bg-[#EEEEEE] rounded-lg p-2 outline-none text-xs" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 ml-1 uppercase">Contact Number</label>
                <input required className="w-full bg-[#EEEEEE] rounded-lg p-2 outline-none text-xs" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 bg-black text-white rounded-xl py-3 text-[11px] font-black uppercase tracking-widest shadow-lg">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 relative shadow-2xl overflow-hidden">
            <button onClick={() => setShowHistoryModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><HiX size={24}/></button>
            <h2 className="text-xl font-black mb-2 text-gray-900 tracking-tight">{selectedSupplier?.name}</h2>
            <p className="text-gray-400 font-bold mb-6 uppercase text-[10px] tracking-widest">Transaction Records</p>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-gray-300 uppercase border-b border-gray-50">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierHistory.map((h, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-none">
                      <td className="py-3 font-bold text-[11px] text-gray-400">ORD-{h.order_id}</td>
                      <td className="py-3 text-[11px] font-bold text-gray-700">{h.product_name}</td>
                      <td className="py-3 text-right text-[11px] font-black text-gray-800">₱{parseFloat(h.total_value || 0).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {supplierHistory.length === 0 && <p className="py-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">No order records found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;