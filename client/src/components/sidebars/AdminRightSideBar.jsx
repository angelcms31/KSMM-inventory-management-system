import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell, HiOutlineRefresh, HiOutlinePaperAirplane, HiOutlineX, HiMinus } from "react-icons/hi";

const AdminRightSidebar = () => {
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "Admin User";
  const isHeadAdmin = localStorage.getItem("is_head_admin") === "true";
  const userRole = isHeadAdmin ? "Head Admin" : (localStorage.getItem("role") || "Admin");

  const [profilePic, setProfilePic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false });
  const [attachments, setAttachments] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bodyRef = useRef(null);
  const fileInputRef = useRef(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / 60000);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} mins ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return past.toLocaleDateString();
  };

  const getStatusStyle = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('login') || act.includes('create') || act.includes('approve')) return "bg-green-600";
    if (act.includes('update') || act.includes('edit')) return "bg-blue-600";
    if (act.includes('logout') || act.includes('delete') || act.includes('deactivate')) return "bg-red-600";
    return "bg-yellow-600";
  };

  const formatFrom = (from) => {
    const match = from?.match(/^(.*?)\s*<(.+)>$/);
    if (match) return match[1].trim().replace(/"/g, '') || match[2];
    return from || '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/audit_logs");
      setActivities((Array.isArray(res.data) ? res.data : []).slice(0, 4));
    } catch (err) {
      setActivities([]);
    }
  };

  const checkGmailStatus = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/gmail/status");
      setGmailConnected(res.data.connected);
      if (res.data.connected) fetchGmailMessages();
      else setGmailLoading(false);
    } catch {
      setGmailLoading(false);
    }
  };

  const fetchGmailMessages = async () => {
    setGmailLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/gmail/messages");
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch Gmail messages:", err);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleConnect = () => {
    window.open("http://localhost:5000/auth/gmail", "_blank", "width=500,height=600");
    setTimeout(checkGmailStatus, 5000);
  };

  const applyFormat = (cmd) => {
    if (bodyRef.current) {
      bodyRef.current.focus();
      document.execCommand(cmd, false, null);
      setFormatting({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    }
  };

  const handleBodyInput = () => {
    if (bodyRef.current) {
      setCompose((prev) => ({ ...prev, body: bodyRef.current.innerHTML }));
      setFormatting({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    }
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setShowCompose(false);
    setComposeMinimized(false);
    setCompose({ to: "", subject: "", body: "" });
    setAttachments([]);
    setFormatting({ bold: false, italic: false, underline: false });
    if (bodyRef.current) bodyRef.current.innerHTML = "";
  };

  const handleSend = async () => {
    if (!compose.to || !compose.subject || !compose.body.trim()) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", compose.to);
      formData.append("subject", compose.subject);
      formData.append("body", compose.body);
      attachments.forEach((file) => formData.append("attachments", file));
      await axios.post("http://localhost:5000/api/gmail/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSendSuccess(true);
      setTimeout(() => { setSendSuccess(false); handleDiscard(); }, 2000);
    } catch {
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (userId) {
          const res = await axios.get(`http://localhost:5000/api/user/${userId}`);
          setProfilePic(res.data.profile_image);
        }
      } catch (err) {
        console.error("Error Fetching:", err);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchActivities();
    checkGmailStatus();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const SidebarContent = () => (
    <div className="relative w-full h-full bg-[#262221] text-white flex flex-col font-sans border-l border-white/5 z-40">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-white/10">
            <img
              src={
                profilePic
                  ? (profilePic.startsWith('data:') || profilePic.startsWith('http')
                    ? profilePic
                    : `http://localhost:5000${profilePic}`)
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
              }
              alt="User"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`; }}
            />
          </div>
          <div>
            <h4 className="text-[14px] font-bold leading-none">{userName}</h4>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${isHeadAdmin ? 'text-indigo-400' : 'text-gray-500'}`}>
              {userRole}
            </p>
          </div>
        </div>
        <div className="relative cursor-pointer group p-1.5 rounded-full hover:bg-white/5 transition-all duration-200 active:scale-90">
          <HiOutlineBell size={22} className="text-gray-400 group-hover:text-white transition-colors duration-200" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#262221]"></span>
        </div>
      </div>

      <div className="px-6 mb-4">
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
                <span className={`${getStatusStyle(log.action)} text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter`}>
                  {log.action?.split(' ')[0] || 'LOG'}
                </span>
              </div>
            )) : (
              <p className="text-[11px] text-gray-600 text-center py-4 italic">No activity yet</p>
            )}
          </div>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-[10px] text-gray-500 mt-6 hover:text-white font-bold transition-colors uppercase tracking-widest"
          >
            VIEW ALL
          </button>
        </div>
      </div>

      <div className="px-6 flex-grow pb-6 overflow-hidden">
        <div className="bg-[#1e1b1a] h-full rounded-xl p-4 border border-white/5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[14px] font-bold">Inbox</h5>
            <div className="flex items-center gap-1.5">
              {gmailConnected && (
                <>
                  <button
                    onClick={() => { setShowCompose(true); setComposeMinimized(false); }}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                    title="Compose"
                  >
                    <HiOutlinePaperAirplane size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={fetchGmailMessages}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                    title="Refresh"
                  >
                    <HiOutlineRefresh size={13} className="text-gray-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {!gmailConnected ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-gray-600 text-[11px] mb-3">Gmail not connected</p>
              <button onClick={handleConnect} className="text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-md transition-colors">
                Connect Gmail
              </button>
            </div>
          ) : gmailLoading ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-600 text-[11px]">Loading...</p>
            </div>
          ) : selected ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <button onClick={() => setSelected(null)} className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1 mb-3">
                ← Back
              </button>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={selected.senderAvatar}
                  alt={selected.senderName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.senderName || '?')}&background=random&color=fff&size=40&bold=true`; }}
                />
                <div>
                  <p className="text-[12px] font-semibold text-gray-200 leading-tight">{selected.senderName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{selected.senderEmail}</p>
                </div>
              </div>
              <p className="text-[12px] font-semibold text-gray-200 mb-1 leading-tight">{selected.subject}</p>
              <p className="text-[10px] text-gray-600 mb-3">{formatDate(selected.date)}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed flex-1 overflow-y-auto">{selected.snippet}</p>
              <button
                onClick={() => {
                  setCompose({ to: selected.from.match(/<(.+)>/)?.[1] || selected.from, subject: `Re: ${selected.subject}`, body: "" });
                  setShowCompose(true);
                  setComposeMinimized(false);
                }}
                className="mt-3 text-[11px] border border-white/10 text-gray-400 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors w-full"
              >
                Reply
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-600 text-[11px] italic">No messages</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className={`px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5 ${msg.isUnread ? 'bg-white/[0.03]' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full shrink-0 object-cover mt-0.5"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || '?')}&background=random&color=fff&size=40&bold=true`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] truncate max-w-[65%] ${msg.isUnread ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                          {msg.senderName || formatFrom(msg.from)}
                        </span>
                        <span className="text-[9px] text-gray-600 shrink-0">{formatDate(msg.date)}</span>
                      </div>
                      <p className={`text-[10px] truncate mb-0.5 ${msg.isUnread ? 'text-gray-200' : 'text-gray-500'}`}>{msg.subject}</p>
                      <p className="text-[9px] text-gray-600 truncate">{msg.snippet}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div
          className="absolute bottom-0 left-[-320px] z-50 w-[310px] rounded-t-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
        >
          <div
            className="bg-[#404040] flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            onClick={() => setComposeMinimized(!composeMinimized)}
          >
            <span className="text-[13px] font-semibold text-white tracking-tight">New Message</span>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setComposeMinimized(!composeMinimized)} className="text-gray-300 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10">
                <HiMinus size={15} />
              </button>
              <button onClick={handleDiscard} className="text-gray-300 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10">
                <HiOutlineX size={15} />
              </button>
            </div>
          </div>

          {!composeMinimized && (
            <div className="bg-[#1e1b1a] flex flex-col" style={{ height: '400px' }}>
              <div className="border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 shrink-0">To</span>
                <input type="text" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} className="flex-1 bg-transparent text-[12px] text-gray-200 outline-none" placeholder="Recipients" autoFocus />
              </div>
              <div className="border-b border-white/10 px-4 py-2.5">
                <input type="text" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} className="w-full bg-transparent text-[12px] text-gray-200 outline-none" placeholder="Subject" />
              </div>
              <div ref={bodyRef} contentEditable suppressContentEditableWarning onInput={handleBodyInput} className="flex-1 px-4 py-3 overflow-y-auto text-[12px] text-gray-300 outline-none" style={{ minHeight: 0 }} data-placeholder="Write your message..." />

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
                <button onClick={handleSend} disabled={sending || !compose.to || !compose.subject || !compose.body.trim()} className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-[12px] font-semibold px-5 py-2 rounded-full">
                  {sending ? "Sending..." : "Send"}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
                <div className="flex items-center gap-0.5">
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className={`p-1.5 rounded-full ${formatting.bold ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 010 8H6z" /><path d="M6 12h9a4 4 0 010 8H6z" /></svg>
                  </button>
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className={`p-1.5 rounded-full ${formatting.italic ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                  </button>
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} className={`p-1.5 rounded-full ${formatting.underline ? 'text-white bg-white/15' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
                  </button>
                  <button onClick={handleAttachClick} className="p-1.5 rounded-full text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                  <button onClick={handleDiscard} className="p-1.5 rounded-full text-gray-500 hover:text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #4b5563;
          pointer-events: none;
        }
      `}</style>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-[280px] h-screen sticky top-0 right-0 shrink-0">
        <SidebarContent />
      </div>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-11 h-11 rounded-2xl bg-[#262221] border border-white/10 flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
      >
        <div className="relative">
          <HiOutlineBell size={18} className="text-gray-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#262221]"></span>
        </div>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="flex-1 bg-black/50" />
          <div className="w-[280px] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideInRight 0.25s ease-out' }}>
            <div className="relative h-full">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <HiOutlineX size={14} className="text-gray-300" />
              </button>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AdminRightSidebar;