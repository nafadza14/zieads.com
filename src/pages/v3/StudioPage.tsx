import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import SocialIcon from '../../components/v3/SocialIcon';
import { 
  Calendar, 
  Sparkles, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  Instagram, 
  Linkedin, 
  MessageSquare 
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';

export default function StudioPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const connRes = await fetch('/api/v3/connections', { headers });
      const connJ = await connRes.json();
      if (connJ.success) setConnections(connJ.data);

      if (connJ.data && connJ.data.length > 0) {
        const recRes = await fetch('/api/v3/studio/recommendations', { headers });
        const recJ = await recRes.json();
        if (recJ.success) setRecommendations(recJ.data);
      }
    } catch (err) {
      console.error("Failed to load studio recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/studio/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        setRecommendations(prev => 
          prev.map(r => r.id === id ? { ...r, user_action: action } : r)
        );
      }
    } catch (err) {
      console.error("Failed to save action:", err);
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    return <SocialIcon platform={platform} size={14} />;
  };

  const hasConnections = connections.length > 0;
  const currentWeekStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Content Studio</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Weekly content recommendations tailored to your brand voice.</p>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: 40, overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: G, marginTop: 40 }}>Generating custom weekly content scripts...</div>
        ) : !hasConnections ? (
          <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={28} style={{ color: P }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Build Custom Recommendations</h2>
              <p style={{ fontSize: '0.85rem', color: G, margin: 0 }}>Connect your organic social platforms under Connections to allow the AI Content Studio to learn your writing brand voice.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Week Strategy Intro Banner */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary-bg) 0%, rgba(255,255,255,1) 100%)', border: `1px solid ${B}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: P, textTransform: 'uppercase', marginBottom: 8 }}>
                <Sparkles size={14} /> Weekly Strategy Overview
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>
                Week starting {currentWeekStr}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Focusing on high-value educational threads and case studies based on your tone.
              </p>
            </div>

            {/* Daily content recommendations list */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>This Week's Drafts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {recommendations.map((rec, i) => {
                  const isCopied = copiedId === rec.id;
                  const isAccepted = rec.user_action === 'accepted';
                  const isRejected = rec.user_action === 'rejected';

                  return (
                    <div key={rec.id || i} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, display: 'grid', gridTemplateColumns: '150px 1fr', gap: 24, opacity: isRejected ? 0.6 : 1, transition: 'all 0.15s' }}>
                      
                      {/* Day and Platform metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Draft #{i + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {getPlatformIcon(rec.platform)}
                          <span style={{ fontWeight: 600 }}>{rec.platform}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: G }}>
                          Best Time: {new Date(rec.optimal_post_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Content details and actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        
                        {/* Topic & Format */}
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 2 }}>{rec.topic}</div>
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-soft)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {rec.format_recommendation}
                          </span>
                        </div>

                        {/* Caption text draft block */}
                        <div style={{ position: 'relative', background: 'var(--bg-soft)', border: `1px solid ${B}`, borderRadius: 6, padding: 16 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontFamily: 'inherit', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                            {rec.caption_draft}
                          </p>
                          <button 
                            onClick={() => handleCopyToClipboard(rec.caption_draft, rec.id)}
                            style={{ position: 'absolute', top: 10, right: 10, background: '#fff', border: `1px solid ${B}`, padding: 6, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}
                          >
                            {isCopied ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                            {isCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {/* Visual concept brief */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: '0.78rem', background: '#fef08a33', border: '1px solid #fef08a', padding: 12, borderRadius: 6 }}>
                          <Info size={14} style={{ color: '#EAB308', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <strong>Visual Brief:</strong> <span style={{ color: 'var(--text-secondary)' }}>{rec.visual_brief}</span>
                          </div>
                        </div>

                        {/* Reasoning / Strategic context */}
                        {rec.reasoning && (
                          <div style={{ fontSize: '0.73rem', color: G }}>
                            <strong>Strategic Reasoning:</strong> {rec.reasoning}
                          </div>
                        )}

                        {/* Footer Actions */}
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${B}` }}>
                          <span style={{ fontSize: '0.75rem', color: G }}>
                            Status: <strong style={{ color: isAccepted ? '#10B981' : isRejected ? '#EF4444' : P }}>{rec.user_action.toUpperCase()}</strong>
                          </span>
                          
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button 
                              onClick={() => handleAction(rec.id, 'rejected')}
                              disabled={isRejected}
                              style={{ border: `1px solid ${B}`, background: isRejected ? 'var(--bg-soft)' : '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', cursor: isRejected ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <ThumbsDown size={12} /> Dismiss
                            </button>
                            <button 
                              onClick={() => handleAction(rec.id, 'accepted')}
                              disabled={isAccepted}
                              style={{ border: 'none', background: isAccepted ? 'var(--bg-soft)' : P, color: isAccepted ? 'var(--text-secondary)' : '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: isAccepted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <ThumbsUp size={12} /> {isAccepted ? 'Accepted' : 'Accept Draft'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </V3Layout>
  );
}
