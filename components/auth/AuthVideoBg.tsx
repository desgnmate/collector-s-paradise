'use client';

import React from 'react';

const AuthVideoBg = () => {
  return (
    <div className="auth-video-wrapper">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="auth-video-element"
      >
        <source src="/videos/cp-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="auth-video-overlay"></div>
    </div>
  );
};

export default AuthVideoBg;
