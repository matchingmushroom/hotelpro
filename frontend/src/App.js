import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import HotelRegister from './pages/HotelRegister';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import RoomKanban from './pages/RoomKanban';
import RoomCalendar from './pages/RoomCalendar';
import Bookings from './pages/Bookings';
import NewBooking from './pages/NewBooking';
import WalkInBooking from './pages/WalkInBooking';
import GroupBooking from './pages/GroupBooking';
import CheckInOut from './pages/CheckInOut';
import Waitlist from './pages/Waitlist';
import FoodMenu from './pages/FoodMenu';
import FoodOrders from './pages/FoodOrders';
import FoodStaffDashboard from './pages/FoodStaffDashboard';
import Housekeeping from './pages/Housekeeping';
import CleanerDashboard from './pages/CleanerDashboard';
import StaffAssignments from './pages/StaffAssignments';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Guests from './pages/Guests';
import Reports from './pages/Reports';
import ActivityLog from './pages/ActivityLog';
import ChatAssistant from './pages/ChatAssistant';
import Settings from './pages/Settings';
import PagePlaceholder from './components/common/PagePlaceholder';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<HotelRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected admin routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/kanban" element={<RoomKanban />} />
            <Route path="/rooms/calendar" element={<RoomCalendar />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/new" element={<NewBooking />} />
            <Route path="/bookings/group" element={<GroupBooking />} />
            <Route path="/bookings/walk-in" element={<WalkInBooking />} />
            <Route path="/check-in-out" element={<CheckInOut />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/food/menu" element={<FoodMenu />} />
            <Route path="/food/orders" element={<FoodOrders />} />
            <Route path="/food/staff-dashboard" element={<FoodStaffDashboard />} />
            <Route path="/housekeeping" element={<Housekeeping />} />
            <Route path="/housekeeping/cleaner" element={<CleanerDashboard />} />
            <Route path="/housekeeping/assignments" element={<StaffAssignments />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}