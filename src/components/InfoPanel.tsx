import React from "react";
import { Info, MapPin, Clock, Compass, Target } from "lucide-react";

interface KMLData {
  name: string;
  content: string;
  points: Array<{
    name: string;
    coordinates: [number, number];
    description?: string;
  }>;
  vectors?: Array<{
    name: string;
    coordinates: Array<[number, number]>; // Array of [lng, lat] points forming a line
    description?: string;
  }>;
}

interface InfoPanelProps {
  kmlData: KMLData;
  onPointClick?: (point: {
    coordinates: [number, number];
    name: string;
  }) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ kmlData, onPointClick }) => {
  // Color palette for markers (same as KMLViewer)
  const getPointColor = (index: number, total: number): string => {
    const hue = (index * 360) / total;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Function to format description by removing HTML tags and extracting key information
  const formatDescription = (description: string | undefined): string => {
    if (!description) return "—";

    // Remove HTML tags and extract meaningful information
    const cleanText = description
      .replace(/<[^>]*>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    // Extract direction and length if present
    const directionMatch = cleanText.match(/Direction[:\s]*([^,\s]+)/i);
    const lengthMatch = cleanText.match(/Length[:\s]*([^,\s]+)/i);

    const parts = [];
    if (directionMatch) {
      parts.push(`Dir: ${directionMatch[1]}`);
    }
    if (lengthMatch) {
      parts.push(`Len: ${lengthMatch[1]}`);
    }

    return parts.length > 0
      ? parts.join(", ")
      : cleanText.substring(0, 50) + (cleanText.length > 50 ? "..." : "");
  };

  const handleRowClick = (point: {
    coordinates: [number, number];
    name: string;
  }) => {
    if (onPointClick) {
      onPointClick(point);
    }
  };
  // Calculate some statistics
  const totalPoints = kmlData.points.length;
  const totalVectors = kmlData.vectors?.length || 0;
  
  // Calculate bounds including both points and vectors
  let allCoordinates = [...kmlData.points.map(p => p.coordinates)];
  if (kmlData.vectors) {
    kmlData.vectors.forEach(vector => {
      allCoordinates = [...allCoordinates, ...vector.coordinates];
    });
  }
  
  const bounds = allCoordinates.reduce(
    (acc, coord) => ({
      minLat: Math.min(acc.minLat, coord[1]),
      maxLat: Math.max(acc.maxLat, coord[1]),
      minLng: Math.min(acc.minLng, coord[0]),
      maxLng: Math.max(acc.maxLng, coord[0]),
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    }
  );

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Info className="w-5 h-5 text-military-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">
          Pattern Analysis
        </h2>
      </div>

      {/* Statistics Grid - Mobile responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 text-military-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">
              Total Points
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {totalPoints}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Compass className="w-4 h-4 text-military-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">
              Area Coverage
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <div>Lat: {(bounds.maxLat - bounds.minLat).toFixed(4)}°</div>
            <div>Lng: {(bounds.maxLng - bounds.minLng).toFixed(4)}°</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-military-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">
              Center Point
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <div>{((bounds.maxLat + bounds.minLat) / 2).toFixed(6)}</div>
            <div>{((bounds.maxLng + bounds.minLng) / 2).toFixed(6)}</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Info className="w-4 h-4 text-military-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">
              File Format
            </span>
          </div>
          <span className="text-lg font-semibold text-gray-800">KML</span>
        </div>
      </div>

      {/* Legend */}
      {kmlData && kmlData.points.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 text-military-600 mr-2" />
            Target Legend
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {kmlData.points.map((point, index) => (
              <div
                key={index}
                onClick={() => onPointClick && onPointClick(point)}
                className="flex items-center p-2 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              >
                <div
                  className="w-4 h-4 rounded-full mr-2 border border-white/50 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: getPointColor(
                      index,
                      kmlData.points.length
                    ),
                  }}
                ></div>
                <span className="text-gray-700 text-sm font-medium truncate">
                  {point.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points Table - Responsive with horizontal scroll on mobile */}
      <div className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Sweep Points</h3>
          <div className="text-sm text-gray-500 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Click row to center map
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Point Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latitude
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Longitude
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kmlData.points.slice(0, 50).map((point, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                  onClick={() => handleRowClick(point)}
                  title="Click to center map on this point"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 relative">
                    {index + 1}
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-3 h-3 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-mono font-semibold">
                    {point.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {point.coordinates[1].toFixed(6)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {point.coordinates[0].toFixed(6)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate" title={point.description || "—"}>
                      {formatDescription(point.description)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {kmlData.points.length > 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing first 50 of {kmlData.points.length} points
            </p>
            <button className="btn-secondary mt-2">View All Points</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
