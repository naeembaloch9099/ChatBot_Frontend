import React, { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaUser,
  FaRobot,
  FaCopy,
  FaCheck,
  FaEdit,
  FaRedo,
  FaTrash,
} from "react-icons/fa";
import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageBubble({
  role = "bot",
  text = "",
  files = [],
  isTyping = false,
  onTypingComplete = null,
  onEdit = null,
  onRegenerate = null,
  onDelete = null,
  messageIndex = null,
  isRegenerating = false,
}) {
  const isUser = role === "user";
  const [displayText, setDisplayText] = useState(isUser ? text : "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Start editing
  const handleEdit = () => {
    setIsEditing(true);
    setEditedText(text);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(text);
  };

  // Save edited message
  const handleSaveEdit = () => {
    if (editedText.trim() && onEdit && messageIndex !== null) {
      setIsEditing(false);
      onEdit(messageIndex, editedText.trim());
    }
  };

  // Regenerate response
  const handleRegenerate = () => {
    if (onRegenerate && messageIndex !== null) {
      onRegenerate(messageIndex);
    }
  };

  // Delete message
  const handleDelete = () => {
    if (onDelete && messageIndex !== null) {
      onDelete(messageIndex);
    }
  };

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
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 sm:mb-6 px-2 sm:px-0`}
    >
      <div
        className={`flex ${
          isUser ? "flex-row-reverse" : "flex-row"
        } max-w-[95%] sm:max-w-[85%] lg:max-w-[70%]`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 ${
            isUser ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3"
          }`}
        >
          <div
            className={`
            w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm
            ${isUser ? "bg-blue-600" : "bg-green-600"}
          `}
          >
            {isUser ? <FaUser /> : <FaRobot />}
          </div>
        </div>

        {/* Message Content */}
        <div
          className={`
          rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm relative overflow-hidden
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
          <div className="message-content break-words overflow-hidden">
            {isEditing ? (
              // Inline editing mode
              <div className="space-y-2">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base resize-none ${
                    isUser
                      ? "bg-blue-500 border-blue-400 text-white placeholder-blue-200 focus:ring-blue-300"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
                  }`}
                  rows={Math.max(
                    3,
                    Math.min(10, editedText.split("\n").length + 1)
                  )}
                  autoFocus
                  placeholder="Type your message..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isUser
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Save & Resend
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap text-white leading-relaxed text-sm sm:text-base">
                {text}
              </div>
            ) : (
              <div className="text-gray-800 leading-relaxed text-sm sm:text-base">
                {isRegenerating ? (
                  <div className="flex items-center gap-2 text-gray-500 italic">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Regenerating response...</span>
                  </div>
                ) : (
                  <>
                    <MarkdownRenderer
                      content={displayText}
                      isTyping={isTyping && currentIndex < text.length}
                    />
                    {isTyping && currentIndex < text.length && (
                      <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse">
                        |
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - Show below bot messages or user messages */}
          {!isTyping && !isEditing && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/50">
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  isUser
                    ? "text-blue-100 hover:bg-blue-500/30"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Copy message"
              >
                {copied ? (
                  <>
                    <FaCheck size={12} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Edit Button (for user messages) */}
              {isUser && onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-100 hover:bg-blue-500/30 transition-colors"
                  title="Edit and resend"
                >
                  <FaEdit size={12} />
                  <span>Edit</span>
                </button>
              )}

              {/* Regenerate Button (for bot messages) */}
              {!isUser && onRegenerate && (
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Regenerate response"
                >
                  <FaRedo size={12} />
                  <span>Regenerate</span>
                </button>
              )}

              {/* Delete Button */}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    isUser
                      ? "text-red-200 hover:bg-red-500/30"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                  title="Delete message"
                >
                  <FaTrash size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
