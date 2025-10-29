import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

// Enhanced ChatGPT-like chat message container with typing animation and auto-scroll
export default function ChatBox({
  messages = [],
  loading = false,
  onMessageComplete = null,
}) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);

  // Debug: Log when messages prop changes
  useEffect(() => {
    console.log("📦 [ChatBox] Received messages update:", messages.length);
    console.log("📦 [ChatBox] Last message:", messages[messages.length - 1]);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing animation for the last bot message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "bot" && !loading) {
      // Reset previous typing animation
      setTypingMessageIndex(null);
      // Small delay to ensure the message is rendered first
      setTimeout(() => {
        setTypingMessageIndex(messages.length - 1);
      }, 50);
    }
  }, [messages, loading]);

  const handleTypingComplete = (index) => {
    setTypingMessageIndex(null);
    if (onMessageComplete) {
      onMessageComplete(index);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      {/* Scrollable message area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 sm:px-4 md:px-6 py-4 sm:py-6 pb-28 sm:pb-32"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              How can I help you today?
            </h3>
            <p className="text-gray-600 max-w-md">
              Ask me anything! I can help with coding, math, writing, research,
              and much more.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={`message-${m.id || i}`}
            role={m.role}
            text={m.text}
            files={m.files || []}
            isTyping={typingMessageIndex === i}
            onTypingComplete={() => handleTypingComplete(i)}
          />
        ))}

        {loading && (
          <div className="flex justify-start mb-6">
            <div className="flex mr-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  Assistant is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
