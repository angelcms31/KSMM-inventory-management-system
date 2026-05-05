import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from "react";
import axios from "axios";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { 
  HiMagnifyingGlass, 
  HiPencil, 
  HiPhoto, 
  HiChevronLeft, 
  HiChevronRight, 
  HiQrCode, 
  HiXMark, 
  HiCheckCircle, 
  HiXCircle, 
  HiArrowDownTray, 
  HiPlus, 
  HiArrowUpTray,
  HiLockClosed,
  HiShieldCheck,
  HiClock
} from "react-icons/hi2";
import AddProductModal from "../../components/modals/AddProductModal";

const QR_SESSION_KEY = "qr_session_expires";
const QR_SESSION_DURATION = 5 * 60 * 1000;

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
          {isSuccess ? (
            <HiCheckCircle size={44} className="text-emerald-500" />
          ) : (
            <HiXCircle size={44} className="text-rose-500" />
          )}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? "text-emerald-500" : "text-rose-500"}`}>
          {isSuccess ? "Success" : "Error"}
        </p>
        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            isSuccess ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
          }`}
        >
          Got it
        </button>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

const useAlert = () => {
  const [alert, setAlert] = useState(null);
  const showAlert = useCallback((message, type = "success") => setAlert({ message, type }), []);
  const closeAlert = useCallback(() => setAlert(null), []);
  return { alert, showAlert, closeAlert };
};

const QRCredentialGate = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter your credentials.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email: username.trim(),
        password: password.trim()
      });
      if (res.data?.success) {
        const expires = Date.now() + QR_SESSION_DURATION;
        sessionStorage.setItem(QR_SESSION_KEY, expires.toString());
        setStep("success");
        setTimeout(() => onSuccess(), 900);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Authentication failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: "popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        {step === "success" ? (
          <>
            <div className="w-20 h-20 rounded-[1.75rem] bg-emerald-50 flex items-center justify-center mb-6">
              <HiShieldCheck size={44} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-emerald-500">Verified</p>
            <p className="text-slate-800 font-black text-xl leading-snug tracking-tight">
              Access granted. Opening scanner...
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-[1.75rem] bg-slate-50 flex items-center justify-center mb-6">
              <HiLockClosed size={36} className="text-slate-700" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-slate-400">QR Scanner Access</p>
            <p className="text-slate-800 font-black text-xl leading-snug tracking-tight mb-2">
              Sign in to continue
            </p>
            <div className="flex items-center gap-1.5 mb-8">
              <HiClock size={12} className="text-amber-400" />
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Session valid for 5 minutes</p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-3 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.slice(0, 30))}
                  maxLength={30}
                  placeholder="Enter your email"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black/10 border border-slate-100 transition-all"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value.slice(0, 30))}
                  maxLength={30}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black/10 border border-slate-100 transition-all"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
                  <HiXCircle size={14} className="text-rose-500 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-rose-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-60 mt-2"
              >
                {loading ? "Verifying..." : "Sign In & Open Scanner"}
              </button>
            </form>

            <button onClick={onClose} className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">
              Cancel
            </button>
          </>
        )}

        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.04] bg-slate-900" />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

const QRSessionExpiredModal = ({ onReauth, onClose }) => (
  <div
    className="fixed inset-0 z-[250] flex items-center justify-center p-6"
    style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.4)" }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
      style={{ animation: "popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-20 h-20 rounded-[1.75rem] bg-amber-50 flex items-center justify-center mb-6">
        <HiClock size={40} className="text-amber-500" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-amber-500">Session Expired</p>
      <p className="text-slate-800 font-black text-xl leading-snug tracking-tight mb-2">
        Your 5-minute session has ended
      </p>
      <p className="text-sm font-bold text-slate-400 mb-8">Please sign in again to continue scanning QR codes.</p>
      <button
        onClick={onReauth}
        className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 mb-3"
      >
        Sign In Again
      </button>
      <button onClick={onClose} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">
        Close
      </button>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.04] bg-amber-500" />
    </div>
    <style>{`
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.88) translateY(16px); }
        to   { opacity: 1; transform: scale(1)    translateY(0);    }
      }
    `}</style>
  </div>
);

const downloadQRCode = async (product) => {
  const text = product.sku || product.name || "NO-SKU";
  const truncateText = (str, n) => str.length > n ? str.substr(0, n - 1) + "..." : str;

  const qrDataUrl = await QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  const qrImg = new Image();
  await new Promise((resolve) => { qrImg.onload = resolve; qrImg.src = qrDataUrl; });

  const padding = 32;
  const labelHeight = 48;
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = qrImg.width + padding * 2;
  finalCanvas.height = qrImg.height + padding * 2 + labelHeight;

  const ctx = finalCanvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  ctx.drawImage(qrImg, padding, padding);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(truncateText(product.sku || "", 28), finalCanvas.width / 2, qrImg.height + padding + 20);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#64748b";
  ctx.fillText(truncateText(product.name || "", 32), finalCanvas.width / 2, qrImg.height + padding + 38);

  const link = document.createElement("a");
  link.download = `QR-${text.substring(0, 20)}.png`;
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
};

const QRScannerModal = ({ products, onClose, showAlert, onSessionExpired }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeRef = useRef(false);
  const productsRef = useRef(products);
  const timerRef = useRef(null);

  const [scannedProduct, setScannedProduct] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [mode, setMode] = useState("camera");
  const [uploading, setUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => { productsRef.current = products; }, [products]);

  useEffect(() => {
    const updateTimer = () => {
      const expires = parseInt(sessionStorage.getItem(QR_SESSION_KEY) || "0");
      const remaining = Math.max(0, expires - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        stopCamera();
        onSessionExpired();
      }
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(timerRef.current);
  }, [onSessionExpired]);

  const formatTime = (ms) => {
    const secs = Math.ceil(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getStockStatus = (current, min) => {
    const stock = Number(current) || 0;
    const threshold = Number(min) || 0;
    if (stock <= 0) return { label: "NO STOCK", color: "bg-rose-500 text-white" };
    if (stock <= threshold) return { label: "LOW STOCK", color: "bg-rose-500 text-white" };
    return { label: "IN STOCK", color: "bg-emerald-500 text-white" };
  };

  const stopCamera = () => {
    activeRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resolveProduct = (value) => {
    const v = value.trim().toLowerCase();
    return productsRef.current.find(
      p => (p.sku || "").toLowerCase() === v || (p.name || "").toLowerCase() === v
    );
  };

  const tick = () => {
    if (!activeRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) {
        activeRef.current = false;
        stopCamera();
        const found = resolveProduct(code.data);
        if (found) {
          setScannedProduct(found);
        } else {
          showAlert(`No product found for: "${code.data.trim()}"`, "error");
        }
        return;
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        streamRef.current = stream;
        activeRef.current = true;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => { animFrameRef.current = requestAnimationFrame(tick); })
            .catch(err => { if (err.name !== "AbortError") console.error("Video play error:", err); });
        }
      })
      .catch(() => setCameraError("Camera access denied. Please allow permissions."));
  };

  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => stopCamera();
  }, [mode]);

  const handleRescan = () => {
    setScannedProduct(null);
    setCameraError(null);
    setUploading(false);
    if (mode === "camera") {
      startCamera();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setScannedProduct(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        setUploading(false);
        if (code && code.data) {
          const found = resolveProduct(code.data);
          if (found) {
            setScannedProduct(found);
          } else {
            showAlert(`No product found for: "${code.data.trim()}"`, "error");
          }
        } else {
          showAlert("No QR code detected in the image.", "error");
        }
      };
      img.onerror = () => { setUploading(false); showAlert("Failed to load image.", "error"); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const switchMode = (newMode) => {
    stopCamera();
    setScannedProduct(null);
    setCameraError(null);
    setUploading(false);
    setMode(newMode);
  };

  const timerColor = timeLeft < 60000 ? "text-rose-500" : timeLeft < 120000 ? "text-amber-500" : "text-emerald-500";
  const timerBg = timeLeft < 60000 ? "bg-rose-50 border-rose-100" : timeLeft < 120000 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative"
        style={{ animation: "popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">QR Scanner</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Scan QR Code</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${timerBg} ${timerColor}`}>
              <HiClock size={12} />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
            >
              <HiXMark size={20} />
            </button>
          </div>
        </div>

        <div className="px-8 pb-4 pt-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => switchMode("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "camera" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            >
              <HiQrCode size={14} /> Camera
            </button>
            <button
              onClick={() => switchMode("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "upload" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            >
              <HiArrowUpTray size={14} /> Upload
            </button>
          </div>
        </div>

        <div className="px-8 pb-8">
          {!scannedProduct ? (
            <div className="space-y-4">
              {mode === "camera" && !cameraError && (
                <div className="relative w-full rounded-[2rem] overflow-hidden bg-black aspect-[4/3] shadow-inner">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 relative border-2 border-white/20 rounded-3xl">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.8)] -translate-y-1/2 animate-[scanLine_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                </div>
              )}

              {mode === "upload" && (
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-12 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center gap-3 disabled:opacity-60"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                    {uploading ? (
                      <svg className="animate-spin text-slate-400" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <HiArrowUpTray size={24} />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                      {uploading ? "Processing..." : "Upload QR Image"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Tap to select from gallery</p>
                  </div>
                </button>
              )}

              {cameraError && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-20 h-20 rounded-[1.75rem] bg-rose-50 flex items-center justify-center">
                    <HiXCircle size={48} className="text-rose-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 text-center">{cameraError}</p>
                  <button
                    onClick={handleRescan}
                    className="bg-black text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!cameraError && (
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {mode === "camera" ? "Align QR code within the frame" : "Select a clear image of the QR"}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-[popIn_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-slate-100 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                  {scannedProduct.product_image ? (
                    <img src={scannedProduct.product_image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <HiPhoto size={32} className="text-slate-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900 uppercase text-sm leading-tight truncate" title={scannedProduct.name}>
                    {scannedProduct.name || "Unnamed Product"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate mt-1">{scannedProduct.sku}</p>
                  {scannedProduct.collection && (
                    <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{scannedProduct.collection}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</p>
                  <p className="font-black text-slate-800 text-xs uppercase truncate">{scannedProduct.category || "---"}</p>
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Unit</p>
                  <p className="font-black text-slate-800 text-xs uppercase">{scannedProduct.stock_unit || "---"}</p>
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Stock Level</p>
                  <p className="font-black text-slate-800 text-sm">{scannedProduct.current_stock?.toLocaleString() || 0}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Min: {scannedProduct.min_stocks || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Price</p>
                  <p className="font-black text-emerald-500 text-sm">
                    ₱{parseFloat(scannedProduct.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className={`px-5 py-2 rounded-full text-[10px] font-black tracking-tight ${getStockStatus(scannedProduct.current_stock, scannedProduct.min_stocks).color}`}>
                  {getStockStatus(scannedProduct.current_stock, scannedProduct.min_stocks).label}
                </div>
                <button
                  onClick={handleRescan}
                  className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                >
                  <HiQrCode size={16} />
                  {mode === "upload" ? "Upload Again" : "Rescan"}
                </button>
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes scanLine {
          0%, 100% { transform: translateY(-60px); opacity: 0.4; }
          50% { transform: translateY(60px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default function SalesInventory() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  const [qrGateOpen, setQrGateOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrExpiredOpen, setQrExpiredOpen] = useState(false);

  const PAGE_SIZE = 10;
  const { alert, showAlert, closeAlert } = useAlert();

  const isQrSessionValid = () => {
    const expires = parseInt(sessionStorage.getItem(QR_SESSION_KEY) || "0");
    return Date.now() < expires;
  };

  const handleScanQRClick = () => {
    if (isQrSessionValid()) {
      setQrScannerOpen(true);
    } else {
      setQrGateOpen(true);
    }
  };

  const handleGateSuccess = () => {
    setQrGateOpen(false);
    setQrScannerOpen(true);
  };

  const handleSessionExpired = () => {
    setQrScannerOpen(false);
    sessionStorage.removeItem(QR_SESSION_KEY);
    setQrExpiredOpen(true);
  };

  const handleReauth = () => {
    setQrExpiredOpen(false);
    setQrGateOpen(true);
  };

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finished_goods");
      const fetchedProducts = res.data || [];
      setProducts(fetchedProducts);
      await autoCreateWorkOrders(fetchedProducts);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("Failed to fetch inventory data.", "error");
    }
  };

  const autoCreateWorkOrders = async (productList) => {
    try {
      const woRes = await axios.get("http://localhost:5000/api/artisan_work_orders");
      const existingOrders = woRes.data || [];
      const activeSkus = new Set(
        existingOrders
          .filter(wo => ["Pending", "pending", "In Production"].includes(wo.status))
          .map(wo => wo.sku)
      );
      const lowStockProducts = productList.filter(
        p => (Number(p.current_stock) || 0) <= (Number(p.min_stocks) || 0)
      );
      await Promise.all(
        lowStockProducts
          .filter(p => !activeSkus.has(p.sku))
          .map(p =>
            axios.post("http://localhost:5000/api/artisan_work_orders", {
              sku: p.sku,
              quantity_needed: p.min_stocks || 1,
              status: "Pending",
              product_image: p.product_image || null,
              category: p.category || "",
            })
          )
      );
    } catch (err) {
      console.error("Auto WO failed:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStockStatus = (current, min) => {
    const stock = Number(current) || 0;
    const threshold = Number(min) || 0;
    if (stock <= 0) return { label: "NO STOCK", color: "bg-[#F43F5E] text-white" };
    if (stock <= threshold) return { label: "LOW STOCK", color: "bg-[#F43F5E] text-white" };
    return { label: "IN STOCK", color: "bg-[#10B981] text-white" };
  };

  const generateNextSKU = (productList) => {
    if (!productList || productList.length === 0) return "SKU-001";
    const nums = productList
      .map(p => { const match = p.sku?.match(/^SKU-(\d+)$/); return match ? parseInt(match[1], 10) : 0; })
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `SKU-${String(max + 1).padStart(3, "0")}`;
  };

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      (p.name || "").toLowerCase().includes(search) ||
      (p.sku || "").toLowerCase().includes(search) ||
      (p.category || "").toLowerCase().includes(search) ||
      (p.collection || "").toLowerCase().includes(search);
    const statusObj = getStockStatus(p.current_stock, p.min_stocks);
    const matchesStatus = statusFilter === "All Status" || statusObj.label === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handleCloseModal = () => { setShowAddModal(false); setSelectedProduct(null); };
  const handleEditClick = (p) => { setSelectedProduct(p); setShowAddModal(true); };
  const handleAddClick = () => { setSelectedProduct({ sku: generateNextSKU(products), isNew: true }); setShowAddModal(true); };

  return (
    <div className="flex w-full bg-[#F9FAFB] font-sans antialiased text-slate-900" style={{ minHeight: "100vh", overflow: "hidden" }}>
      <AlertDialog alert={alert} onClose={closeAlert} />

      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8" style={{ overflow: "hidden", height: "100vh" }}>

        <div className="bg-white p-3 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center flex-shrink-0">
          <div className="flex gap-2 items-center flex-1">
            <div className="relative flex-1 min-w-0">
              <HiMagnifyingGlass className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder="Search SKU, Name..."
                className="w-full bg-slate-50 border-none rounded-2xl py-3 sm:py-3.5 pl-10 sm:pl-12 pr-3 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-black/5 transition-all text-xs sm:text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value.slice(0, 30))}
                maxLength={30}
              />
            </div>

            <button
              onClick={handleAddClick}
              className="sm:hidden flex-shrink-0 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <HiPlus size={20} />
            </button>

            <button
              onClick={handleScanQRClick}
              className="sm:hidden flex-shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <HiQrCode size={20} />
            </button>
          </div>

          <button
            onClick={handleScanQRClick}
            className="hidden sm:flex flex-shrink-0 items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg whitespace-nowrap"
          >
            <HiQrCode size={16} />
            <span>Scan QR</span>
          </button>
        </div>

        <div className="flex-1 min-h-0" style={{ overflow: "hidden" }}>
          <section
            className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col"
            style={{ height: "100%", overflow: "hidden" }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6 px-1 sm:px-2 flex-shrink-0">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Finished Goods Inventory</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 sm:mt-2">Production Records</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <select
                  className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 sm:px-4 font-bold text-slate-600 outline-none cursor-pointer text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-all shadow-sm"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All Status">All Status</option>
                  <option value="IN STOCK">In Stock</option>
                  <option value="LOW STOCK">Low Stock</option>
                  <option value="NO STOCK">No Stock</option>
                </select>
                <button
                  onClick={handleAddClick}
                  className="hidden sm:flex bg-black text-white px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest whitespace-nowrap items-center gap-2"
                >
                  + Add Product
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0" style={{ overflow: "hidden auto" }}>
              {pagedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <HiMagnifyingGlass size={56} className="mb-4" />
                  <p className="text-base font-black uppercase tracking-widest text-slate-400">No results found</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <table className="w-full border-separate border-spacing-y-3" style={{ tableLayout: "fixed" }}>
                      <thead>
                        <tr className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                          <th className="pb-2 text-left pl-6" style={{ width: "26%" }}>Product Details</th>
                          <th className="pb-2 text-center" style={{ width: "11%" }}>Category</th>
                          <th className="pb-2 text-center" style={{ width: "12%" }}>Stocks</th>
                          <th className="pb-2 text-center" style={{ width: "9%" }}>Unit</th>
                          <th className="pb-2 text-center" style={{ width: "12%" }}>Status</th>
                          <th className="pb-2 text-center" style={{ width: "11%" }}>Price</th>
                          <th className="pb-2 text-right pr-8" style={{ width: "19%" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-slate-700">
                        {pagedProducts.map(p => {
                          const status = getStockStatus(p.current_stock, p.min_stocks);
                          return (
                            <tr key={p.sku} className="group hover:bg-slate-50/80 transition-all">
                              <td className="py-3 pl-6 rounded-l-[2rem] text-left border-y border-l border-transparent group-hover:border-slate-100" style={{ overflow: "hidden" }}>
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                                    {p.product_image ? (
                                      <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <HiPhoto size={22} className="text-slate-200" />
                                    )}
                                  </div>
                                  <div className="flex flex-col items-start min-w-0">
                                    <span className="text-slate-900 font-black uppercase text-xs mb-0.5 truncate w-full" title={p.name}>
                                      {p.name || "Unnamed"}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider w-full overflow-hidden">
                                      <span className="truncate max-w-[100px]" title={p.sku}>{p.sku}</span>
                                      {p.collection && (
                                        <>
                                          <span className="text-slate-300 flex-shrink-0">•</span>
                                          <span className="truncate max-w-[80px]" title={p.collection}>{p.collection}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-center border-y border-transparent group-hover:border-slate-100">
                                <p className="truncate uppercase font-black text-[10px] text-slate-500" title={p.category}>{p.category || "---"}</p>
                              </td>
                              <td className="py-3 text-center border-y border-transparent group-hover:border-slate-100">
                                <div className="flex flex-col items-center">
                                  <span className="text-[14px] text-slate-900 font-black leading-none">{p.current_stock || 0}</span>
                                  <span className="text-[8px] text-slate-400 uppercase font-black mt-0.5 tracking-tight">Min: {p.min_stocks || 0}</span>
                                </div>
                              </td>
                              <td className="py-3 text-center border-y border-transparent group-hover:border-slate-100">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide">{p.stock_unit || "---"}</span>
                              </td>
                              <td className="py-3 text-center border-y border-transparent group-hover:border-slate-100">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm tracking-tight inline-block whitespace-nowrap ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-3 text-center font-black text-[#10B981] border-y border-transparent group-hover:border-slate-100 whitespace-nowrap">
                                ₱{parseFloat(p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 pr-4 rounded-r-[2rem] text-right border-y border-r border-transparent group-hover:border-slate-100">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => downloadQRCode(p)} title="Download QR" className="w-10 h-10 bg-white text-slate-500 hover:text-emerald-600 hover:shadow-md rounded-xl transition-all border border-slate-100 inline-flex items-center justify-center shadow-sm">
                                    <HiArrowDownTray size={16} />
                                  </button>
                                  <button onClick={() => handleEditClick(p)} className="w-10 h-10 bg-white text-slate-900 hover:shadow-md rounded-xl transition-all border border-slate-100 inline-flex items-center justify-center shadow-sm">
                                    <HiPencil size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-3">
                    {pagedProducts.map(p => {
                      const status = getStockStatus(p.current_stock, p.min_stocks);
                      return (
                        <div key={p.sku} className="bg-slate-50/60 rounded-[1.5rem] p-4 border border-slate-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                              {p.product_image ? (
                                <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <HiPhoto size={22} className="text-slate-200" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 uppercase text-xs truncate">{p.name || "Unnamed"}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{p.sku}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => downloadQRCode(p)} className="w-9 h-9 bg-white text-slate-500 hover:text-emerald-600 hover:shadow-md rounded-xl transition-all border border-slate-100 inline-flex items-center justify-center shadow-sm">
                                <HiArrowDownTray size={15} />
                              </button>
                              <button onClick={() => handleEditClick(p)} className="w-9 h-9 bg-white text-slate-900 hover:shadow-md rounded-xl transition-all border border-slate-100 inline-flex items-center justify-center shadow-sm">
                                <HiPencil size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white rounded-xl p-2.5 text-center">
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Stock</p>
                              <p className="font-black text-slate-800 text-sm">{p.current_stock || 0}</p>
                              <p className="text-[8px] text-slate-400 font-bold text-center">Min: {p.min_stocks || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-2.5 text-center">
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Price</p>
                              <p className="font-black text-emerald-500 text-xs text-center leading-tight">
                                ₱{parseFloat(p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-2.5 flex items-center justify-center">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-tight inline-block whitespace-nowrap ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                          {(p.category || p.collection) && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {p.category && (
                                <span className="text-[9px] font-black uppercase text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-100">{p.category}</span>
                              )}
                              {p.collection && (
                                <span className="text-[9px] font-black uppercase text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-100">{p.collection}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {safePage} of {totalPages}</span>
                <button onClick={handlePrev} disabled={safePage === 1} className="w-9 h-9 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all">
                  <HiChevronLeft size={16} />
                </button>
                <button onClick={handleNext} disabled={safePage === totalPages} className="w-9 h-9 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all">
                  <HiChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {qrGateOpen && (
        <QRCredentialGate
          onSuccess={handleGateSuccess}
          onClose={() => setQrGateOpen(false)}
        />
      )}

      {qrScannerOpen && (
        <QRScannerModal
          products={products}
          onClose={() => setQrScannerOpen(false)}
          showAlert={showAlert}
          onSessionExpired={handleSessionExpired}
        />
      )}

      {qrExpiredOpen && (
        <QRSessionExpiredModal
          onReauth={handleReauth}
          onClose={() => setQrExpiredOpen(false)}
        />
      )}

      {showAddModal && (
        <AddProductModal
          product={selectedProduct}
          products={products}
          fetchProducts={fetchData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}