import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendGeminiMessage } from '../config/gemini';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import { AMENITIES } from '../utils/constants';

const amenityIconMap = Object.fromEntries(AMENITIES.map(a => [a.value, a]));

export default function Landing() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Welcome to Otel.Pro! How can I help you?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const { data } = await fetchAll('rooms', { filters: { status: 'available' }, orderBy: 'room_number' });
      setRooms(data || []);
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setRoomsLoading(false);
    }
  }

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    const res = await sendGeminiMessage(userMsg, 'Otel.Pro hotel guest inquiry', 'guest');
    setChatHistory(h => [...h, { role: 'ai', text: res.text }]);
    setChatLoading(false);
  };

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <i className="fas fa-hotel"></i>
            <span>Otel.Pro</span>
          </div>
          <div className="landing-nav-links">
            <a href="#rooms">Rooms</a>
            <a href="#amenities">Amenities</a>
            <a href="#contact">Contact</a>
            <Link to="/login" className="btn btn-accent btn-sm">Staff Login</Link>
            <Link to="/register" className="btn btn-outline btn-sm" style={{color:'#fff',borderColor:'rgba(255,255,255,0.4)'}}>Register Hotel</Link>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Welcome to <span>Otel.Pro</span></h1>
          <p>Experience luxury and comfort at its finest. Your perfect stay awaits.</p>
          <a href="#rooms" className="btn btn-accent btn-lg">View Rooms</a>
        </div>
      </section>

      <section id="rooms" className="landing-section">
        <h2>Our Rooms</h2>
        <p className="section-subtitle">Choose from our selection of premium rooms</p>
        <div className="rooms-grid">
          {roomsLoading ? (
            <div className="loading-placeholder">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="loading-placeholder">No rooms available yet. Check back soon!</div>
          ) : rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-img-wrap">
                {room.images?.[0]
                  ? <img className="room-card-img" src={room.images[0].startsWith('http') ? room.images[0] : `http://localhost:5000${room.images[0]}`} alt={room.room_number} />
                  : <div className="room-card-img-placeholder"><i className="fas fa-hotel"></i></div>
                }
                <span className="room-card-badge">{room.room_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              <div className="room-card-body">
                <div className="room-card-header">
                  <h3>{room.room_number}</h3>
                  <span className="room-price">{formatCurrency(room.price_per_night)}<small>/night</small></span>
                </div>
                <div className="room-card-meta">
                  <span><i className="fas fa-user-friends"></i> Up to {room.capacity} guests</span>
                  <span><i className="fas fa-layer-group"></i> Floor {room.floor}</span>
                </div>
                <p>{room.description || 'Comfortable and well-equipped room for a pleasant stay.'}</p>
                {room.amenities?.length > 0 && (
                  <div className="landing-amenity-chips">
                    {room.amenities.slice(0, 5).map(a => {
                      const info = amenityIconMap[a];
                      return <span key={a} className="chip"><i className={`fas ${info?.icon || 'fa-check'}`}></i> {info?.label || a}</span>;
                    })}
                  </div>
                )}
                <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
                  <i className="fas fa-calendar-check"></i> Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="amenities" className="landing-section landing-alt">
        <h2>Amenities</h2>
        <p className="section-subtitle">Everything you need for a comfortable stay</p>
        <div className="amenities-grid">
          {[
            { icon: 'fa-wifi', label: 'Free WiFi' },
            { icon: 'fa-utensils', label: 'Restaurant' },
            { icon: 'fa-dumbbell', label: 'Gym' },
            { icon: 'fa-swimmer', label: 'Pool' },
            { icon: 'fa-car', label: 'Parking' },
            { icon: 'fa-concierge-bell', label: 'Room Service' },
          ].map(a => (
            <div key={a.label} className="amenity-card">
              <i className={`fas ${a.icon}`}></i>
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="landing-section">
        <h2>Contact Us</h2>
        <p className="section-subtitle">Get in touch for reservations and inquiries</p>
        <div className="contact-grid">
          <div className="contact-item">
            <i className="fas fa-map-marker-alt"></i>
            <div>
              <h4>Address</h4>
              <p>Otel.Pro, City Center</p>
            </div>
          </div>
          <div className="contact-item">
            <i className="fas fa-phone"></i>
            <div>
              <h4>Phone</h4>
              <p>+977 1-4XXXXXX</p>
            </div>
          </div>
          <div className="contact-item">
            <i className="fas fa-envelope"></i>
            <div>
              <h4>Email</h4>
              <p>info@otelpro.com</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Otel.Pro. All rights reserved.</p>
      </footer>

      {/* AI Chat Widget */}
      <div className={`chat-widget ${chatOpen ? 'open' : ''}`}>
        {chatOpen && (
          <div className="chat-widget-body">
            <div className="chat-widget-header">
              <span>Otel.Pro AI</span>
              <button onClick={() => setChatOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="chat-widget-msgs">
              {chatHistory.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {chatLoading && <div className="chat-msg ai">Thinking...</div>}
            </div>
            <div className="chat-widget-input">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask anything..."
              />
              <button onClick={handleChat}><i className="fas fa-paper-plane"></i></button>
            </div>
          </div>
        )}
        <button className="chat-widget-toggle" onClick={() => setChatOpen(!chatOpen)}>
          <i className={`fas fa-${chatOpen ? 'times' : 'comment-dots'}`}></i>
        </button>
      </div>

      <style>{`
        .landing { font-family: system-ui, sans-serif; }
        .landing-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          background: rgba(26,26,46,0.95);
          backdrop-filter: blur(10px);
          z-index: 100;
          padding: 0 24px;
        }
        .landing-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .landing-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--white);
          font-size: 1.3rem;
          font-weight: 700;
        }
        .landing-logo i { color: var(--accent); }
        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .landing-nav-links a {
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-size: 0.9rem;
        }
        .landing-nav-links a:hover { color: var(--white); }
        .landing-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 80px 24px;
        }
        .landing-hero-content { max-width: 700px; }
        .landing-hero-content h1 {
          font-size: 3rem;
          color: var(--white);
          margin-bottom: 16px;
        }
        .landing-hero-content h1 span { color: var(--accent); }
        .landing-hero-content p {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 32px;
        }
        .landing-section {
          padding: 80px 24px;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .landing-section h2 { font-size: 2rem; margin-bottom: 8px; }
        .landing-alt { background: var(--bg); max-width: none; }
        .section-subtitle { color: var(--text-muted); margin-bottom: 40px; }
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .loading-placeholder {
          grid-column: 1 / -1;
          padding: 60px;
          color: var(--text-muted);
          font-size: 1rem;
        }
        .room-card {
          background: var(--white);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: all 0.25s ease;
          text-align: left;
        }
        .room-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
        }
        .room-card-img-wrap {
          position: relative;
          height: 200px;
          background: var(--bg);
          overflow: hidden;
        }
        .room-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .room-card-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: var(--text-muted);
        }
        .room-card-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          color: white;
          padding: 4px 14px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .room-card-body { padding: 20px; }
        .room-card-body h3 { margin-bottom: 4px; font-size: 1.1rem; }
        .room-card-body p { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; }
        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .room-card-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .room-card-meta i { margin-right: 4px; }
        .room-price { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
        .room-price small { font-size: 0.75rem; font-weight: 400; color: var(--text-muted); }
        .landing-amenity-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }
        .landing-amenity-chips .chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 500;
          background: var(--bg);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .landing-amenity-chips .chip i { color: var(--accent); font-size: 0.65rem; }
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        .amenity-card {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .amenity-card i { font-size: 2rem; color: var(--accent); }
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--white);
          border-radius: 12px;
          box-shadow: var(--shadow);
          text-align: left;
        }
        .contact-item i { font-size: 1.5rem; color: var(--accent); }
        .contact-item p { color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px; }
        .landing-footer {
          text-align: center;
          padding: 24px;
          color: var(--text-muted);
          font-size: 0.85rem;
          border-top: 1px solid var(--border);
        }
        .chat-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .chat-widget-toggle {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--white);
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          transition: var(--transition);
        }
        .chat-widget-toggle:hover { transform: scale(1.05); }
        .chat-widget-body {
          width: 340px;
          height: 460px;
          background: var(--white);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-widget-header {
          background: var(--primary);
          color: var(--white);
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }
        .chat-widget-header button {
          background: none;
          border: none;
          color: var(--white);
          cursor: pointer;
          font-size: 1rem;
        }
        .chat-widget-msgs {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chat-msg {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          max-width: 85%;
          line-height: 1.4;
        }
        .chat-msg.user {
          background: var(--primary);
          color: var(--white);
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        .chat-msg.ai {
          background: var(--bg);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        .chat-widget-input {
          display: flex;
          padding: 12px;
          gap: 8px;
          border-top: 1px solid var(--border);
        }
        .chat-widget-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1.5px solid var(--border);
          border-radius: 24px;
          font-size: 0.85rem;
          outline: none;
        }
        .chat-widget-input input:focus { border-color: var(--primary); }
        .chat-widget-input button {
          background: var(--accent);
          color: var(--white);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
