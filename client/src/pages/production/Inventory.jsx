import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlinePencil, HiOutlineClipboardList } from 'react-icons/hi';

export default function Inventory() {
  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All categories");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Production": return "bg-green-500";
      case "Daily Quota": return "bg-gray-700";
      case "Complete": return "bg-blue-600";
      default: return "bg-gray-500";
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.artisan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "All categories" || product.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FBFBFB] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="px-10 pt-10 pb-6 bg-white">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Inventory</h1>
          <p className="text-sm text-gray-400 font-medium">Manage and monitor Artisan's real-time progress</p>
        </div>

        <div className="px-10 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="Search by product, artisan, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm font-medium"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-gray-100 text-sm font-bold text-gray-500 uppercase tracking-widest cursor-pointer"
            >
              <option>All categories</option>
              <option>Accessory</option>
              <option>Furniture</option>
              <option>Decor</option>
            </select>
            <button className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
              + Add product
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-10 py-8">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Artisan</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SKU</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deadline</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-all">
                      <td className="px-8 py-5 text-sm text-gray-900 font-black tracking-tight">{product.name}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{product.artisan}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{product.sku}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{product.category}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{product.deadline}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-tighter ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-gray-300 hover:text-black transition-colors">
                          <HiOutlinePencil size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <HiOutlineClipboardList size={56} className="text-gray-400" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">No Inventory Data Available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? "bg-black text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}