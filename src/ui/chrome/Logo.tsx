import React from 'react';

/** Baker Corp mark. Raster plate when the file exists, CSS hexagon when it does
 *  not — no SVG anywhere in this build. 'worn' is the default because the clean
 *  plate is drawn on white and only reads on a light ground. */
export function Logo({ variant = 'worn', className, alt = 'Baker Corporation' }:
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
