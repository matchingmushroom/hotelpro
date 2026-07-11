const GAS_URL = process.env.REACT_APP_GAS_URL || '';

async function callGAS(payload) {
  if (!GAS_URL) {
    console.log('[GAS DEV] Action:', payload.action, payload);
    return { success: true, mock: true };
  }
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err) {
    console.warn('GAS call failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function gasSendEmail({ to, subject, htmlBody, type }) {
  return callGAS({
    action: 'sendEmail',
    to,
    subject,
    htmlBody,
    type,
  });
}

export async function gasSendQuote(data) {
  return callGAS({
    action: 'sendEmail',
    type: 'quote',
    to: data.email,
    subject: 'Your Quote from Otel.Pro',
    htmlBody: buildQuoteEmail(data),
  });
}

export async function gasSendInvoice(data) {
  return callGAS({
    action: 'sendEmail',
    type: 'invoice',
    to: data.email,
    subject: 'Invoice from Otel.Pro',
    htmlBody: buildInvoiceEmail(data),
  });
}

export async function gasSendOTP(email, otp) {
  return callGAS({
    action: 'sendEmail',
    type: 'otp',
    to: email,
    subject: 'Password Reset OTP',
    htmlBody: buildOtpEmail(otp),
  });
}

export async function gasSendBookingConfirmation(data) {
  return callGAS({
    action: 'sendEmail',
    type: 'booking',
    to: data.email,
    subject: 'Booking Confirmation - Otel.Pro',
    htmlBody: buildBookingEmail(data),
  });
}

export async function gasUploadFile(base64Data, fileName, mimeType, folder) {
  return callGAS({
    action: 'uploadFile',
    fileData: base64Data,
    fileName,
    mimeType,
    folder,
  });
}

export async function gasBackupToSheets(table, rows) {
  return callGAS({
    action: 'backupToSheets',
    table,
    rows,
  });
}

// Branded HTML email builders
function buildQuoteEmail(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;">Otel.Pro</h1>
        <p style="margin:4px 0 0;opacity:0.8;">Quote</p>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e2e8f0;">
        <p>Dear ${data.guestName || 'Guest'},</p>
        <p>Thank you for choosing Otel.Pro. Please find your quote below.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Total:</strong> ${data.total || 'NPR 0'}</p>
          <p style="margin:4px 0;"><strong>Valid Until:</strong> ${data.validUntil || 'N/A'}</p>
        </div>
        <p style="color:#64748b;font-size:14px;">If you have any questions, please contact us.</p>
      </div>
      <div style="text-align:center;padding:16px;font-size:12px;color:#94a3b8;">
        Otel.Pro Hotel Management System &bull; Thank you for your business
      </div>
    </div>`;
}

function buildInvoiceEmail(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;">Otel.Pro</h1>
        <p style="margin:4px 0 0;opacity:0.8;">Invoice</p>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e2e8f0;">
        <p>Dear ${data.guestName || 'Guest'},</p>
        <p>Your invoice is ready.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Amount Due:</strong> ${data.total || 'NPR 0'}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate || 'N/A'}</p>
        </div>
      </div>
      <div style="text-align:center;padding:16px;font-size:12px;color:#94a3b8;">Otel.Pro Hotel Management</div>
    </div>`;
}

function buildOtpEmail(otp) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">Password Reset</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e2e8f0;text-align:center;">
        <p>Your OTP for password reset:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f0f2f5;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:14px;">Valid for 10 minutes</p>
      </div>
    </div>`;
}

function buildBookingEmail(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;">Booking Confirmed</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e2e8f0;">
        <p>Dear ${data.guestName || 'Guest'},</p>
        <p>Your booking at Otel.Pro has been confirmed.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Room:</strong> ${data.roomNumber || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Check-In:</strong> ${data.checkIn || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Check-Out:</strong> ${data.checkOut || 'N/A'}</p>
        </div>
      </div>
    </div>`;
}
