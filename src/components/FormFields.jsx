import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from './Toast.jsx';

export function initialValues(fields, row) {
  const v = {};
  fields.forEach((f) => {
    const existing = row ? row[f.name] : undefined;
    if (existing !== undefined && existing !== null) v[f.name] = existing;
    else v[f.name] = f.default ?? (f.type === 'checkbox' ? false : '');
  });
  return v;
}

/** Builds the request body. On edit, cleared text fields are sent as '' so they can be emptied. */
export function buildPayload(fields, values, keepEmpty = false) {
  const out = {};
  fields.forEach((f) => {
    let v = values[f.name];
    if (f.type === 'number') {
      if (v === '' || v === undefined) return;
      v = Number(v);
    }
    if (v === '' && !keepEmpty) return;
    if (v === undefined) return;
    out[f.name] = v;
  });
  return out;
}

const MAX_MB = 5;

/** File picker that uploads to POST /api/common/upload and stores the returned fileUrl as the field value. */
function ImageField({ field, value, onChange }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast('Please choose a JPG, PNG or WEBP image', 'error');
    if (file.size > MAX_MB * 1024 * 1024) return toast(`Image is larger than ${MAX_MB} MB`, 'error');

    setUploading(true);
    try {
      const res = await api.upload(file);
      const url = res?.data?.fileUrl;
      if (!url) throw new Error('Upload succeeded but no file URL was returned');
      onChange(url);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-field">
      {value ? (
        <div className="image-preview">
          <img src={value} alt="Preview" />
          <div className="grow">
            <a className="link small" href={value} target="_blank" rel="noreferrer">
              View image
            </a>
            <div className="muted small url" title={value}>
              {value}
            </div>
          </div>
          <button type="button" className="btn sm danger" onClick={() => onChange('')}>
            Remove
          </button>
        </div>
      ) : (
        <div className="muted small">No image uploaded</div>
      )}
      <label className={`btn sm upload-btn ${uploading ? 'disabled' : ''}`}>
        {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={uploading} hidden />
      </label>
      <small className="muted">JPG, PNG or WEBP, up to {MAX_MB} MB.</small>
    </div>
  );
}

export default function FormFields({ fields, values, onChange }) {
  const set = (name, value) => onChange({ ...values, [name]: value });

  return (
    <>
      {fields.map((f) =>
        f.type === 'image' ? (
          <div key={f.name} className="field">
            <span>{f.label}</span>
            <ImageField field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
          </div>
        ) : (
          <label key={f.name} className={`field ${f.type === 'checkbox' ? 'check' : ''}`}>
            <span>
              {f.label}
              {f.required && <em className="req"> *</em>}
            </span>
            {f.type === 'textarea' ? (
              <textarea rows={3} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === 'checkbox' ? (
              <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
            ) : f.type === 'select' ? (
              <select className="full" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                value={values[f.name]}
                required={f.required}
                min={f.min}
                step={f.integer ? 1 : f.type === 'number' ? 'any' : undefined}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </label>
        )
      )}
    </>
  );
}
