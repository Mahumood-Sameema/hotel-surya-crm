import React, { useState } from "react";
import { 
  KeyRound, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function ChangePassword() {
  const { changeUserPassword } = usePmsAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New Password and Confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New Password must be at least 6 characters long.");
      return;
    }

    try {
      setSaving(true);
      const res = await changeUserPassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMsg("Your password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(res.message || "Failed to change password.");
      }
    } catch (err) {
      setErrorMsg("Failed to update password: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Change Password</h1>
          <p className="pms-page-header-subtitle">Update your front desk credentials for security purposes</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800 border border-red-150">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800 border border-green-150">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-xl border border-gray-205 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-gray-700">Current Password *</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? "text" : "password"}
                className="w-full rounded-md border border-gray-300 p-2 pr-9 text-xs focus:outline-none"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700">New Password *</label>
            <div className="relative mt-1">
              <input
                type={showNew ? "text" : "password"}
                className="w-full rounded-md border border-gray-300 p-2 pr-9 text-xs focus:outline-none"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-4xs text-gray-400 mt-1">Min 6 characters</p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Confirm New Password *</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-150">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-850 py-3 font-semibold text-white shadow hover:bg-red-900 transition-colors disabled:bg-gray-400"
            >
              <Save className="h-4 w-4" /> {saving ? "Updating..." : "Update Password"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
