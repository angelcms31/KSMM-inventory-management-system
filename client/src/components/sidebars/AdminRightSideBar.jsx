import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell, HiOutlineRefresh, HiOutlinePaperAirplane, HiOutlineX, HiMinus, HiChevronLeft, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { getHashedPath } from "../../utils/hash";

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess ? <HiCheckCircle size={44} className="text-emerald-500" /> : <HiXCircle size={44} className="text-rose-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className="text-slate-800 font-bold text-lg leading-tight tracking-tight mb-8">{alert.message}</p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100'}`}
        >
          {isSuccess ? 'CLOSE' : 'GOT IT'}
        </button>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

const AdminRightSidebar = ({ pendingCompose, onComposeHandled }) => {
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "Admin User";
  const getIsHeadAdmin = () => localStorage.getItem("is_head_admin") === "true";
  const isHeadAdmin = getIsHeadAdmin();
  const userRole = isHeadAdmin ? "Head Admin" : (localStorage.getItem("role") || "Admin");
  const role = localStorage.getItem("userRole")?.toLowerCase() || "admin";

  const [profilePic, setProfilePic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [viewMode, setViewMode] = useState('inbox');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false });
  const [attachments, setAttachments] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarAlert, setSidebarAlert] = useState(null);

  const bodyRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!pendingCompose || !pendingCompose.to) return;

    setShowCompose(true);
    setComposeMinimized(false);
    setComposeTo(pendingCompose.to);
    setComposeSubject(pendingCompose.subject || "");

    let attempts = 0;
    const injectInterval = setInterval(() => {
      attempts++;
      if (bodyRef.current) {
        const escaped = (pendingCompose.body || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
        bodyRef.current.innerHTML = escaped;
        if (onComposeHandled) onComposeHandled();
        clearInterval(injectInterval);
      }
      if (attempts > 20) clearInterval(injectInterval);
    }, 100);

    return () => clearInterval(injectInterval);
  }, [pendingCompose, onComposeHandled]);

  const getStorageKey = () => `notif_read_${localStorage.getItem("user_id") || "guest"}`;
  const getSessionKey = () => `notif_session_${localStorage.getItem("user_id") || "guest"}`;

  const getReadIds = () => {
    try {
      const persistent = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
      const session = JSON.parse(sessionStorage.getItem(getSessionKey()) || "[]");
      return Array.from(new Set([...persistent, ...session]));
    } catch { return []; }
  };

  const saveReadIds = (ids) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(ids));
      sessionStorage.setItem(getSessionKey(), JSON.stringify(ids));
    } catch {}
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMins = Math.floor((now - past) / 60000);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} mins ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  const getStatusStyle = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('login') || act.includes('create') || act.includes('approve') || act.includes('activat')) return "bg-green-600";
    if (act.includes('update') || act.includes('edit') || act.includes('unlock')) return "bg-blue-600";
    if (act.includes('logout') || act.includes('delete') || act.includes('deactivate') || act.includes('reject') || act.includes('lock')) return "bg-red-600";
    return "bg-yellow-600";
  };

  const getNotifBadge = (action) => {
    const act = action?.toLowerCase() || '';
    const text = action || 'LOG';
    if (act.includes('login') || act.includes('activat')) return { pillText: text, pillClass: 'bg-emerald-500/20 text-emerald-400' };
    if (act.includes('logout') || act.includes('deactivat')) return { pillText: text, pillClass: 'bg-red-500/20 text-red-400' };
    if (act.includes('update') || act.includes('edit') || act.includes('unlock')) return { pillText: text, pillClass: 'bg-blue-500/20 text-blue-400' };
    if (act.includes('approv')) return { pillText: text, pillClass: 'bg-emerald-500/20 text-emerald-400' };
    if (act.includes('reject') || act.includes('lock') || act.includes('delete')) return { pillText: text, pillClass: 'bg-red-500/20 text-red-400' };
    if (act.includes('registr') || act.includes('request') || act.includes('pending') || act.includes('create')) return { pillText: text, pillClass: 'bg-yellow-500/20 text-yellow-400' };
    return { pillText: text, pillClass: 'bg-gray-500/20 text-gray-400' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const formatFrom = (from) => {
    const match = from?.match(/^(.*?)\s*<(.+)>$/);
    if (match) return match[1].trim().replace(/"/g, '') || match[2];
    return from || '';
  };

  const navigateToAudit = () => {
    const auditPath = getHashedPath(role, 'audit');
    navigate(`/dashboard/${auditPath}`);
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/audit_logs");
      const allLogs = Array.isArray(res.data) ? res.data : [];
      setActivities(allLogs.slice(0, 4));

      const storedReadIds = getReadIds();
      const headAdmin = getIsHeadAdmin();

      const filtered = allLogs.filter(log => {
        const act = log.action?.toLowerCase() || '';
        if (headAdmin) {
          return act.includes('registration') || act.includes('pending') ||
            act.includes('approval') || act.includes('approved') ||
            act.includes('rejected') || act.includes('request') ||
            act.includes('activated') || act.includes('deactivated') ||
            act.includes('locked');
        } else {
          return (act.includes('activated') && !act.includes('deactivated')) ||
            act.includes('deactivated') || act.includes('locked');
        }
      });

      const notifList = filtered.slice(0, 15).map(log => {
        const stableId = `${log.timestamp}__${(log.action || '').replace(/\s+/g, '_')}__${(log.merged_name || '').replace(/\s+/g, '_')}`;
        return {
          notifId: stableId,
          action: log.action,
          merged_name: log.merged_name || 'System',
          timestamp: log.timestamp,
          isRead: storedReadIds.includes(stableId),
        };
      });

      setNotifications(notifList);
      setUnreadCount(notifList.filter(n => !n.isRead).length);
    } catch { setActivities([]); }
  };

  const markOneRead = (notifId) => {
    const current = getReadIds();
    if (!current.includes(notifId)) saveReadIds([...current, notifId]);
    setNotifications(prev => prev.map(n => n.notifId === notifId ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    if (unreadCount > 0) {
      const allIds = notifications.map(n => n.notifId);
      saveReadIds(Array.from(new Set([...getReadIds(), ...allIds])));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const checkGmailStatus = async () => {
    setGmailLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/gmail/status");
      setGmailConnected(res.data.connected);
      if (res.data.connected) fetchGmailMessages();
      else setGmailLoading(false);
    } catch {
      setGmailConnected(false);
      setGmailLoading(false);
    }
  };

  const fetchGmailMessages = async () => {
    setGmailLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        axios.get("http://localhost:5000/api/gmail/messages"),
        axios.get("http://localhost:5000/api/gmail/sent"),
      ]);
      setMessages(inboxRes.data || []);
      setSentMessages(sentRes.data || []);
    } catch {
      console.error("Failed to fetch messages");
    } finally { setGmailLoading(false); }
  };

  const handleConnect = () => {
    window.open("http://localhost:5000/auth/gmail", "_blank", "width=500,height=600");
    setTimeout(checkGmailStatus, 5000);
  };

  const applyFormat = useCallback((cmd) => {
    if (bodyRef.current) {
      bodyRef.current.focus();
      document.execCommand(cmd, false, null);
      setFormatting({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    }
  }, []);

  const handleBodyKeyUp = useCallback(() => {
    setFormatting({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }, []);

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = "";
  };

  const removeAttachment = (index) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleDiscard = useCallback(() => {
    setShowCompose(false);
    setComposeMinimized(false);
    setComposeTo("");
    setComposeSubject("");
    setAttachments([]);
    setSendSuccess(false);
    if (bodyRef.current) bodyRef.current.innerHTML = "";
  }, []);

  const handleSend = async () => {
    const bodyText = bodyRef.current?.innerText?.trim() || "";
    const bodyHTML = bodyRef.current?.innerHTML || "";
    if (!composeTo || !composeSubject || !bodyText) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", composeTo);
      formData.append("subject", composeSubject);
      formData.append("body", bodyHTML);
      attachments.forEach(file => formData.append("attachments", file));

      await axios.post("http://localhost:5000/api/gmail/send", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSendSuccess(true);
      fetchGmailMessages();
      setSidebarAlert({ type: 'success', message: 'Email sent successfully!' });
      setTimeout(() => { handleDiscard(); }, 2000);
    } catch (err) {
      console.error(err);
      setSidebarAlert({ type: 'error', message: 'Failed to send email.' });
    } finally { setSending(false); }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (userId) {
          const res = await axios.get(`http://localhost:5000/api/user/${userId}`);
          setProfilePic(res.data.profile_image);
        }
      } catch {}
    };
    fetchUserProfile();
    fetchActivities();
    checkGmailStatus();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const NotificationsPanel = () => (
    <div className="absolute inset-0 bg-[#262221] z-50 flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNotifications(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <HiChevronLeft size={18} className="text-gray-400" />
          </button>
          <div>
            <h4 className="text-[14px] font-bold text-white">Notifications</h4>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
              {isHeadAdmin ? 'All Account Activity' : 'Account Activity'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{unreadCount} new</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto text-left">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <span className="text-4xl">{isHeadAdmin ? '📋' : '🛡️'}</span>
            <p className="text-gray-600 text-[12px] font-bold">{isHeadAdmin ? 'No activity yet' : 'No account alerts'}</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map(notif => {
              const { pillText, pillClass } = getNotifBadge(notif.action);
              return (
                <div
                  key={notif.notifId}
                  onClick={() => !notif.isRead && markOneRead(notif.notifId)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.03] transition-colors ${!notif.isRead ? 'bg-white/[0.05] hover:bg-white/[0.08]' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider truncate max-w-[160px] ${pillClass}`}>
                        {pillText}
                      </span>
                      {!notif.isRead && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                      By <span className={`font-bold ${isHeadAdmin ? 'text-blue-400' : 'text-indigo-400'}`}>{notif.merged_name}</span>
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{formatTime(notif.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => { setShowNotifications(false); navigateToAudit(); }}
          className="w-full text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors py-2"
        >
          View Full Audit Log →
        </button>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="relative w-full h-full bg-[#262221] text-white flex flex-col font-sans border-l border-white/5 z-40 overflow-hidden">
      {showNotifications && <NotificationsPanel />}

      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-white/10">
            <img
              src={profilePic ? (profilePic.startsWith('data:') || profilePic.startsWith('http') ? profilePic : `http://localhost:5000${profilePic}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
              alt="User"
              className="w-full h-full object-cover"
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`; }}
            />
          </div>
          <div>
            <h4 className="text-[14px] font-bold leading-none">{userName}</h4>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${isHeadAdmin ? 'text-indigo-400' : 'text-gray-500'}`}>{userRole}</p>
          </div>
        </div>
        <button onClick={handleOpenNotifications} className="relative cursor-pointer p-1.5 rounded-full hover:bg-white/5 transition-all duration-200 active:scale-90">
          <HiOutlineBell size={22} className="text-gray-400 hover:text-white transition-colors duration-200" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-[#262221] flex items-center justify-center">
              <span className="text-[8px] font-black text-white px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </span>
          )}
        </button>
      </div>

      <div className="px-6 mb-4 text-left">
        <div className="bg-[#1e1b1a] rounded-xl p-4 border border-white/5">
          <h5 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-5">Recent Activities</h5>
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((log, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-grow pr-2 min-w-0">
                  <p className="text-[12px] font-bold leading-tight text-gray-200 truncate">{log.action}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate italic">By {log.merged_name}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{formatTime(log.timestamp)}</p>
                </div>
                <span className={`${getStatusStyle(log.action)} text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter flex-shrink-0`}>
                  {log.action?.split(' ')[0] || 'LOG'}
                </span>
              </div>
            )) : (
              <p className="text-[11px] text-gray-600 text-center py-4 italic">No activity yet</p>
            )}
          </div>
          <button onClick={navigateToAudit} className="text-[10px] text-gray-500 mt-6 hover:text-white font-bold transition-colors uppercase tracking-widest">
            VIEW ALL
          </button>
        </div>
      </div>

      <div className="px-6 flex-grow pb-6 overflow-hidden text-left flex flex-col">
        <div className="bg-[#1e1b1a] flex-1 rounded-xl p-4 border border-white/5 flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-black/20 p-1 rounded-lg">
              <button onClick={() => setViewMode('inbox')} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${viewMode === 'inbox' ? 'bg-white text-black' : 'text-gray-500'}`}>Inbox</button>
              <button onClick={() => setViewMode('sent')} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${viewMode === 'sent' ? 'bg-white text-black' : 'text-gray-500'}`}>Sent</button>
            </div>
            {gmailConnected && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setShowCompose(true); setComposeMinimized(false); }} className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors" title="Compose">
                  <HiOutlinePaperAirplane size={13} className="text-gray-400" />
                </button>
                <button onClick={fetchGmailMessages} className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors" title="Refresh">
                  <HiOutlineRefresh size={13} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {gmailLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">Loading...</p>
                </div>
              </div>
            ) : !gmailConnected ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <HiOutlinePaperAirplane className="text-gray-600 rotate-90" size={20} />
                </div>
                <p className="text-gray-400 text-[11px] font-bold mb-1">Gmail Disconnected</p>
                <button onClick={handleConnect} className="w-full text-[10px] font-black uppercase tracking-widest bg-white text-black py-2.5 rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
                  Connect Gmail
                </button>
              </div>
            ) : (viewMode === 'inbox' ? messages : sentMessages).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-600 text-[11px] italic">No {viewMode} messages</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(viewMode === 'inbox' ? messages : sentMessages).map(msg => (
                  <div key={msg.id} onClick={() => setSelected(msg)} className={`px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5 ${msg.isUnread ? 'bg-white/[0.03]' : ''}`}>
                    <div className="flex items-start gap-2">
                      <img
                        src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'S')}&background=random&color=fff&size=40&bold=true`}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full shrink-0 object-cover mt-0.5"
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || '?')}&background=random&color=fff&size=40&bold=true`; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-[11px] truncate max-w-[65%] ${msg.isUnread ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                            {msg.senderName || formatFrom(msg.from)}
                          </span>
                          <span className="text-[9px] text-gray-600 shrink-0">{formatDate(msg.date)}</span>
                        </div>
                        <p className={`text-[10px] truncate mb-0.5 ${msg.isUnread ? 'text-gray-200' : 'text-gray-500'}`}>{msg.subject}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="absolute inset-0 bg-[#1e1b1a] z-30 flex flex-col p-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-white/5 rounded-md"><HiChevronLeft size={20} /></button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setComposeTo(selected.senderEmail || "");
                      setComposeSubject(`Re: ${selected.subject}`);
                      if (bodyRef.current) bodyRef.current.innerHTML = "";
                      setSelected(null);
                      setShowCompose(true);
                      setComposeMinimized(false);
                    }}
                    className="text-[10px] font-bold text-indigo-400 px-2 py-1 hover:bg-white/5 rounded"
                  >
                    REPLY
                  </button>
                  <button onClick={() => setSelected(null)} className="text-[10px] font-bold text-gray-500 hover:text-white">CLOSE</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar text-left">
                <h2 className="text-[14px] font-bold mb-2 leading-tight text-white">{selected.subject}</h2>
                <div className="text-[11px] mb-4">
                  <span className="text-gray-500 font-medium">From:</span>
                  <span className="text-white ml-1">{selected.from}</span>
                </div>
                <div className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: selected.snippet || "(No content)" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; pointer-events: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );

  return (
    <>
      <AlertDialog alert={sidebarAlert} onClose={() => setSidebarAlert(null)} />

      {showCompose && (
        <div
          className={`fixed z-[9999] w-[310px] rounded-t-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 ${composeMinimized ? 'h-12' : 'h-[450px]'}`}
          style={{ bottom: 0, right: 288, boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
        >
          <div className="bg-[#404040] flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setComposeMinimized(m => !m)}>
            <span className="text-[13px] font-semibold text-white tracking-tight">New Message</span>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => setComposeMinimized(m => !m)} className="text-gray-300 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"><HiMinus size={15} /></button>
              <button onClick={handleDiscard} className="text-gray-300 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"><HiOutlineX size={15} /></button>
            </div>
          </div>
          {!composeMinimized && (
            <div className="bg-[#1e1b1a] flex flex-col h-[calc(100%-48px)]">
              <div className="border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 shrink-0">To</span>
                <input type="text" value={composeTo} onChange={e => setComposeTo(e.target.value)} className="flex-1 bg-transparent text-[12px] text-gray-200 outline-none" placeholder="Recipients" />
              </div>
              <div className="border-b border-white/10 px-4 py-2.5">
                <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} className="w-full bg-transparent text-[12px] text-gray-200 outline-none" placeholder="Subject" />
              </div>
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                onKeyUp={handleBodyKeyUp}
                className="flex-1 px-4 py-3 overflow-y-auto text-[12px] text-gray-300 outline-none custom-scrollbar"
                style={{ minHeight: 0 }}
                data-placeholder="Write your message..."
              />
              {attachments.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 text-[10px] text-gray-300 max-w-[140px]">
                      <span className="truncate">{file.name}</span>
                      <button onClick={() => removeAttachment(i)} className="text-gray-500 hover:text-white shrink-0 ml-0.5"><HiOutlineX size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              {sendSuccess && (
                <div className="px-4 pb-1">
                  <p className="text-[11px] text-green-400 font-medium">✓ Message sent!</p>
                </div>
              )}
              <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-[12px] font-semibold px-5 py-2 rounded-full transition-colors active:scale-95 disabled:opacity-50">
                  {sending ? "Sending..." : "Send"}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
                <div className="flex items-center gap-0.5">
                  <button onMouseDown={e => { e.preventDefault(); applyFormat('bold'); }} className={`p-1.5 rounded-full hover:bg-white/5 ${formatting.bold ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 010 8H6z" /><path d="M6 12h9a4 4 0 010 8H6z" /></svg>
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); applyFormat('italic'); }} className={`p-1.5 rounded-full hover:bg-white/5 ${formatting.italic ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); applyFormat('underline'); }} className={`p-1.5 rounded-full hover:bg-white/5 ${formatting.underline ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
                  </button>
                  <button onClick={handleAttachClick} className="p-1.5 rounded-full text-gray-500 hover:bg-white/5 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                  <button onClick={handleDiscard} className="p-1.5 rounded-full text-gray-500 hover:text-red-400 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="hidden lg:block w-[280px] h-screen sticky top-0 right-0 shrink-0">
        <SidebarContent />
      </div>

      <button
        onClick={() => { setMobileOpen(true); handleOpenNotifications(); }}
        className="lg:hidden fixed top-4 right-4 z-40 w-11 h-11 rounded-2xl bg-[#262221] border border-white/10 flex items-center justify-center shadow-lg"
      >
        <div className="relative">
          <HiOutlineBell size={18} className="text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-[#262221] flex items-center justify-center">
              <span className="text-[7px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </span>
          )}
        </div>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="flex-1 bg-black/50" />
          <div className="w-[280px] h-full overflow-y-auto text-left" onClick={e => e.stopPropagation()} style={{ animation: 'slideInRight 0.25s ease-out' }}>
            <div className="relative h-full">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <HiOutlineX size={14} />
              </button>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRightSidebar;