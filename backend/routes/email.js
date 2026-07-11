const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { buildQuoteEmail, buildInvoiceEmail, buildOTPEmail, buildBookingConfirmation } = require('../templates/emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const templateBuilders = {
  quote: buildQuoteEmail,
  invoice: buildInvoiceEmail,
  otp: buildOTPEmail,
  booking: buildBookingConfirmation,
};

router.post('/', async (req, res) => {
  try {
    const { to, subject, html, type, data } = req.body;
    const htmlBody = html || (type && templateBuilders[type]?.(data || {}));

    if (!htmlBody) return res.status(400).json({ error: 'No email content provided' });

    if (!process.env.SMTP_USER) {
      console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject} | Type: ${type}`);
      return res.json({ success: true, message: 'Email logged (dev mode)' });
    }

    const info = await transporter.sendMail({
      from: `"Otel.Pro" <${process.env.SMTP_FROM || 'noreply@otelpro.com'}>`,
      to,
      subject: `[Otel.Pro] ${subject}`,
      html: htmlBody,
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
