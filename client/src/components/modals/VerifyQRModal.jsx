import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  HiCheckCircle,
  HiXCircle,
  HiPhoto,
  HiQrCode,
  HiEye,
  HiEyeSlash,
} from "react-icons/hi2";
import { API_URL } from "../../config";

const getStockStatus = (current, min) => {
  const stock = Number(current) || 0;
  const threshold = Number(min) || 0;
  if (stock <= 0) return { label: "NO STOCK", color: "bg-rose-500 text-white", dot: "bg-rose-400" };
  if (stock <= threshold) return { label: "LOW STOCK", color: "bg-amber-500 text-white", dot: "bg-amber-400" };
  return { label: "IN STOCK", color: "bg-emerald-500 text-white", dot: "bg-emerald-400" };
};

export default function VerifyQR() {
  const [searchParams] = useSearchParams();
  const sku = searchParams.get("sku");

  const [authenticated, setAuthenticated] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (authenticated && sku) fetchProduct();
  }, [authenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter your credentials.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, {
  email: email.trim(),
  password: password.trim(),
});
      if (res.data?.success) {
        setAuthenticated(true);
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setLoginError(err?.response?.data?.message || "Authentication failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    setFetchError("");
    try {
const res = await axios.get(`${API_URL}/api/finished_goods`);
      const all = res.data || [];
      const found = all.find(
        (p) => (p.sku || "").toLowerCase() === (sku || "").toLowerCase()
      );
      if (found) {
        setProduct(found);
      } else {
        setFetchError(`No product found for SKU: "${sku}"`);
      }
    } catch {
      setFetchError("Failed to load product data.");
    } finally {
      setLoading(false);
    }
  };

  if (!sku) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[1.75rem] bg-rose-50 flex items-center justify-center mb-6">
            <HiXCircle size={44} className="text-rose-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400 mb-2">Invalid Link</p>
          <p className="text-slate-700 font-black text-lg leading-snug tracking-tight">
            No SKU found in this QR link.
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div
          className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm p-10 flex flex-col items-center text-center"
          style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <div className="w-20 h-20 rounded-[1.75rem] bg-slate-100 flex items-center justify-center mb-6">
            <HiQrCode size={36} className="text-slate-700" />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">QR Product Lookup</p>
          <p className="text-slate-900 font-black text-xl leading-snug tracking-tight mb-1">Sign in to view product</p>
          <p className="text-[11px] font-bold text-slate-400 mb-8">
            SKU: <span className="text-slate-600 font-black">{sku}</span>
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-3 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 60))}
                placeholder="Enter your email"
                className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black/10 border border-slate-100 transition-all"
                disabled={loginLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 60))}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black/10 border border-slate-100 transition-all"
                  disabled={loginLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <HiEyeSlash size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
                <HiXCircle size={14} className="text-rose-500 flex-shrink-0" />
                <p className="text-[11px] font-bold text-rose-600">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-60 mt-2"
            >
              {loginLoading ? "Verifying..." : "Sign In & View Product"}
            </button>
          </form>
        </div>

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div
        className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm overflow-hidden"
        style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 px-10">
            <svg className="animate-spin text-slate-300 mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Product...</p>
          </div>
        )}

        {fetchError && !loading && (
          <div className="flex flex-col items-center justify-center py-16 px-10 text-center">
            <div className="w-20 h-20 rounded-[1.75rem] bg-rose-50 flex items-center justify-center mb-6">
              <HiXCircle size={44} className="text-rose-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400 mb-2">Not Found</p>
            <p className="text-slate-700 font-black text-base leading-snug">{fetchError}</p>
          </div>
        )}

        {product && !loading && (() => {
          const status = getStockStatus(product.current_stock, product.min_stocks);
          return (
            <>
              <div className="relative h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                {product.product_image ? (
                  <img
                    src={product.product_image}
                    className="w-full h-full object-cover"
                    alt={product.name}
                  />
                ) : (
                  <HiPhoto size={64} className="text-slate-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight inline-flex items-center gap-1.5 ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot} opacity-80`} />
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="p-7">
                <div className="mb-5">
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-1">
                    {product.name || "Unnamed Product"}
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{product.sku}</p>
                  {product.collection && (
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{product.collection}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</p>
                    <p className="font-black text-slate-800 text-xs uppercase truncate">{product.category || "---"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Unit</p>
                    <p className="font-black text-slate-800 text-xs uppercase">{product.stock_unit || "---"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Stock Level</p>
                    <p className="font-black text-slate-900 text-lg leading-none">{product.current_stock || 0}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Min: {product.min_stocks || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Price</p>
                    <p className="font-black text-emerald-500 text-lg leading-none">
                      ₱{parseFloat(product.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <HiCheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verified via QR Code</p>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}