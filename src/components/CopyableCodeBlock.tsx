import React from "react";

type CopyableCodeBlockProps = {
  value: string;
  language?: string;
};

const CopyableCodeBlock = ({
  value,
  language = "json",
}: CopyableCodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="absolute right-2 top-2 z-10 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 focus:outline-none"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-64 json-prism-preview">
        <code className={`language-${language}`}>{value}</code>
      </pre>
    </div>
  );
};

export default CopyableCodeBlock;
