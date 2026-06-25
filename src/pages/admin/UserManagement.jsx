import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  User, 
  ShieldAlert, 
  X, 
  Check, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle
} from "lucide-react";
import { getUsers, createUser, updateUser } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function UserManagement() {
  const { user, hasPermission, resetUserPassword } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal Dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    passwordHash: "",
    phone: "",
    role: "Receptionist",
    status: "Active"
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadUsersList = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error("User management load fail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("admin")) {
      loadUsersList();
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!formData.fullName || !formData.email || !formData.passwordHash) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    if (formData.passwordHash !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    try {
      await createUser(formData, user);
      setSuccessMsg("Staff account created successfully.");
      setShowAddModal(false);
      resetForm();
      await loadUsersList();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg("Failed to create staff: " + err.message);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await updateUser(selectedUser.userId, {
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        status: formData.status
      }, user);

      setSuccessMsg("Staff profile updated successfully.");
      setShowEditModal(false);
      resetForm();
      await loadUsersList();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg("Failed to update staff: " + err.message);
    }
  };

  const handleResetPassword = async (email) => {
    setErrorMsg("");
    setSuccessMsg("");
    const confirm = window.confirm(`Are you sure you want to send a password reset email to ${email}?`);
    if (!confirm) return;

    try {
      const res = await resetUserPassword(email);
      if (res.success) {
        setSuccessMsg(`Password reset email sent to ${email} successfully.`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg("Failed to reset password: " + (res.message || "Unknown error"));
        setTimeout(() => setErrorMsg(""), 5000);
      }
    } catch (err) {
      setErrorMsg("Failed to reset password: " + err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const handleToggleStatus = async (userToUpdate) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (userToUpdate.userId === user.userId) {
      alert("You cannot deactivate or change the status of your own account to avoid getting locked out.");
      return;
    }

    const newStatus = userToUpdate.status === "Active" ? "Inactive" : "Active";
    const confirm = window.confirm(`Are you sure you want to change status of ${userToUpdate.fullName} to ${newStatus}?`);
    if (!confirm) return;

    try {
      await updateUser(userToUpdate.userId, {
        fullName: userToUpdate.fullName,
        phone: userToUpdate.phone || "",
        role: userToUpdate.role,
        status: newStatus
      }, user);

      setSuccessMsg(`Account status updated to ${newStatus} successfully.`);
      await loadUsersList();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg("Failed to toggle account status: " + err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      fullName: u.fullName,
      email: u.email,
      passwordHash: "",
      phone: u.phone || "",
      role: u.role,
      status: u.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      passwordHash: "",
      phone: "",
      role: "Receptionist",
      status: "Active"
    });
    setConfirmPassword("");
    setErrorMsg("");
  };

  if (!hasPermission("admin")) {
    return (
      <div className="mx-auto max-w-lg text-center py-20 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-800">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500">
            This module is reserved for hotel managers only. Receptionists are restricted from user management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesRole = filterRole === "All" || u.role === filterRole;
    const matchesStatus = filterStatus === "All" || u.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Staff Management</h1>
          <p className="pms-page-header-subtitle">Create receptionist profiles, toggle active status, and audit roles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-red-850 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Staff Account
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800 border border-green-150">
          <Check className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff name, email, phone..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Role:</span>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-red-500 focus:outline-none"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Receptionist">Receptionist</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-red-500 focus:outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email Username</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Role Placement</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredUsers.map(u => (
                <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-800 text-xs font-bold font-serif">
                      {u.fullName[0]}
                    </div>
                    <span>{u.fullName}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{u.email}</td>
                  <td className="px-6 py-4 text-xs font-mono">{u.phone || "N/A"}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{u.role}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      u.status === "Active" 
                        ? "bg-green-105 text-green-800 border-green-200" 
                        : "bg-red-105 text-red-800 border-red-200"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-xs font-bold text-red-850 hover:text-red-900 hover:underline transition-colors"
                      >
                        Edit
                      </button>
                      
                      {u.userId !== user.userId ? (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-bold transition-colors hover:underline ${
                            u.status === "Active" 
                              ? "text-slate-500 hover:text-slate-700" 
                              : "text-green-750 hover:text-green-900"
                          }`}
                        >
                          {u.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic cursor-not-allowed" title="Current session account">
                          Self
                        </span>
                      )}
                      
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline transition-colors"
                      >
                        Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <form onSubmit={handleCreateUser} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="font-serif text-lg font-bold text-gray-900">Add Staff Account</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800 border border-red-150">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p className="text-xs font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Email Address (Username) *</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-semibold"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Login Password *</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-md border border-gray-300 p-2 pr-9 text-xs focus:outline-none"
                    required
                    value={formData.passwordHash}
                    onChange={e => setFormData({...formData, passwordHash: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Confirm Password *</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Role Dropdown</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs bg-white focus:outline-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Receptionist">Receptionist</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Account Status</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs bg-white focus:outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-150 pt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-red-850 py-2 text-center text-white hover:bg-red-900 transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <form onSubmit={handleEditUser} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="font-serif text-lg font-bold text-gray-900">Edit Staff Profile</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800 border border-red-150">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p className="text-xs font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-bold text-gray-905"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500 uppercase tracking-widest text-4xs">Email Username (Locked)</label>
                <p className="mt-1 font-semibold text-gray-550 bg-gray-50 p-2 border border-gray-100 rounded-md text-xs">{formData.email}</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 font-medium">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Role Placement</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs bg-white focus:outline-none disabled:bg-gray-150 disabled:text-gray-400 font-semibold"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={selectedUser && selectedUser.userId === user.userId}
                  >
                    <option value="Receptionist">Receptionist</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Account Status</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs bg-white focus:outline-none disabled:bg-gray-150 disabled:text-gray-400 font-semibold"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    disabled={selectedUser && selectedUser.userId === user.userId}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-150 pt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-red-850 py-2 text-center text-white hover:bg-red-900 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
