import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendGeminiMessage } from '../config/gemini';

export default function Landing() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Welcome to Otel.Pro! How can I help you?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

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
          {[
            { type: 'Single Room', price: 'NPR 2,500', img: '🛏️', desc: 'Cozy room for one guest with all essentials' },
            { type: 'Double Room', price: 'NPR 4,000', img: '🛌', desc: 'Spacious room for two with queen bed' },
            { type: 'Suite', price: 'NPR 8,000', img: '🏠', desc: 'Premium suite with living area and city view' },
            { type: 'Deluxe', price: 'NPR 12,000', img: '🌟', desc: 'Top-floor luxury with panoramic views' },
          ].map(room => (
            <div key={room.type} className="room-card">
              <div className="room-card-img">{room.img}</div>
              <div className="room-card-body">
                <h3>{room.type}</h3>
                <p>{room.desc}</p>
                <div className="room-card-footer">
                  <span className="room-price">{room.price}<small>/night</small></span>
                  <button className="btn btn-primary btn-sm">Book Now</button>
                </div>
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
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }
        .room-card {
          background: var(--white);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .room-card-img {
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          background: var(--bg);
        }
        .room-card-body { padding: 20px; text-align: left; }
        .room-card-body h3 { margin-bottom: 8px; }
        .room-card-body p { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; }
        .room-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .room-price { font-size: 1.2rem; font-weight: 700; color: var(--primary); }
        .room-price small { font-size: 0.8rem; font-weight: 400; color: var(--text-muted); }
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
