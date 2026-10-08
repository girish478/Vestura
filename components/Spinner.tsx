
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="relative h-12 w-12" role="presentation" aria-hidden>
      {/* Static track ring */}
      <div className="absolute inset-0 rounded-full border-2 border-line" />
      {/* Rotating progress ring — uses .spinner-ring from theme.css */}
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent spinner-ring"
        style={{ borderTopColor: 'var(--accent)', borderRightColor: 'rgba(31,61,52,0.25)' }}
      />
    </div>
  );
};
