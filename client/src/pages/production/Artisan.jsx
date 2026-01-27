import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiMagnifyingGlass, 
  HiPencil, 
  HiPlusSmall, 
  HiFunnel, 
  HiEnvelope, 
  HiPhone, 
  HiChevronLeft, 
  HiChevronRight,
  HiClipboardDocumentList
} from 'react-icons/hi2'; 

export default function Artisan() {
  const [artisans, setArtisans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtisans, setTotalArtisans] = useState(0);
  const itemsPerPage = 6;

  const fetchData = async () => {
    try {
      const artRes = await axios.get("http://localhost:5000/api/artisans", {
        params: { search: searchTerm, page: currentPage, limit: itemsPerPage }
      });
      setArtisans(artRes.data.artisans || []);
      setTotalArtisans(artRes.data.totalArtisans || 0);

      const matRes = await axios.get("http://localhost:5000/api/materials");
      setMaterials(Array.isArray(matRes.data) ? matRes.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setArtisans([]);
      setMaterials([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, currentPage]);

  const getStatusStyle = (status, stock, threshold) => {
    if (status === "Active" || status === "In Stock" || stock > (threshold || 10)) return "bg-emerald-500 text-white";
    if (stock <= (threshold || 10) && stock > 0) return "bg-amber-500 text-white";
    return "bg-rose-500 text-white";
  };

  const totalPages = Math.ceil(totalArtisans / itemsPerPage);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans antialiased text-slate-900">
      <div className="flex-1 flex flex-col overflow-hidden px-10 py-8 text-sm">
        
        <header className="mb-6">
          <h1 className="text-4xl font-black tracking-tight">Artisan</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Inventory Control Center</p>
        </header>

        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex gap-4 mb-8">
          <div className="relative flex-1 group">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-slate-100 transition-all font-bold"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="relative">
            <HiFunnel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select className="pl-12 pr-10 py-3 bg-slate-50 border-none rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer appearance-none min-w-[180px]">
              <option>All Materials</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
          
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Artisans</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Active Workforce Monitoring</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-2 bg-black rounded-xl text-[10px] font-black uppercase text-white shadow-xl shadow-black/10">
                <HiPlusSmall size={16}/> Work Order
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artisans.map((artisan) => (
                <div key={artisan.artisan_id} className="border border-slate-100 rounded-[1.5rem] p-6 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-2">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-50">
                        <img src={artisan.profile_image || "/default-avatar.png"} className="w-full h-full object-cover" alt="" />
                      </div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight">{artisan.first_name} {artisan.last_name}</h3>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-md w-fit ${getStatusStyle(artisan.status)}`}>{artisan.status}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 pb-2 tracking-widest">
                      <span>Department</span>
                      <span>ID Number</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-700">
                      <span>{artisan.department}</span>
                      <span>AR-{artisan.id_number || artisan.artisan_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium pt-1 truncate">
                      <HiEnvelope size={14} className="shrink-0"/> {artisan.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium truncate">
                      <HiPhone size={14} className="shrink-0"/> {artisan.contact || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end mt-8 gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-100 text-slate-400 rounded text-xs font-bold disabled:opacity-30">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentPage === page ? "bg-black text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-100 text-slate-400 rounded text-xs font-bold disabled:opacity-30">›</button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Raw Material Inventory</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stock Level Management</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-2 bg-black rounded-xl text-[10px] font-black uppercase text-white"><HiPlusSmall size={16}/> Add Material</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <th className="px-4 pb-2">Material SKU</th>
                    <th className="px-4 pb-2 text-center">Stock Quantity</th>
                    <th className="px-4 pb-2 text-center">Cost/Unit</th>
                    <th className="px-4 pb-2">Supplier</th>
                    <th className="px-4 pb-2 text-center">Status</th>
                    <th className="px-4 pb-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  {materials.map((m) => (
                    <tr key={m.sku} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                      <td className="px-4 py-4 border-t border-slate-50 rounded-l-2xl">
                        <span className="font-black text-slate-900">{m.sku}</span>
                      </td>
                      <td className="px-4 py-4 border-t border-slate-50 text-center">
                        <div className="flex flex-col items-center">
                          <span>{m.stock}</span>
                          <span className="text-[8px] uppercase text-slate-300">Min: {m.reorder_threshold}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-900 border-t border-slate-50 text-center">₱{m.price}</td>
                      <td className="px-4 py-4 text-slate-400 font-medium border-t border-slate-50">{m.supplier || "N/A"}</td>
                      <td className="px-4 py-4 border-t border-slate-50 text-center">
                        <span className={`px-4 py-1 rounded-lg text-[9px] uppercase font-black tracking-tight ${getStatusStyle(null, m.stock, m.reorder_threshold)}`}>
                          {m.stock > m.reorder_threshold ? "In Stock" : "Low Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-t border-slate-50 text-center rounded-r-2xl">
                        <button className="p-2 text-slate-300 hover:text-black transition-colors"><HiPencil size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {materials.length === 0 && (
                <div className="py-20 flex flex-col items-center text-slate-200">
                  <HiClipboardDocumentList size={48}/>
                  <span className="text-[10px] font-black uppercase mt-2 tracking-widest">Empty Inventory</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}