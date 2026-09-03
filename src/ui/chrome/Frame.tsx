import React from 'react';

/** Every panel in the game is issued equipment. The tag says whose. */
export const UNIT = 'Baker Corp · Marlow · Inv-Unit 07';

/** Stable, meaningless-looking serial derived from a seed, so a panel keeps
 *  the same number across renders and reloads. */
export function serialOf(seed: string, prefix = 'BC'): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  const n = String(h % 10000).padStart(4, '0');
  const l = 'ABCDEFGHJKLMNPRSTUVWXZ'[h % 22];
  return `${prefix}-${n}/${l}`;
}

/** The equipment tag strip: worn Baker mark, owner line, serial. */
export function Tag({ unit = UNIT, serial, className }: { unit?: string; serial: string; className?: string }) {
  return (
    <div className={'tag' + (className ? ' ' + className : '')}>
      <span className="who">{unit}</span>
      <span className="sn">{serial}</span>
    </div>
  );
}

/** Framed panel: steel border, corner brackets, scanlines, boot flicker, tag. */
export function Frame({ className, tag = true, unit, serial, children, ...rest }:
  { className?: string; tag?: boolean; unit?: string; serial: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={'frame' + (className ? ' ' + className : '')} {...rest}>
      {tag && <Tag unit={unit} serial={serial} />}
      {children}
    </div>
  );
}
