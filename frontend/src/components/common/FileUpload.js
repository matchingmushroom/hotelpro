import { useState, useRef } from 'react';

export default function FileUpload({ onUpload, accept = 'image/*', label = 'Upload File', folder = 'general' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Try backend upload first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onUpload?.({ success: true, url: data.path, filename: data.filename, source: 'backend' });
        return;
      }
    } catch (err) {
      console.warn('Backend upload failed, trying GAS fallback', err.message);
    }

    // Fallback: GAS upload (base64)
    try {
      const base64Data = await fileToBase64(file);
      const { gasUploadFile } = await import('../../services/gasService');
      const result = await gasUploadFile(base64Data.split(',')[1], file.name, file.type, folder);
      onUpload?.({ success: true, url: result?.data?.url || base64Data, filename: file.name, source: 'gas' });
    } catch (err) {
      onUpload?.({ success: false, error: err.message });
    } finally {
      setUploading(false);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function clearFile() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    onUpload?.({ success: true, url: null, cleared: true });
  }

  return (
    <div className="file-upload-wrap">
      {preview ? (
        <div className="file-preview">
          <img src={preview} alt="Preview" />
          <button type="button" className="file-clear" onClick={clearFile} title="Remove">
            <i className="fas fa-times"></i>
          </button>
        </div>
      ) : (
        <label className="file-upload-btn">
          <i className="fas fa-cloud-upload-alt"></i>
          <span>{label}</span>
          <input ref={fileRef} type="file" accept={accept} onChange={handleFileChange} hidden />
        </label>
      )}
      {uploading && <div className="file-uploading"><i className="fas fa-spinner fa-spin"></i> Uploading...</div>}
      <style>{`
        .file-upload-wrap { margin: 8px 0; }
        .file-upload-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border: 2px dashed var(--border);
          border-radius: var(--radius); cursor: pointer;
          color: var(--text-secondary); font-size: 0.85rem;
          transition: var(--transition); background: var(--bg);
        }
        .file-upload-btn:hover { border-color: var(--primary); color: var(--primary); }
        .file-upload-btn i { font-size: 1.1rem; }
        .file-preview {
          position: relative; display: inline-block;
          border-radius: var(--radius); overflow: hidden;
          border: 1px solid var(--border);
        }
        .file-preview img {
          max-height: 120px; max-width: 200px;
          display: block; object-fit: cover;
        }
        .file-clear {
          position: absolute; top: 4px; right: 4px;
          width: 24px; height: 24px; border-radius: 50%;
          border: none; background: rgba(0,0,0,0.6); color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem;
        }
        .file-uploading {
          font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
