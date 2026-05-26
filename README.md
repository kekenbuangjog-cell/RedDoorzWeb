# RedDoorz Cebu: Hotel Booking Platform Prototype

A modern, responsive web application for hotel bookings in Cebu, featuring role-based access control and a live Firebase backend.

## 🚀 Features
- **Multi-Role System**:
  - **Customers**: Search, filter, and book hotels. Manage stay history and leave reviews.
  - **Partners**: List properties, upload multiple images via Cloudinary, and manage guest check-ins.
  - **Admins**: Monitor system-wide revenue, users, and every booking on the platform.
- **Dynamic UI**: Responsive design with Bootstrap 5 and a "Minimalist Ultra-Pill" search interface.
- **Serverless Backend**: Integrated with Firebase Authentication and Firestore NoSQL Database.
- **Secure Checkout**: Split-view payment summary with price auto-calculation.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Framework**: Bootstrap 5.3
- **Backend**: Google Firebase (Auth/Firestore)
- **Storage**: Cloudinary (for Partner image uploads)
- **Icons**: Bootstrap Icons

## 📂 Project Structure
- `index.html`: Landing page with auto-seeding database logic.
- `listings.html`: Dynamic property search with client-side filtering.
- `details.html`: Property details, amenities, and reviews.
- `booking_summary.html`: Professional checkout engine.
- `partner_dashboard.html`: Property owner portal.
- `admin_dashboard.html`: Platform management interface.
- `js/`: Modular application logic.
- `includes/`: Reusable UI components (Navbar, Modals).

## 🚀 How to Run
1. Clone the repository.
2. Open `index.html` via a local server (e.g., VS Code Live Server).
3. The database will automatically seed with starter data if empty.

---
*Created for school project submission - 2026.*
