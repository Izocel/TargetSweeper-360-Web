import { Compass, Info } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import React, { useEffect, useState } from "react";
import {
  LabelFormat,
  LabelFormatter,
  PutProjectRequest,
  SweeperConfigs,
  Target,
} from "targetsweeper-360";
import { T360Api } from "../api";
import CopyableCodeBlock from "./CopyableCodeBlock";

export interface KmlData {
  name: string;
  url: string;
}

const LabelFormatOptions = Object.entries(LabelFormat).map(([key, value]) => {
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
});

interface SweeperProjectGeneratorProps {
  onLoadKmlToMap: (data?: KmlData) => void;
  positionHandler: () => GeolocationCoordinates | undefined;
}

const SweeperProjectGenerator: React.FC<SweeperProjectGeneratorProps> = ({
  onLoadKmlToMap,
  positionHandler,
}) => {
  const [requestData, setRequestData] = useState<PutProjectRequest["data"]>({
    name: "",
    labelFormat: LabelFormat.SIMPLE,
    target: new Target(0, 0, ""),
    sweeperConfigs: new SweeperConfigs(10, 500, 300),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<any>(null);
  const [apiResult, setApiResult] = useState<null | {
    projectName: string;
    files: { path: string; content: string }[];
    summary: {
      target: string;
      maxRadius: number;
      stepSize: string;
      totalPoints: number;
      labelFormat: LabelFormat;
    };
  }>(null);

  useEffect(() => {
    // Highlight JSON preview after each render
    Prism.highlightAll();
  });

  const updateRequestData = (
    partialRequest: Partial<PutProjectRequest["data"]>
  ) => {
    const values = Object.assign(requestData ?? {}, partialRequest);
    setRequestData({ ...(values as any) });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    setApiError(null);
    setApiResult(null);
    setIsSubmitting(true);

    try {
      const apiRequest = new PutProjectRequest(requestData as any);
      if (!apiRequest?.isValid) {
        throw {
          response: { data: apiRequest },
        };
      }

      const response = await T360Api.Projects.put(apiRequest);
      setApiResult(response.data);
    } catch (error: any) {
      setApiError(error.response?.data?.errors ?? error);
    }

    setIsSubmitting(false);
  };

  const handleUseCurrentPosition = async () => {
    const pos = positionHandler();
    if (pos) {
      updateRequestData({
        target: {
          ...requestData!.target,
          latitude: pos.latitude,
          longitude: pos.longitude,
        },
      });
    }
  };

  function renderNameSection() {
    return (
      <div className="w-1/2 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <input
          type="text"
          placeholder="Enter project name"
          value={requestData?.name || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          onChange={(e) => updateRequestData({ name: e.target.value })}
        />
        <div className="text-xs text-gray-500 mt-1">
          A name for your sweep project (e.g., "Training Alpha").
        </div>
      </div>
    );
  }

  function renderTargetSections() {
    const target = requestData?.target!;

    return (
      <div>
        <div className="w-1/2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Name
          </label>
          <input
            type="text"
            placeholder="Enter target name"
            value={requestData?.target?.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) =>
              updateRequestData({ target: { ...target, name: e.target.value } })
            }
          />
          <div className="text-xs text-gray-500 mt-1">
            A label for the main target (e.g., "Alpha Point").
          </div>
        </div>

        <div className="w-1/2 mb-4">
          <label className="flex text-sm font-medium text-gray-700 mb-1">
            Target Coordinates (Latitude, Longitude)
            <Compass
              className="ml-2 h-5 w-5"
              onClick={handleUseCurrentPosition}
            />
          </label>
          <div className="relative flex">
            <input
              required
              min={-90.0}
              max={90.0}
              step="any"
              type="number"
              aria-label="Latitude"
              placeholder="e.g. 37.7749"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
              value={target.latitude}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                updateRequestData({
                  target: {
                    ...target,
                    latitude: isNaN(value) ? e.target.value : value,
                  },
                });
              }}
            />
            <input
              required
              min={-180}
              max={180}
              step="any"
              type="number"
              aria-label="Longitude"
              placeholder="e.g. -122.4194"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
              value={target.longitude}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                updateRequestData({
                  target: {
                    ...target,
                    longitude: isNaN(value) ? e.target.value : value,
                  },
                });
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press the compass icon to use current location.
          </div>
        </div>
      </div>
    );
  }

  function renderLabelFormatSection() {
    return (
      <div className="w-1/2 mb-4">
        <label
          htmlFor="label-format-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Label Format
        </label>
        <select
          id="label-format-select"
          name="label-format-select"
          title="Label Format"
          aria-label="Label Format"
          value={requestData?.labelFormat}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          onChange={(e) =>
            updateRequestData({ labelFormat: e.target.value as LabelFormat })
          }
        >
          {LabelFormatOptions}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          Choose how sweep point labels are formatted.
        </div>
      </div>
    );
  }

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

  function renderApiResults() {
    if (!apiResult) return null;

    const { projectName, summary, files } = apiResult;
    const kmlData = {
      name: projectName,
      url: `${import.meta.env.VITE_API_URL}/api/projects?name=${projectName}`,
    };

    const fileButtons = files.map((file, index) => {
      const extension = file.path.split(".").pop();
      const link = document.createElement("a");
      link.setAttribute("target", "_blank");
      link.setAttribute("href", `${kmlData.url}&type=${extension}`);
      document.body.appendChild(link);

      return (
        <button
          key={index}
          type="button"
          className="btn-primary mr-2 mb-2"
          onClick={() => {
            link.click();
            link.remove();
          }}
        >
          Download {extension}
        </button>
      );
    });

    return (
      <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
        <div className="font-semibold text-green-700 m-1">Success:</div>
        <button
          type="button"
          className="btn-primary w-full max-w-lg"
          onClick={() => onLoadKmlToMap(kmlData)}
        >
          Load into Map 🎯
        </button>
        <div className="row mt-4 mb-4">{fileButtons}</div>

        <div className="mt-2">
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-64 json-prism-preview">
            <CopyableCodeBlock
              value={JSON.stringify({ ...kmlData, summary }, null, 2)}
            />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <Info className="w-5 h-5 text-military-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">
          Configure your project
        </h2>
      </div>
      <form onSubmit={handleSubmit}>
        {renderNameSection()}
        {renderLabelFormatSection()}
        <div className="border-b border-gray-200 my-4" />

        {renderTargetSections()}

        <div className="w-1/2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mt-1">
              Radius Step (meters)
            </label>
            <input
              min={1}
              step={1}
              type="number"
              placeholder="e.g. 10"
              max={requestData?.sweeperConfigs.maxRadius}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={requestData?.sweeperConfigs.radiusStep}
              onChange={(e) =>
                updateRequestData({
                  sweeperConfigs: {
                    ...requestData!.sweeperConfigs,
                    radiusStep: parseInt(e.target.value),
                  },
                })
              }
            />
            <div className="text-xs text-gray-500 mt-1">
              Distance between each sweep ring (meters).
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mt-1">
                Max Radius (meters)
              </label>
              <input
                step={1}
                type="number"
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min={requestData?.sweeperConfigs.radiusStep}
                value={requestData?.sweeperConfigs.maxRadius}
                onChange={(e) =>
                  updateRequestData({
                    sweeperConfigs: {
                      ...requestData!.sweeperConfigs,
                      maxRadius: parseInt(e.target.value),
                    },
                  })
                }
              />
              <div className="text-xs text-gray-500 mt-1">
                Maximum sweep radius from the target (meters).
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mt-1">
                Angle Step (MOA)
              </label>
              <input
                min={1}
                step={1}
                type="number"
                placeholder="e.g. 300"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={requestData?.sweeperConfigs.angleStepMOA}
                onChange={(e) =>
                  updateRequestData({
                    sweeperConfigs: {
                      ...requestData!.sweeperConfigs,
                      angleStepMOA: parseInt(e.target.value),
                    },
                  })
                }
              />
              <div className="text-xs text-gray-500 mt-1">
                Angular step between sweep points (in MOA, 1 degree = 60 MOA).
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1 text-bold">
            Preview:
          </label>
          <CopyableCodeBlock value={JSON.stringify(requestData, null, 2)} />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate ⚙️"}
          </button>
          {renderApiErrors()}
          {renderApiResults()}
        </div>
      </form>
    </div>
  );
};

export default SweeperProjectGenerator;
