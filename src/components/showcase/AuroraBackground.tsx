import React from 'react';

// Layered aurora mesh driven by the scoped --sc-accent / --sc-accent-2 vars.
// Pure CSS-animated blobs + a fine grid; respects prefers-reduced-motion via CSS.
const AuroraBackground: React.FC = () => (
  <div className="sc-aurora" aria-hidden="true">
    <div className="sc-aurora-blob sc-aurora-1" />
    <div className="sc-aurora-blob sc-aurora-2" />
    <div className="sc-aurora-blob sc-aurora-3" />
    <div className="sc-grid" />
    <div className="sc-noise" />
  </div>
);

export default AuroraBackground;
