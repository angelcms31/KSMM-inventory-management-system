import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  HiOutlineMail, HiOutlinePhone, HiX, 
  HiCamera, HiDotsHorizontal, HiChevronDown, HiOutlineSearch, HiChevronLeft, HiChevronRight,
  HiCheckCircle, HiXCircle
} from "react-icons/hi";

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess
            ? <HiCheckCircle size={44} className="text-emerald-500" />
            : <HiXCircle size={44} className="text-rose-500" />
          }
        </div>

        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>

        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg
            ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}
        >
          Got it
        </button>

        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
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
  const showAlert = useCallback((message, type = 'success') => setAlert({ message, type }), []);
  const closeAlert = useCallback(() => setAlert(null), []);
  return { alert, showAlert, closeAlert };
};

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const usersPerPage = 9;

  const { alert, showAlert, closeAlert } = useAlert();

  const initialFormState = { 
    firstName: '', middleName: '', lastName: '', email: '', 
    contactNo: '', role: 'Sales', gender: 'Male', profileImage: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users`, { params: { page: 1, limit: 9999 } });
      setAllUsers(res.data.users || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { setCurrentPage(0); }, [searchTerm]);

  const filteredUsers = allUsers.filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
    const firstName = (u.firstname || '').toLowerCase();
    const middleName = (u.middlename || '').toLowerCase();
    const lastName = (u.lastname || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const contactNo = (u.contact_no || '').toLowerCase();
    const idPrefix = u.is_head_admin ? "ha" : (u.user_role || "us").substring(0, 2).toLowerCase();
    const displayId = `${idPrefix}-${u.permanent_id || '0'}`;
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    return firstName.includes(term) || middleName.includes(term) || lastName.includes(term) ||
           email.includes(term) || contactNo.includes(term) || displayId.includes(term) || fullName.includes(term);
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(currentPage * usersPerPage, (currentPage + 1) * usersPerPage);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) { showAlert("Only JPEG and PNG images are allowed.", 'error'); return; }
      if (file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isEdit) setSelectedUser({ ...selectedUser, profileImage: reader.result });
          else setFormData({ ...formData, profileImage: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        showAlert("Image must be 10MB or less.", 'error');
      }
    }
  };

  const handleNameChange = (field, value, isEdit = false) => {
    if (!/^[a-zA-Z\s]*$/.test(value)) return;
    if (isEdit) setSelectedUser({ ...selectedUser, [field]: value });
    else setFormData({ ...formData, [field]: value });
  };

  const handleEmailChange = (value, isEdit = false) => {
    if (isEdit) setSelectedUser({ ...selectedUser, email: value });
    else setFormData({ ...formData, email: value });
  };

  const handlePhoneChange = (value, isEdit = false) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 10) return;
    if (isEdit) setSelectedUser({ ...selectedUser, contactNo: value });
    else setFormData({ ...formData, contactNo: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.email.includes('@')) { showAlert("Email must contain @.", 'error'); return; }
    if (formData.contactNo.length !== 10) { showAlert("Contact number must be exactly 10 digits.", 'error'); return; }
    try {
      await axios.post("http://localhost:5000/api/add_user", { ...formData, creatorId: localStorage.getItem("user_id") });
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchUsers();
      showAlert("User added successfully!", 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || "Error adding user.", 'error');
    }
  };

  const handleEditClick = (user) => {
    const idPrefix = user.is_head_admin ? "HA" : (user.user_role || "US").substring(0, 2).toUpperCase();
    setSelectedUser({
      ...user,
      firstName: user.firstname || '',
      middleName: user.middlename || '',
      lastName: user.lastname || '',
      email: user.email || '',
      contactNo: user.contact_no || '',
      role: user.user_role || '',
      gender: user.gender || 'Male',
      profileImage: user.profile_image || '',
      originalEmail: user.email || '',
      displayId: `${idPrefix}-${user.permanent_id || '0'}`
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put("http://localhost:5000/api/user/update", {
        firstName: selectedUser.firstName, middleName: selectedUser.middleName,
        lastName: selectedUser.lastName, email: selectedUser.email,
        contactNo: selectedUser.contactNo, role: selectedUser.role,
        gender: selectedUser.gender, profileImage: selectedUser.profileImage,
        originalEmail: selectedUser.originalEmail
      });
      setShowEditModal(false);
      fetchUsers();
      showAlert("User updated successfully!", 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || "Update failed.", 'error');
    }
  };

  const handleUnlock = async (user) => {
    try {
      await axios.put("http://localhost:5000/api/user/unlock", {
        userId: user.user_id,
        adminId: localStorage.getItem("user_id"),
        adminRole: localStorage.getItem("userRole")
      });
      fetchUsers();
      setActiveMenu(null);
      showAlert("Account unlocked successfully!", 'success');
    } catch (err) {
      showAlert("Error unlocking account.", 'error');
    }
  };

  const handleApproveAdmin = async (user) => {
    try {
      await axios.put("http://localhost:5000/api/admin/approve", { userId: user.user_id, adminId: localStorage.getItem("user_id") });
      fetchUsers();
      setActiveMenu(null);
      showAlert("Admin account approved!", 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || "Approval failed.", 'error');
    }
  };

  const handleRejectAdmin = async (user) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/reject/${user.user_id}`, {
        data: { adminId: localStorage.getItem("user_id") }
      });
      fetchUsers();
      setActiveMenu(null);
      showAlert("Admin request rejected and deleted.", 'success');
    } catch (err) {
      showAlert("Error rejecting request.", 'error');
    }
  };

  const toggleStatus = async (user) => {
    const currentStatus = user.status || user.Status;
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    const currentUserId = localStorage.getItem("user_id");
    if (newStatus === 'Deactivated' && String(user.user_id) === String(currentUserId)) {
      showAlert("You cannot deactivate your own account.", 'error');
      return;
    }
    try {
      await axios.put("http://localhost:5000/api/user/status", { userId: user.user_id, status: newStatus, adminId: currentUserId, adminRole: localStorage.getItem("role") });
      fetchUsers();
      setActiveMenu(null);
      showAlert(`Account ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || "Error updating status.", 'error');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData(initialFormState);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">
      Loading...
    </div>
  );

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden text-left" onClick={() => setActiveMenu(null)}>
      <AlertDialog alert={alert} onClose={closeAlert} />

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, contact, or ID..."
            className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 pb-10">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative h-fit text-left">
          <div className="flex justify-between items-center mb-6 px-2">
            <h1 className="text-2xl font-black uppercase text-slate-900 leading-none tracking-tighter">Manage Users</h1>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(p - 1, 0)); }}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"
                >
                  <HiChevronLeft size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"
                >
                  <HiChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg tracking-widest hover:scale-105 transition-all"
              >
                + Add User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentUsers.map((user, index) => {
              const userStatus = user.status || user.Status;
              const isLocked = user.is_locked || user.Is_Locked;
              const isApproved = user.is_approved;
              const isHeadAdmin = user.is_head_admin;
              const idPrefix = isHeadAdmin ? "AD" : (user.user_role || "US").substring(0, 2).toUpperCase();
              const displayId = `${idPrefix}-${user.permanent_id || '0'}`;
              const fullName = `${user.firstname} ${user.middlename ? `${user.middlename} ` : ''}${user.lastname}`;

              return (
                <div
                  key={index}
                  className={`border border-gray-300 rounded-[1.5rem] p-4 relative bg-white shadow-sm flex flex-col overflow-hidden ${userStatus === 'Deactivated' ? 'opacity-80' : ''}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === index ? null : index); }}
                    className="absolute top-4 right-4 text-gray-600 hover:text-black z-10"
                  >
                    <HiDotsHorizontal size={20} />
                  </button>

                  {activeMenu === index && (
                    <div className="absolute top-11 right-4 bg-white border rounded-lg shadow-xl z-30 w-48 py-2 text-[11px] font-bold overflow-hidden" 
                         style={{ borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                      {isLocked ? (
                        <button onClick={(e) => { e.stopPropagation(); handleUnlock(user); }} className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-600">
                          Unlock & Activate
                        </button>
                      ) : (
                        <>
                          {user.user_role === 'Admin' && !isApproved ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleApproveAdmin(user); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-bold">
                                Approve Admin
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleRejectAdmin(user); }} className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-bold border-t border-gray-100">
                                Reject Request
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(user); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-slate-700">
                                Update Information
                              </button>
                              {String(user.user_id) !== String(localStorage.getItem("user_id")) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleStatus(user); }}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-100 ${userStatus === 'Active' ? 'text-rose-500' : 'text-emerald-600'}`}
                                >
                                  {userStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 mb-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstname}`}
                        className="w-14 h-14 rounded-full object-cover border border-gray-100"
                        alt="Profile"
                      />
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isLocked ? 'bg-yellow-400' : userStatus === 'Deactivated' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0 pr-8">
                      <h3 className="font-bold text-sm text-black truncate" title={fullName}>{fullName}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <p className="text-[#9CA3AF] text-[10px] font-black uppercase tracking-wider">{isHeadAdmin ? "Head Admin" : user.user_role}</p>
                        {user.user_role === 'Admin' && !isApproved && (
                          <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-300 rounded-2xl p-3 bg-white min-w-0">
                    <div className="flex justify-between text-[#9CA3AF] text-[10px] font-normal mb-1 uppercase tracking-widest">
                      <span>ID No.</span>
                      <span>Date Added</span>
                    </div>
                    <div className="flex justify-between font-black text-black text-xs mb-3 pb-2 border-b border-gray-200 uppercase tracking-tight">
                      <span>{displayId}</span>
                      <span className="text-[10px]">{user.date_added ? new Date(user.date_added).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <p className="flex items-center gap-2 text-black text-xs min-w-0">
                        <HiOutlineMail size={18} className="flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="flex items-center gap-2 text-black text-xs min-w-0">
                        <HiOutlinePhone size={18} className="flex-shrink-0" />
                        <span>{user.contact_no ? `+63 ${user.contact_no}` : 'No Contact'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 lg:p-6 text-left">
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] w-full max-w-3xl p-6 lg:p-12 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={closeModal} className="absolute top-5 right-5 lg:top-10 lg:right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm">
              <HiX size={22} />
            </button>

            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase mb-6 lg:mb-8 tracking-tighter leading-none">
              {showAddModal ? "Add New User" : "Update User"}
            </h2>

            <form onSubmit={showAddModal ? handleAddUser : handleUpdateUser} className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-x-10">
              <div className="sm:col-span-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">First Name</label>
                  <input required maxLength={24} className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm"
                    value={showAddModal ? formData.firstName : selectedUser?.firstName}
                    onChange={e => handleNameChange('firstName', e.target.value, showEditModal)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Middle Name</label>
                  <input maxLength={24} className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm"
                    value={showAddModal ? formData.middleName : selectedUser?.middleName}
                    onChange={e => handleNameChange('middleName', e.target.value, showEditModal)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Last Name</label>
                  <input required maxLength={24} className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm"
                    value={showAddModal ? formData.lastName : selectedUser?.lastName}
                    onChange={e => handleNameChange('lastName', e.target.value, showEditModal)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Contact</label>
                  <div className="flex items-center bg-[#F3F4F6] rounded-xl overflow-hidden">
                    <span className="px-3 text-sm font-black text-slate-500 border-r border-slate-300 py-3 flex-shrink-0">+63</span>
                    <input required className="flex-1 bg-transparent p-3 outline-none font-bold text-sm" placeholder="9XXXXXXXXX" maxLength={10}
                      value={showAddModal ? formData.contactNo : selectedUser?.contactNo}
                      onChange={e => handlePhoneChange(e.target.value, showEditModal)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Email Address</label>
                  <input required type="email" maxLength={30} className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm"
                    value={showAddModal ? formData.email : selectedUser?.email}
                    onChange={e => handleEmailChange(e.target.value, showEditModal)} />
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col items-center justify-between py-2 gap-4">
                <div className="flex flex-col items-center w-full space-y-3">
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                    {(showAddModal ? formData.profileImage : selectedUser?.profileImage) ? (
                      <img src={showAddModal ? formData.profileImage : selectedUser.profileImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <HiCamera size={36} className="text-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <p className="text-white text-[9px] font-black uppercase">Upload Photo</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, showEditModal)} />
                  </div>

                  <div className="w-full space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">ID Number</label>
                    <div className="w-full bg-[#E9ECEF] rounded-xl p-3 font-bold text-sm text-slate-600 text-center">
                      {showAddModal ? "Auto Generated" : (selectedUser?.displayId || "Loading...")}
                    </div>
                  </div>

                  <div className="w-full space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Gender</label>
                    <div className="relative">
                      <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm appearance-none cursor-pointer"
                        value={showAddModal ? formData.gender : selectedUser?.gender}
                        onChange={e => showAddModal ? setFormData({...formData, gender: e.target.value}) : setSelectedUser({...selectedUser, gender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="w-full space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Position</label>
                    <div className="relative">
                      <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm appearance-none cursor-pointer"
                        value={showAddModal ? formData.role : selectedUser?.role}
                        onChange={e => showAddModal ? setFormData({...formData, role: e.target.value}) : setSelectedUser({...selectedUser, role: e.target.value})}>
                        <option value="Sales">Sales</option>
                        <option value="Admin">Admin</option>
                        <option value="Production">Production</option>
                        <option value="Finance">Finance</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-400 uppercase text-[10px] font-black hover:bg-slate-50 transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl uppercase text-[10px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest cursor-pointer">
                    Confirm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;