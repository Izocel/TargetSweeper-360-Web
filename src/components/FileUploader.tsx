import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Loader } from "lucide-react";

interface KMLData {
  name: string;
  content: string;
  points: Array<{
    name: string;
    coordinates: [number, number];
    description?: string;
  }>;
}

interface FileUploaderProps {
  onKMLLoad: (data: KMLData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onKMLLoad }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const parseKML = useCallback(
    (content: string, fileName: string): KMLData | null => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "application/xml");

        // Check for parsing errors
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
          throw new Error("Invalid XML format");
        }

        const points: Array<{
          name: string;
          coordinates: [number, number];
          description?: string;
        }> = [];

        // Extract placemarks with coordinates
        const placemarks = doc.querySelectorAll("Placemark");

        placemarks.forEach((placemark) => {
          const name =
            placemark.querySelector("name")?.textContent || "Unnamed Point";
          const description =
            placemark.querySelector("description")?.textContent || "";
          const coordinates = placemark
            .querySelector("coordinates")
            ?.textContent?.trim();

          if (coordinates) {
            // KML coordinates are in format: longitude,latitude,altitude
            const coords = coordinates.split(",");
            if (coords.length >= 2) {
              const lng = parseFloat(coords[0]);
              const lat = parseFloat(coords[1]);

              if (!isNaN(lng) && !isNaN(lat)) {
                points.push({
                  name,
                  coordinates: [lng, lat],
                  description,
                });
              }
            }
          }
        });

        const documentName =
          doc.querySelector("Document > name")?.textContent ||
          fileName.replace(".kml", "").replace(".kmz", "");

        return {
          name: documentName,
          content,
          points,
        };
      } catch (error) {
        console.error("Error parsing KML:", error);
        return null;
      }
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const kmlData = parseKML(content, file.name);
          if (kmlData) {
            onKMLLoad(kmlData);
          } else {
            alert(
              "Error: Could not parse KML file. Please ensure it's a valid KML format."
            );
          }
        }
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
        alert("Error reading file. Please try again.");
      };
      reader.readAsText(file);
    },
    [parseKML, onKMLLoad]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/vnd.google-earth.kml+xml": [".kml"],
        "application/vnd.google-earth.kmz": [".kmz"],
        "text/xml": [".kml"],
      },
      multiple: false,
    });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300
        ${isProcessing ? "pointer-events-none opacity-75" : ""}
        ${
          isDragActive && !isDragReject
            ? "border-military-500 bg-military-50 scale-105"
            : ""
        }
        ${isDragReject ? "border-red-500 bg-red-50" : ""}
        ${
          !isDragActive && !isProcessing
            ? "border-gray-300 hover:border-military-400 hover:bg-gray-50 hover:scale-102"
            : ""
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="space-y-3">
        {isProcessing ? (
          <>
            <Loader className="w-12 h-12 text-military-600 mx-auto animate-spin" />
            <div>
              <p className="text-military-700 font-medium">
                Processing KML file...
              </p>
              <p className="text-sm text-military-600">
                Parsing coordinates and metadata
              </p>
            </div>
          </>
        ) : isDragReject ? (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <p className="text-red-600 font-medium">Invalid file type</p>
              <p className="text-sm text-red-500">
                Please upload a .kml or .kmz file
              </p>
            </div>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="w-12 h-12 text-military-600 mx-auto animate-bounce" />
            <div>
              <p className="text-military-700 font-medium">
                Drop your KML file here
              </p>
              <p className="text-sm text-military-600">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-700 font-medium">
                Drag & drop a KML file here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select from your device
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <span>Supports:</span>
              <span className="bg-gray-100 px-2 py-1 rounded">.kml</span>
              <span className="bg-gray-100 px-2 py-1 rounded">.kmz</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
