import React, { useState, useEffect } from "react";
import { 
  Search, 
  Mail, 
  MessageSquare, 
  Check, 
  X, 
  Archive,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  getContactInquiries, 
  updateInquiryStatus 
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function ContactInquiries() {
  const { user } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Expanded card view state
  const [expandedId, setExpandedId] = useState(null);

  // Reply Dialog State
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");

  const loadData = async () => {
    try {
      const data = await getContactInquiries();
      // Sort by date descending
      setInquiries(data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      console.error("Inquiries fail to load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTarget) return;

    try {
      await updateInquiryStatus(replyTarget.id, "Replied", replyText, user);
      setReplyTarget(null);
      setReplyText("");
      await loadData();
    } catch (err) {
      console.error("Reply record fail:", err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateInquiryStatus(id, "Archived", "", user);
      await loadData();
    } catch (err) {
      console.error("Archive fail:", err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const filteredInquiries = inquiries.filter(i => {
    const name = i.fullName.toLowerCase();
    const searchMatch = 
      name.includes(searchQuery.toLowerCase()) ||
      i.phone.includes(searchQuery) ||
      i.message.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || i.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Replied":
        return "bg-green-100 text-green-800 border-green-205";
      case "Archived":
        return "bg-gray-105 text-gray-750 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Website Inquiries</h1>
          <p className="pms-page-header-subtitle">Respond to customer feedback, queries, and feedback emails</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer name, mobile, message text..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Inquiries</option>
            <option value="New">New (Unread)</option>
            <option value="Replied">Replied (Triaged)</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Inquiries list grid */}
      <div className="space-y-4">
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map(i => {
            const isExpanded = expandedId === i.id;
            return (
              <div 
                key={i.id} 
                className="rounded-xl border border-gray-205 bg-white p-5 shadow-sm space-y-3 transition-all"
              >
                {/* Inquiry Card Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">{i.fullName}</h3>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-4xs font-semibold ${getStatusBadge(i.status)}`}>
                        {i.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      Phone: {i.phone} | Email: {i.email}
                    </p>
                  </div>
                  <div className="text-right text-3xs text-gray-400 font-mono">
                    {new Date(i.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>

                {/* Message Text Block */}
                <div className="bg-gray-50/50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed italic border border-gray-150">
                  "{i.message}"
                </div>

                {/* Reply display if present */}
                {i.replyNote && (
                  <div className="bg-green-50/40 rounded-lg p-3 text-xs text-green-905 border border-green-100 space-y-1">
                    <span className="font-bold uppercase text-3xs text-green-700">Follow-up Note recorded:</span>
                    <p className="italic">"{i.replyNote}"</p>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex justify-between items-center border-t border-gray-150 pt-3">
                  <span className="text-3xs text-gray-400 font-medium">Subject: {i.subject || "General Inquiry"}</span>
                  
                  <div className="flex items-center gap-2">
                    {i.status === "New" && (
                      <>
                        <button
                          onClick={() => setReplyTarget(i)}
                          className="rounded-lg bg-red-800 hover:bg-red-900 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                        >
                          Mark as Replied
                        </button>
                        <button
                          onClick={() => handleArchive(i.id)}
                          className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 px-3 py-1.5 text-xs font-semibold transition-all"
                        >
                          Archive
                        </button>
                      </>
                    )}
                    {i.status === "Replied" && (
                      <button
                        onClick={() => handleArchive(i.id)}
                        className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 px-3 py-1 text-3xs font-semibold transition-all"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">
            No customer inquiries found matching current status.
          </div>
        )}
      </div>

      {/* Reply dialog popup modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <form onSubmit={handleReplySubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="font-serif text-lg font-bold text-gray-900">Record Follow-up Action</h3>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-md italic border border-gray-150 text-gray-600">
                "{replyTarget.message}"
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Notes / Phone Call Reply Summary *</label>
                <textarea
                  placeholder="Summarize the response or actions taken (e.g. called guest, sent quote email for standard AC)..."
                  className="w-full rounded-md border border-gray-300 p-2.5 text-xs focus:outline-none"
                  rows="4"
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-150 pt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-red-800 py-2 text-center text-white hover:bg-red-900 transition-colors"
              >
                Save Reply Status
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
