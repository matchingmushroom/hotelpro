const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const GUEST_SYSTEM = `You are Otel.Pro AI, a helpful hotel assistant for guests.
Answer questions about the hotel, rooms, amenities, nearby attractions, and general inquiries.
Be friendly, concise, and professional. If you don't know something, suggest the guest contact reception.
Keep responses under 3 sentences when possible.`;

const STAFF_SYSTEM = `You are Otel.Pro AI, an expert hotel management assistant for staff.
You can help with: room management, booking operations, guest check-in/out, food orders,
housekeeping, invoicing, reporting, and hotel operations.
Provide concise, practical answers. When relevant, suggest which page/module to use in the system.
Keep responses actionable and brief.`;

export async function sendGeminiMessage(message, context = '', role = 'staff') {
  if (!GEMINI_API_KEY) {
    return { text: 'Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.' };
  }
  try {
    const systemPrompt = role === 'guest' ? GUEST_SYSTEM : STAFF_SYSTEM;
    const fullPrompt = systemPrompt + (context ? `\n\nCurrent context: ${context}` : '') + `\n\nGuest/Staff: ${message}`;
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });
    const data = await res.json();
    return {
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.',
      error: data?.error?.message,
    };
  } catch (err) {
    return { text: 'Error connecting to Gemini: ' + err.message };
  }
}
