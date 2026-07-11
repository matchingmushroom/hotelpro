/**
 * Otel.Pro - Google Apps Script Backend
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 */

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    let result;
    switch (action) {
      case 'sendEmail':
        result = EmailService.send(params);
        break;
      case 'uploadFile':
        result = DriveService.upload(params);
        break;
      case 'backupToSheets':
        result = SheetsService.backup(params);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Otel.Pro GAS Backend is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
