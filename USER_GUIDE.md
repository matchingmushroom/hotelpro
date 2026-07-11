# Otel.Pro — User Guide

Hotel management system for room booking, housekeeping, food ordering, billing, and reporting.

---

## 1. Getting Started

### Login Credentials (Seed Data)

| Email | Password | Role | Access |
|---|---|---|---|
| admin@otelpro.com | admin123 | Admin | Full access |
| reception@otelpro.com | reception123 | Receptionist | Bookings, guests, check-in/out |
| housekeeping@otelpro.com | hk123 | Housekeeping | Rooms, housekeeping tasks |
| food@otelpro.com | food123 | Food Staff | Menu, food orders |

Open the app and log in at the login page.

### User Roles Overview

- **Admin** — Everything including reports, activity log, settings, staff management
- **Receptionist** — Dashboard, Rooms, Bookings, Check-In/Out, Guests, Invoices, Quotes, Payments, Waitlist, AI Assistant
- **Housekeeping** — Dashboard, Rooms, Housekeeping tasks, AI Assistant
- **Food Staff** — Dashboard, Food Menu, Food Orders, Food Staff Dashboard

---

## 2. Dashboard

The main overview page shows:
- **Total Rooms** / **Available Now**
- **Today's Check-Ins** / **Today's Check-Outs**
- Quick action buttons: New Booking, Check-In, Food Orders

---

## 3. Room Management

### Rooms List
View all rooms in a sortable/searchable table. Each room shows room number, type, floor, price, capacity, status, and amenities.

**Actions:**
- **Add Room** — Click "Add Room", fill in number, type, floor, price, capacity, amenities
- **Edit** — Click edit icon on any room
- **Change Status** — Use the status dropdown (Available / Occupied / Cleaning / Maintenance / Out of Order)
- **Delete** — Click delete icon (confirm dialog)

### KanBan Board
Drag-and-drop rooms between columns: Available, Occupied, Cleaning, Maintenance. Status updates instantly.

### Calendar View
Monthly grid showing room availability. Green = available, Red = occupied, Amber = maintenance. Navigate months with arrows or click "Today".

---

## 4. Bookings

### New Booking (Walk-In or Regular)
Multi-step wizard:
1. **Select Dates & Room** — Choose check-in/out dates, pick from available rooms
2. **Guest Details** — Enter or search existing guest
3. **Confirmation** — Review and confirm

The system checks room availability automatically. Walk-in bookings skip the advance reservation step.

### Group Booking
Reserve multiple rooms at once. Enter group name, contact info, dates, and select multiple rooms.

### Bookings List
View all bookings with filters by status (Confirmed / Checked In / Checked Out / Cancelled). Search by guest name. Cancel bookings from the action menu.

### Check-In / Check-Out
Dual-tab interface:
- **Check-In tab** — Shows today's expected arrivals. Click to confirm check-in. Room status updates to Occupied.
- **Check-Out tab** — Shows guests checking out today. Click to complete check-out. Room status updates to Cleaning.

---

## 5. Guest Management

Add, edit, search, and delete guest profiles. Each guest record includes:
- Name, email, phone, address
- ID card upload (front and back images)

Uploaded ID images are stored on the server and displayed in the guest profile.

---

## 6. Food & Beverage

### Menu Management
Add/edit/delete menu items. Each item has:
- Name, category (Veg / Non-Veg / Beverages / Desserts / Snacks)
- Description, price, availability toggle

### Food Orders
Create new orders from the Cart Drawer (side panel). Select items, adjust quantities, and submit. Track orders through statuses:
- **Pending** → **Preparing** → **Delivered** → **Cancelled**

### Food Staff Dashboard
Real-time kitchen display (Kanban-style). Orders auto-update. Features:
- **Voice alerts** — New orders announced via text-to-speech (room number + items)
- **Click to advance** — Click an order card to move it to the next status
- **Filter** by status

---

## 7. Housekeeping

### Cleaning Requests
Create cleaning requests for rooms. Set priority (Low / Medium / High) and add notes. Assign to staff members. Mark as complete when done.

### Cleaner Dashboard
Simplified view for housekeeping staff:
- **My Tasks** — Assigned to you
- **Urgent Queue** — High-priority requests
- **Standard Queue** — All unassigned requests

Auto-refreshes every 10 seconds. Claim tasks and mark them complete.

### Staff Assignments
Schedule housekeeping staff to specific rooms on specific dates. Track status: Pending → In Progress → Completed.

---

## 8. Billing

### Quotes
Generate price quotes for guests. Add line items (description, quantity, unit price) — totals auto-calculate (10% tax included). Statuses: Draft → Sent → Accepted → Rejected → Expired.

**Actions:**
- **Email** the quote to the guest
- **Print** a branded quote document
- **Convert to Invoice** — pre-populates invoice form

### Invoices
Full invoicing with payment tracking. Similar line-item editor as quotes. Statuses: Draft → Sent → Paid → Partial → Overdue → Cancelled.

**Actions:**
- **Record Payment** — Enter amount, payment method, reference, upload screenshot
- **Email** invoice to guest
- **Print** branded invoice document
- Payments auto-track: amount paid, remaining balance

### Payments (Transaction History)
View all payment transactions. Filter by date range, payment method, or guest name. Shows total received for the filtered period.

### Payment Methods
Configure accepted payment types: Cash, Card, Bank Transfer, Mobile Banking, Online. Toggle active/inactive.

---

## 9. Reports & Analytics

Dashboard of business metrics with charts:
- **Monthly Revenue** (Line chart)
- **Monthly Bookings** (Bar chart)
- **Room Status Distribution** (Doughnut)
- **Booking Status Distribution** (Doughnut)
- **Food Order Status** (Doughnut)
- **KPI cards**: Total Revenue, Pending/Outstanding, Total Rooms, Food Orders

---

## 10. Activity Log

Audit trail of all actions: create, update, delete, check-in, check-out, payment, convert. Each entry shows:
- Action type with color-coded icon
- Entity type (room, booking, guest, etc.)
- Timestamp
- Details (JSON)

---

## 11. AI Assistant

Staff-facing AI chatbot powered by Google Gemini. Ask questions about hotel operations:
- "How do I check in a guest?"
- "Show me today's bookings"
- "How to create an invoice?"

Pre-built suggestion chips for quick access.

---

## 12. Settings (Admin Only)

### Payment Methods
Add, edit, or delete payment method types.

### Staff Management
- **Invite Staff** — Enter email and name to send invitation
- **Edit Staff** — Change name, phone, role
- **Toggle Active/Inactive** — Deactivate without deleting
- **Reset Password** — Force password reset
- **Delete Staff** — Remove permanently

### Change Password
Update your own account password.

---

## 13. Tips

- **Search** — Most list pages have a search bar. Type guest names, room numbers, or any keyword.
- **Status Filters** — Use status dropdowns to narrow down lists.
- **Bookings** — Check room availability in Calendar view before creating a booking.
- **Food Orders** — Use the Staff Dashboard for live order tracking in the kitchen.
- **Quotes → Invoices** — Convert accepted quotes directly to invoices to save time.
- **Check-Out** — Automatically triggers room cleaning status.
- **Activity Log** — Useful for auditing what changed and when.
