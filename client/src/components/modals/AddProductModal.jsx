import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { HiXMark, HiPhoto, HiQrCode, HiPrinter } from "react-icons/hi2";
import { QRCodeCanvas } from "qrcode.react";

export default function AddProductModal({ product, products = [], fetchProducts, onClose }) {
  const isEdit = !!(product && product.sku && !product.isNew);
  const qrRef = useRef();
  const skuRef = useRef(product?.sku || "");

  const [view, setView] = useState("info");
  const [form, setForm] = useState({
    sku: product?.sku || "",
    name: "",
    collection: "",
    brand: "",
    selling_price: "",
    location: "",
    category: "",
    quantity: "",
    min_stocks: "",
    product_image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/warehouses").then((res) => {
      setWarehouses(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (product && isEdit) {
      skuRef.current = product.sku;
      setForm({
        sku: product.sku,
        name: product.name || "",
        collection: product.collection || "",
        brand: product.brand || "",
        selling_price: product.selling_price || "",
        location: product.warehouse_location || product.location || "",
        category: product.category || "",
        quantity: product.current_stock || product.quantity || "",
        min_stocks: product.min_stocks || "",
        product_image: product.product_image || null,
      });
      setImagePreview(product.product_image || null);
    }
  }, [product]);

  const isDuplicateName = (value) => {
    const normalized = value.toLowerCase().replace(/\s/g, "");
    return products.some((p) => {
      const existing = (p.name || "").toLowerCase().replace(/\s/g, "");
      if (isEdit) return existing === normalized && p.sku !== product.sku;
      return existing === normalized;
    });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, name: value }));
    if (!value.trim()) { setNameError(""); return; }
    setNameError(isDuplicateName(value) ? "A product with this name already exists." : "");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm((prev) => ({ ...prev, product_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateQR = () => {
    setFormError("");
    if (!form.name.trim()) {
      setNameError("Product Name is required.");
      return;
    }
    if (isDuplicateName(form.name)) {
      setNameError("A product with this name already exists.");
      return;
    }
    if (!form.location) {
      setFormError("Please select a Storage Location before generating QR.");
      return;
    }
    setView("qr");
  };

  const handleSaveRecord = async () => {
    const sku = skuRef.current;
    if (!sku) {
      setFormError("SKU is missing. Please close and try again.");
      return;
    }
    if (!form.location) {
      setFormError("Storage Location is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        sku,
        name: form.name,
        collection: form.collection || "",
        brand: form.brand || "",
        selling_price: parseFloat(form.selling_price) || 0,
        location: form.location,
        category: form.category || "",
        quantity: parseInt(form.quantity) || 0,
        min_stocks: parseInt(form.min_stocks) || 0,
        product_image: form.product_image || null,
      };

      if (isEdit) {
        await axios.put(`http://localhost:5000/api/products/${sku}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/sales_Add_inventory", payload);
      }

      await fetchProducts();
      onClose();
    } catch (err) {
      const msg = err.response?.data || err.message;
      setFormError("Save failed: " + msg);
      console.error("Save error:", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 backdrop-blur-md bg-black/20 font-sans antialiased text-slate-900">
      <div className="bg-white rounded-[3.5rem] w-full max-w-3xl p-14 relative shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-slate-100 text-left">

        <button onClick={onClose} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full z-20">
          <HiXMark size={24} />
        </button>

        {view === "info" ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">
                {isEdit ? "Edit Product Information" : "Add Product"}
              </h2>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center">
                <div className="w-36 h-36 rounded-[2.5rem] border-4 border-white shadow-2xl flex items-center justify-center bg-slate-50 overflow-hidden relative group shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <HiPhoto size={48} className="text-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-4">
                    <span className="text-white text-[9px] font-black uppercase tracking-widest">Click to Upload Photo</span>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-black ml-1">System SKU Code</label>
                  <input
                    readOnly
                    className="w-full bg-slate-50/80 rounded-2xl p-4 font-black text-sm text-slate-500 border border-slate-100 outline-none cursor-not-allowed"
                    value={skuRef.current}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-2 tracking-widest">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className={`w-full bg-slate-50 border rounded-2xl p-4 outline-none font-bold text-sm focus:ring-4 transition-all ${
                      nameError ? "border-red-300 focus:ring-red-100" : "border-slate-100 focus:ring-black/5"
                    }`}
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="Enter Unique Name..."
                  />
                  {nameError && <p className="text-red-500 text-[10px] font-bold ml-2 mt-1">{nameError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-2 tracking-widest">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-sm cursor-pointer"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">---</option>
                    <option>Earrings</option>
                    <option>Necklace</option>
                    <option>Bracelets</option>
                    <option>Bag</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-2 tracking-widest">
                    Storage Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full bg-slate-50 border rounded-2xl p-4 outline-none font-bold text-sm ${
                      formError && !form.location ? "border-red-300" : "border-slate-100"
                    }`}
                    value={form.location}
                    onChange={(e) => { setForm({ ...form, location: e.target.value }); setFormError(""); }}
                  >
                    <option value="">---</option>
                    {warehouses.map((w) => (
                      <option key={w.warehouse_id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-2 tracking-widest">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-sm"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-2 tracking-widest">Selling Price (₱)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-sm"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                  <p className="text-red-600 text-[11px] font-bold">{formError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-2 justify-center">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={submitting || !!nameError}
                    className={`flex items-center gap-4 px-16 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all ${
                      submitting || nameError ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-black text-white hover:scale-105"
                    }`}
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={!!nameError}
                    className={`flex items-center gap-4 px-16 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all group ${
                      nameError ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-black text-white hover:scale-105"
                    }`}
                  >
                    Generate QR Code <HiQrCode size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="mb-10 text-left">
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Product Identity</h2>
              <p className="text-xs font-bold text-slate-400 tracking-wider">System generated QR identification.</p>
            </div>

            <div className="flex gap-14 items-start mb-14">
              <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100">
                <div ref={qrRef} className="rounded-2xl overflow-hidden">
                  <QRCodeCanvas value={skuRef.current} size={220} level="H" includeMargin={true} />
                </div>
              </div>

              <div className="flex-1 space-y-8 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] ml-1">Verified Product Name</label>
                  <div className="w-full bg-slate-50/80 p-4 rounded-2xl font-black text-slate-900 text-sm truncate uppercase tracking-tight border border-slate-100">{form.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] ml-1">SKU Code</label>
                    <div className="w-full bg-slate-50/80 p-4 rounded-2xl font-black text-slate-900 text-sm border border-slate-100">{skuRef.current}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] ml-1">Category Tag</label>
                    <div className="w-full bg-slate-50/80 p-4 rounded-2xl font-black text-slate-900 text-sm border border-slate-100 uppercase">{form.category || "---"}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] ml-1">Assigned Storage</label>
                  <div className="w-full bg-slate-50/80 p-4 rounded-2xl font-black text-slate-900 text-sm border border-slate-100 uppercase">{form.location}</div>
                </div>
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 mb-6">
                <p className="text-red-600 text-[11px] font-bold">{formError}</p>
              </div>
            )}

            <div className="flex justify-end items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => { setView("info"); setFormError(""); }}
                  className="flex items-center gap-2 px-8 py-5 border-2 border-slate-100 text-slate-400 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={submitting}
                  className="flex items-center gap-3 px-10 py-5 bg-[#10B981] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#059669] transition-all italic disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <HiPrinter size={18} />
                  {submitting ? "Saving..." : "Print PDF & Save Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}