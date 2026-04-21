import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { HiX, HiOutlineOfficeBuilding } from "react-icons/hi";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === "success";
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: "popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? "bg-emerald-50" : "bg-rose-50"}`}>
          {isSuccess
            ? <HiCheckCircle size={44} className="text-emerald-500" />
            : <HiXCircle size={44} className="text-rose-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? "text-emerald-500" : "text-rose-500"}`}>
          {isSuccess ? "Success" : "Error"}
        </p>
        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">{alert.message}</p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isSuccess ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"}`}
        >
          Got it
        </button>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
};

const useAlert = () => {
  const [alert, setAlert] = useState(null);
  const showAlert = useCallback((message, type = "success") => setAlert({ message, type }), []);
  const closeAlert = useCallback(() => setAlert(null), []);
  return { alert, showAlert, closeAlert };
};

export default function AddWarehouseModal({ warehouse, onClose, fetchWarehouses }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity_total: "",
    manager_name: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        location: warehouse.location || "",
        capacity_total: warehouse.capacity_total || "",
        manager_name: warehouse.manager_name || warehouse.manager || "",
      });
    }
  }, [warehouse]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Warehouse name is required.";
    if (!formData.manager_name.trim()) e.manager_name = "Manager name is required.";
    if (!formData.location.trim()) e.location = "Location is required.";
    if (formData.capacity_total === "" || formData.capacity_total === null) {
      e.capacity_total = "Capacity is required.";
    } else if (Number(formData.capacity_total) <= 0) {
      e.capacity_total = "Capacity must be greater than 0.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (warehouse) {
        await axios.put(`http://localhost:5000/api/warehouses/${warehouse.warehouse_id}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/warehouses/add", formData);
      }
      fetchWarehouses();
      showAlert(warehouse ? "Warehouse updated successfully!" : "Warehouse added successfully!", "success");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      showAlert("Error: " + (err.response?.data || err.message), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full bg-gray-50 border rounded-xl p-3 font-bold outline-none text-sm transition-all focus:ring-2 focus:ring-black/5";
  const inputClass = (field) => `${inputBase} ${errors[field] ? "border-red-300 bg-red-50/30" : "border-gray-100"}`;

  return (
    <>
      <AlertDialog alert={alert} onClose={closeAlert} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4 font-sans text-sm">
        <div className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-all">
            <HiX size={24} />
          </button>

          <header className="mb-8">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-800 mb-4">
              <HiOutlineOfficeBuilding size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
              {warehouse ? "Update Warehouse" : "Add Warehouse"}
            </h2>
          </header>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Warehouse Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                className={inputClass("name")}
                placeholder="e.g. South Warehouse"
                value={formData.name}
                onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
              />
              {errors.name && <p className="text-red-500 text-[9px] font-bold ml-1 mt-0.5">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Warehouse Manager <span className="text-red-500">*</span>
              </label>
              <input
                required
                className={inputClass("manager_name")}
                placeholder="Full Name"
                value={formData.manager_name}
                onChange={e => { setFormData({ ...formData, manager_name: e.target.value }); setErrors({ ...errors, manager_name: "" }); }}
              />
              {errors.manager_name && <p className="text-red-500 text-[9px] font-bold ml-1 mt-0.5">{errors.manager_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className={inputClass("location")}
                  placeholder="e.g. Cebu City"
                  value={formData.location}
                  onChange={e => { setFormData({ ...formData, location: e.target.value }); setErrors({ ...errors, location: "" }); }}
                />
                {errors.location && <p className="text-red-500 text-[9px] font-bold ml-1 mt-0.5">{errors.location}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  className={inputClass("capacity_total")}
                  placeholder="e.g. 50000"
                  value={formData.capacity_total}
                  onChange={e => { setFormData({ ...formData, capacity_total: e.target.value }); setErrors({ ...errors, capacity_total: "" }); }}
                />
                {errors.capacity_total && <p className="text-red-500 text-[9px] font-bold ml-1 mt-0.5">{errors.capacity_total}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
            <button onClick={onClose} className="font-bold text-gray-400 text-xs hover:text-black transition-all px-4">Cancel</button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : warehouse ? "Update Warehouse" : "Save Warehouse"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}