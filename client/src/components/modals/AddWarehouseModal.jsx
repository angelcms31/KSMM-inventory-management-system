import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiX, HiOutlineOfficeBuilding } from "react-icons/hi";

export default function AddWarehouseModal({ warehouse, onClose, fetchWarehouses }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity_total: '',
    manager_name: '' 
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || '', 
        location: warehouse.location || '',
        capacity_total: warehouse.capacity_total || 50000,
        manager_name: warehouse.manager_name || warehouse.manager || '' 
      });
    }
  }, [warehouse]);

  const handleSave = async () => {
    try {
      if (warehouse) {
        await axios.put(`http://localhost:5000/api/warehouses/${warehouse.warehouse_id}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/warehouses/add", formData);
      }
      fetchWarehouses();
      onClose();
    } catch (err) {
      alert("Error: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4 font-sans text-sm">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl relative animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-all">
          <HiX size={24} />
        </button>

        <header className="mb-8">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-800 mb-4">
            <HiOutlineOfficeBuilding size={24}/>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
            {warehouse ? "Update Warehouse" : "Add Warehouse"}
          </h2>
        </header>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Warehouse Name</label>
            <input 
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" 
              placeholder="e.g. South Warehouse" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Warehouse Manager</label>
            <input 
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" 
              placeholder="Full Name" 
              value={formData.manager_name} 
              onChange={e => setFormData({...formData, manager_name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Location</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Capacity</label>
              <input 
                type="number"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" 
                value={formData.capacity_total}
                onChange={e => setFormData({...formData, capacity_total: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
          <button onClick={onClose} className="font-bold text-gray-400 text-xs hover:text-black transition-all px-4">Cancel</button>
          <button 
            onClick={handleSave}
            className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {warehouse ? "Update Warehouse" : "Save Warehouse"}
          </button>
        </div>
      </div>
    </div>
  );
}