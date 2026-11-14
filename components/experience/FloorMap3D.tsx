'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import floorplan from '@/public/images/pokemon_floorplan.png';

export type FloorZone = {
  id: string;
  num: string;
  pin: string;
  /** Area on the floor plan, in percent of the image. */
  rect: { left: number; top: number; width: number; height: number };
};

const PLANE = 760;
const TILT_3D = 'rotateX(50deg) rotateZ(-14deg)';
// The exact inverse of TILT_3D, so pins stand upright and face the viewer.
const BILLBOARD_3D = 'rotateZ(14deg) rotateX(-50deg)';

/**
 * The event's pixel floor plan as a tilted 3D slab with a sign per area.
 * It scales itself to whatever box it is given; `bottomInset` keeps the
 * floor clear of anything the parent overlays along the bottom edge.
 */
export default function FloorMap3D({
  zones,
  active,
  view,
  onSelect,
  bottomInset = 0,
}: {
  zones: FloorZone[];
  active: string;
  view: '3d' | 'top';
  onSelect: (id: string) => void;
  bottomInset?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const usableHeight = Math.max(0, box.height - bottomInset);
  // The tilted slab is about 1.25x as wide as the plan; the flat plan is square.
  // Perspective makes the near corner of the tilted slab wider than the plan,
  // so the 3D view needs more horizontal room than its flat footprint.
  const scale = view === '3d'
    ? Math.min(1, Math.max(0.22, Math.min((box.width - 24) / 1120, usableHeight / 660)))
    : Math.min(1, Math.max(0.28, Math.min(box.width - 40, usableHeight - 72) / PLANE));
  // Signs keep a readable size however small the map gets.
  const pinScale = Math.min(1.9, Math.max(1, 0.82 / (scale || 1)));
  const centerY = view === '3d'
    ? Math.round(usableHeight * 0.47)
    : Math.round(48 + (usableHeight - 48) / 2);

  return (
    <div
      ref={rootRef}
      className={`floor-map is-${view}`}
      role="group"
      aria-label="Event floor map. Choose an area to see what happens there."
    >
      <div className="floor-map-stage" style={{ top: centerY, transform: `scale(${scale || 0.5})` }}>
        <div className="floor-map-plane" style={{ transform: view === '3d' ? TILT_3D : 'none' }}>
          <span className="floor-map-side is-front" aria-hidden="true" />
          <span className="floor-map-side is-right" aria-hidden="true" />
          <Image
            src={floorplan}
            alt=""
            className="floor-map-image"
            width={PLANE}
            height={PLANE}
            sizes={`${PLANE}px`}
          />

          {zones.map((zone) => (
            <span
              key={`area-${zone.id}`}
              aria-hidden="true"
              className={`floor-map-area ${zone.id === active ? 'is-active' : ''}`}
              style={{
                left: `${zone.rect.left}%`,
                top: `${zone.rect.top}%`,
                width: `${zone.rect.width}%`,
                height: `${zone.rect.height}%`,
              }}
            />
          ))}

          {zones.map((zone) => {
            const on = zone.id === active;
            const x = ((zone.rect.left + zone.rect.width / 2) / 100) * PLANE;
            const y = ((zone.rect.top + zone.rect.height / 2) / 100) * PLANE;
            const lift = view === '3d' ? (on ? 26 : 16) : 2;
            return (
              <div
                key={`pin-${zone.id}`}
                className="floor-map-pin-anchor"
                style={{ left: x, top: y, transform: `translateZ(${lift}px) ${view === '3d' ? BILLBOARD_3D : ''} scale(${pinScale})` }}
              >
                {on && (
                  <svg className="floor-map-cursor" aria-hidden="true" width="22" height="16" viewBox="0 0 22 16">
                    <polygon points="2,2 20,2 11,14" />
                  </svg>
                )}
                <button
                  type="button"
                  className={`floor-map-pin ${on ? 'is-active' : ''}`}
                  aria-pressed={on}
                  onClick={() => onSelect(zone.id)}
                >
                  <span className="floor-map-pin-num" aria-hidden="true">{zone.num}</span>
                  {zone.pin}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
