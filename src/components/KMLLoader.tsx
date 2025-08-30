import { Upload } from "lucide-react";
import Prism from "prismjs";
import { useEffect, useState } from "react";
import { PutFileProjectRequest } from "targetsweeper-360";
import { T360Api } from "../api";
import CopyableCodeBlock from "./CopyableCodeBlock";
import type { KmlData } from "./SweeperProjectGenerator";

interface KMLLoaderProps {
  onLoadKmlToMap: (data?: KmlData) => void;
  defaultUrl?: string;
}

const KMLLoader: React.FC<KMLLoaderProps> = ({
  onLoadKmlToMap,
  defaultUrl,
}) => {
  const [url, setUrl] = useState(defaultUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"url" | "file">("url");
  const [loadedKml, setLoadedKml] = useState<KmlData | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);

  const [apiRequest, setApiRequest] = useState<PutFileProjectRequest | null>();

  useEffect(() => {
    // Highlight JSON preview after each render
    Prism.highlightAll();
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiError(null);

    try {
      const apiRequest = new PutFileProjectRequest({
        file:
          e.target.files && e.target.files.length > 0
            ? e.target.files[0]
            : undefined,
      } as any);

      if (!apiRequest?.isValid) {
        throw {
          response: {
            data: apiRequest,
          },
        };
      }

      setApiRequest(apiRequest);
    } catch (error: any) {
      setApiError(error?.response?.data?.errors ?? error);
    }
  };

  const handleFileUpload = async () => {
    setIsUploading(true);

    try {
      const response = await T360Api.Projects.putFile(apiRequest!);

      const kmlData = {
        name: response.data.path.split("/").pop(),
        url: new URL(response.data.path).toString(),
      };

      setApiRequest(null);
      setLoadedKml(kmlData);
      onLoadKmlToMap(kmlData);
    } catch (error: any) {
      setApiError(error?.response?.data?.errors ?? error);
    }

    setIsUploading(false);
  };

  const handleUrlLoad = () => {
    try {
      const urlObj = new URL(url);
      const kmlData = {
        name: urlObj.pathname.split("/").pop() || url,
        url: urlObj.toString(),
      };
      onLoadKmlToMap(kmlData);
      setLoadedKml(kmlData);
    } catch (error: any) {
      setApiError(error.message || "Unknown error");
    }
  };

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    switch (mode) {
      case "url":
        handleUrlLoad();
        break;
      case "file":
        await handleFileUpload();
        break;
      default:
        break;
    }
  };

  // Unload KML handler
  const handleUnload = () => {
    setApiRequest(null);
    setLoadedKml(null);
    setApiError(null);
    onLoadKmlToMap();
  };

  function renderApiErrors() {
    if (!apiError) return null;

    return (
      <div className="mt-2">
        <label className="block text-xs font-medium text-red-500 text-bold mb-1">
          Request errors:
        </label>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-64 json-prism-preview">
          <CopyableCodeBlock value={JSON.stringify(apiError, null, 2)} />
        </pre>
      </div>
    );
  }

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
              Note: URL must be over `https` and publicly accessible.
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
              onChange={handleFileInput}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-military-50 file:text-military-700 hover:file:bg-military-100"
            ></input>
            <p className="text-xs text-gray-500 mt-1">
              Only KML files are accepted. Uploaded files will be become
              publicly accessible to anyone.
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
        {renderApiErrors()}
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
            <span className="font-medium">Source:</span>{" "}
            {loadedKml.url.startsWith("http") ? "Remote URL" : "Uploaded File"}
          </div>
          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Name:</span> {loadedKml.name}
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
          <button
            className="btn-secondary w-full mt-2"
            onClick={handleUnload}
            type="button"
          >
            Unload KML
          </button>
        </div>
      )}
    </div>
  );
};

export default KMLLoader;
