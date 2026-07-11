function baseLayout(title, bodyContent) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:22px;">Otel.Pro</h1>
        <p style="margin:4px 0 0;opacity:0.7;font-size:14px;">${title}</p>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        ${bodyContent}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
          Otel.Pro Hotel Management System &bull; Thank you for choosing us
        </p>
      </div>
    </div>`;
}

function buildQuoteEmail(data) {
  return baseLayout('Quote', `
    <p>Dear ${data.guestName || 'Guest'},</p>
    <p>Thank you for your interest in Otel.Pro. Please find your quote below.</p>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>Total:</strong> ${data.total || 'NPR 0'}</p>
      <p style="margin:4px 0;"><strong>Valid Until:</strong> ${data.validUntil || 'N/A'}</p>
    </div>
    <p style="color:#64748b;font-size:14px;">If you have any questions, please reply to this email.</p>
  `);
}

function buildInvoiceEmail(data) {
  return baseLayout('Invoice', `
    <p>Dear ${data.guestName || 'Guest'},</p>
    <p>Your invoice from Otel.Pro is ready.</p>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>Amount Due:</strong> ${data.total || 'NPR 0'}</p>
      <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate || 'N/A'}</p>
    </div>
    <p style="color:#64748b;font-size:14px;">Payment can be made at the reception or via bank transfer.</p>
  `);
}

function buildOTPEmail(otp) {
  return baseLayout('Password Reset', `
    <p>You requested a password reset.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f0f2f5;border-radius:8px;margin:16px 0;">
      ${otp}
    </div>
    <p style="color:#64748b;font-size:14px;text-align:center;">This OTP is valid for 10 minutes.</p>
    <p style="color:#64748b;font-size:13px;">If you did not request this, please ignore this email.</p>
  `);
}

function buildBookingConfirmation(data) {
  return baseLayout('Booking Confirmed', `
    <p>Dear ${data.guestName || 'Guest'},</p>
    <p>Your booking at Otel.Pro has been confirmed.</p>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>Room:</strong> ${data.roomNumber || 'N/A'}</p>
      <p style="margin:4px 0;"><strong>Check-In:</strong> ${data.checkIn || 'N/A'}</p>
      <p style="margin:4px 0;"><strong>Check-Out:</strong> ${data.checkOut || 'N/A'}</p>
      <p style="margin:4px 0;"><strong>Guests:</strong> ${data.guests || '1 Adult'}</p>
    </div>
    <p style="color:#64748b;font-size:14px;">We look forward to welcoming you!</p>
  `);
}

module.exports = { buildQuoteEmail, buildInvoiceEmail, buildOTPEmail, buildBookingConfirmation };
