"use client";

import { useIsMobile } from '@/hooks/useGameInput';

// SVG Icons for realm buttons (no emojis)
const RealmIcons = {
  hub: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
      <ellipse cx="8" cy="7" rx="4" ry="3" fill="#5b8c5a" />
      <circle cx="6" cy="6" r="1" fill="#333" />
      <circle cx="10" cy="6" r="1" fill="#333" />
    </svg>
  ),
  rabbit: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="11" rx="4" ry="3" fill="#E8DCC8" />
      <ellipse cx="5" cy="3" rx="1.5" ry="5" fill="#E8DCC8" />
      <ellipse cx="11" cy="3" rx="1.5" ry="5" fill="#E8DCC8" />
      <ellipse cx="5" cy="3" rx="1" ry="4" fill="#FFB6C1" />
      <ellipse cx="11" cy="3" rx="1" ry="4" fill="#FFB6C1" />
      <circle cx="6" cy="10" r="1" fill="#333" />
      <circle cx="10" cy="10" r="1" fill="#333" />
    </svg>
  ),
  cat: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="5" ry="4" fill="#FFA500" />
      <path d="M2 4 L4 8 L2 8 Z" fill="#FFA500" />
      <path d="M14 4 L12 8 L14 8 Z" fill="#FFA500" />
      <circle cx="6" cy="8" r="1" fill="#333" />
      <circle cx="10" cy="8" r="1" fill="#333" />
      <ellipse cx="8" cy="10" rx="1" ry="0.5" fill="#FF69B4" />
    </svg>
  ),
  frog: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
      <circle cx="5" cy="5" r="2.5" fill="#4ade80" />
      <circle cx="11" cy="5" r="2.5" fill="#4ade80" />
      <circle cx="5" cy="4.5" r="1" fill="#333" />
      <circle cx="11" cy="4.5" r="1" fill="#333" />
      <path d="M6 11 Q8 13 10 11" stroke="#333" strokeWidth="1" fill="none" />
    </svg>
  ),
  owl: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="9" rx="5" ry="5" fill="#8B4513" />
      <circle cx="5.5" cy="7" r="2.5" fill="#FFF8DC" />
      <circle cx="10.5" cy="7" r="2.5" fill="#FFF8DC" />
      <circle cx="5.5" cy="7" r="1.2" fill="#FFD700" />
      <circle cx="10.5" cy="7" r="1.2" fill="#FFD700" />
      <circle cx="5.5" cy="7" r="0.5" fill="#333" />
      <circle cx="10.5" cy="7" r="0.5" fill="#333" />
      <path d="M7 10 L8 12 L9 10" fill="#FF8C00" />
    </svg>
  ),
  elf: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1 L4 8 L12 8 Z" fill="#2E8B57" />
      <circle cx="8" cy="11" r="4" fill="#F5DEB3" />
      <circle cx="6.5" cy="10" r="0.8" fill="#333" />
      <circle cx="9.5" cy="10" r="0.8" fill="#333" />
      <path d="M2 6 L4 8" stroke="#F5DEB3" strokeWidth="2" />
      <path d="M14 6 L12 8" stroke="#F5DEB3" strokeWidth="2" />
    </svg>
  ),
};

// Vertical sidebar for realm navigation on mobile
export default function MobileRealmSidebar({ currentRealm, onNavigate }) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const realms = [
    { id: 'hub', name: 'Hub (Clock)', color: '#4ade80' },
    { id: 'rabbit', name: 'Rabbit Realm', color: '#E8DCC8' },
    { id: 'cat', name: 'Cat Realm', color: '#FFA500' },
    { id: 'frog', name: 'Frog Realm', color: '#4ade80' },
    { id: 'owl', name: 'Owl Realm', color: '#8B4513' },
    { id: 'elf', name: 'Elf Realm', color: '#2E8B57' },
  ];

  const handleClick = (realm) => {
    if (onNavigate) {
      onNavigate(realm.id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      right: '8px',
      top: '70px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '6px',
      borderRadius: '10px',
      zIndex: 100,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    }}>
      {realms.map((realm) => {
        const IconComponent = RealmIcons[realm.id];
        const isActive = currentRealm === realm.id;

        return (
          <button
            key={realm.id}
            onClick={() => handleClick(realm)}
            title={realm.name}
            style={{
              width: '36px',
              height: '36px',
              background: isActive
                ? `${realm.color}33`
                : 'rgba(255, 255, 255, 0.08)',
              border: isActive
                ? `2px solid ${realm.color}`
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
              opacity: isActive ? 1 : 0.7,
            }}
          >
            {IconComponent && <IconComponent size={20} />}
          </button>
        );
      })}
    </div>
  );
}
