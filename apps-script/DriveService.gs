/**
 * Drive Service - handles file uploads and retrieval
 */

var DriveService = {
  FOLDERS: {
    'id-cards': { id: null },
    'payments': { id: null },
    'rooms': { id: null }
  },

  upload: function(params) {
    var fileName = params.fileName || 'untitled';
    var fileData = params.fileData;  // base64 encoded
    var mimeType = params.mimeType || 'image/jpeg';
    var folder = params.folder || 'general';

    if (!fileData) throw new Error('No file data provided');

    var folderId = this._getFolderId(folder);
    var blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    var file = folderId
      ? DriveApp.getFolderById(folderId).createFile(blob)
      : DriveApp.createFile(blob);

    return {
      driveId: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      mimeType: file.getMimeType(),
      size: file.getSize()
    };
  },

  getFile: function(params) {
    var fileId = params.driveId;
    if (!fileId) throw new Error('driveId required');
    var file = DriveApp.getFileById(fileId);
    return {
      driveId: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      mimeType: file.getMimeType()
    };
  },

  _getFolderId: function(folderName) {
    var props = PropertiesService.getScriptProperties();
    var key = 'folder_' + folderName;
    var folderId = props.getProperty(key);
    if (!folderId) {
      var folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folderId = folders.next().getId();
        props.setProperty(key, folderId);
      }
    }
    return folderId;
  }
};
