'use client';

import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isSafeImageUrl } from '@/lib/journey/journey-store';

type StopImageProps = {
  src?: string;
  alt: string;
  badge?: string;
  className?: string;
};

export function StopImage({ src, alt, badge, className }: StopImageProps) {
  const usable = src && isSafeImageUrl(src) ? src : undefined;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [usable]);

  const showPlaceholder = !usable || failed || !loaded;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-900 ${className ?? ''}`}>
      {usable && !failed ? (
        // Stop photos are arbitrary user-supplied URLs; next/image would reject any
        // host missing from next.config remotePatterns, and data: URLs outright.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // A cached image can already be complete before React attaches onLoad,
          // which would otherwise leave it stuck at opacity-0.
          ref={(node) => {
            if (!node?.complete) return;
            if (node.naturalWidth > 0) setLoaded(true);
            else setFailed(true);
          }}
          src={usable}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}

      {showPlaceholder ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
          <div>
            <ImageIcon className="mx-auto h-6 w-6 opacity-80" />
            <p className="mt-2 text-base font-semibold">{alt}</p>
            <p className="mt-1 text-xs opacity-80">{failed ? '图片加载失败，检查网址是否可公开访问' : '在「编辑」里填入图片网址即可展示'}</p>
          </div>
        </div>
      ) : null}

      {badge ? (
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
