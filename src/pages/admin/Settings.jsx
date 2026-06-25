import React, { useState, useEffect } from "react";
import { 
  Save, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Check, 
  AlertCircle,
  Building,
  DollarSign
} from "lucide-react";
import { getSettings, saveSettings } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function Settings() {
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelAddress: "",
    hotelPhone: "",
    hotelEmail: "",
    hotelGstin: "",
    cgstRate: 6,
    sgstRate: 6,
    checkInTime: "12:00 PM",
    checkOutTime: "12:00 PM",
    wifiPassword: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        if (hasPermission("admin")) {
          const settings = await getSettings();
          if (settings) {
            setFormData({
              hotelName: settings.hotelName || "Hotel Surya Residency",
              hotelAddress: settings.hotelAddress || "Near Anna Bus Stand, Meenakshipuram, Nagercoil, Tamil Nadu, India",
              hotelPhone: settings.hotelPhone || "+91 4652 230400",
              hotelEmail: settings.hotelEmail || "info@suryaresidency.com",
              hotelGstin: settings.hotelGstin || "33AAAAA1111A1Z1",
              cgstRate: settings.cgstRate ?? 6,
              sgstRate: settings.sgstRate ?? 6,
              checkInTime: settings.checkInTime || "12:00 PM",
              checkOutTime: settings.checkOutTime || "12:00 PM",
              wifiPassword: settings.wifiPassword || "surya123"
            });
          }
        }
      } catch (err) {
        console.error("Settings load fail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsData();
  }, [hasPermission]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    if (Number(formData.cgstRate) < 0 || Number(formData.sgstRate) < 0) {
      setErrorMsg("GST rates cannot be negative percentages.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        cgstRate: Number(formData.cgstRate),
        sgstRate: Number(formData.sgstRate)
      };
      await saveSettings(payload, user);
      setSuccessMsg("Hotel configuration settings updated and saved successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
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
            This module is reserved for hotel managers only. Receptionists are restricted from editing system settings.
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

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="pms-page-header">
          <div>
            <h1 className="pms-page-header-title">Hotel Configurations</h1>
            <p className="pms-page-header-subtitle">Manage tax rates (GST), billing headers, checkin hours, and contact details</p>
          </div>
          <div className="shrink-0">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#B71C1C] hover:bg-[#9B1515] px-4 py-2 font-bold text-white shadow transition-colors disabled:bg-gray-400 text-xs"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
            </button>
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
            <Check className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left 2 Columns: Forms */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Section 1: Hotel Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-red-800" /> General Properties
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600">Hotel Name *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-bold text-gray-905"
                  required
                  value={formData.hotelName}
                  onChange={e => setFormData({...formData, hotelName: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600">Printable Invoice Address *</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  rows="3"
                  required
                  value={formData.hotelAddress}
                  onChange={e => setFormData({...formData, hotelAddress: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-600">Landline / Phone *</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                    required
                    value={formData.hotelPhone}
                    onChange={e => setFormData({...formData, hotelPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600">Hotel Email Address *</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                    required
                    value={formData.hotelEmail}
                    onChange={e => setFormData({...formData, hotelEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Policy & Operations */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-red-800" /> Operational Rules
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600">Default Check-In Time</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  value={formData.checkInTime}
                  onChange={e => setFormData({...formData, checkInTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600">Default Check-Out Time</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                  value={formData.checkOutTime}
                  onChange={e => setFormData({...formData, checkOutTime: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-gray-600">Guest Room Wi-Fi Password</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-mono"
                  value={formData.wifiPassword}
                  onChange={e => setFormData({...formData, wifiPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Taxes & Save widget */}
        <div className="space-y-6">
          
          {/* Tax Rates (GST) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#B71C1C]" /> Tax Rates (GST)
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600">Hotel GSTIN *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-mono font-bold"
                  required
                  value={formData.hotelGstin}
                  onChange={e => setFormData({...formData, hotelGstin: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-600">CGST (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-semibold"
                    required
                    value={formData.cgstRate}
                    onChange={e => setFormData({...formData, cgstRate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600">SGST (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none font-semibold"
                    required
                    value={formData.sgstRate}
                    onChange={e => setFormData({...formData, sgstRate: e.target.value})}
                  />
                </div>
              </div>

              {/* Notion-style Help Block */}
              <div className="bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r-md text-[10px] text-slate-500 leading-relaxed">
                Invoices calculate CGST and SGST dynamically based on these settings. Changes will apply to newly generated invoices.
              </div>
            </div>
          </div>

        </div>
      </div>
      </form>
    </div>
  );
}
