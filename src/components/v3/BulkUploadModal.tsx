/*
  Bulk upload (spec 7.4): one CSV row per post. Rows are checked first (dry run),
  then created as drafts with their date, so nothing publishes until the user
  approves it on the calendar.
*/
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Card, LoadingState } from './ui';
import SocialIcon from './SocialIcon';
import { api } from '../../lib/api';
import '../../pages/v3/connections.css';

export const BULK_TEMPLATE = 'date,time,platform,caption,media_url,first_comment\n2026-11-10,09:00,instagram,"New serum drop, link in bio",https://example.com/serum.jpg,"Which shade are you?"\n2026-11-11,19:00,facebook,"Behind the scenes at the lab",,\n';

export default function BulkUploadModal({ onClose, onDone }: { onClose: () => void; onDone: (created: number) => void }) {
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })();
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const check = async (text: string) => {
    setBusy(true);
    setErr('');
    setPreview(null);
    try {
      setPreview(await api('/api/v3/posts/bulk', { body: { csv: text, timezone: tz, dry_run: true } }));
    } catch (e: any) {
      setErr(e.body?.errors?.[0] ? `Line ${e.body.errors[0].line}: ${e.body.errors[0].message}` : e.message);
    } finally {
      setBusy(false);
    }
  };

  const readFile = async (f: File) => {
    setFileName(f.name);
    const text = await f.text();
    setCsv(text);
    check(text);
  };

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api('/api/v3/posts/bulk', { body: { csv, timezone: tz } });
      if (r.errors?.length && !r.created?.length) throw new Error(`Line ${r.errors[0].line}: ${r.errors[0].message}`);
      onDone(r.created?.length || 0);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([BULK_TEMPLATE], { type: 'text/csv' }));
    a.download = 'zieads-bulk-posts-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="zcn-overlay" role="dialog" aria-modal="true" aria-label="Bulk upload posts">
      <Card className="zcn-modal is-wide" padding={26}>
        <div className="zcn-modal-head">
          <span className="zd-icon-dot">
            <Upload size={18} />
          </span>
          <div>
            <h3>Bulk upload posts</h3>
            <p>
              One row per post with date, time, platform, caption, and optionally media_url and first_comment. Times use your time zone ({tz}). Every row becomes a draft on the calendar, so nothing goes live until you approve it.{' '}
              <button type="button" className="zcn-link" onClick={downloadTemplate}>
                Download the template
              </button>
            </p>
          </div>
        </div>
        <label className={`zcn-drop ${fileName ? 'has-file' : ''}`}>
          <span className="zcn-drop-icon">
            <Upload size={20} />
          </span>
          <span>{fileName || 'Choose a CSV file'}</span>
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </label>
        {busy && !preview && <LoadingState text="Checking the rows" inline />}
        {preview && (
          <div className="zcn-preview">
            <p>
              <strong>{preview.rows.length} posts</strong> ready to add as drafts.
            </p>
            {preview.errors?.length > 0 && (
              <p className="zcn-note">
                {preview.errors.length} row{preview.errors.length === 1 ? '' : 's'} will be skipped, first: line {preview.errors[0].line}, {preview.errors[0].message}
              </p>
            )}
            <div className="zcn-table-wrap">
              <table className="zcn-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Channel</th>
                    <th>Caption</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 20).map((r: any) => (
                    <tr key={r.line}>
                      <td>{new Date(r.scheduled_for).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                      <td>
                        <SocialIcon platform={r.platform} size={14} /> {r.platform}
                      </td>
                      <td>{String(r.caption).slice(0, 80)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {err && <p className="zcn-note is-error">{err}</p>}
        <div className="zcn-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} loading={busy && !!preview} disabled={!preview?.rows?.length}>
            Add {preview?.rows?.length || ''} drafts
          </Button>
        </div>
      </Card>
    </div>
  );
}
