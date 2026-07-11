import { useNavigate } from 'react-router-dom';
import BookingForm from '../components/bookings/BookingForm';

export default function WalkInBooking() {
  const navigate = useNavigate();

  function handleSuccess(booking) {
    navigate('/check-in-out');
  }

  return (
    <div>
      <div className="page-header">
        <h1>Walk-In Booking</h1>
        <p>Register a guest without prior reservation</p>
      </div>
      <BookingForm
        defaultType="walk_in"
        onClose={() => navigate('/bookings')}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
