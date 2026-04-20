import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiPhoto, HiPencil, HiChevronLeft, HiChevronRight, HiXMark, HiMagnifyingGlass } from 'react-icons/hi2';

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

const EMPTY_FORM = {
  unique_code: '', cost_per_unit: '', stock_quantity: '',
  reorder_threshold: '', material_image: null, material_name: '', category: '', stock_unit: ''
};

export default function RawMaterials({ materials: propMaterials, onRefresh, searchTerm: propSearchTerm }) {
  const isStandalone = propMaterials === undefined;

  const [materials, setMaterials] = useState(propMaterials || []);
  const [searchTerm, setSearchTerm] = useState(propSearchTerm || '');
  const [showMatModal, setShowMatModal] = useState(false);
  const [isUpdateMat, setIsUpdateMat] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentMatPage, setCurrentMatPage] = useState(0);
  const [filterInvStatus, setFilterInvStatus] = useState('All Inventory');
  const matsPerPage = 5;

  const [matForm, setMatForm] = useState(EMPTY_FORM);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/materials');
      setMaterials(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isStandalone) fetchMaterials();
  }, []);

  useEffect(() => {
    if (!isStandalone) setMaterials(propMaterials);
  }, [propMaterials]);

  useEffect(() => {
    if (!isStandalone) setSearchTerm(propSearchTerm || '');
  }, [propSearchTerm]);

  useEffect(() => {
    if (showMatModal && !isUpdateMat) {
      const code = `MAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setMatForm(prev => ({ ...prev, unique_code: code }));
    }
  }, [showMatModal, isUpdateMat]);

  useEffect(() => { setCurrentMatPage(0); }, [searchTerm]);

  const closeModal = () => {
    setShowMatModal(false);
    setIsUpdateMat(false);
    setSelectedMatId(null);
    setImagePreview(null);
    setMatForm(EMPTY_FORM);
  };

  const handleRefresh = () => {
    if (isStandalone) fetchMaterials();
    else if (onRefresh) onRefresh();
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); setMatForm({ ...matForm, material_image: reader.result }); };
      reader.readAsDataURL(file);
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
      closeModal();
      handleRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={isStandalone ? "w-full h-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden" : ""}>
      {isStandalone && (
        <div className="flex-shrink-0 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 flex gap-4 items-center">
          <div className="relative flex-1">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentMatPage(0); }}
            />
          </div>
        </div>
      )}

      <section className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 ${isStandalone ? 'flex-1 overflow-y-auto' : ''}`}>
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
            <button
              onClick={() => { setIsUpdateMat(false); setMatForm(EMPTY_FORM); setImagePreview(null); setShowMatModal(true); }}
              className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all"
            >
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
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide">{m.stock_unit || '---'}</span>
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
                        setImagePreview(null);
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

      {showMatModal && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
            <button onClick={closeModal} className="absolute top-10 right-10 text-gray-400 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm">
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
                  <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm" value={matForm.material_name} onChange={e => setMatForm({ ...matForm, material_name: e.target.value })} />
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
                <button type="button" onClick={closeModal} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">Confirm Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}