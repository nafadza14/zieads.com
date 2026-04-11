import { useState } from 'react';

const P = '#7B2FBE';
const G = '#64748b';
const D = '#1e293b';
const B = '#e2e8f0';

interface Finding {
  category: string;
  title: string;
  description: string;
  impact: string;
  actionableStep: string;
  annotation?: string; // New collaborative field
}

export default function CollaborativeReport({ findings, onUpdate }: { findings: Finding[], onUpdate?: (newFindings: Finding[]) => void }) {
  const [activeFinding, setActiveFinding] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [localFindings, setLocalFindings] = useState<Finding[]>(findings);

  const saveAnnotation = (index: number) => {
    const updated = [...localFindings];
    updated[index].annotation = noteText;
    setLocalFindings(updated);
    if (onUpdate) onUpdate(updated);
    setActiveFinding(null);
  };

  if (!localFindings || localFindings.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      {localFindings.map((f, i) => (
        <div key={i} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: P, background: '#f3e8ff', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{f.category}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{f.impact} Impact</span>
            </div>
            {/* Action button */}
            <button 
              onClick={() => { setActiveFinding(i); setNoteText(f.annotation || ''); }}
              style={{ background: 'transparent', border: 'none', color: G, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              {f.annotation ? 'Edit Note' : 'Add Note'}
            </button>
          </div>

          <h4 style={{ fontSize: '1.2rem', color: D, marginBottom: 8, fontWeight: 700 }}>{f.title}</h4>
          <p style={{ fontSize: '1rem', color: G, lineHeight: '1.6', marginBottom: 16 }}>{f.description}</p>
          
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, borderLeft: `3px solid ${P}` }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: D, marginBottom: 4 }}>Action Item</strong>
            <span style={{ fontSize: '0.95rem', color: G }}>{f.actionableStep}</span>
          </div>

          {/* Collaborative Annotation Section */}
          {f.annotation && activeFinding !== i && (
            <div style={{ marginTop: 16, background: '#fefce8', padding: 12, borderRadius: 8, border: '1px solid #fef08a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ca8a04', marginBottom: 4 }}>Agency Note</div>
              <div style={{ fontSize: '0.9rem', color: '#854d0e', fontStyle: 'italic' }}>"{f.annotation}"</div>
            </div>
          )}

          {/* Annotation Editor */}
          {activeFinding === i && (
            <div style={{ marginTop: 16, background: '#f1f5f9', padding: 16, borderRadius: 8, border: `1px solid ${B}` }}>
              <textarea 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add internal notes or client communication for this finding..."
                style={{ width: '100%', height: 80, padding: 12, border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.9rem', marginBottom: 12, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveFinding(null)} style={{ background: 'transparent', border: `1px solid ${B}`, borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', color: G }}>Cancel</button>
                <button onClick={() => saveAnnotation(i)} style={{ background: P, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>Save Note</button>
              </div>
            </div>
          )}

        </div>
      ))}
    </div>
  );
}
