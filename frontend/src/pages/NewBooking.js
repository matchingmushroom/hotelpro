import { useNavigate } from 'react-router-dom';
import BookingForm from '../components/bookings/BookingForm';

export default function NewBooking() {
  const navigate = useNavigate();

  function handleSuccess(booking) {
    navigate('/bookings');
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Booking</h1>
        <p>Create a new room reservation</p>
      </div>
      <BookingForm
        onClose={() => navigate('/bookings')}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
