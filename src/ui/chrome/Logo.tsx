import React from 'react';

/** Baker Corp mark. Raster when the plate exists, CSS hexagon when it does not
 *  — no SVG anywhere in this build. */
export function Logo({ variant = 'clean', className, alt = 'Baker Corporation' }:
  { variant?: 'clean' | 'worn'; className?: string; alt?: string }) {
  const [missing, setMissing] = React.useState(false);
  if (missing) return <span className={'logo-fallback' + (className ? ' ' + className : '')} role="img" aria-label={alt} />;
  return (
    <img
      className={'logo-mark' + (className ? ' ' + className : '')}
      src={`/art/ui/logo-${variant}.png`}
      alt={alt}
      onError={() => setMissing(true)}
    />
  );
}
