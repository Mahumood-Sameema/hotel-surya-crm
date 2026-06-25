export const defaultRoomTypes = [
  {
    roomTypeId: "standard_non_ac",
    name: "Standard Non-AC",
    tagline: "Economy Choice",
    basePrice: 1499,
    description: "Essential comfort for the practical traveler. Clean, ventilated, and perfectly arranged for a budget-friendly stay in the heart of Nagercoil.",
    capacity: "2 Adults",
    features: ["Free Wi-Fi", "Smart TV", "2 Adults"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    amenities: {
      ac: false,
      wifi: true,
      breakfast: "Optional",
      seating: "None",
      roomService: "Limited"
    }
  },
  {
    roomTypeId: "deluxe_ac",
    name: "Deluxe AC",
    tagline: "Most Popular",
    basePrice: 2499,
    description: "Modern amenities and climate control for a relaxing escape from the city heat. Features cozy bedding and modern decor for an outstanding stay.",
    capacity: "2 Guests",
    features: ["Full AC", "High-speed Wi-Fi", "Tea/Coffee"],
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    amenities: {
      ac: true,
      wifi: true,
      breakfast: "Included",
      seating: "Desk",
      roomService: "24/7"
    }
  },
  {
    roomTypeId: "suite_ac",
    name: "Suite AC",
    tagline: "Premium Luxury",
    basePrice: 4499,
    description: "Our flagship experience with separate living spaces, perfect for families or guests seeking ultimate luxury. Experience premium hospitality.",
    capacity: "3 Guests",
    features: ["Living Area", "King Size Bed", "Mini Bar"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    amenities: {
      ac: true,
      wifi: true,
      breakfast: "Included",
      seating: "Sofa Set",
      roomService: "24/7 Priority"
    }
  }
];

export const defaultRooms = [
  { roomId: "101", roomNumber: "101", roomTypeId: "standard_non_ac", floor: 1, status: "available", createdAt: new Date().toISOString() },
  { roomId: "102", roomNumber: "102", roomTypeId: "standard_non_ac", floor: 1, status: "available", createdAt: new Date().toISOString() },
  { roomId: "201", roomNumber: "201", roomTypeId: "deluxe_ac", floor: 2, status: "available", createdAt: new Date().toISOString() },
  { roomId: "202", roomNumber: "202", roomTypeId: "deluxe_ac", floor: 2, status: "available", createdAt: new Date().toISOString() },
  { roomId: "301", roomNumber: "301", roomTypeId: "suite_ac", floor: 3, status: "available", createdAt: new Date().toISOString() }
];

export const defaultWebsiteSettings = {
  hotelName: "Surya Residency",
  address: "123 Residency Road, City Center, Nagercoil, Kanyakumari District, Tamil Nadu - 629001",
  phoneNumber: "+91 98765 43210",
  landline: "04652 234567",
  email: "info@suryaresidency.com",
  bookingsEmail: "bookings@suryaresidency.com",
  whatsAppNumber: "919876543210",
  googleMapsUrl: "https://maps.google.com/?q=Surya+Residency+Nagercoil",
  checkInTime: "12:00 PM",
  checkOutTime: "11:00 AM",
  facebookUrl: "https://facebook.com/suryaresidency",
  instagramUrl: "https://instagram.com/suryaresidency",
  youtubeUrl: "https://youtube.com/suryaresidency",
  footerInformation: "Your trusted partner in hospitality, delivering quality and comfort for over 15 years.",
  copyrightText: "© 2026 Hotel Surya Residency. All rights reserved."
};
