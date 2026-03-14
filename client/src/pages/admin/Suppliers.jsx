import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiOutlineSearch, 
  HiDotsHorizontal, HiOutlineTruck, HiOutlineClipboardList, 
  HiOutlineClock, HiOutlineCurrencyDollar, HiChevronLeft, HiChevronRight
} from "react-icons/hi";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [addFormData, setAddFormData] = useState({ name: '', email: '', contact_no: '' });
  const [updateFormData, setUpdateFormData] = useState({ name: '', email: '', contact_no: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const [procurementPage, setProcurementPage] = useState(0);
  const itemsPerPage = 4;
  const procurementPerPage = 5;

  const fetchData = async () => {
    try {
      const [resSuppliers, resOrders] = await Promise.all([
        axios.get(`http://localhost:5000/api/suppliers`),
        axios.get(`http://localhost:5000/api/all_orders`)
      ]);
      setSuppliers(resSuppliers.data || []);
      setOrders(resOrders.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setSuppliers([]);
      setOrders([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const activePartners = suppliers.filter(sup => (sup.status || 'Active') === 'Active').length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const totalValue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    return { activePartners, totalOrders, pendingOrders, totalValue };
  }, [suppliers, orders]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    return [...suppliers]
      .filter(sup =>
        sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.contact_no?.includes(searchTerm) ||
        sup.supplier_id?.toString().includes(searchTerm)
      )
      .sort((a, b) => {
        const statusA = (a.status || 'Active');
        const statusB = (b.status || 'Active');
        if (statusA === 'Active' && statusB !== 'Active') return -1;
        if (statusA !== 'Active' && statusB === 'Active') return 1;
        return b.supplier_id - a.supplier_id;
      });
  }, [suppliers, searchTerm]);

  const currentSuppliers = sortedAndFilteredSuppliers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const currentOrders = orders.slice(procurementPage * procurementPerPage, (procurementPage + 1) * procurementPerPage);

  const supplierHistory = useMemo(() => {
    if (!selectedSupplier) return [];
    return orders.filter(order => order.supplier_id === selectedSupplier.supplier_id);
  }, [orders, selectedSupplier]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
      case "Received":
      case "Delivered": return "bg-emerald-500";
      case "Deactivated":
      case "Cancelled": return "bg-rose-500";
      case "Pending": return "bg-amber-500";
      case "Approved": return "bg-blue-600";
      default: return "bg-slate-400";
    }
  };

  const handleContactInput = (val, isUpdate = false) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 10) return;
    if (isUpdate) setUpdateFormData({ ...updateFormData, contact_no: cleanVal });
    else setAddFormData({ ...addFormData, contact_no: cleanVal });
  };

  const handleNameInput = (val, isUpdate = false) => {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200d|\u200b|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/g;
    const cleanVal = val.replace(emojiRegex, '');
    if (isUpdate) setUpdateFormData({ ...updateFormData, name: cleanVal });
    else setAddFormData({ ...addFormData, name: cleanVal });
  };

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
    if (addFormData.contact_no.length !== 10) { alert("Contact number must be exactly 10 digits."); return; }
    try {
      await axios.post("http://localhost:5000/api/add_supplier", {
        name: addFormData.name,
        email: addFormData.email,
        phone: addFormData.contact_no
      });
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', contact_no: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Error adding supplier";
      alert(msg);
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (updateFormData.contact_no.length !== 10) { alert("Contact number must be exactly 10 digits."); return; }
    try {
      await axios.put(`http://localhost:5000/api/suppliers/${selectedSupplier.supplier_id}`, updateFormData);
      setShowUpdateModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Error updating supplier";
      alert(msg);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">Loading...</div>;

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name, email or contact..." className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-3">
        {[
          { label: "Total Suppliers", val: stats.activePartners, sub: "Active Partners", icon: <HiOutlineTruck /> },
          { label: "Total Orders", val: stats.totalOrders, sub: "Completed POs", icon: <HiOutlineClipboardList /> },
          { label: "Pending Orders", val: stats.pendingOrders, sub: "Waitlist", icon: <HiOutlineClock /> },
          { label: "Total Values", val: `₱${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Procured Assets", icon: <HiOutlineCurrencyDollar /> }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-30">
            <div className="flex justify-between items-start">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{item.label}</p>
              <span className="text-slate-300 text-xl">{item.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{item.val}</h2>
              <p className="text-slate-400 text-[8px] font-bold uppercase mt-0.5 tracking-tighter">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pb-10">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative h-fit text-left">
          <div className="flex justify-between items-center mb-6 px-2">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 leading-none tracking-tighter">Manage Suppliers</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100"><HiChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(sortedAndFilteredSuppliers.length / itemsPerPage) - 1} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100"><HiChevronRight size={16}/></button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest">+ Add Supplier</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {currentSuppliers.length > 0 ? (
              currentSuppliers.map((sup) => (
                <div key={sup.supplier_id} className={`border border-gray-100 rounded-3xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition-all relative ${sup.status === 'Deactivated' ? 'opacity-80' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400"><HiOutlineTruck size={20} /></div>
                    <div className="relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === sup.supplier_id ? null : sup.supplier_id)} className="text-slate-300 hover:text-black transition-colors"><HiDotsHorizontal size={20} /></button>
                      {activeMenuId === sup.supplier_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 text-left">
                          <button onClick={() => toggleStatus(sup)} className={`w-full text-left px-3 py-1.5 font-black text-[8px] uppercase hover:bg-gray-50 ${sup.status === 'Active' ? 'text-rose-500' : 'text-emerald-500'}`}>{sup.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-black text-base text-slate-900 leading-tight truncate" title={sup.name}>{sup.name}</h3>
                    <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter text-white ${getStatusStyle(sup.status || 'Active')}`}>{sup.status || 'Active'}</div>
                  </div>
                  <div className="space-y-1 mb-5">
                    <p className="flex items-center gap-2 text-[9px] font-bold text-slate-500 truncate" title={sup.email}><HiOutlineMail size={12} className="text-slate-300 flex-shrink-0"/> {sup.email}</p>
                    <p className="flex items-center gap-2 text-[9px] font-bold text-slate-500"><HiOutlinePhone size={12} className="text-slate-300 flex-shrink-0"/> {sup.contact_no ? `+63 ${sup.contact_no}` : 'No Contact'}</p>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button disabled={sup.status === 'Deactivated'} onClick={() => { setSelectedSupplier(sup); setShowHistoryModal(true); }} className="flex-1 text-[8px] font-black py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50">History</button>
                    <button disabled={sup.status === 'Deactivated'} onClick={() => { setSelectedSupplier(sup); setUpdateFormData({name: sup.name, email: sup.email, contact_no: sup.contact_no}); setShowUpdateModal(true); }} className="flex-1 text-[8px] font-black py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50">Edit</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <HiOutlineSearch size={48} className="mb-2 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">No suppliers found</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 h-fit text-left">
          <div className="flex justify-between items-center mb-3 px-2">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-slate-900">Recent Supplier Order</h1>
            </div>
            <div className="flex gap-1 mr-2">
              <button onClick={() => setProcurementPage(p => Math.max(p - 1, 0))} disabled={procurementPage === 0} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronLeft size={16}/></button>
              <button onClick={() => setProcurementPage(p => p + 1)} disabled={procurementPage >= Math.ceil(orders.length / procurementPerPage) - 1} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronRight size={16}/></button>
            </div>
          </div>
          <div className="overflow-hidden border border-slate-100 rounded-3xl">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-5 pl-6 text-left w-[15%]">PO ID</th>
                  <th className="py-5 text-left w-[18%]">Supplier</th>
                  <th className="py-5 text-left w-[20%]">Material</th>
                  <th className="py-5 text-left w-[12%]">Qty</th>
                  <th className="py-5 text-left w-[18%]">Value</th>
                  <th className="py-5 text-left w-[18%]">Date</th>
                  <th className="py-5 text-left w-[17%] pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {currentOrders.map(order => (
                  <tr key={order.purchase_order_id} className="hover:bg-slate-50 transition-all border-b border-slate-50 last:border-none">
                    <td className="py-4 pl-6 text-slate-900 font-black text-xs text-left">PO-{order.purchase_order_id}</td>
                    <td className="py-4 text-left truncate max-w-[120px] text-xs" title={order.supplier_name}>{order.supplier_name}</td>
                    <td className="py-4 text-left truncate max-w-[150px] text-[10px]" title={order.material_name}>{order.material_name}</td>
                    <td className="py-4 text-left text-slate-400 font-black text-xs">{order.ordered_quantity}</td>
                    <td className="py-4 text-left font-black text-emerald-600 text-xs">₱{Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4 text-left text-slate-400 font-black text-[10px]">{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-4 text-left pr-6">
                      <span className={`px-3 py-1 rounded-lg text-[8px] uppercase font-black text-white shadow-sm ${getStatusStyle(order.status)}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showHistoryModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-12 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={() => setShowHistoryModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiX size={28}/></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none truncate max-w-[90%]">{selectedSupplier.name}</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1 text-left">Order Transaction History</p>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 text-left pl-2">PO ID</th><th className="pb-4 text-left">Date</th><th className="pb-4 text-left">Material</th><th className="pb-4 text-center">Qty</th><th className="pb-4 text-right pr-6">Value</th><th className="pb-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-gray-700">
                  {supplierHistory.map(order => (
                    <tr key={order.purchase_order_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 pl-2 font-black">PO-{order.purchase_order_id}</td>
                      <td className="text-slate-400 font-black">{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="truncate max-w-[150px]" title={order.material_name}>{order.material_name}</td>
                      <td className="text-center font-black">{order.ordered_quantity}</td>
                      <td className="text-right font-black text-slate-900 pr-6">₱{Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-center"><span className={`px-3 py-1 rounded-lg text-[8px] uppercase font-black text-white ${getStatusStyle(order.status)}`}>{order.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || showUpdateModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-12 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => { setShowAddModal(false); setShowUpdateModal(false); }} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiX size={28}/></button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">{showAddModal ? "Add Supplier" : "Update Supplier"}</h2>
            <form onSubmit={showAddModal ? handleAddSupplier : handleUpdateSupplier} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Name</label>
                <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? addFormData.name : updateFormData.name} onChange={e => handleNameInput(e.target.value, !showAddModal)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Email Address</label>
                <input required type="email" className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? addFormData.email : updateFormData.email} onChange={e => showAddModal ? setAddFormData({...addFormData, email: e.target.value}) : setUpdateFormData({...updateFormData, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Contact</label>
                <div className="flex items-center bg-[#F3F4F6] rounded-2xl overflow-hidden">
                  <span className="px-3 text-sm font-black text-slate-500 border-r border-slate-300 py-4 flex-shrink-0">+63</span>
                  <input
                    required
                    className="flex-1 bg-transparent p-4 outline-none font-bold text-sm"
                    placeholder="9XXXXXXXXX"
                    maxLength={10}
                    value={showAddModal ? addFormData.contact_no : updateFormData.contact_no}
                    onChange={e => handleContactInput(e.target.value, !showAddModal)}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4 justify-end">
                <button type="button" onClick={() => { setShowAddModal(false); setShowUpdateModal(false); }} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;