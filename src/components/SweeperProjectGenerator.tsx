import { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import { Info, Compass } from "lucide-react";
import { SweepConfiguration } from "targetsweeper-360/";
import { Target as SweeperTarget } from "targetsweeper-360";
import { LabelFormat } from "targetsweeper-360";
import { LabelFormatter } from "targetsweeper-360/dist/constants/enums/LabelFormats";

interface SweeperProjectGeneratorProps {
  onLoadKmlToMap?: (url: string) => void;
}

const SweeperProjectGenerator: React.FC<SweeperProjectGeneratorProps> = ({
  onLoadKmlToMap,
}) => {
  const [projectName, setProjectName] = useState("");
  const [target, setTarget] = useState(() => new SweeperTarget(NaN, NaN, ""));
  const [sweeperConfig, setSweeperConfig] = useState(
    () => new SweepConfiguration(10, 500, 300)
  );
  const [labelFormat, setLabelFormat] = useState<LabelFormat>(
    LabelFormat.SIMPLE
  );
  const [apiResult, setApiResult] = useState<null | {
    kmlUrl: string;
    csvUrl: string;
    kmzUrl: string;
    summary: string;
  }>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const jsonPreviewRef = useRef<HTMLPreElement>(null);

  // Prepare sweep configuration
  const projectJson = {
    ProjectName: projectName,
    Target: {
      name: target.name,
      longitude: target.longitude,
      latitude: target.latitude,
    },
    Sweeper: {
      radiusStep: sweeperConfig.radiusStep,
      maxRadius: sweeperConfig.maxRadius,
      angleStepMOA: sweeperConfig.angleStepMOA,
      format: labelFormat,
    },
  };

  // Prism highlight effect for JSON preview
  useEffect(() => {
    if (jsonPreviewRef.current) {
      const codeEl = jsonPreviewRef.current.querySelector("code");
      if (codeEl) {
        Prism.highlightElement(codeEl);
      }
    }
  }, [projectName, target, sweeperConfig, labelFormat]);

  // Function to send data to backend
  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setApiError(null);
    setApiResult(null);

    // Validation: all fields required
    if (!projectName.trim()) {
      setApiError("Project Name is required.");
      return;
    }
    if (!target.name.trim()) {
      setApiError("Target Name is required.");
      return;
    }
    if (
      isNaN(target.latitude) ||
      isNaN(target.longitude) ||
      target.latitude === null ||
      target.longitude === null ||
      target.latitude === undefined ||
      target.longitude === undefined
    ) {
      setApiError("Target coordinates are required and must be valid numbers.");
      return;
    }
    if (!labelFormat) {
      setApiError("Label Format is required.");
      return;
    }
    if (
      !sweeperConfig.radiusStep ||
      !sweeperConfig.maxRadius ||
      !sweeperConfig.angleStepMOA ||
      isNaN(sweeperConfig.radiusStep) ||
      isNaN(sweeperConfig.maxRadius) ||
      isNaN(sweeperConfig.angleStepMOA)
    ) {
      setApiError(
        "All sweep configuration fields are required and must be valid numbers."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/kml/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectJson),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate KML");
      }
      const data = await response.json();
      setApiResult(data);
    } catch (err: any) {
      setApiError(err.message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <Info className="w-5 h-5 text-military-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">
          Configure your project
        </h2>
      </div>
      <form className="space-y-4" onSubmit={handleGenerate} autoComplete="off">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
          />
          <div className="text-xs text-gray-500 mt-1">
            A name for your sweep project (e.g., "Training Sweep Alpha").
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={target.name}
              onChange={(e) =>
                setTarget(
                  new SweeperTarget(
                    target.longitude,
                    target.latitude,
                    e.target.value
                  )
                )
              }
              placeholder="Enter target name"
            />
            <div className="text-xs text-gray-500 mt-1">
              A label for the main target (e.g., "Alpha Point").
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Coordinates
            </label>
            <div className="relative flex">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                value={
                  isNaN(target.latitude) || isNaN(target.longitude)
                    ? ""
                    : `${target.latitude}, ${target.longitude}`
                }
                onChange={(e) => {
                  const [latStr, lngStr] = e.target.value
                    .split(",")
                    .map((s) => s.trim());
                  const lat =
                    latStr === undefined || latStr === ""
                      ? NaN
                      : parseFloat(latStr);
                  const lng =
                    lngStr === undefined || lngStr === ""
                      ? NaN
                      : parseFloat(lngStr);
                  setTarget(new SweeperTarget(lng, lat, target.name));
                }}
                placeholder="e.g. 37.7749, -122.4194"
                aria-label="Latitude, Longitude"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-military-200 focus:outline-none"
                title="Use current position"
                onClick={async () => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setTarget(
                        new SweeperTarget(
                          pos.coords.longitude,
                          pos.coords.latitude,
                          target.name
                        )
                      );
                    },
                    () => {},
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }}
              >
                <Compass className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Latitude and longitude (comma separated). Click the icon to use
              your current location.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label
              htmlFor="label-format-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Label Format
            </label>
            <select
              id="label-format-select"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={labelFormat}
              onChange={(e) => setLabelFormat(e.target.value as LabelFormat)}
              title="Choose the label format for sweep points"
            >
              {Object.entries(LabelFormat).map(([key, value]) => {
                const example = LabelFormatter.getExamples()[value]?.[0] || "";
                return (
                  <option key={key} value={value}>
                    {key
                      .replace(/_/g, " ")
                      .replace("TACTICAL", "Tactical")
                      .replace("DESCRIPTIVE", "Descriptive")
                      .replace("CLOCK NAVIGATION", "Clock/Navigation")
                      .replace("COMPACT GRID", "Compact Grid")
                      .replace("BEARING RANGE", "Bearing/Range")
                      .replace("SEARCH PATTERN", "Search Pattern")
                      .replace("AVIATION", "Aviation")
                      .replace("SIMPLE", "Simple")}
                    — {example}
                  </option>
                );
              })}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Choose how sweep point labels are formatted. Example shown for
              each style.
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius Step (meters)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={sweeperConfig.radiusStep}
                  min={1}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSweeperConfig(
                      (prev) =>
                        new SweepConfiguration(
                          value,
                          prev.maxRadius,
                          prev.angleStepMOA
                        )
                    );
                  }}
                  placeholder="e.g. 10"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Distance between each sweep ring (meters).
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Radius (meters)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={sweeperConfig.maxRadius}
                  min={sweeperConfig.radiusStep}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSweeperConfig(
                      (prev) =>
                        new SweepConfiguration(
                          prev.radiusStep,
                          value,
                          prev.angleStepMOA
                        )
                    );
                  }}
                  placeholder="e.g. 500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maximum sweep radius from the target (meters).
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Angle Step (MOA)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={sweeperConfig.angleStepMOA}
                  min={1}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSweeperConfig(
                      (prev) =>
                        new SweepConfiguration(
                          prev.radiusStep,
                          prev.maxRadius,
                          value
                        )
                    );
                  }}
                  placeholder="e.g. 300"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Angular step between sweep points (in MOA, 1 degree = 60 MOA).
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <strong>Sweep Summary:</strong> {sweeperConfig.getSummary()}
        </div>
        {/* ...existing code for targets, preview, etc... */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Preview
          </label>
          <pre
            ref={jsonPreviewRef}
            className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-64 json-prism-preview"
          >
            <code className="language-json">
              {JSON.stringify(projectJson, null, 2)}
            </code>
          </pre>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate ⚙️"}
          </button>
          {apiError && (
            <div className="text-red-600 text-xs mt-2">{apiError}</div>
          )}
          {apiResult && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mt-2 text-xs">
              <div className="font-semibold text-green-700 mb-1">
                Files generated:
              </div>
              <ul className="list-disc ml-5">
                <li>
                  <a
                    href={apiResult.kmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    Download KML
                  </a>
                </li>
                <li>
                  <a
                    href={apiResult.csvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    Download CSV
                  </a>
                </li>
                <li>
                  <a
                    href={apiResult.kmzUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    Download KMZ
                  </a>
                </li>
              </ul>
              <button
                className="btn-primary mt-3"
                type="button"
                onClick={() => {
                  if (onLoadKmlToMap) onLoadKmlToMap(apiResult.kmlUrl);
                }}
              >
                Load into Map
              </button>
              {apiResult.summary && (
                <div className="mt-2 text-gray-700">
                  {typeof apiResult.summary === "string" ? (
                    apiResult.summary
                  ) : (
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32">
                      {JSON.stringify(apiResult.summary, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SweeperProjectGenerator;
