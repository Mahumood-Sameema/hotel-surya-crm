import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { usePmsAuth } from "../context/PmsAuthContext";
import PmsLayout from "../layouts/PmsLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

// Rooms
import RoomGrid from "../pages/rooms/RoomGrid";
import RoomList from "../pages/rooms/RoomList";
import RoomTypes from "../pages/rooms/RoomTypes";

// Guests
import GuestList from "../pages/guests/GuestList";
import GuestProfile from "../pages/guests/GuestProfile";

// Bookings
import BookingList from "../pages/bookings/BookingList";
import CreateBooking from "../pages/bookings/CreateBooking";
import BookingCalendar from "../pages/bookings/BookingCalendar";

// Operations
import CheckIn from "../pages/operations/CheckIn";
import CheckOut from "../pages/operations/CheckOut";

// Billing
import Payments from "../pages/billing/Payments";
import Invoices from "../pages/billing/Invoices";
import InvoiceDetail from "../pages/billing/InvoiceDetail";

// Reports
import RevenueReport from "../pages/reports/RevenueReport";
import OccupancyReport from "../pages/reports/OccupancyReport";
import BookingSourceReport from "../pages/reports/BookingSourceReport";
import GuestReport from "../pages/reports/GuestReport";
import PaymentReport from "../pages/reports/PaymentReport";

// Website Inquiries
import WebsiteBookingRequests from "../pages/website/WebsiteBookingRequests";
import ContactInquiries from "../pages/website/ContactInquiries";

// Admin Settings
import UserManagement from "../pages/admin/UserManagement";
import RolesPermissions from "../pages/admin/RolesPermissions";
import Settings from "../pages/admin/Settings";
import AuditLogs from "../pages/admin/AuditLogs";

// Profile Settings
import MyProfile from "../pages/profile/MyProfile";
import ChangePassword from "../pages/profile/ChangePassword";
import Unauthorized from "../pages/Unauthorized";

// Route Guard
function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = usePmsAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    // Enforce immediate redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  return <PmsLayout>{children}</PmsLayout>;
}

export default function AppRoutes() {
  const { user } = usePmsAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Protected Layout Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Bookings */}
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute>
            <BookingList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings/create" 
        element={
          <ProtectedRoute>
            <CreateBooking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings/calendar" 
        element={
          <ProtectedRoute>
            <BookingCalendar />
          </ProtectedRoute>
        } 
      />

      {/* Operations */}
      <Route 
        path="/operations/check-in" 
        element={
          <ProtectedRoute>
            <CheckIn />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/operations/check-out" 
        element={
          <ProtectedRoute>
            <CheckOut />
          </ProtectedRoute>
        } 
      />

      {/* Guests */}
      <Route 
        path="/guests" 
        element={
          <ProtectedRoute>
            <GuestList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guests/:guestId" 
        element={
          <ProtectedRoute>
            <GuestProfile />
          </ProtectedRoute>
        } 
      />

      {/* Rooms */}
      <Route 
        path="/rooms" 
        element={
          <ProtectedRoute>
            <RoomList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rooms/grid" 
        element={
          <ProtectedRoute>
            <RoomGrid />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rooms/types" 
        element={
          <ProtectedRoute>
            <RoomTypes />
          </ProtectedRoute>
        } 
      />

      {/* Billing */}
      <Route 
        path="/billing/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/billing/invoices" 
        element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/billing/invoices/:invoiceId" 
        element={
          <ProtectedRoute>
            <InvoiceDetail />
          </ProtectedRoute>
        } 
      />

      {/* Reports */}
      <Route 
        path="/reports/revenue" 
        element={
          <ProtectedRoute permission="reports/revenue">
            <RevenueReport />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/occupancy" 
        element={
          <ProtectedRoute>
            <OccupancyReport />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/booking-source" 
        element={
          <ProtectedRoute>
            <BookingSourceReport />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/guests" 
        element={
          <ProtectedRoute>
            <GuestReport />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/payments" 
        element={
          <ProtectedRoute permission="reports/payments">
            <PaymentReport />
          </ProtectedRoute>
        } 
      />

      {/* Website Triage */}
      <Route 
        path="/website/requests" 
        element={
          <ProtectedRoute>
            <WebsiteBookingRequests />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/website/inquiries" 
        element={
          <ProtectedRoute>
            <ContactInquiries />
          </ProtectedRoute>
        } 
      />

      {/* Admin Panels */}
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute permission="admin">
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/roles" 
        element={
          <ProtectedRoute permission="admin">
            <RolesPermissions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute permission="admin">
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/audit-logs" 
        element={
          <ProtectedRoute permission="admin">
            <AuditLogs />
          </ProtectedRoute>
        } 
      />

      {/* Profile */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile/change-password" 
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/unauthorized" 
        element={
          <ProtectedRoute>
            <Unauthorized />
          </ProtectedRoute>
        } 
      />

      {/* Default Redirection */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
