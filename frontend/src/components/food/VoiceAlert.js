import { useEffect, useRef } from 'react';

export default function VoiceAlert({ order, enabled = true }) {
  const spokenRef = useRef(new Set());

  useEffect(() => {
    if (!enabled || !order || spokenRef.current.has(order.id)) return;
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const itemNames = items.map(i => i.name || i.item_name).filter(Boolean).join(', ');
    const message = `New order from Room ${order.room_number || 'Reception'}: ${itemNames || 'Food order'}`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
    spokenRef.current.add(order.id);
  }, [order, enabled]);

  return null;
}
