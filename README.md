# Global Library — Library Seat Management System

A full-stack MERN application for running a paid study library / reading room. Each admin account **is** a library owner — signing up as an admin means registering yourself and your library together. From there, the admin manages seats, time slots, members, fee collection, and public-facing notices, all from one dashboard.

---

## What this system does

Think of it as a management tool for a "pay-per-seat" study space (common in India — libraries that rent out seats by shift/slot rather than full membership). Each admin owns exactly one library, and can:

- Set up their library's public profile (name, timings, address, gallery, UPI QR for payments)
- Define **seats** (physical desks) and **slots** (time shifts, e.g. Morning 6–12, Evening 4–10, with a monthly fee each)
- Enroll **members** and assign them to a specific seat + slot
- Track **fee payments** month-to-month, see who's paid, pending, or overdue
- Publish **notices** that visitors can see on the public site
- View a **dashboard** with live occupancy, collections, and admissions stats

The system is **multi-tenant** — it's built so multiple libraries (each with their own admin account) can use the same deployment, with each library's data kept isolated from the others.

---

## Tech Stack

**Frontend**
- React (Vite)
- Axios for API calls
- Tailwind CSS for styling

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- Cloudinary for image uploads (logo, banner, gallery, UPI QR)
- Multer for handling file uploads

---

## Core Functionality

### 1. Authentication (`/api/auth`)
- Signup — creates the admin/owner account, and can create their library in the same step (an admin can also sign up first and create their library afterward)
- Login — returns a JWT used for all subsequent authenticated requests
- Get current admin (`/me`) — used to restore session on page load
- Change password

### 2. Library Profile (`/api/library`)
- Public: fetch library details (for the public-facing site) or list all libraries
- Private: create the library the admin owns (one per admin — this is their library, not someone else's), update settings (hours, contact info, rules, facilities), and upload:
  - Logo
  - Cover banner
  - Gallery images (up to 5)
  - UPI QR code (for members to pay fees digitally)

### 3. Slots (`/api/slots`)
Time-based shifts a seat can be rented for, e.g.:
- Morning: 6:00–12:00, ₹500/month
- Evening: 16:00–22:00, ₹600/month

Slot timings are validated against the library's opening/closing hours (unless the library is 24-hours). A single seat can be booked for multiple non-overlapping slots by different members.

### 4. Seats (`/api/seats`)
- Create individual seats or bulk-create a numbered range (e.g. Seat 1–50)
- View seat-by-seat allocation status, including which slots are occupied and by whom
- Check whether a seat is available for a specific slot before assigning a member (prevents double-booking overlapping time ranges)
- Public seat-browsing shows occupancy only; member personal details are only visible to the logged-in admin

### 5. Members (`/api/members`)
- Enroll a member with their seat + slot assignment
- Automatically calculates their first fee due date (one month from joining) and creates the corresponding fee record
- Search/filter by name, phone, seat number, slot, status, or fee status
- Update member details or status (active/inactive)
- Delete a member — automatically releases their seat allocation and removes related fee history

### 6. Fees (`/api/fees`)
- View a member's full fee/payment history
- Mark a fee as paid (cash or UPI) — automatically generates the next month's pending fee record
- Today's collection summary
- Pending/overdue summary — grouped into overdue, due today, and due tomorrow, so the admin knows who to follow up with

### 7. Notices (`/api/notices`)
- Admin can create/update/delete notices with a visible-from/visible-until window
- Public endpoint shows only currently-active notices to visitors

### 8. Dashboard (`/api/dashboard`)
- Total and active member counts
- Seat occupancy (overall and per-slot)
- Today's new admissions and fee collections
- Pending/overdue/due-today/due-tomorrow fee counts
- Drill-down into a specific slot: which seats are free, who's assigned where, and their current fee status

---

## Multi-Tenancy Model

The system supports multiple libraries on one deployment, each with its own admin — and each admin *is* the owner of exactly one library, not a staff member managing someone else's. Every piece of data (members, seats, slots, fees, notices) is scoped by a `library` field tied to that owning admin. When an admin is logged in, their own library is always the one used for every request — no request can act on another library's data, even if a `libraryId` is manually supplied in the URL or headers. Public/anonymous routes fall back to an explicitly requested `libraryId`, or the single library on record if only one exists.

---

## Project Structure

```
backend/
├── config/          # DB connection, Cloudinary setup
├── controllers/      # Route logic (auth, library, seats, slots, members, fees, notices, dashboard)
├── middleware/        # auth (JWT verification), library (tenant scoping), error handling
├── models/           # Mongoose schemas: Admin, Library, Seat, Slot, Member, SeatAllocation, FeeHistory, Notice
├── routes/           # Express route definitions
├── utils/            # Shared helpers (seat/slot overlap and availability logic)
└── server.js         # App entry point

frontend/
├── src/
│   ├── api/          # Axios instance + API service layer
│   ├── context/       # Auth context (session state)
│   ├── components/    # UI components
│   └── pages/         # Route-level pages
```

---

## Getting Started

### Backend
```bash
cd backend
npm install
# create a .env file — see .env.example
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Required environment variables (backend `.env`)
```
MONGO_URI=
JWT_SECRET=
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=development
PORT=5000
```

---

## Future Scope to add AI chatbot so that Library owner can chat from their system
