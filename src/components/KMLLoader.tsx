import { useState } from "react";
import { Upload } from "lucide-react";

interface KMLData {
  name: string;
  url: string;
}

interface KMLLoaderProps {
  onLoad: (kmlData: KMLData) => void;
  defaultUrl?: string;
}

const KMLLoader: React.FC<KMLLoaderProps> = ({ onLoad, defaultUrl }) => {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState(defaultUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedKml, setLoadedKml] = useState<KMLData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (
        selected.type !== "application/vnd.google-earth.kml+xml" &&
        !selected.name.endsWith(".kml")
      ) {
        setError("Only KML files are allowed.");
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "url") {
      setIsUploading(true);
      try {
        new URL(url); // Validate URL
        // Fetch the remote KML file as a blob
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Failed to fetch remote KML file");
        const blob = await resp.blob();
        // Try to get filename from URL
        let filename = url.split("/").pop() || "remote.kml";
        if (!filename.endsWith(".kml")) filename += ".kml";
        // Create a File object from the blob
        const remoteFile = new File([blob], filename, {
          type: blob.type || "application/vnd.google-earth.kml+xml",
        });
        // Upload to /api/upload-kml
        const formData = new FormData();
        formData.append("file", remoteFile);
        const response = await fetch("/api/kml/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to upload KML");
        }
        const data = await response.json();
        onLoad(data);
        setLoadedKml(data);
        setUrl("");
      } catch (err: any) {
        setError(err.message || "Unknown error");
        // Try to load the remote URL directly in the map anyway
        if (url) {
          const fallback = { name: url, url };
          onLoad(fallback);
          setLoadedKml(fallback);
        }
      } finally {
        setIsUploading(false);
      }
    } else if (mode === "file") {
      if (!file) {
        setError("Please select a KML file to upload.");
        return;
      }
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/kml/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to upload KML");
        }
        const data = await response.json();
        onLoad(data);
        setLoadedKml(data);
        setFile(null);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <Upload className="w-5 h-5 text-military-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">Load a KML File</h2>
      </div>
      <form onSubmit={handleLoad} className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <span
            className={`text-sm font-medium ${
              mode === "url" ? "text-military-700" : "text-gray-500"
            }`}
          >
            Remote URL
          </span>
          <button
            type="button"
            aria-label="Toggle between Remote URL and Local File"
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              mode === "file" ? "bg-military-600" : "bg-gray-300"
            }`}
            onClick={() => setMode(mode === "url" ? "file" : "url")}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                mode === "file" ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              mode === "file" ? "text-military-700" : "text-gray-500"
            }`}
          >
            Local File
          </span>
        </div>
        {mode === "url" ? (
          <div>
            <label
              htmlFor="kml-url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              KML File URL
            </label>
            <input
              id="kml-url"
              name="kml-url"
              type="url"
              placeholder="https://example.com/sample.kml"
              value={url ?? ""}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Google Maps KmlLayer URL must be publicly accessible.
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="kml-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              KML File
            </label>
            <input
              id="kml-file"
              type="file"
              accept=".kml,application/vnd.google-earth.kml+xml"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-military-50 file:text-military-700 hover:file:bg-military-100"
              value="" // Note: value attribute for file inputs is not standard, but included for consistency
            />
            <p className="text-xs text-gray-500 mt-1">
              Only KML files are accepted. Uploaded files will be available for
              download and map loading.
            </p>
          </div>
        )}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isUploading}
        >
          {isUploading
            ? "Uploading..."
            : mode === "url"
            ? "Load KML from URL"
            : "Upload and Load KML"}
        </button>
        {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      </form>

      {/* KML Details and Download Options */}
      {loadedKml && (
        <div className="mt-8 p-4 rounded-lg bg-gray-100 border border-gray-200">
          <div className="mb-2 text-military-700 font-semibold flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-military-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            KML Details
          </div>
          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Name:</span> {loadedKml.name}
          </div>
          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Source:</span>{" "}
            {loadedKml.url.startsWith("http") ? "Remote URL" : "Uploaded File"}
          </div>
          <div className="text-sm text-gray-700 mb-3 break-all">
            <span className="font-medium">URL:</span>{" "}
            <a
              href={loadedKml.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-military-700 underline"
            >
              {loadedKml.url}
            </a>
          </div>
          <a
            href={loadedKml.url}
            download
            className="inline-block px-4 py-2 bg-military-600 text-white rounded hover:bg-military-700 transition-colors text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download KML
          </a>
        </div>
      )}
    </div>
  );
};

export default KMLLoader;
