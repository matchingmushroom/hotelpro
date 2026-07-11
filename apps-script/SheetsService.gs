/**
 * Sheets Service - backup data to Google Sheets
 */

var SheetsService = {
  BACKUP_SHEET_NAME: 'OtelPro_Backup',

  backup: function(params) {
    var table = params.table;
    var rows = params.rows || [];
    var spreadsheet = this._getOrCreateSpreadsheet();
    var sheet = spreadsheet.getSheetByName(table);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(table);
    }

    // Clear existing content
    sheet.clear();

    if (rows.length === 0) {
      sheet.appendRow(['No data']);
      return { message: table + ' backed up (0 rows)' };
    }

    // Write headers
    var headers = Object.keys(rows[0]);
    sheet.appendRow(headers);

    // Write data
    var data = rows.map(function(row) {
      return headers.map(function(h) {
        var val = row[h];
        if (typeof val === 'object') return JSON.stringify(val);
        return val !== undefined && val !== null ? String(val) : '';
      });
    });

    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    }

    return {
      message: table + ' backed up',
      rowCount: rows.length,
      sheetUrl: spreadsheet.getUrl()
    };
  },

  _getOrCreateSpreadsheet: function() {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('backup_sheet_id');

    if (sheetId) {
      try {
        return SpreadsheetApp.openById(sheetId);
      } catch (e) {
        // Sheet deleted, create new
      }
    }

    var ss = SpreadsheetApp.create(this.BACKUP_SHEET_NAME);
    props.setProperty('backup_sheet_id', ss.getId());
    return ss;
  }
};
