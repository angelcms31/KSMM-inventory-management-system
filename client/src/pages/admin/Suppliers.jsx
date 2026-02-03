import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiOutlineSearch, 
  HiDotsHorizontal, HiOutlineTruck, HiOutlineClipboardList, 
  HiOutlineClock, HiOutlineCurrencyDollar 
} from "react-icons/hi";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [addFormData, setAddFormData] = useState({ name: '', email: '', contact_no: '' });
  const [updateFormData, setUpdateFormData] = useState({ name: '', email: '', contact_no: '' });

  const fetchData = async () => {
    try {
      const resSuppliers = await axios.get(`http://localhost:5000/api/suppliers`);
      setSuppliers(resSuppliers.data || []);
      const resOrders = await axios.get(`http://localhost:5000/api/all_orders`);
      setOrders(resOrders.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeSuppliersCount = useMemo(() => {
    return suppliers.filter(sup => (sup.status || 'Active') === 'Active').length;
  }, [suppliers]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    return [...suppliers]
      .filter(sup => 
        sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.supplier_id?.toString().includes(searchTerm)
      )
      .sort((a, b) => {
        const statusA = (a.status || 'Active').trim().toLowerCase();
        const statusB = (b.status || 'Active').trim().toLowerCase();
        if (statusA === 'active' && statusB !== 'active') return -1;
        if (statusA !== 'active' && statusB === 'active') return 1;
        return b.supplier_id - a.supplier_id;
      });
  }, [suppliers, searchTerm]);

  const toggleStatus = async (sup) => {
    const newStatus = sup.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await axios.patch(`http://localhost:5000/api/suppliers/status/${sup.supplier_id}`, { status: newStatus });
      fetchData();
      setActiveMenuId(null);
    } catch (err) {
      alert("Error updating status");
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add_supplier", addFormData);
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', contact_no: '' });
      fetchData();
    } catch (err) {
      alert("Error adding supplier");
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/suppliers/${selectedSupplier.supplier_id}`, updateFormData);
      setShowUpdateModal(false);
      fetchData();
    } catch (err) {
      alert("Error updating supplier");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">Syncing_Supplier_Registry...</div>;

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden text-sm">
      <div className="flex-1 overflow-y-auto px-10 pt-8 pb-10 custom-scrollbar">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Suppliers</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Supplier Procurement Management</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            <HiOutlinePlus size={18} /> Add Supplier
          </button>
        </header>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
            <div className="flex justify-between items-start mb-2"><p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Suppliers</p><HiOutlineTruck className="text-gray-300"/></div>
            <h2 className="text-3xl font-black text-gray-900">{activeSuppliersCount}</h2>
            <p className="text-green-500 text-[9px] font-black uppercase mt-1 tracking-tighter">Active Partners</p>
          </div>
          {[
            { label: "Total Orders", val: "0", icon: <HiOutlineClipboardList /> },
            { label: "Pending Orders", val: "0", icon: <HiOutlineClock /> },
            { label: "Total Values", val: "₱0", icon: <HiOutlineCurrencyDollar /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative opacity-60">
              <div className="flex justify-between items-start mb-2"><p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p><span className="text-gray-300">{stat.icon}</span></div>
              <h2 className="text-3xl font-black text-gray-900">{stat.val}</h2>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 max-w-sm">
             <HiOutlineSearch className="text-gray-400" size={20} />
             <input type="text" placeholder="Filter Supplier Name or ID..." className="bg-transparent outline-none font-bold text-gray-600 text-xs w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-8">
            {sortedAndFilteredSuppliers.map((sup) => (
              <div key={sup.supplier_id} className={`border border-gray-100 rounded-[2.5rem] p-6 relative bg-white group transition-all duration-300 ${sup.status === 'Deactivated' ? 'opacity-90 shadow-sm' : 'hover:border-gray-300 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl text-gray-900 tracking-tight uppercase">{sup.name}</h3>
                    <span className={`${sup.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-600'} text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter`}>{sup.status || 'Active'}</span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveMenuId(activeMenuId === sup.supplier_id ? null : sup.supplier_id)} className="text-gray-300 hover:text-black"><HiDotsHorizontal size={24} /></button>
                    {activeMenuId === sup.supplier_id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-20 py-2">
                        <button onClick={() => toggleStatus(sup)} className={`w-full text-left px-4 py-2 font-black text-[10px] uppercase hover:bg-gray-50 ${sup.status === 'Active' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {sup.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-6">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-gray-500"><HiOutlineMail size={14} className="text-gray-300"/> {sup.email}</p>
                  <p className="flex items-center gap-2 text-[11px] font-bold text-gray-500"><HiOutlinePhone size={14} className="text-gray-300"/> {sup.contact_no}</p>
                </div>

                <div className="flex gap-3">
                  <button disabled={sup.status === 'Deactivated'} className={`flex-1 text-[10px] font-black py-3 rounded-xl border uppercase tracking-widest ${sup.status === 'Deactivated' ? 'bg-gray-100 text-gray-300 border-gray-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-black hover:text-white'}`}>History</button>
                  <button disabled={sup.status === 'Deactivated'} onClick={() => { setSelectedSupplier(sup); setUpdateFormData({name: sup.name, email: sup.email, contact_no: sup.contact_no}); setShowUpdateModal(true); }} className={`flex-1 text-[10px] font-black py-3 rounded-xl border uppercase tracking-widest ${sup.status === 'Deactivated' ? 'bg-gray-100 text-gray-300 border-gray-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-black hover:text-white'}`}>Update</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 tracking-tighter">Recent Supplier Orders</h3>
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <th className="px-6 pb-2">Order ID</th><th className="pb-2">Supplier</th><th className="pb-2">Product</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Value</th><th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold text-gray-700">
              <tr className="bg-gray-50/40"><td colSpan="6" className="py-12 text-center text-gray-300 font-black uppercase tracking-[0.3em]">No Recent Activity Found</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || showUpdateModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => { setShowAddModal(false); setShowUpdateModal(false); }} className="absolute top-10 right-10 text-gray-300 hover:text-black"><HiX size={32}/></button>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-8">{showAddModal ? "New Partner" : "Update Records"}</h2>
            <form onSubmit={showAddModal ? handleAddSupplier : handleUpdateSupplier} className="space-y-6 text-left">
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Name</label><input required className="w-full bg-gray-50 rounded-2xl p-5 outline-none font-black text-lg border border-gray-100" value={showAddModal ? addFormData.name : updateFormData.name} onChange={e => showAddModal ? setAddFormData({...addFormData, name: e.target.value}) : setUpdateFormData({...updateFormData, name: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Email</label><input required type="email" className="w-full bg-gray-100 rounded-2xl p-5 outline-none font-black text-lg border border-gray-100" value={showAddModal ? addFormData.email : updateFormData.email} onChange={e => showAddModal ? setAddFormData({...addFormData, email: e.target.value}) : setUpdateFormData({...updateFormData, email: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Contact</label><input required className="w-full bg-gray-100 rounded-2xl p-5 outline-none font-black text-lg border border-gray-100" value={showAddModal ? addFormData.contact_no : updateFormData.contact_no} onChange={e => showAddModal ? setAddFormData({...addFormData, contact_no: e.target.value}) : setUpdateFormData({...updateFormData, contact_no: e.target.value})} /></div>
              <div className="flex gap-4 pt-6"><button type="button" onClick={() => { setShowAddModal(false); setShowUpdateModal(false); }} className="flex-1 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 rounded-2xl hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-black text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-widest shadow-2xl">{showAddModal ? "Save" : "Update"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;