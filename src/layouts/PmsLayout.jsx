import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Bed,
  CheckSquare,
  IndianRupee,
  FileText,
  BarChart3,
  Globe,
  ShieldCheck,
  User,
  KeyRound,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Plus,
  X,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { usePmsAuth } from "../context/PmsAuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  getGuests,
  getBookings,
  getRooms
} from "../services/pmsDbService";

export default function PmsLayout({ children }) {
  const { user, logout, hasPermission } = usePmsAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar Toggles
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Header menus state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ guests: [], bookings: [], rooms: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs for closing dropdowns on click outside
  const userMenuRef = useRef(null);
  const quickActionsRef = useRef(null);
  const searchRef = useRef(null);
  const notifDrawerRef = useRef(null);

  // Fetch notifications periodically
  const fetchNotificationsData = async () => {
    const data = await getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter(n => n.status === "Unread").length);
  };

  useEffect(() => {
    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Search Queries
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ guests: [], bookings: [], rooms: [] });
        return;
      }

      const q = searchQuery.toLowerCase();
      const allGuests = await getGuests();
      const allBookings = await getBookings();
      const allRooms = await getRooms();

      const matchedGuests = allGuests.filter(g =>
        g.fullName.toLowerCase().includes(q) ||
        g.phone.includes(q)
      ).slice(0, 5);

      const matchedBookings = allBookings.filter(b =>
        b.bookingId.toLowerCase().includes(q) ||
        (b.guestId && allGuests.find(g => g.guestId === b.guestId)?.fullName.toLowerCase().includes(q))
      ).slice(0, 5);

      const matchedRooms = allRooms.filter(r =>
        r.roomNumber.includes(q) ||
        r.status.toLowerCase().includes(q)
      ).slice(0, 5);

      setSearchResults({ guests: matchedGuests, bookings: matchedBookings, rooms: matchedRooms });
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Click Outside logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    fetchNotificationsData();
  };

  const handleSearchSelect = (path) => {
    setSearchQuery("");
    setShowSearchDropdown(false);
    navigate(path);
  };

  // Build Breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(x => x);
    if (paths.length === 0) return [{ label: "Dashboard", active: true }];

    return paths.map((segment, idx) => {
      const isLast = idx === paths.length - 1;
      const formattedLabel = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      const linkPath = "/" + paths.slice(0, idx + 1).join("/");

      return {
        label: formattedLabel,
        path: linkPath,
        active: isLast
      };
    });
  };

  // Nav configuration
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, category: "MAIN" },
    { label: "Bookings", path: "/bookings", icon: ClipboardList, category: "MAIN" },
    { label: "Booking Calendar", path: "/bookings/calendar", icon: CalendarDays, category: "MAIN" },

    { label: "Check-In", path: "/operations/check-in", icon: CheckSquare, category: "OPERATIONS" },
    { label: "Check-Out", path: "/operations/check-out", icon: CheckSquare, category: "OPERATIONS" },
    { label: "Guests", path: "/guests", icon: Users, category: "OPERATIONS" },
    { label: "Room Grid", path: "/rooms/grid", icon: Bed, category: "OPERATIONS" },
    { label: "Room List", path: "/rooms", icon: Bed, category: "OPERATIONS" },
    { label: "Room Types", path: "/rooms/types", icon: Bed, category: "OPERATIONS" },

    { label: "Payments Log", path: "/billing/payments", icon: IndianRupee, category: "FINANCE" },
    { label: "Invoices", path: "/billing/invoices", icon: FileText, category: "FINANCE" },

    { label: "Revenue Report", path: "/reports/revenue", icon: BarChart3, category: "REPORTS", permission: "reports/revenue" },
    { label: "Occupancy Report", path: "/reports/occupancy", icon: BarChart3, category: "REPORTS" },
    { label: "Booking Sources", path: "/reports/booking-source", icon: BarChart3, category: "REPORTS" },
    { label: "Guest Insights", path: "/reports/guests", icon: BarChart3, category: "REPORTS" },
    { label: "Payment Report", path: "/reports/payments", icon: BarChart3, category: "REPORTS", permission: "reports/payments" },

    { label: "Booking Requests", path: "/website/requests", icon: Globe, category: "WEBSITE", badge: "requests" },
    { label: "Contact Inquiries", path: "/website/inquiries", icon: Globe, category: "WEBSITE", badge: "inquiries" },

    { label: "User Management", path: "/admin/users", icon: ShieldCheck, category: "ADMIN", permission: "admin" },
    { label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck, category: "ADMIN", permission: "admin" },
    { label: "Hotel Settings", path: "/admin/settings", icon: ShieldCheck, category: "ADMIN", permission: "admin" },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: ShieldCheck, category: "ADMIN", permission: "admin" },

    { label: "My Profile", path: "/profile", icon: User, category: "PROFILE" },
    { label: "Change Password", path: "/profile/change-password", icon: KeyRound, category: "PROFILE" }
  ];

  const filteredNavs = navItems.filter(item => !item.permission || hasPermission(item.permission));

  const categories = ["MAIN", "OPERATIONS", "FINANCE", "REPORTS", "WEBSITE", "ADMIN", "PROFILE"];

  const renderNavGroup = (cat, isMobile = false) => {
    const items = filteredNavs.filter(i => i.category === cat);
    if (items.length === 0) return null;

    return (
      <div key={cat} className="mb-4">
        <h3 className="px-4 text-[10px] font-semibold text-red-200 tracking-wider mb-2 uppercase font-sans">
          {cat}
        </h3>
        <div className="space-y-1">
          {items.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (location.pathname.startsWith(item.path + "/") &&
                !navItems.some(other => other.path !== item.path && other.path.startsWith(item.path + "/") && location.pathname.startsWith(other.path)));
            let badgeCount = 0;
            if (item.badge === "requests") {
              badgeCount = notifications.filter(n => n.type === "Website Booking Request" && n.status === "Unread").length;
            } else if (item.badge === "inquiries") {
              badgeCount = notifications.filter(n => n.type === "Website Inquiry" && n.status === "Unread").length;
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobile) setMobileOpen(false);
                }}
                className={`flex items-center px-4 py-2 text-sm font-medium transition-all ${isActive
                  ? "bg-[#7F1010] text-white border-l-4 border-white pl-3"
                  : "text-red-100 hover:bg-[#9B1515] hover:text-white"
                  }`}
              >
                <span className="flex-grow truncate">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-red-900 rounded-full animate-pulse">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const getInitials = (name) => {
    if (!name) return "SR";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">

      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col bg-[#B71C1C] text-white transition-all duration-300 ease-in-out z-20 ${collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72 opacity-100'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-red-800 shrink-0">
          <span className="font-bold text-lg font-serif whitespace-nowrap">Surya Residency</span>
        </div>
        <nav className="flex-grow py-4 overflow-y-auto overscroll-contain w-72">
          {categories.map(cat => renderNavGroup(cat, false))}
        </nav>
      </aside>

      {/* 2. MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50"
          />
          <aside className="fixed inset-y-0 left-0 flex flex-col w-72 max-w-xs bg-[#B71C1C] text-white h-full overflow-y-auto overscroll-contain shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-red-800 shrink-0">
              <span className="font-bold text-lg font-serif">Surya Residency</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded text-white hover:bg-[#9B1515]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-grow py-4 overflow-y-auto overscroll-contain">
              {categories.map(cat => renderNavGroup(cat, true))}
            </nav>
          </aside>
        </div>
      )}

      {/* 3. MAIN WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header Bar Wrapper */}
        <div className="px-4 lg:px-6 pt-4 lg:pt-6 pb-2 bg-slate-50 z-45">
          <header className="h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-between px-4 shadow-sm">
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setCollapsed(!collapsed);
                  } else {
                    setMobileOpen(true);
                  }
                }}
                className="p-2 rounded hover:bg-gray-200"
              >
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
            <div className="flex items-center space-x-3">

              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                  <Link to="/dashboard" className="hover:text-red-700 font-bold uppercase tracking-wider">Surya Residency</Link>
                  {getBreadcrumbs().map((b, i) => (
                    <React.Fragment key={i}>
                      <span>/</span>
                      {b.active ? (
                        <span className="text-[#B71C1C] font-semibold">{b.label}</span>
                      ) : (
                        <Link to={b.path} className="hover:text-red-700">{b.label}</Link>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Global search */}
            <div ref={searchRef} className="relative max-w-md w-full mx-4 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search guests, bookings, rooms..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-650 focus:border-transparent transition-all"
                />
              </div>

              {showSearchDropdown && searchQuery.trim().length >= 2 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 p-2 text-slate-800">
                  {searchResults.guests.length === 0 && searchResults.bookings.length === 0 && searchResults.rooms.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No matches found</div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.guests.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Guests</div>
                          {searchResults.guests.map(g => (
                            <div
                              key={g.guestId}
                              onClick={() => handleSearchSelect(`/guests/${g.guestId}`)}
                              className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm flex justify-between"
                            >
                              <span className="font-medium text-slate-700">{g.fullName}</span>
                              <span className="text-xs text-slate-400">{g.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.bookings.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Bookings</div>
                          {searchResults.bookings.map(b => (
                            <div
                              key={b.bookingId}
                              onClick={() => handleSearchSelect(`/bookings`)}
                              className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm flex justify-between"
                            >
                              <span className="font-medium text-[#B71C1C]">{b.bookingId}</span>
                              <span className="text-xs text-slate-400">{b.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.rooms.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms</div>
                          {searchResults.rooms.map(r => (
                            <div
                              key={r.roomId}
                              onClick={() => handleSearchSelect(`/rooms/grid`)}
                              className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm flex justify-between"
                            >
                              <span className="font-medium text-slate-700">Room {r.roomNumber}</span>
                              <span className="text-xs text-slate-400 capitalize">{r.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions & Menu */}
            <div className="flex items-center space-x-3">
              <div ref={quickActionsRef} className="relative">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick Actions</span>
                </button>
                {showQuickActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-slate-800">
                    <Link to="/bookings/create" onClick={() => setShowQuickActions(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">New Booking</Link>
                    <Link to="/operations/check-in" onClick={() => setShowQuickActions(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Check-In Guest</Link>
                    <Link to="/operations/check-out" onClick={() => setShowQuickActions(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Check-Out Guest</Link>
                    <Link to="/guests" onClick={() => setShowQuickActions(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Add Guest Profile</Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 rounded-full hover:bg-slate-100 relative text-slate-600"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-sm shadow">
                    {getInitials(user?.fullName)}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-none">{user?.fullName}</div>
                    <div className="text-[10px] text-slate-450 font-medium">{user?.role}</div>
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-slate-800">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="h-4 w-4 mr-2.5 text-slate-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/profile/change-password"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <KeyRound className="h-4 w-4 mr-2.5 text-slate-400" />
                      Change Password
                    </Link>
                    <hr className="my-1 border-slate-200" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-650 hover:bg-red-50 font-bold transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* 4. NOTIFICATION DRAWERS */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            />
            <div ref={notifDrawerRef} className="relative bg-white w-96 max-w-full h-full shadow-2xl flex flex-col z-50 border-l border-slate-200 text-slate-800 p-0 animate-fade-in">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-[#B71C1C]" />
                  <h2 className="font-bold text-lg text-[#B71C1C]">System Alerts</h2>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full hover:bg-slate-250"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-yellow-50/50">
                <span className="text-xs font-semibold text-yellow-850">{unreadCount} pending review</span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-[#B71C1C] hover:underline"
                >
                  Mark All Read
                </button>
              </div>

              <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const isUnread = n.status === "Unread";
                    return (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors ${isUnread ? "bg-amber-50/50 hover:bg-amber-100/30" : "hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {n.type === "Room Maintenance Alert" ? (
                              <Wrench className="h-5 w-5 text-slate-500" />
                            ) : n.type === "System Alert" ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Globe className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-grow min-w-0 text-xs">
                            <h4 className="font-bold text-slate-805 truncate">{n.title}</h4>
                            <p className="text-slate-450 mt-0.5 leading-relaxed">{n.description}</p>
                            <span className="text-[9px] text-slate-400 mt-2 block">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(n.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => setShowNotifications(false)}
                              className="text-xs font-bold text-red-650 hover:text-red-700 shrink-0"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. MAIN CONTENT WRAPPER */}
        <main className="flex-grow p-4 lg:p-6 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>

    </div>
  );
}
