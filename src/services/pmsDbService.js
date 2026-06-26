import { db, isFirebaseConfigured, auth, createAuthAccountSecondary } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { 
  defaultRoomTypes, 
  defaultRooms, 
  defaultWebsiteSettings,
} from "../utils/seedData";

// LocalStorage Keys
const PMS_KEYS = {
  USERS: "sr_pms_users",
  GUESTS: "sr_pms_guests",
  BOOKINGS: "sr_pms_bookings",
  INVOICES: "sr_pms_invoices",
  PAYMENTS: "sr_pms_payments",
  AUDIT_LOGS: "sr_pms_audit_logs",
  NOTIFICATIONS: "sr_pms_notifications",
  ROOMS: "sr_rooms", // Sync with guest website
  ROOM_TYPES: "sr_room_types", // Sync with guest website
  BOOKING_REQUESTS: "sr_bookings", // Sync with guest website (requests)
  CONTACT_INQUIRIES: "sr_contacts", // Sync with guest website
  SETTINGS: "sr_website_settings" // Sync with guest website
};

// Log Firebase connection and storage state to console
if (isFirebaseConfigured && db) {
  console.log("%c🔥 Firebase is connected. Authentication & Data layer: FIREBASE FIRESTORE", "color: #16a34a; font-weight: bold; font-size: 13px;");
} else {
  console.log("%c💾 Firebase is NOT configured. Authentication & Data layer: LOCAL STORAGE", "color: #dc2626; font-weight: bold; font-size: 13px;");
}

// Default Admin Users
const defaultUsers = [
  {
    userId: "u1_manager",
    fullName: "S. Rao (Admin)",
    email: "manager@suryaresidency.com",
    phone: "+91 98765 00001",
    role: "Manager",
    status: "Active",
    createdAt: new Date().toISOString()
  },
  {
    userId: "u2_receptionist",
    fullName: "Amit Patel",
    email: "receptionist@suryaresidency.com",
    phone: "+91 98765 00002",
    role: "Receptionist",
    status: "Active",
    createdAt: new Date().toISOString()
  }
];

// Helper to get current client info (IP/Browser)
const getClientInfo = () => {
  return {
    ipAddress: "192.168.1.45",
    browser: navigator.userAgent
  };
};

// Seed LocalStorage
const seedPmsData = () => {
  if (!localStorage.getItem(PMS_KEYS.USERS)) {
    localStorage.setItem(PMS_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(PMS_KEYS.ROOMS)) {
    localStorage.setItem(PMS_KEYS.ROOMS, JSON.stringify(defaultRooms));
  }
  if (!localStorage.getItem(PMS_KEYS.ROOM_TYPES)) {
    localStorage.setItem(PMS_KEYS.ROOM_TYPES, JSON.stringify(defaultRoomTypes));
  }
  if (!localStorage.getItem(PMS_KEYS.SETTINGS)) {
    localStorage.setItem(PMS_KEYS.SETTINGS, JSON.stringify(defaultWebsiteSettings));
  }
  
  // Seed initial guests
  if (!localStorage.getItem(PMS_KEYS.GUESTS)) {
    const initialGuests = [
      {
        guestId: "g1",
        fullName: "Rahul Sharma",
        phone: "9876543210",
        email: "rahul@gmail.com",
        dateOfBirth: "1990-05-15",
        anniversaryDate: "2018-11-22",
        idType: "Aadhaar Card",
        idNumber: "1234 5678 9012",
        address: "Flat 402, Green Glen Layout",
        city: "Delhi",
        state: "Delhi",
        pinCode: "110001",
        nationality: "Indian",
        isVip: true,
        totalStays: 2,
        totalSpent: 15000,
        internalNotes: "Prefers high floor rooms.",
        createdAt: new Date().toISOString()
      },
      {
        guestId: "g2",
        fullName: "Neha Kapoor",
        phone: "9876512345",
        email: "neha@outlook.com",
        dateOfBirth: "1993-08-20",
        anniversaryDate: "",
        idType: "Passport",
        idNumber: "Z9876543",
        address: "32 Crescent Road",
        city: "Bangalore",
        state: "Karnataka",
        pinCode: "560001",
        nationality: "Indian",
        isVip: false,
        totalStays: 1,
        totalSpent: 4998,
        internalNotes: "Needs early check-in when possible.",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(PMS_KEYS.GUESTS, JSON.stringify(initialGuests));
  }

  // Seed default booking requests (leads from site)
  if (!localStorage.getItem(PMS_KEYS.BOOKING_REQUESTS)) {
    const initialRequests = [
      {
        id: "req1",
        bookingRef: "SR-20260624-8142",
        guestName: "Vijay Kumar",
        email: "vijay@yahoo.com",
        phone: "9876554321",
        roomTypeId: "deluxe_ac",
        checkIn: "2026-06-25",
        checkOut: "2026-06-27",
        roomsCount: 1,
        guestsCount: 2,
        specialRequests: "Needs airport taxi pick-up if available.",
        status: "Pending",
        createdAt: new Date().toISOString()
      },
      {
        id: "req2",
        bookingRef: "SR-20260624-9041",
        guestName: "Sarah Miller",
        email: "sarah@miller.com",
        phone: "9876599999",
        roomTypeId: "standard_non_ac",
        checkIn: "2026-07-10",
        checkOut: "2026-07-12",
        roomsCount: 1,
        guestsCount: 1,
        specialRequests: "Non-smoking room please.",
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(PMS_KEYS.BOOKING_REQUESTS, JSON.stringify(initialRequests));
  }

  // Seed bookings list
  if (!localStorage.getItem(PMS_KEYS.BOOKINGS)) {
    const initialBookings = [
      {
        bookingId: "BK-2026-0001",
        guestId: "g1",
        roomId: "201",
        roomTypeId: "deluxe_ac",
        bookingRequestId: "req1_mocked",
        checkInDate: "2026-06-23",
        checkOutDate: "2026-06-25",
        actualCheckIn: "2026-06-23T12:30:00Z",
        actualCheckOut: null,
        nightsCount: 2,
        adultsCount: 2,
        childrenCount: 0,
        source: "Website",
        specialRequests: "",
        ratePerNight: 2499,
        extraCharges: [],
        subTotal: 4998,
        discountType: "amount",
        discountValue: 0,
        discountAmount: 0,
        gstRate: 12,
        gstAmount: 600, // 300 CGST + 300 SGST
        grandTotal: 5598,
        advancePaid: 1500,
        balanceDue: 4098,
        status: "Checked In",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(PMS_KEYS.BOOKINGS, JSON.stringify(initialBookings));
  }

  // Seed invoices
  if (!localStorage.getItem(PMS_KEYS.INVOICES)) {
    const initialInvoices = [
      {
        invoiceId: "SR-INV-0001",
        bookingId: "BK-2026-0001",
        guestId: "g1",
        invoiceDate: new Date().toISOString().split("T")[0],
        subTotal: 4998,
        discountAmount: 0,
        gstAmount: 600,
        grandTotal: 5598,
        paidAmount: 1500,
        balanceDue: 4098,
        status: "Partial",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(PMS_KEYS.INVOICES, JSON.stringify(initialInvoices));
  }

  // Seed payments
  if (!localStorage.getItem(PMS_KEYS.PAYMENTS)) {
    const initialPayments = [
      {
        paymentId: "PAY-0001",
        bookingId: "BK-2026-0001",
        invoiceId: "SR-INV-0001",
        paymentDate: "2026-06-23T12:45:00Z",
        amount: 1500,
        paymentMode: "UPI",
        referenceId: "UPI9876543210",
        paymentType: "Advance",
        status: "Completed"
      }
    ];
    localStorage.setItem(PMS_KEYS.PAYMENTS, JSON.stringify(initialPayments));
  }

  // Seed audit logs
  if (!localStorage.getItem(PMS_KEYS.AUDIT_LOGS)) {
    const initialLogs = [
      {
        id: "log1",
        timestamp: new Date().toISOString(),
        userId: "u1",
        userName: "S. Rao (Admin)",
        role: "Manager",
        action: "Login",
        module: "Auth",
        recordId: "u1",
        oldValue: "",
        newValue: "Logged in successfully from frontdesk",
        ipAddress: "192.168.1.45",
        browser: navigator.userAgent
      }
    ];
    localStorage.setItem(PMS_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  }

  // Seed notifications
  if (!localStorage.getItem(PMS_KEYS.NOTIFICATIONS)) {
    const initialNotifications = [
      {
        id: "n1",
        title: "New Website Request",
        description: "Vijay Kumar requested Deluxe AC for June 25",
        type: "Website Booking Request",
        status: "Unread",
        timestamp: new Date().toISOString(),
        link: "/website/requests",
        bookingRequestId: "req1"
      }
    ];
    localStorage.setItem(PMS_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
  }
};

seedPmsData();

// ==========================================
// DB SERVICE METHODS
// ==========================================

// Helper to write audit logs
export const logAction = async (user, action, module, recordId, oldValue = "", newValue = "") => {
  const log = {
    id: "log_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    userId: user ? user.userId : "system",
    userName: user ? user.fullName : "System",
    role: user ? user.role : "System",
    action,
    module,
    recordId,
    oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
    newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
    ...getClientInfo()
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "audit_logs"), log);
      return;
    } catch (e) {
      console.warn("Firestore error adding log:", e);
    }
  }

  const logs = JSON.parse(localStorage.getItem(PMS_KEYS.AUDIT_LOGS)) || [];
  logs.unshift(log);
  localStorage.setItem(PMS_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

// Auth: Retrieve Firestore User Profile by Firebase UID
export const getUserProfile = async (uid) => {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), userId: docSnap.id };
      }
    } catch (e) {
      console.warn("Firestore getUserProfile fail:", e);
    }
  }
  
  // Fallback LocalStorage check
  const users = JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
  const found = users.find(u => u.userId === uid || u.uid === uid);
  return found || null;
};

// Users Management
export const getUsers = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => ({ ...d.data(), userId: d.id }));
    } catch (e) {
      console.warn("Firestore get users fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
};

export const bootstrapAdminProfile = async (uid, email) => {
  const adminProfile = {
    uid,
    fullName: "Hotel Administrator",
    email,
    phone: "",
    role: "Manager",
    status: "Active",
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "users", uid), adminProfile);
    } catch (e) {
      console.error("Firestore bootstrapAdminProfile fail:", e);
    }
  }

  // Also sync in LocalStorage
  const users = JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
  const filtered = users.filter(u => u.uid !== uid && u.email !== email);
  filtered.push({ userId: uid, ...adminProfile });
  localStorage.setItem(PMS_KEYS.USERS, JSON.stringify(filtered));

  await logAction({ userId: uid, fullName: "Hotel Administrator", role: "Manager" }, "Created", "Users", uid, "", "Auto-bootstrapped Master Admin Profile");
  return { userId: uid, ...adminProfile };
};

export const createUser = async (userData, currentUser) => {
  const { fullName, email, passwordHash, phone, role, status } = userData;
  
  try {
    // 1. Create account in Firebase Auth using the secondary app helper
    const authUser = await createAuthAccountSecondary(email, passwordHash);
    const uid = authUser.uid;

    const newUserProfile = {
      uid,
      fullName,
      email,
      phone: phone || "",
      role: role || "Receptionist",
      status: status || "Active",
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? (currentUser.uid || currentUser.userId || "") : ""
    };

    // 2. Create profile document in Firestore using the UID as the Document ID
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "users", uid), newUserProfile);
    }

    // Also sync in LocalStorage fallback
    const users = JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
    // Ensure we don't duplicate
    const filtered = users.filter(u => u.uid !== uid && u.email !== email);
    filtered.push({ userId: uid, ...newUserProfile });
    localStorage.setItem(PMS_KEYS.USERS, JSON.stringify(filtered));

    await logAction(currentUser, "Created", "Users", uid, "", newUserProfile);
    return { userId: uid, ...newUserProfile };
  } catch (err) {
    console.error("createUser failed:", err);
    throw err;
  }
};

export const updateUser = async (userId, updateData, currentUser) => {
  // Never allow password/hashes updates in the profile document updates
  const { passwordHash, ...cleanUpdateData } = updateData;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      const oldVal = docSnap.data();
      await updateDoc(docRef, cleanUpdateData);
      await logAction(currentUser, "Updated", "Users", userId, oldVal, cleanUpdateData);
      return { userId, ...oldVal, ...cleanUpdateData };
    } catch (e) {
      console.warn("Firestore update user fail:", e);
    }
  }

  const users = JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
  const idx = users.findIndex(u => u.userId === userId || u.uid === userId);
  if (idx !== -1) {
    const oldVal = users[idx];
    users[idx] = { ...oldVal, ...cleanUpdateData };
    localStorage.setItem(PMS_KEYS.USERS, JSON.stringify(users));
    await logAction(currentUser, "Updated", "Users", userId, oldVal, cleanUpdateData);
    return users[idx];
  }
  return null;
};

export const deleteUser = async (userId, currentUser) => {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      const oldVal = docSnap.exists() ? docSnap.data() : "";
      await deleteDoc(docRef);
      await logAction(currentUser, "Deleted", "Users", userId, oldVal, "Removed user profile from Firestore");
    } catch (e) {
      console.warn("Firestore delete user profile fail:", e);
    }
  }

  const users = JSON.parse(localStorage.getItem(PMS_KEYS.USERS)) || [];
  const filtered = users.filter(u => u.userId !== userId && u.uid !== userId);
  localStorage.setItem(PMS_KEYS.USERS, JSON.stringify(filtered));
  await logAction(currentUser, "Deleted", "Users", userId, "Deleted staff", "Removed from database");
  return true;
};

// Rooms
export const getRooms = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "rooms"));
      if (snap.empty) {
        console.log("Firestore rooms is empty. Seeding default rooms...");
        for (const r of defaultRooms) {
          const { roomId, ...rData } = r;
          await setDoc(doc(db, "rooms", r.roomNumber), { ...rData, createdAt: new Date().toISOString() });
        }
        const freshSnap = await getDocs(collection(db, "rooms"));
        return freshSnap.docs.map(d => ({ ...d.data(), roomId: d.id }));
      }
      return snap.docs.map(d => ({ ...d.data(), roomId: d.id }));
    } catch (e) {
      console.warn("Firestore get rooms fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.ROOMS)) || [];
};

export const updateRoomStatus = async (roomId, status, reason = "", currentUser) => {
  const updates = { status, statusReason: reason };
  
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "rooms", roomId);
      const snap = await getDoc(docRef);
      const oldVal = snap.data();
      await updateDoc(docRef, updates);
      await logAction(currentUser, "Status Changed", "Rooms", roomId, oldVal.status, status + (reason ? ` (${reason})` : ""));
      return { roomId, ...oldVal, ...updates };
    } catch (e) {
      console.warn("Firestore update room fail:", e);
    }
  }

  const rooms = JSON.parse(localStorage.getItem(PMS_KEYS.ROOMS)) || [];
  const idx = rooms.findIndex(r => r.roomId === roomId);
  if (idx !== -1) {
    const oldVal = rooms[idx];
    rooms[idx] = { ...oldVal, ...updates };
    localStorage.setItem(PMS_KEYS.ROOMS, JSON.stringify(rooms));
    await logAction(currentUser, "Status Changed", "Rooms", roomId, oldVal.status, status + (reason ? ` (${reason})` : ""));
    return rooms[idx];
  }
  return null;
};

export const saveRoom = async (roomData, currentUser) => {
  const isEdit = !!roomData.roomId;

  if (isFirebaseConfigured && db) {
    try {
      if (isEdit) {
        const docRef = doc(db, "rooms", roomData.roomId);
        const snap = await getDoc(docRef);
        const oldVal = snap.data();
        await updateDoc(docRef, roomData);
        await logAction(currentUser, "Updated", "Rooms", roomData.roomId, oldVal, roomData);
        return roomData;
      } else {
        const newRoom = { ...roomData, createdAt: new Date().toISOString() };
        // Strip out the roomId field so we do not store roomId: null in Firestore
        const { roomId, ...dbRoom } = newRoom;
        const docRef = await addDoc(collection(db, "rooms"), dbRoom);
        await logAction(currentUser, "Created", "Rooms", docRef.id, "", { ...dbRoom, roomId: docRef.id });
        return { ...dbRoom, roomId: docRef.id };
      }
    } catch (e) {
      console.error("Firestore saveRoom fail:", e);
      throw e;
    }
  } else {
    const rooms = JSON.parse(localStorage.getItem(PMS_KEYS.ROOMS)) || [];
    if (isEdit) {
      const idx = rooms.findIndex(r => r.roomId === roomData.roomId);
      if (idx !== -1) {
        const oldVal = rooms[idx];
        rooms[idx] = { ...oldVal, ...roomData };
        localStorage.setItem(PMS_KEYS.ROOMS, JSON.stringify(rooms));
        await logAction(currentUser, "Updated", "Rooms", roomData.roomId, oldVal, roomData);
        return rooms[idx];
      }
    } else {
      const newRoom = { 
        ...roomData, 
        roomId: roomData.roomNumber, 
        createdAt: new Date().toISOString() 
      };
      rooms.push(newRoom);
      localStorage.setItem(PMS_KEYS.ROOMS, JSON.stringify(rooms));
      await logAction(currentUser, "Created", "Rooms", newRoom.roomId, "", newRoom);
      return newRoom;
    }
    return null;
  }
};

// Room Types
export const getRoomTypes = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "room_types"));
      if (snap.empty) {
        console.log("Firestore room_types is empty. Seeding default room types...");
        for (const rt of defaultRoomTypes) {
          const { roomTypeId, ...rtData } = rt;
          await setDoc(doc(db, "room_types", roomTypeId), rtData);
        }
        const freshSnap = await getDocs(collection(db, "room_types"));
        return freshSnap.docs.map(d => ({ ...d.data(), roomTypeId: d.id }));
      }
      return snap.docs.map(d => ({ ...d.data(), roomTypeId: d.id }));
    } catch (e) {
      console.warn("Firestore get roomTypes fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.ROOM_TYPES)) || [];
};

export const saveRoomType = async (typeData, currentUser) => {
  const isEdit = !!typeData.roomTypeId;
  
  if (isFirebaseConfigured && db) {
    try {
      if (isEdit) {
        const docRef = doc(db, "room_types", typeData.roomTypeId);
        const snap = await getDoc(docRef);
        const oldVal = snap.data();
        await updateDoc(docRef, typeData);
        await logAction(currentUser, "Updated", "Room Types", typeData.roomTypeId, oldVal, typeData);
        return typeData;
      } else {
        const newId = typeData.name.toLowerCase().replace(/\s+/g, "_");
        const newType = { ...typeData, roomTypeId: newId };
        await setDoc(doc(db, "room_types", newId), newType);
        await logAction(currentUser, "Created", "Room Types", newId, "", newType);
        return newType;
      }
    } catch (e) {
      console.warn("Firestore saveRoomType fail:", e);
    }
  }

  const types = JSON.parse(localStorage.getItem(PMS_KEYS.ROOM_TYPES)) || [];
  if (isEdit) {
    const idx = types.findIndex(t => t.roomTypeId === typeData.roomTypeId);
    if (idx !== -1) {
      const oldVal = types[idx];
      types[idx] = { ...oldVal, ...typeData };
      localStorage.setItem(PMS_KEYS.ROOM_TYPES, JSON.stringify(types));
      await logAction(currentUser, "Updated", "Room Types", typeData.roomTypeId, oldVal, typeData);
      return types[idx];
    }
  } else {
    const newId = typeData.name.toLowerCase().replace(/\s+/g, "_");
    const newType = { ...typeData, roomTypeId: newId };
    types.push(newType);
    localStorage.setItem(PMS_KEYS.ROOM_TYPES, JSON.stringify(types));
    await logAction(currentUser, "Created", "Room Types", newId, "", newType);
    return newType;
  }
  return null;
};

export const deleteRoomType = async (roomTypeId, currentUser) => {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "room_types", roomTypeId));
      await logAction(currentUser, "Deleted", "Room Types", roomTypeId, "Room type deleted", "");
      return true;
    } catch (e) {
      console.warn("Firestore deleteRoomType fail:", e);
    }
  }
  const rts = JSON.parse(localStorage.getItem(PMS_KEYS.ROOM_TYPES)) || [];
  const filtered = rts.filter(t => t.roomTypeId !== roomTypeId);
  localStorage.setItem(PMS_KEYS.ROOM_TYPES, JSON.stringify(filtered));
  await logAction(currentUser, "Deleted", "Room Types", roomTypeId, "Room type deleted", "");
  return true;
};

// Guests
export const getGuests = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "guests"));
      return snap.docs.map(d => ({ ...d.data(), guestId: d.id }));
    } catch (e) {
      console.warn("Firestore get guests fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.GUESTS)) || [];
};

export const saveGuest = async (guestData, currentUser) => {
  const isEdit = !!guestData.guestId;
  const finalGuest = {
    ...guestData,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      if (isEdit) {
        const docRef = doc(db, "guests", guestData.guestId);
        const snap = await getDoc(docRef);
        const oldVal = snap.data();
        await updateDoc(docRef, finalGuest);
        await logAction(currentUser, "Updated", "Guests", guestData.guestId, oldVal, finalGuest);
        return { ...oldVal, ...finalGuest, guestId: guestData.guestId };
      } else {
        finalGuest.createdAt = new Date().toISOString();
        finalGuest.totalStays = 0;
        finalGuest.totalSpent = 0;
        // Strip out the guestId field so we do not store guestId: null in Firestore
        const { guestId, ...dbGuest } = finalGuest;
        const docRef = await addDoc(collection(db, "guests"), dbGuest);
        await logAction(currentUser, "Created", "Guests", docRef.id, "", { ...dbGuest, guestId: docRef.id });
        return { ...dbGuest, guestId: docRef.id };
      }
    } catch (e) {
      console.warn("Firestore saveGuest fail:", e);
    }
  }

  const guests = JSON.parse(localStorage.getItem(PMS_KEYS.GUESTS)) || [];
  if (isEdit) {
    const idx = guests.findIndex(g => g.guestId === guestData.guestId);
    if (idx !== -1) {
      const oldVal = guests[idx];
      guests[idx] = { ...oldVal, ...finalGuest };
      localStorage.setItem(PMS_KEYS.GUESTS, JSON.stringify(guests));
      await logAction(currentUser, "Updated", "Guests", guestData.guestId, oldVal, finalGuest);
      return guests[idx];
    }
  } else {
    finalGuest.guestId = "g_" + Math.random().toString(36).substring(2, 9);
    finalGuest.createdAt = new Date().toISOString();
    finalGuest.totalStays = 0;
    finalGuest.totalSpent = 0;
    guests.push(finalGuest);
    localStorage.setItem(PMS_KEYS.GUESTS, JSON.stringify(guests));
    await logAction(currentUser, "Created", "Guests", finalGuest.guestId, "", finalGuest);
    return finalGuest;
  }
  return null;
};

// Bookings
export const getBookings = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "bookings"));
      return snap.docs.map(d => ({ ...d.data(), bookingId: d.id }));
    } catch (e) {
      console.warn("Firestore get bookings fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.BOOKINGS)) || [];
};

export const createBooking = async (bookingData, currentUser) => {
  const count = (await getBookings()).length + 1;
  const paddedCount = String(count).padStart(4, "0");
  const yr = new Date().getFullYear();
  const bookingId = `BK-${yr}-${paddedCount}`;

  const newBooking = {
    bookingId,
    ...bookingData,
    createdAt: new Date().toISOString()
  };

  // If there's an associated room, set room to 'reserved' (or 'occupied' if checked in immediately)
  if (newBooking.roomId) {
    const newStatus = newBooking.status === "Checked In" ? "occupied" : "reserved";
    await updateRoomStatus(newBooking.roomId, newStatus, `Booked via ${bookingId}`, currentUser);
  }

  // Update Guest counts if guest exists
  if (newBooking.guestId) {
    await updateGuestStats(newBooking.guestId, newBooking.grandTotal);
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "bookings", bookingId), newBooking);
      await logAction(currentUser, "Created", "Bookings", bookingId, "", newBooking);
      
      // Auto-create a Draft Invoice
      await createInvoiceForBooking(newBooking, currentUser);

      return newBooking;
    } catch (e) {
      console.warn("Firestore createBooking fail:", e);
    }
  }

  const bookings = JSON.parse(localStorage.getItem(PMS_KEYS.BOOKINGS)) || [];
  bookings.push(newBooking);
  localStorage.setItem(PMS_KEYS.BOOKINGS, JSON.stringify(bookings));
  await logAction(currentUser, "Created", "Bookings", bookingId, "", newBooking);

  // Auto-create a Draft Invoice
  await createInvoiceForBooking(newBooking, currentUser);

  return newBooking;
};

export const updateBooking = async (bookingId, updateData, currentUser) => {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "bookings", bookingId);
      const snap = await getDoc(docRef);
      const oldVal = snap.data();
      
      // If room changed, release old and hold new
      if (updateData.roomId && oldVal.roomId !== updateData.roomId) {
        await updateRoomStatus(oldVal.roomId, "available", "Room reassigned", currentUser);
        const newStatus = updateData.status === "Checked In" ? "occupied" : "reserved";
        await updateRoomStatus(updateData.roomId, newStatus, `Reassigned to ${bookingId}`, currentUser);
      }
      
      await updateDoc(docRef, updateData);
      await logAction(currentUser, "Updated", "Bookings", bookingId, oldVal, updateData);
      
      // Re-sync Invoice if pricing changed
      await syncInvoiceForBooking({ ...oldVal, ...updateData }, currentUser);

      return { bookingId, ...oldVal, ...updateData };
    } catch (e) {
      console.warn("Firestore updateBooking fail:", e);
    }
  }

  const bookings = JSON.parse(localStorage.getItem(PMS_KEYS.BOOKINGS)) || [];
  const idx = bookings.findIndex(b => b.bookingId === bookingId);
  if (idx !== -1) {
    const oldVal = bookings[idx];
    
    if (updateData.roomId && oldVal.roomId !== updateData.roomId) {
      await updateRoomStatus(oldVal.roomId, "available", "Room reassigned", currentUser);
      const newStatus = (updateData.status || oldVal.status) === "Checked In" ? "occupied" : "reserved";
      await updateRoomStatus(updateData.roomId, newStatus, `Reassigned to ${bookingId}`, currentUser);
    }

    bookings[idx] = { ...oldVal, ...updateData };
    localStorage.setItem(PMS_KEYS.BOOKINGS, JSON.stringify(bookings));
    await logAction(currentUser, "Updated", "Bookings", bookingId, oldVal, updateData);

    // Re-sync Invoice if pricing changed
    await syncInvoiceForBooking(bookings[idx], currentUser);

    return bookings[idx];
  }
  return null;
};

// Help helper to update guest stats
const updateGuestStats = async (guestId, spentAmt) => {
  const guests = await getGuests();
  const guest = guests.find(g => g.guestId === guestId);
  if (guest) {
    const finalStays = (guest.totalStays || 0) + 1;
    const finalSpent = (guest.totalSpent || 0) + spentAmt;
    await saveGuest({
      ...guest,
      totalStays: finalStays,
      totalSpent: finalSpent
    }, { fullName: "System", role: "System", userId: "system" });
  }
};

// Invoices Helper
export const getInvoices = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      return snap.docs.map(d => ({ ...d.data(), invoiceId: d.id }));
    } catch (e) {
      console.warn("Firestore get invoices fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.INVOICES)) || [];
};

const createInvoiceForBooking = async (booking, currentUser) => {
  const count = (await getInvoices()).length + 1;
  const invoiceId = `SR-INV-${String(count).padStart(4, "0")}`;
  
  const newInvoice = {
    invoiceId,
    bookingId: booking.bookingId,
    guestId: booking.guestId,
    invoiceDate: new Date().toISOString().split("T")[0],
    subTotal: booking.subTotal,
    discountAmount: booking.discountAmount || 0,
    gstAmount: booking.gstAmount,
    grandTotal: booking.grandTotal,
    paidAmount: booking.advancePaid || 0,
    balanceDue: booking.balanceDue,
    status: (booking.advancePaid >= booking.grandTotal) ? "Paid" : (booking.advancePaid > 0 ? "Partial" : "Unpaid"),
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "invoices", invoiceId), newInvoice);
      await logAction(currentUser, "Created", "Invoices", invoiceId, "", newInvoice);
      return;
    } catch (e) {
      console.warn("Firestore invoice creation fail:", e);
    }
  }

  const invoices = JSON.parse(localStorage.getItem(PMS_KEYS.INVOICES)) || [];
  invoices.push(newInvoice);
  localStorage.setItem(PMS_KEYS.INVOICES, JSON.stringify(invoices));
  await logAction(currentUser, "Created", "Invoices", invoiceId, "", newInvoice);
};

const syncInvoiceForBooking = async (booking, currentUser) => {
  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.bookingId === booking.bookingId);
  if (invoice) {
    const updates = {
      subTotal: booking.subTotal,
      discountAmount: booking.discountAmount || 0,
      gstAmount: booking.gstAmount,
      grandTotal: booking.grandTotal,
      paidAmount: booking.advancePaid || 0,
      balanceDue: booking.balanceDue,
      status: (booking.advancePaid >= booking.grandTotal) ? "Paid" : (booking.advancePaid > 0 ? "Partial" : "Unpaid")
    };
    
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, "invoices", invoice.invoiceId), updates);
        await logAction(currentUser, "Updated", "Invoices", invoice.invoiceId, invoice, updates);
        return;
      } catch (e) {
        console.warn("Firestore invoice sync fail:", e);
      }
    }

    const idx = invoices.findIndex(inv => inv.invoiceId === invoice.invoiceId);
    if (idx !== -1) {
      invoices[idx] = { ...invoice, ...updates };
      localStorage.setItem(PMS_KEYS.INVOICES, JSON.stringify(invoices));
      await logAction(currentUser, "Updated", "Invoices", invoice.invoiceId, invoice, updates);
    }
  }
};

// Payments
export const getPayments = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "payments"));
      return snap.docs.map(d => ({ ...d.data(), paymentId: d.id }));
    } catch (e) {
      console.warn("Firestore get payments fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.PAYMENTS)) || [];
};

export const createPayment = async (paymentData, currentUser) => {
  const count = (await getPayments()).length + 1;
  const paymentId = `PAY-${String(count).padStart(4, "0")}`;
  
  const newPayment = {
    paymentId,
    paymentDate: new Date().toISOString(),
    status: "Completed",
    ...paymentData
  };

  // Sync payments into booking and invoice ledger
  const bookings = await getBookings();
  const booking = bookings.find(b => b.bookingId === newPayment.bookingId);
  if (booking) {
    const finalAdvance = (booking.advancePaid || 0) + newPayment.amount;
    const finalBalance = Math.max(0, booking.grandTotal - finalAdvance);
    let finalStatus = booking.status;
    
    await updateBooking(booking.bookingId, {
      advancePaid: finalAdvance,
      balanceDue: finalBalance,
      status: finalStatus
    }, currentUser);
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "payments", paymentId), newPayment);
      await logAction(currentUser, "Created", "Payments", paymentId, "", newPayment);
      return newPayment;
    } catch (e) {
      console.warn("Firestore payment fail:", e);
    }
  }

  const payments = JSON.parse(localStorage.getItem(PMS_KEYS.PAYMENTS)) || [];
  payments.push(newPayment);
  localStorage.setItem(PMS_KEYS.PAYMENTS, JSON.stringify(payments));
  await logAction(currentUser, "Created", "Payments", paymentId, "", newPayment);
  return newPayment;
};

export const voidPayment = async (paymentId, reason, currentUser) => {
  const updates = { status: "Voided", voidReason: reason };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "payments", paymentId);
      const snap = await getDoc(docRef);
      const oldVal = snap.data();

      // Deduct from booking advance ledger if completed
      if (oldVal.status === "Completed") {
        const bookings = await getBookings();
        const booking = bookings.find(b => b.bookingId === oldVal.bookingId);
        if (booking) {
          const finalAdvance = Math.max(0, (booking.advancePaid || 0) - oldVal.amount);
          const finalBalance = booking.grandTotal - finalAdvance;
          await updateBooking(booking.bookingId, {
            advancePaid: finalAdvance,
            balanceDue: finalBalance
          }, currentUser);
        }
      }

      await updateDoc(docRef, updates);
      await logAction(currentUser, "Voided", "Payments", paymentId, oldVal, updates);
      return { paymentId, ...oldVal, ...updates };
    } catch (e) {
      console.warn("Firestore voidPayment fail:", e);
    }
  }

  const payments = JSON.parse(localStorage.getItem(PMS_KEYS.PAYMENTS)) || [];
  const idx = payments.findIndex(p => p.paymentId === paymentId);
  if (idx !== -1) {
    const oldVal = payments[idx];
    
    if (oldVal.status === "Completed") {
      const bookings = await getBookings();
      const booking = bookings.find(b => b.bookingId === oldVal.bookingId);
      if (booking) {
        const finalAdvance = Math.max(0, (booking.advancePaid || 0) - oldVal.amount);
        const finalBalance = booking.grandTotal - finalAdvance;
        await updateBooking(booking.bookingId, {
          advancePaid: finalAdvance,
          balanceDue: finalBalance
        }, currentUser);
      }
    }

    payments[idx] = { ...oldVal, ...updates };
    localStorage.setItem(PMS_KEYS.PAYMENTS, JSON.stringify(payments));
    await logAction(currentUser, "Voided", "Payments", paymentId, oldVal, updates);
    return payments[idx];
  }
  return null;
};

// Website Leads Triage (Booking Requests)
export const getBookingRequests = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "booking_requests"));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.warn("Firestore get requests fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.BOOKING_REQUESTS)) || [];
};

export const updateBookingRequestStatus = async (requestId, status, currentUser) => {
  const updates = { status };
  
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "booking_requests", requestId);
      const snap = await getDoc(docRef);
      const oldVal = snap.data();
      await updateDoc(docRef, updates);
      await logAction(currentUser, "Status Changed", "Website Requests", requestId, oldVal.status, status);
      return { id: requestId, ...oldVal, ...updates };
    } catch (e) {
      console.warn("Firestore update request fail:", e);
    }
  }

  const requests = JSON.parse(localStorage.getItem(PMS_KEYS.BOOKING_REQUESTS)) || [];
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx !== -1) {
    const oldVal = requests[idx];
    requests[idx] = { ...oldVal, ...updates };
    localStorage.setItem(PMS_KEYS.BOOKING_REQUESTS, JSON.stringify(requests));
    await logAction(currentUser, "Status Changed", "Website Requests", requestId, oldVal.status, status);
    return requests[idx];
  }
  return null;
};

// Website inquiries
export const getContactInquiries = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "contact_inquiries"));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.warn("Firestore get inquiries fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.CONTACT_INQUIRIES)) || [];
};

export const updateInquiryStatus = async (inquiryId, status, replyNote = "", currentUser) => {
  const updates = { status, replyNote, repliedAt: new Date().toISOString() };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "contact_inquiries", inquiryId);
      const snap = await getDoc(docRef);
      const oldVal = snap.data();
      await updateDoc(docRef, updates);
      await logAction(currentUser, "Status Changed", "Contact Inquiries", inquiryId, oldVal.status || "New", status);
      return { id: inquiryId, ...oldVal, ...updates };
    } catch (e) {
      console.warn("Firestore update inquiry fail:", e);
    }
  }

  const inquiries = JSON.parse(localStorage.getItem(PMS_KEYS.CONTACT_INQUIRIES)) || [];
  const idx = inquiries.findIndex(i => i.id === inquiryId);
  if (idx !== -1) {
    const oldVal = inquiries[idx];
    inquiries[idx] = { ...oldVal, ...updates };
    localStorage.setItem(PMS_KEYS.CONTACT_INQUIRIES, JSON.stringify(inquiries));
    await logAction(currentUser, "Status Changed", "Contact Inquiries", inquiryId, oldVal.status || "New", status);
    return inquiries[idx];
  }
  return null;
};

// Audit Logs
export const getAuditLogs = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "audit_logs"));
      return snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      console.warn("Firestore get audit logs fail:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.AUDIT_LOGS)) || [];
};

// Notifications Drawer
export const getNotifications = async () => {
  let notificationsList = [];
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "notifications"));
      notificationsList = snap.docs.map(d => {
        const data = d.data();
        let link = data.link || "";
        if (link.startsWith("/pms")) {
          link = link.substring(4);
        }
        return { ...data, id: d.id, link };
      });
    } catch (e) {
      console.warn("Firestore get notifications fail:", e);
    }
  } else {
    notificationsList = JSON.parse(localStorage.getItem(PMS_KEYS.NOTIFICATIONS)) || [];
    // Clean up /pms prefix if present in localStorage notifications
    notificationsList = notificationsList.map(n => {
      let link = n.link || "";
      if (link.startsWith("/pms")) {
        link = link.substring(4);
      }
      return { ...n, link };
    });
  }

  // Sync booking requests (Website Booking Requests)
  let updated = false;
  try {
    const bookingRequests = await getBookingRequests();
    for (const req of bookingRequests) {
      if (req.status === "Pending") {
        // We match by either bookingRequestId or guestName in description to prevent duplication
        const exists = notificationsList.some(
          n => n.type === "Website Booking Request" && (n.bookingRequestId === req.id || n.description?.includes(req.guestName))
        );

        if (!exists) {
          const newNotif = {
            id: "notif_req_" + req.id,
            title: "New Website Request",
            description: `${req.guestName} requested standard/deluxe room for ${req.checkIn}`,
            type: "Website Booking Request",
            status: "Unread",
            timestamp: req.createdAt || new Date().toISOString(),
            link: `/website/requests`,
            bookingRequestId: req.id
          };

          if (isFirebaseConfigured && db) {
            await addDoc(collection(db, "notifications"), newNotif);
            notificationsList.push(newNotif);
          } else {
            notificationsList.unshift(newNotif);
            updated = true;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to sync booking request notifications:", err);
  }

  if (updated && !isFirebaseConfigured) {
    localStorage.setItem(PMS_KEYS.NOTIFICATIONS, JSON.stringify(notificationsList));
  }

  return notificationsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const createNotification = async (title, description, type, link = "") => {
  const newNotif = {
    id: "notif_" + Math.random().toString(36).substring(2, 9),
    title,
    description,
    type,
    status: "Unread",
    timestamp: new Date().toISOString(),
    link
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "notifications"), newNotif);
      return;
    } catch (e) {
      console.warn("Firestore add notification fail:", e);
    }
  }

  const notifs = JSON.parse(localStorage.getItem(PMS_KEYS.NOTIFICATIONS)) || [];
  notifs.unshift(newNotif);
  localStorage.setItem(PMS_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
};

export const markAllNotificationsRead = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "notifications"));
      for (const d of snap.docs) {
        if (d.data().status === "Unread") {
          await updateDoc(doc(db, "notifications", d.id), { status: "Read" });
        }
      }
      return;
    } catch (e) {
      console.warn("Firestore read all notifications fail:", e);
    }
  }

  const notifs = JSON.parse(localStorage.getItem(PMS_KEYS.NOTIFICATIONS)) || [];
  const updated = notifs.map(n => ({ ...n, status: "Read" }));
  localStorage.setItem(PMS_KEYS.NOTIFICATIONS, JSON.stringify(updated));
};

// Settings Configuration
export const getSettings = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "website_settings", "settings");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.warn("Firestore settings check failed:", e);
    }
  }
  return JSON.parse(localStorage.getItem(PMS_KEYS.SETTINGS)) || defaultWebsiteSettings;
};

export const saveSettings = async (settingsData, currentUser) => {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "website_settings", "settings"), settingsData);
      await logAction(currentUser, "Updated", "Settings", "settings", "Global configurations updated", settingsData);
      return settingsData;
    } catch (e) {
      console.warn("Firestore save settings fail:", e);
    }
  }

  localStorage.setItem(PMS_KEYS.SETTINGS, JSON.stringify(settingsData));
  await logAction(currentUser, "Updated", "Settings", "settings", "Global configurations updated", settingsData);
  return settingsData;
};
