import React from 'react';
import { Instagram, Facebook, Globe, Music } from 'lucide-react';
import { Socials } from '../../types';

export interface SocialBadgesProps {
  socials?: Socials | null;
  className?: string;
}

export const SocialBadges: React.FC<SocialBadgesProps> = ({ socials, className = '' }) => {
  if (!socials) return null;

  const items: {
    name: string;
    url: string;
    label: string;
    tooltip: string;
    style: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [];

  if (socials.instagram && socials.instagram.trim() !== '') {
    const raw = socials.instagram.trim();
    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const handle = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '');
    const url = isUrl ? raw : `https://instagram.com/${handle}`;
    items.push({
      name: 'Instagram',
      url,
      label: `@${handle.split('/')[0]}`,
      tooltip: `Instagram: @${handle}`,
      style: 'bg-pink-950/40 text-pink-400 border-pink-900/50 hover:bg-pink-900/50',
      icon: Instagram
    });
  }

  if (socials.facebook && socials.facebook.trim() !== '') {
    const raw = socials.facebook.trim();
    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const handle = raw.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '');
    const url = isUrl ? raw : `https://facebook.com/${handle}`;
    items.push({
      name: 'Facebook',
      url,
      label: handle.split('/')[0] || 'Facebook',
      tooltip: `Facebook: ${raw}`,
      style: 'bg-blue-950/40 text-blue-400 border-blue-900/50 hover:bg-blue-900/50',
      icon: Facebook
    });
  }

  if (socials.tiktok && socials.tiktok.trim() !== '') {
    const raw = socials.tiktok.trim();
    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const handle = raw.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/^@/, '');
    const url = isUrl ? raw : `https://tiktok.com/@${handle}`;
    items.push({
      name: 'TikTok',
      url,
      label: `@${handle.split('/')[0]}`,
      tooltip: `TikTok: @${handle}`,
      style: 'bg-stone-900 text-stone-200 border-stone-700/80 hover:bg-stone-850',
      icon: Music
    });
  }

  if (socials.website && socials.website.trim() !== '') {
    const raw = socials.website.trim();
    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const url = isUrl ? raw : `https://${raw}`;
    const displayLabel = raw.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    items.push({
      name: 'Website',
      url,
      label: displayLabel,
      tooltip: `Sitio Web: ${url}`,
      style: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/50',
      icon: Globe
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mr-1">
        Redes Sociales:
      </span>
      {items.map(item => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.tooltip}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition tracking-wide ${item.style}`}
          >
            <IconComponent size={12} />
            <span className="max-w-[140px] truncate">{item.label}</span>
          </a>
        );
      })}
    </div>
  );
};
