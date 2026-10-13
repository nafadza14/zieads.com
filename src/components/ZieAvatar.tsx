/*
  Zie: the face of the ZieAds AI Agent.
  Use this wherever the agent speaks or is named (chat avatar, "Powered by", hero box).
*/
import './zie-avatar.css';

export const ZIE_AVATAR_SRC = '/zie/zie-avatar.webp';

export default function ZieAvatar({
  size = 32,
  active = false,
  ring = true,
  className = '',
}: {
  size?: number;
  /** Spinning orange ring while the agent is working */
  active?: boolean;
  /** Thin ring around the avatar */
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`zie-avatar ${ring ? 'has-ring' : ''} ${active ? 'is-active' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src={ZIE_AVATAR_SRC} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}
