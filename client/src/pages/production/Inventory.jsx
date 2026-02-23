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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editForm, setEditForm] = useState({
    sku: '',
    quantity: '',
    category: '',
    target_date: '',
    artisan_id: '',
    status: '',
    product_image: null,
    selectedMaterials: []
  });

  const fetchData = async () => {
    try {
      const [woRes, matRes, artRes, fgRes] = await Promise.all([
        axios.get("http://localhost:5000/api/artisan_work_orders"),
        axios.get("http://localhost:5000/api/materials"),
        axios.get("http://localhost:5000/api/artisans"),
        axios.get("http://localhost:5000/api/finished_goods")
      ]);
      setWorkOrders(woRes.data || []);
      setMaterials(matRes.data || []);
      setArtisans(artRes.data.artisans || []);
      setFinishedGoods(fgRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const truncateText = (text, limit = 30) => {
    if (!text) return "---";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const getProductName = (sku) => {
    const product = finishedGoods.find(fg => fg.sku === sku);
    return product ? (product.name || product.collection) : "Unknown Product";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, product_image: reader.result }));
      };
      reader.readAsDataURL(file);
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
        return {
          material_id: m.material_id,
          qty,
          cost,
          total: Number(m.subtotal) || (qty * cost)
        };
      });
      setEditForm({
        sku: order.sku || '',
        quantity: order.quantity_needed || '',
        category: order.department || '',
        target_date: order.target_date?.split('T')[0] || '',
        artisan_id: order.artisan_id || '',
        status: order.status || 'In Production',
        product_image: order.product_image || null,
        selectedMaterials: mapped
      });
    } catch (err) {
      setEditForm({
        sku: order.sku || '',
        quantity: order.quantity_needed || '',
        category: order.department || '',
        target_date: order.target_date?.split('T')[0] || '',
        artisan_id: order.artisan_id || '',
        status: order.status || 'In Production',
        product_image: order.product_image || null,
        selectedMaterials: []
      });
    }
    setShowEditModal(true);
  };

  const handleMarkComplete = async (order) => {
    if (!window.confirm(`Mark WO-${order.work_order_id} as Complete and add ${order.quantity_needed} units to Finished Goods stock?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/work_orders/${order.work_order_id}/complete`);
      fetchData();
      alert("Work order completed and stock updated!");
    } catch (err) {
      const msg = err.response?.data || err.message || "Failed to complete order.";
      alert("Error: " + msg);
    }
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
      updated[index].qty = Number(value) || 0;
    } else if (field === 'material_id') {
      updated[index].material_id = value;
      const mat = materials.find(m => m.material_id === parseInt(value));
      updated[index].cost = mat ? Number(mat.cost_per_unit) : 0;
    }
    updated[index].total = (Number(updated[index].qty) || 0) * (Number(updated[index].cost) || 0);
    setEditForm({ ...editForm, selectedMaterials: updated });
  };

  const calculateSubtotal = () => {
    return editForm.selectedMaterials.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editForm.selectedMaterials.length === 0) {
      alert("Please add at least one raw material.");
      return;
    }
    const payload = {
      ...editForm,
      artisan_id: parseInt(editForm.artisan_id),
      quantity: parseInt(editForm.quantity),
      total_cost: calculateSubtotal(),
      selectedMaterials: editForm.selectedMaterials.map(m => ({
        material_id: parseInt(m.material_id),
        qty: Number(m.qty) || 0,
        cost: Number(m.cost) || 0,
        total: (Number(m.qty) || 0) * (Number(m.cost) || 0)
      })).filter(m => !isNaN(m.material_id) && m.qty > 0)
    };
    try {
      await axios.put(`http://localhost:5000/api/work_orders/${selectedOrder.work_order_id}`, payload);
      setShowEditModal(false);
      fetchData();
      alert("Inventory Updated Successfully!");
    } catch (err) {
      alert("Update failed.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Complete': return 'bg-[#002B5B]';
      case 'Quality Control': return 'bg-black';
      default: return 'bg-[#1D7A1D]';
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const searchString = `${order.sku} ${order.first_name} ${order.last_name} ${order.department} ${getProductName(order.sku)}`.toLowerCase();
    const searchMatch = searchString.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "All Status" || order.status === statusFilter;
    return searchMatch && statusMatch;
  });

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center">
        <div className="relative flex-1 group">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
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
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col mb-10">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                <th className="pb-2 text-left pl-6 w-[30%]">Product Details</th>
                <th className="pb-2 text-left pl-0 w-[20%]">Artisan</th>
                <th className="pb-2 text-left pl-0 w-[15%]">Category</th>
                <th className="pb-2 text-center w-[15%]">Status</th>
                <th className="pb-2 text-center w-[15%]">Total Cost</th>
                <th className="pb-2 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700">
              {filteredOrders.map((order) => {
                const isComplete = order.status === 'Complete';
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
                          <span className="text-slate-900 font-black uppercase text-xs mb-0.5 truncate max-w-[220px]" title={getProductName(order.sku)}>
                            {truncateText(getProductName(order.sku))}
                          </span>
                          <div className="flex items-center gap-1.5 justify-start w-full overflow-hidden">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider truncate max-w-[100px]" title={order.sku}>
                              {truncateText(order.sku, 15)}
                            </span>
                            <span className="text-slate-300 text-[10px] flex-shrink-0">•</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase whitespace-nowrap">{order.quantity_needed} Unit/s</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-left pl-0 text-slate-500 text-sm border-y border-transparent group-hover:border-slate-100">
                      {order.first_name} {order.last_name}
                    </td>
                    <td className="py-4 text-left pl-0 text-slate-400 text-[10px] uppercase font-black border-y border-transparent group-hover:border-slate-100 tracking-widest">
                      {order.department}
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
                      {isComplete ? (
                        <div className="flex justify-end gap-2 opacity-30">
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-not-allowed">
                            <HiPencil size={18} className="text-slate-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleMarkComplete(order)}
                            className="p-3 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-100"
                            title="Mark as Complete & add to Finished Goods"
                          >
                            <HiCheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100"
                            title="Edit Work Order"
                          >
                            <HiPencil size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-8 relative shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Update Record</h2>
                <p className="text-slate-400 font-bold mt-1 tracking-tight text-xs">Modify resource allocation and production status.</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className={`${getStatusColor(editForm.status)} text-white px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] outline-none cursor-pointer border-none shadow-lg tracking-widest`}
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="In Production">In Production</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Complete">Complete</option>
                  <option value="Pending">Pending</option>
                </select>
                <button onClick={() => setShowEditModal(false)} className="text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiXMark size={24}/></button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-2 gap-8 mb-6 overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Product SKU & Name</label>
                      <select required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-xs" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})}>
                        <option value="">Select Product...</option>
                        {finishedGoods.map(fg => <option key={fg.sku} value={fg.sku}>{fg.sku} - {fg.name || fg.collection}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Quantity</label>
                      <input type="number" required className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-xs" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Category</label>
                      <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-xs" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                        <option value="">Select category...</option>
                        <option>Earrings</option><option>Necklace</option><option>Bracelets</option><option>Bag</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Date</label>
                      <input type="date" className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-xs" value={editForm.target_date} onChange={e => setEditForm({...editForm, target_date: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assigned Artisan</label>
                    <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-xs" value={editForm.artisan_id} onChange={e => setEditForm({...editForm, artisan_id: e.target.value})}>
                      {artisans.map(a => <option key={a.artisan_id} value={a.artisan_id}>{a.first_name} {a.last_name}</option>)}
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-[9px] font-black uppercase text-center">Change<br/>Photo</p>
                      </div>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
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
                                <select className="bg-transparent outline-none w-full font-black cursor-pointer text-slate-900 text-[11px]" value={item.material_id} onChange={(e) => handleMaterialChange(index, 'material_id', e.target.value)}>
                                  <option value="">Choose...</option>
                                  {materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <input type="number" className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 outline-none font-black text-[11px]" value={item.qty} onChange={(e) => handleMaterialChange(index, 'qty', e.target.value)} />
                              </td>
                              <td className="p-2 text-center text-slate-400 font-black text-[10px]">₱{(Number(item.cost) || 0).toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <button type="button" onClick={() => setEditForm({...editForm, selectedMaterials: editForm.selectedMaterials.filter((_, i) => i !== index)})}>
                                  <HiTrash className="text-rose-400 hover:text-rose-600 transition-colors" size={14}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <div className="flex items-center gap-6">
                  <span className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Estimated Cost</span>
                  <span className="text-3xl font-black text-emerald-600 tracking-tighter italic">₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-8 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" className="px-10 py-3 bg-black text-white rounded-xl uppercase text-[10px] font-black shadow-2xl hover:bg-stone-800 transition-all tracking-widest">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}