import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { FaCopy, FaCheck } from "react-icons/fa";
import "katex/dist/katex.min.css";

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-sm rounded-t-lg border-b border-gray-600">
        <span className="font-mono">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <FaCheck className="text-green-400" size={12} />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <FaCopy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
          <code className={`language-${language}`}>{value}</code>
        </pre>
      </div>
    </div>
  );
};

const MarkdownRenderer = ({ content, isTyping = false }) => {
  return (
    <div className={`max-w-none break-words ${isTyping ? "opacity-75" : ""}`}>
      <style>{`
        /* Make KaTeX math responsive */
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          padding: 0.5rem 0;
        }
        .katex {
          font-size: 1em;
          white-space: normal;
        }
        @media (max-width: 640px) {
          .katex {
            font-size: 0.9em;
          }
          .katex-display {
            font-size: 0.85em;
          }
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const value = String(children).replace(/\n$/, "");

            return !inline ? (
              <CodeBlock language={language} value={value} />
            ) : (
              <code
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Pre blocks (handle code blocks at pre level to avoid p > div nesting)
          pre({ children, ...props }) {
            return <div {...props}>{children}</div>;
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },

          th({ children }) {
            return (
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="border border-gray-300 px-4 py-2">{children}</td>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2 break-words">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 mb-3 break-words">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-4 mb-2 break-words">
                {children}
              </h3>
            );
          },

          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-inside my-3 space-y-1 text-gray-700">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="list-decimal list-inside my-3 space-y-1 text-gray-700">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Paragraphs - use div to avoid HTML nesting validation errors
          p({ children }) {
            return (
              <div className="my-3 text-gray-700 leading-relaxed break-words overflow-x-auto">
                {children}
              </div>
            );
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">
                {children}
              </blockquote>
            );
          },

          // Strong and emphasis
          strong({ children }) {
            return (
              <strong className="font-semibold text-gray-900">
                {children}
              </strong>
            );
          },

          em({ children }) {
            return <em className="italic text-gray-700">{children}</em>;
          },

          // Links
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
