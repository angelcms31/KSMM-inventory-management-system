import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiXMark, HiPhoto } from "react-icons/hi2";

export default function AddProductModal({ product, fetchProducts, onClose }) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    sku: "",
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
  const [triggerMsg, setTriggerMsg] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/warehouses").then((res) => {
      setWarehouses(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || "",
        name: product.name || "",
        collection: product.collection || "",
        brand: product.brand || "",
        selling_price: product.selling_price || "",
        location: product.warehouse_location || "",
        category: product.category || "",
        quantity: product.current_stock || "",
        min_stocks: product.min_stocks || "",
        product_image: product.product_image || null,
      });
      setImagePreview(product.product_image || null);
    }
  }, [product]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTriggerMsg(null);

    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/products/${form.sku}`, {
          name: form.name,
          collection: form.collection,
          brand: form.brand,
          selling_price: parseFloat(form.selling_price),
          product_image: form.product_image,
          location: form.location,
          category: form.category,
          quantity: parseInt(form.quantity),
          min_stocks: parseInt(form.min_stocks) || 0,
        });

        const stock = parseInt(form.quantity) || 0;
        const min = parseInt(form.min_stocks) || 0;

        if (stock <= min) {
          try {
            const woCheck = await axios.get("http://localhost:5000/api/artisan_work_orders");
            const existing = (woCheck.data || []).find(
              (wo) =>
                wo.sku === form.sku &&
                (wo.status === "Pending" || wo.status === "In Production")
            );

            if (!existing) {
              await axios.post("http://localhost:5000/api/work_orders/trigger", {
                sku: form.sku,
                quantity_needed: min * 2 || 10,
                category: form.category,
              });
              setTriggerMsg(
                `⚠️ Low stock detected — Work Order auto-created for ${form.name}!`
              );
            }
          } catch (triggerErr) {
            console.error("WO trigger failed:", triggerErr.message);
          }
        }
      } else {
        await axios.post("http://localhost:5000/api/sales_Add_inventory", {
          sku: form.sku,
          name: form.name,
          collection: form.collection,
          brand: form.brand,
          selling_price: parseFloat(form.selling_price),
          product_image: form.product_image,
          location: form.location,
          category: form.category,
          quantity: parseInt(form.quantity),
          min_stocks: parseInt(form.min_stocks) || 0,
        });
      }

      await fetchProducts();

      if (triggerMsg) {
        setTimeout(() => onClose(), 2000);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Submit error:", err.message);
      alert("Error: " + (err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-[100] p-6 text-left backdrop-blur-md bg-black/10">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-10 right-10 text-gray-400 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"
        >
          <HiXMark size={28} />
        </button>

        <h2 className="text-4xl font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">
          {isEdit ? "Edit Product" : "Add Product"}
        </h2>

        {triggerMsg && (
          <div className="mb-4 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 font-black text-xs uppercase tracking-wider">
            {triggerMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 overflow-y-auto no-scrollbar flex-1 pr-2"
        >
          <div className="flex flex-col items-center mb-6 flex-shrink-0">
            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
              ) : (
                <HiPhoto size={40} className="text-slate-200" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-[10px] font-black uppercase text-center">
                  Upload Photo
                </p>
              </div>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 font-bold text-left">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                SKU
              </label>
              <input
                required
                disabled={isEdit}
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Product Name
              </label>
              <input
                required
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 font-bold text-left">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Collection
              </label>
              <input
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm"
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Brand
              </label>
              <input
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 font-bold text-left">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Category
              </label>
              <select
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm cursor-pointer"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category...</option>
                <option>Earrings</option>
                <option>Necklace</option>
                <option>Bracelets</option>
                <option>Bag</option>
                <option>Accessory</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Selling Price (₱)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 font-bold text-left">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Stock Qty
              </label>
              <input
                type="number"
                required
                className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none font-black text-sm"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Min Threshold
              </label>
              <input
                type="number"
                className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none font-black text-sm"
                value={form.min_stocks}
                onChange={(e) => setForm({ ...form, min_stocks: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                Warehouse
              </label>
              <select
                className="w-full bg-[#F3F4F6] rounded-xl p-4 outline-none font-black text-sm cursor-pointer"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select...</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-1 justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest disabled:opacity-60"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}