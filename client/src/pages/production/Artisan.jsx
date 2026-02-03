import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiMagnifyingGlass, HiPlusSmall, HiXMark, HiPhoto, HiPencil, HiChevronLeft, HiChevronRight, HiTrash 
} from 'react-icons/hi2'; 

export default function Artisan() {
  const [artisans, setArtisans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All category");
  const [filterWOStatus, setFilterWOStatus] = useState("All Status");
  const [filterInvStatus, setFilterInvStatus] = useState("All Inventory");
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showMatModal, setShowMatModal] = useState(false);
  const [isUpdateMat, setIsUpdateMat] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [woImagePreview, setWoImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const [woForm, setWoForm] = useState({
    sku: '', quantity: '', category: '', target_date: '', artisan_id: '', status: 'In Production', product_image: null, selectedMaterials: [] 
  });

  const [matForm, setMatForm] = useState({
    unique_code: '', supplier_id: '', cost_per_unit: '', stock_quantity: '', reorder_threshold: '', material_image: null, material_name: '', category: '' 
  });

  const fetchData = async () => {
    try {
      const [artRes, matRes, fgRes, woRes, supRes] = await Promise.all([
        axios.get("http://localhost:5000/api/artisans"),
        axios.get("http://localhost:5000/api/materials"),
        axios.get("http://localhost:5000/api/finished_goods"),
        axios.get("http://localhost:5000/api/artisan_work_orders"),
        axios.get("http://localhost:5000/api/suppliers")
      ]);
      setArtisans(artRes.data.artisans || []);
      setMaterials(matRes.data || []);
      setFinishedGoods(fgRes.data || []);
      setWorkOrders(woRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (showMatModal && !isUpdateMat) {
      const code = `MAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setMatForm(prev => ({ ...prev, unique_code: code }));
    }
  }, [showMatModal, isUpdateMat]);

  const addMaterialToWO = () => {
    setWoForm({
      ...woForm,
      selectedMaterials: [...woForm.selectedMaterials, { material_id: '', qty: 0, cost: 0, total: 0 }]
    });
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...woForm.selectedMaterials];
    if (field === 'qty') {
      updated[index][field] = Number(value) || 0;
    } else if (field === 'material_id') {
      updated[index][field] = value;
      const mat = materials.find(m => m.material_id === parseInt(value));
      updated[index].cost = mat ? Number(mat.cost_per_unit) : 0;
    }
    updated[index].total = Number(updated[index].qty) * Number(updated[index].cost);
    setWoForm({ ...woForm, selectedMaterials: updated });
  };

  const calculateSubtotal = () => woForm.selectedMaterials.reduce((sum, item) => sum + Number(item.total), 0);

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    const payload = {
      ...woForm,
      artisan_id: parseInt(woForm.artisan_id),
      quantity: parseInt(woForm.quantity),
      total_cost: calculateSubtotal(),
      selectedMaterials: woForm.selectedMaterials.map(m => ({
        material_id: parseInt(m.material_id),
        qty: parseInt(m.qty),
        cost: Number(m.cost)
      })).filter(m => !isNaN(m.material_id) && m.qty > 0)
    };
    try {
      await axios.post("http://localhost:5000/api/work_orders", payload);
      setShowWorkOrderModal(false);
      setWoImagePreview(null);
      setWoForm({ sku: '', quantity: '', category: '', target_date: '', artisan_id: '', status: 'In Production', product_image: null, selectedMaterials: [] });
      await fetchData();
      alert("Work Order Assigned!");
    } catch (err) { 
      alert(err.response?.data?.error || "Error."); 
    }
  };

  const handleMatSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...matForm,
      stock_quantity: parseInt(matForm.stock_quantity),
      reorder_threshold: parseInt(matForm.reorder_threshold),
      cost_per_unit: parseFloat(matForm.cost_per_unit),
      supplier_id: parseInt(matForm.supplier_id)
    };
    try {
      if (isUpdateMat) {
        await axios.put(`http://localhost:5000/api/materials/${selectedMatId}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/add_material", payload);
      }
      setShowMatModal(false);
      setImagePreview(null);
      setMatForm({ unique_code: '', supplier_id: '', cost_per_unit: '', stock_quantity: '', reorder_threshold: '', material_image: null, material_name: '', category: '' });
      fetchData();
    } catch (err) { alert("Error saving material."); }
  };

  const handleWOImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWoImagePreview(reader.result);
        setWoForm({ ...woForm, product_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setMatForm({ ...matForm, material_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Complete': return 'bg-[#002B5B]';
      case 'Quality Control': return 'bg-black';
      default: return 'bg-[#1D7A1D]'; 
    }
  };

  const getStatusStyle = (stock, threshold) => {
    return parseInt(stock) > parseInt(threshold) ? "bg-emerald-500 text-white" : "bg-rose-500 text-white";
  };

  const filteredOrders = workOrders.filter(order => {
    const name = `${order.first_name} ${order.last_name}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || (order.sku && order.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = filterDept === "All category" || order.department === filterDept;
    const matchesStatus = filterWOStatus === "All Status" || order.status === filterWOStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const currentOrders = filteredOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.unique_code.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowStock = parseInt(m.stock_quantity) <= parseInt(m.reorder_threshold);
    const matchesInvStatus = filterInvStatus === "All Inventory" || (filterInvStatus === "Low Stock" ? isLowStock : !isLowStock);
    return matchesSearch && matchesInvStatus;
  });

  const getProductName = (sku) => {
    const product = finishedGoods.find(fg => fg.sku === sku);
    return product ? (product.name) : "Unknown Product";
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans antialiased text-slate-900">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-10 py-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center flex-shrink-0">
          <div className="relative flex-1 group">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search resources..." className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}} />
          </div>
          <select className="bg-[#F8F9FA] border-none rounded-2xl py-3.5 px-6 font-bold text-slate-600 outline-none cursor-pointer min-w-[180px] text-xs uppercase tracking-wider" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option>All category</option>
            <option>Earrings</option><option>Necklace</option><option>Bracelets</option><option>Bag</option><option>Accessory</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10 pb-10">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Artisans Work Order</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Production Tracking</p>
              </div>
              <div className="flex items-center gap-4">
                <select className="bg-[#F8F9FA] border-none rounded-xl py-2 px-3 font-bold text-slate-500 outline-none text-xs cursor-pointer" value={filterWOStatus} onChange={(e) => setFilterWOStatus(e.target.value)}>
                  <option>All Status</option>
                  <option>In Production</option><option>Quality Control</option><option>Complete</option><option>Pending</option>
                </select>
                <div className="flex gap-2 mr-4">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"><HiChevronLeft size={20}/></button>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 transition-all hover:bg-slate-100"><HiChevronRight size={20}/></button>
                </div>
                <button onClick={() => {setShowWorkOrderModal(true)}} className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">+ Work Order</button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {currentOrders.map((order) => (
                <div key={order.work_order_id} className="border border-gray-200 rounded-[2rem] p-5 bg-white shadow-sm flex flex-col min-h-[300px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <img src={order.artisan_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.first_name}`} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0">
                      {order.product_image ? <img src={order.product_image} className="w-full h-full object-cover" /> : <HiPhoto size={20} className="m-auto mt-5 text-slate-200" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">{order.first_name} {order.last_name}</h3>
                  <div className={`w-fit px-4 py-1 rounded-lg text-[9px] font-black uppercase text-white mb-6 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 mt-auto text-[10px]">
                    <div className="grid grid-cols-2 gap-2 mb-4 uppercase text-[8px] font-bold text-[#9CA3AF]">
                      <div><p>SKU</p><p className="text-slate-900 text-[11px] truncate font-black">{order.sku}</p></div>
                      <div><p>Product</p><p className="text-slate-900 text-[11px] truncate font-black">{getProductName(order.sku)}</p></div>
                    </div>
                    <div className="pt-3 border-t font-black space-y-1">
                        <p className="text-slate-700">Target: {order.quantity_needed} Units</p>
                        <p className="text-emerald-600 font-bold">Total Cost: ₱{Number(order.total_cost || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
            <div className="flex justify-between items-center mb-10 text-slate-900">
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Raw Materials</h1>
               <div className="flex gap-4 items-center">
                <select className="bg-[#F8F9FA] border-none rounded-xl py-2 px-3 font-bold text-slate-500 outline-none text-xs cursor-pointer" value={filterInvStatus} onChange={(e) => setFilterInvStatus(e.target.value)}>
                  <option>All Inventory</option><option>In Stock</option><option>Low Stock</option>
                </select>
                <button onClick={() => {setIsUpdateMat(false); setShowMatModal(true)}} className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">+ Add Material</button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-center border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b">
                    <th className="pb-4">Image</th><th className="pb-4">Material</th><th className="pb-4">Code</th><th className="pb-4">Stock</th><th className="pb-4">Cost</th><th className="pb-4">Status</th><th className="pb-4 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  {filteredMaterials.map((m) => (
                    <tr key={m.material_id} className="hover:bg-slate-50 transition-all group">
                      <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100"><div className="w-12 h-12 mx-auto bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">{m.material_image ? <img src={m.material_image} className="w-full h-full object-cover" /> : <HiPhoto className="text-slate-300" size={20}/>}</div></td>
                      <td className="py-4 uppercase text-slate-900 font-black border-y border-transparent group-hover:border-slate-100">{m.material_name}</td>
                      <td className="py-4 text-slate-400 text-[11px] font-bold border-y border-transparent group-hover:border-slate-100">{m.unique_code}</td>
                      <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] text-slate-900 font-black leading-none">{m.stock_quantity}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">Min: {m.reorder_threshold}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-900 font-black border-y border-transparent group-hover:border-slate-100">₱{Number(m.cost_per_unit).toFixed(2)}</td>
                      <td className="py-4 border-y border-transparent group-hover:border-slate-100">
                        <span className={`px-4 py-1 rounded-lg text-[8px] uppercase font-black ${getStatusStyle(m.stock_quantity, m.reorder_threshold)}`}>
                          {parseInt(m.stock_quantity) > parseInt(m.reorder_threshold) ? "In Stock" : "Low Stock"}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100"><button onClick={() => {setSelectedMatId(m.material_id); setMatForm({...m}); setIsUpdateMat(true); setShowMatModal(true)}} className="p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100"><HiPencil size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {showWorkOrderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <div><h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Work Order Form</h2><p className="text-slate-400 font-bold mt-1 tracking-tight">Resource allocation and production management.</p></div>
              <div className="flex items-center gap-4">
                <select className={`${getStatusColor(woForm.status)} text-white px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] outline-none cursor-pointer border-none shadow-lg tracking-widest`} value={woForm.status} onChange={(e) => setWoForm({...woForm, status: e.target.value})}><option value="In Production">In Production</option><option value="Complete">Complete</option><option value="Quality Control">Quality Control</option></select>
                <button onClick={() => {setShowWorkOrderModal(false); setWoImagePreview(null);}} className="text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiXMark size={28}/></button>
              </div>
            </div>
            <form onSubmit={handleCreateWorkOrder} className="space-y-6">
              <div className="flex flex-col items-center mb-10">
                <div className="w-36 h-36 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                  {woImagePreview ? <img src={woImagePreview} className="w-full h-full object-cover" /> : <HiPhoto size={48} className="text-slate-200" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-white text-[10px] font-black uppercase">Upload Design</p></div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleWOImageChange} accept="image/*" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Product SKU & Name</label><select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={woForm.sku} onChange={e => setWoForm({...woForm, sku: e.target.value})}><option value="">Select Product...</option>{finishedGoods.map(fg => (<option key={fg.sku} value={fg.sku}>{fg.sku} - {fg.name}</option>))}</select></div>
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Quantity</label><input type="number" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={woForm.quantity} onChange={e => setWoForm({...woForm, quantity: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Category</label><select className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={woForm.category} onChange={e => setWoForm({...woForm, category: e.target.value})}><option value="">Select category...</option><option>Earrings</option><option>Necklace</option><option>Bracelets</option><option>Bag</option></select></div>
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Target Date</label><input type="date" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={woForm.target_date} onChange={e => setWoForm({...woForm, target_date: e.target.value})} /></div>
              </div>
              <div className="space-y-2 font-bold"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Assigned Artisan</label><select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-bold text-sm" value={woForm.artisan_id} onChange={e => setWoForm({...woForm, artisan_id: e.target.value})}><option value="">Select Artisan...</option>{artisans.map(a => <option key={a.artisan_id} value={a.artisan_id}>{a.first_name} {a.last_name} ({a.department})</option>)}</select></div>
              
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6 px-2"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Raw Materials Required</h3><button type="button" onClick={addMaterialToWO} className="bg-black text-white p-2 rounded-xl hover:scale-110 transition-all shadow-lg"><HiPlusSmall size={24} /></button></div>
                <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b"><tr><th className="p-5">Material Name</th><th className="p-5 text-center">Qty</th><th className="p-5 text-center">Unit Cost</th><th className="p-5 text-right pr-8">Subtotal</th><th className="p-5"></th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {woForm.selectedMaterials.map((item, index) => (
                        <tr key={index} className="text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                          <td className="p-5"><select className="bg-transparent outline-none w-full font-black cursor-pointer text-slate-900" value={item.material_id} onChange={(e) => handleMaterialChange(index, 'material_id', e.target.value)}><option value="">Choose Material...</option>{materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}</select></td>
                          <td className="p-5 text-center"><input type="number" className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl py-1.5 outline-none font-black" value={item.qty} onChange={(e) => handleMaterialChange(index, 'qty', e.target.value)} /></td>
                          <td className="p-5 text-center text-slate-400 font-black">₱{(Number(item.cost) || 0).toFixed(2)}</td>
                          <td className="p-5 text-right font-black text-slate-900 pr-8">₱{(Number(item.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-5 text-right pr-6"><button type="button" onClick={() => setWoForm({...woForm, selectedMaterials: woForm.selectedMaterials.filter((_, i) => i !== index)})}><HiTrash className="text-rose-400 hover:text-rose-600 transition-colors" size={18}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-center gap-10">
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Estimated Total Cost</span>
                  <span className="text-4xl font-black text-emerald-600 tracking-tighter italic">₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex gap-4 pt-4 justify-end">
                <button type="button" onClick={() => {setShowWorkOrderModal(false); setWoImagePreview(null);}} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-2xl hover:bg-stone-800 transition-all tracking-widest">Assign Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <button onClick={() => {setShowMatModal(false); setImagePreview(null);}} className="absolute top-10 right-10 text-gray-400 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiXMark size={28}/></button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">{isUpdateMat ? "Modify Material" : "Register Material"}</h2>
            <form onSubmit={handleMatSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-10">
                <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                  {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : (matForm.material_image ? <img src={matForm.material_image} className="w-full h-full object-cover" /> : <HiPhoto size={40} className="text-slate-200" />)}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-white text-[10px] font-black uppercase">Upload Photo</p></div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 font-bold">
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Material Name</label><input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" placeholder="e.g. Leather" value={matForm.material_name} onChange={e => setMatForm({...matForm, material_name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Unique Code</label><input disabled className="w-full bg-[#F3F4F6] rounded-2xl p-4 opacity-50 outline-none cursor-not-allowed font-black text-sm" value={matForm.unique_code} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4 font-black">
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Current Stock</label><input type="number" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none border border-transparent text-sm" value={matForm.stock_quantity} onChange={e => setMatForm({...matForm, stock_quantity: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Min Threshold</label><input type="number" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none border border-transparent text-sm" value={matForm.reorder_threshold} onChange={e => setMatForm({...matForm, reorder_threshold: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Unit Price</label><input type="number" step="0.01" required className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none border border-transparent text-sm" value={matForm.cost_per_unit} onChange={e => setMatForm({...matForm, cost_per_unit: e.target.value})} /></div>
              </div>
              <div className="space-y-2 font-bold"><label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Supplier Assignment</label><select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 appearance-none outline-none border border-transparent font-black text-sm cursor-pointer" value={matForm.supplier_id} onChange={e => setMatForm({...matForm, supplier_id: e.target.value})}>
                <option value="">Select Supplier...</option>{suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
              </select></div>
              <div className="flex gap-4 pt-1 justify-end">
                <button type="button" onClick={() => {setShowMatModal(false); setImagePreview(null);}} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">{isUpdateMat ? "Save Changes" : "Confirm Registry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}