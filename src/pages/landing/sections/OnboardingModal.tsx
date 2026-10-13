import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Link2,  UserPlus, X, BotMessageSquare } from 'lucide-react';
import ZieAvatar from '../../../components/ZieAvatar';
import { TextRollButton } from '../ui';
import SocialIcon from '../../../components/v3/SocialIcon';
import '../../audit-flow.css';

interface Props {
  pendingPrompt: string;
  onConfirm: () => void;
  onClose: () => void;
}

const STEPS = [
  { icon: <UserPlus size={16} />, title: 'Create your free account', desc: 'Takes about 30 seconds. No credit card.' },
  { icon: <Link2 size={16} />, title: 'Connect your channels', desc: 'Instagram, TikTok, LinkedIn and more, read only.' },
  { icon: <BotMessageSquare size={16} />, title: 'Your AI Agent gets to work', desc: 'It answers this request with your real data.' },
];

export default function OnboardingModal({ pendingPrompt, onConfirm, onClose }: Props) {
  // Escape closes, page scroll locks while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="zf-modal-backdrop" onClick={onClose}>
      <div className="zf-modal" role="dialog" aria-modal="true" aria-labelledby="zf-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="zf-modal-glow" aria-hidden="true" />

        <div className="zf-modal-head">
          <span className="zf-agent">
            <ZieAvatar size={40} active />
            <span>
              <strong>Zie, your AI Agent</strong>
              <small>
                <i className="zf-live" /> Ready for your request
              </small>
            </span>
          </span>
          <button className="zf-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* The user's prompt, shown as a sent chat bubble */}
        <div className="zf-chat">
          <div className="zf-bubble-user">{pendingPrompt}</div>
          <div className="zf-bubble-agent">
            <span className="zf-typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>Great request. Sign up and I will start on it with your real account data.</span>
          </div>
        </div>

        <h3 id="zf-modal-title" className="zf-modal-title">
          One step away from your AI marketing agent
        </h3>

        <ol className="zf-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ animationDelay: `${0.35 + i * 0.1}s` }}>
              <span className="zf-step-num">0{i + 1}</span>
              <span className="zf-step-ico">{s.icon}</span>
              <span className="zf-step-text">
                <strong>{s.title}</strong>
                <small>{s.desc}</small>
              </span>
            </li>
          ))}
        </ol>

        <div className="zf-modal-channels">
          {(['instagram', 'tiktok', 'linkedin', 'facebook', 'x'] as const).map((k) => (
            <SocialIcon key={k} platform={k} size={22} />
          ))}
          <span>Works with the channels you already use</span>
        </div>

        <div className="zf-modal-actions">
          <TextRollButton text="Create free account" onClick={onConfirm} className="zf-modal-cta" />
          <p className="zf-modal-note">
            <Check size={13} /> Free plan forever. Your request is saved for you.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
