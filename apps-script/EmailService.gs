/**
 * Email Service - uses MailApp for sending emails
 */

var EmailService = {
  send: function(params) {
    var to = params.to;
    var subject = params.subject;
    var htmlBody = params.htmlBody || params.html;

    if (!to || !subject || !htmlBody) {
      throw new Error('Missing required fields: to, subject, htmlBody');
    }

    MailApp.sendEmail({
      to: to,
      subject: '[Otel.Pro] ' + subject,
      htmlBody: htmlBody,
      name: 'Otel.Pro'
    });

    return { message: 'Email sent to ' + to, subject: subject };
  },

  sendQuote: function(params) {
    var html = this._buildQuoteTemplate(params);
    return this.send({
      to: params.email,
      subject: 'Your Quote from Otel.Pro',
      htmlBody: html
    });
  },

  sendInvoice: function(params) {
    var html = this._buildInvoiceTemplate(params);
    return this.send({
      to: params.email,
      subject: 'Invoice from Otel.Pro',
      htmlBody: html
    });
  },

  sendOTP: function(params) {
    var html = '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">' +
      '<h2 style="color:#1a1a2e;">Password Reset OTP</h2>' +
      '<p>Your OTP for password reset is:</p>' +
      '<div style="font-size:28px;font-weight:700;letter-spacing:6px;text-align:center;padding:16px;background:#f0f2f5;border-radius:8px;margin:16px 0;">' +
      params.otp + '</div>' +
      '<p style="color:#64748b;">This OTP is valid for 10 minutes.</p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;">' +
      '<p style="font-size:12px;color:#94a3b8;">Otel.Pro Hotel Management System</p></div>';
    return this.send({
      to: params.email,
      subject: 'Password Reset OTP',
      htmlBody: html
    });
  },

  _buildQuoteTemplate: function(p) {
    return '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">' +
      '<h1 style="color:#1a1a2e;">Quote</h1>' +
      '<p>Dear ' + (p.guestName || 'Guest') + ',</p>' +
      '<p>Please find your quote below.</p>' +
      '<p>Total: <strong>' + (p.total || 'NPR 0') + '</strong></p>' +
      '<p>Valid until: ' + (p.validUntil || 'N/A') + '</p>' +
      '<hr><p style="font-size:12px;color:#94a3b8;">Otel.Pro Hotel Management</p></div>';
  },

  _buildInvoiceTemplate: function(p) {
    return '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">' +
      '<h1 style="color:#1a1a2e;">Invoice</h1>' +
      '<p>Dear ' + (p.guestName || 'Guest') + ',</p>' +
      '<p>Please find your invoice attached.</p>' +
      '<p>Amount Due: <strong>' + (p.total || 'NPR 0') + '</strong></p>' +
      '<p>Due Date: ' + (p.dueDate || 'N/A') + '</p>' +
      '<hr><p style="font-size:12px;color:#94a3b8;">Otel.Pro Hotel Management</p></div>';
  }
};
