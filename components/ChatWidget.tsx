"use client";

import React, { useState } from 'react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`chat-widget-container ${isOpen ? 'is-open' : ''}`}>
      {/* The Chat Window Popup */}
      <div className="chat-window">
        <div className="chat-header">
          <h3>Collector Support</h3>
          <button className="close-btn" onClick={toggleChat}>&times;</button>
        </div>
        <div className="chat-body">
          <p>Hi there! How can we help you with Collector's Paradise today?</p>
        </div>
        <div className="chat-footer">
          <input type="text" placeholder="Type a message..." />
          <button className="send-btn">Send</button>
        </div>
      </div>

      {/* The Pokeball Button */}
      <div className="pokeball-widget" onClick={toggleChat}>
        <div className="poke-top"></div>
        <div className="poke-bottom"></div>
        <div className="poke-center">
          <div className="poke-button"></div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
