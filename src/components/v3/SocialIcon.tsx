import React from 'react';

interface SocialIconProps {
  platform: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function SocialIcon({ platform, size = 20, style }: SocialIconProps) {
  const p = platform.toLowerCase();

  if (p === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="url(#ig-grad-icon)" />
        <rect x="5" y="5" width="14" height="14" rx="4" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
        <circle cx="16.5" cy="7.5" r="1" fill="white" />
        <defs>
          <linearGradient id="ig-grad-icon" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FED976" />
            <stop offset="0.25" stopColor="#FEB24C" />
            <stop offset="0.5" stopColor="#FD8D3C" />
            <stop offset="0.75" stopColor="#FC4E2A" />
            <stop offset="1" stopColor="#C90076" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (p === 'tiktok' || p === 'tiktok_ads') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="black" />
        <path d="M16 8.5C14.5 8.5 13.5 7.5 13.5 6H11V15.5C11 17.43 9.43 19 7.5 19C5.57 19 4 17.43 4 15.5C4 13.57 5.57 12 7.5 12C8 12 8.46 12.11 8.88 12.3V9.8C8.44 9.73 8 9.7 7.5 9.7C4.3 9.7 1.7 12.3 1.7 15.5C1.7 18.7 4.3 21.3 7.5 21.3C10.7 21.3 13.3 18.7 13.3 15.5V11C14.5 12 16 12.5 17.5 12.5V10C16.7 10 16 9.3 16 8.5Z" fill="white" />
      </svg>
    );
  }

  if (p === 'linkedin') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="#0A66C2" />
        <path d="M19 19H16V14.5C16 13.2 15.5 12.5 14.5 12.5C13.7 12.5 13.2 13 13.2 13.7V19H10.2V10H13.2V11.2C13.6 10.6 14.5 10 15.8 10C17.8 10 19 11.3 19 14V19ZM6.7 8.5C5.7 8.5 5 7.8 5 6.8C5 5.8 5.7 5 6.7 5C7.7 5 8.5 5.8 8.5 6.8C8.5 7.8 7.7 8.5 6.7 8.5ZM5.2 19V10H8.2V19H5.2Z" fill="white" />
      </svg>
    );
  }

  if (p === 'facebook' || p === 'meta' || p === 'meta_ads') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="#1877F2" />
        <path d="M17.5 12.5H15V19H12V12.5H10V9.8H12V8.2C12 6.2 13.2 5 15.2 5C16.1 5 17 5.1 17.5 5.2V7.5H16.2C15.2 7.5 15 8 15 8.8V9.8H17.5L17.5 12.5Z" fill="white" />
      </svg>
    );
  }

  if (p === 'twitter' || p === 'x') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="#000000" />
        <path d="M18.2 5H19.8L16.2 9.1L20.5 19H17.2L14.7 15.6L14.7 15.6L11.7 19H10.1L14 14.4L9.8 5H13.2L15.4 8.3L18.2 5ZM17.6 17.9H18.5L12.7 6H11.7L17.6 17.9Z" fill="white" />
      </svg>
    );
  }

  if (p === 'google' || p === 'google_ads') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }}>
        <rect width="24" height="24" rx="6" fill="#4285F4" />
        <path d="M12 9.7V12.2H16.2C16.2 13.4 15 14.7 12 14.7C9.5 14.7 7.5 12.7 7.5 10.2C7.5 7.7 9.5 5.7 12 5.7C13.4 5.7 14.4 6.3 14.9 6.8L16.8 4.9C15.6 3.8 14 3.2 12 3.2C8.1 3.2 5 6.3 5 10.2C5 14.1 8.1 17.2 12 17.2C16 17.2 18.8 14.3 18.8 10.2C18.8 9.7 18.7 9.2 18.6 8.7L12 8.7V9.7Z" fill="white" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
