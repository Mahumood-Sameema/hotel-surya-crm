# Surya CRM - Property Management System (PMS)

Surya CRM is a modern, comprehensive Property Management System built with React, Vite, and Firebase. It provides a robust suite of tools to manage hotel operations, bookings, guests, and billing seamlessly.

## Features

- **Dashboard:** Overview of hotel operations, occupancy, and key metrics.
- **Bookings Management:** Create, view, and manage reservations.
- **Rooms Management:** Track room status, availability, and types.
- **Guest Profiles:** Maintain detailed guest histories and information.
- **Billing & Invoicing:** Handle payments, generate invoices, and track revenue.
- **Operations:** Manage daily tasks, housekeeping, and maintenance.
- **Reports:** Generate detailed insights on occupancy, revenue, and more.
- **Admin & Roles:** Manage user access and permissions.
- **Website Content Management:** Update and manage the public-facing website content.

## Tech Stack

- **Frontend:** React 19, React Router DOM v7
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **Backend/Database:** Firebase (Firestore, Authentication)
- **Linting:** Oxlint

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd surya-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

## Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Locally preview the production build.
- `npm run lint`: Runs Oxlint to check for code quality issues.

## Project Structure

```
surya-crm/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable React components
│   ├── context/         # React Context providers (Auth, etc.)
│   ├── firebase/        # Firebase configuration and utilities
│   ├── layouts/         # Layout components (e.g., PmsLayout)
│   ├── pages/           # Page components (Bookings, Rooms, Guests, etc.)
│   ├── routes/          # Application routing logic
│   ├── services/        # API and backend service calls
│   └── utils/           # Helper functions and utilities
├── .env                 # Environment variables
├── firestore.rules      # Firebase Firestore security rules
├── package.json         # Project metadata and dependencies
└── vite.config.js       # Vite configuration
```
