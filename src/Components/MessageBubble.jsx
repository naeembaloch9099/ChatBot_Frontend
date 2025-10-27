import React, { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaUser,
  FaRobot,
} from "react-icons/fa";
import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageBubble({
  role = "bot",
  text = "",
  files = [],
  isTyping = false,
  onTypingComplete = null,
}) {
  const isUser = role === "user";
  const [displayText, setDisplayText] = useState(isUser ? text : "");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Typing animation for bot messages
  useEffect(() => {
    if (isUser || !text) {
      setDisplayText(text);
      return;
    }

    if (isTyping && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex((prev) => prev + 1);
      }, 30); // Typing speed - slower for better effect

      return () => clearTimeout(timer);
    } else if (currentIndex >= text.length && onTypingComplete) {
      onTypingComplete();
    } else if (!isTyping) {
      // If not typing, show full text immediately
      setDisplayText(text);
    }
  }, [isUser, text, isTyping, currentIndex, onTypingComplete]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`flex ${
          isUser ? "flex-row-reverse" : "flex-row"
        } max-w-[85%] lg:max-w-[70%]`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`
            w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
            ${isUser ? "bg-blue-600" : "bg-green-600"}
          `}
          >
            {isUser ? <FaUser /> : <FaRobot />}
          </div>
        </div>

        {/* Message Content */}
        <div
          className={`
          rounded-2xl px-4 py-3 shadow-sm relative
          ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
          }
        `}
        >
          {/* File preview section */}
          {Array.isArray(files) && files.length > 0 && (
            <div className="mb-3 space-y-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-black bg-opacity-10"
                >
                  <span className="inline-block w-4 h-4">
                    {/pdf/i.test(f.type) ? (
                      <FaFilePdf className="text-red-500" />
                    ) : /jpe?g|png|webp/i.test(f.type) ? (
                      <FaFileImage className="text-blue-500" />
                    ) : (
                      <FaFileAlt className="text-gray-500" />
                    )}
                  </span>
                  <span className="text-xs font-medium truncate flex-1">
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${
                          isUser ? "text-white" : "text-blue-600"
                        }`}
                      >
                        {f.name}
                      </a>
                    ) : (
                      f.name
                    )}
                  </span>
                  <span
                    className={`text-xs ${
                      isUser ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Message Text */}
          <div className="message-content">
            {isUser ? (
              <div className="whitespace-pre-wrap text-white leading-relaxed">
                {text}
              </div>
            ) : (
              <div className="text-gray-800 leading-relaxed">
                <MarkdownRenderer
                  content={displayText}
                  isTyping={isTyping && currentIndex < text.length}
                />
                {isTyping && currentIndex < text.length && (
                  <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse">
                    |
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
