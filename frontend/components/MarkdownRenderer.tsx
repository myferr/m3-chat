"use client";

import React, { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

import "./prism-theme.css";

const CodeBlock: React.FC<any> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const [isCopied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = () => {
    const innerHTML = document.getElementById("code")?.innerText || "";
    navigator.clipboard.writeText(innerHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-2">
      <pre className={className} {...props}>
        <code id="code">{children}</code>
      </pre>

      <button
        onClick={handleCopy}
        type="button"
        aria-label="Copy code to clipboard"
        className="absolute right-2 top-2 bg-secondary/50 text-white px-2 py-1 rounded text-xs select-none"
      >
        {isCopied ? "Copied!" : `Copy ${language || ""}`}
      </button>
    </div>
  );
};

const components: Components = {
  code: CodeBlock,

  // Support headers (h1-h6) with correct rendering
  h1: ({ node, ...props }) => (
    <h1 className="text-4xl font-black mt-4 mb-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-3xl font-bold mt-4 mb-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-2xl font-semibold mt-4 mb-2" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-xl font-semibold mt-4 mb-2" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="text-lg font-semibold mt-4 mb-2" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="text-md font-semibold mt-4 mb-2" {...props} />
  ),
};

type Props = {
  content: string;
};

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
