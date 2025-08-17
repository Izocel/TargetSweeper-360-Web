import React, { useCallback, useRef, useState, useEffect } from "react";
import { Loader as LoaderIcon } from "lucide-react";
import { GoogleMap, KmlLayer } from "@react-google-maps/api";
import "./KMLViewer.css";

interface KMLData {
  name: string;
  url: string; // Direct URL to the KML file
}

interface KMLViewerProps {
  kmlData: KMLData | null;
  onMapReady?: (centerFunction: (lat: number, lng: number) => void) => void;
  myPosition?: { lat: number; lng: number } | null;
}
const KMLViewer: React.FC<KMLViewerProps> = ({
  kmlData,
  onMapReady,
  // initialPosition removed
  myPosition,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Removed: initialMarkerRef (no initial marker)

  // Default center: San Francisco, but use myPosition if available
  const defaultCenter = myPosition || { lat: 37.7749, lng: -122.4194 };
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  // Use myPosition from props
  const myMarkerRef = useRef<any>(null);

  // Effect for myPosition marker using basic Marker
  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !myPosition) return;
    if (myMarkerRef.current) {
      myMarkerRef.current.setMap(null);
      myMarkerRef.current = null;
    }
    myMarkerRef.current = new window.google.maps.Marker({
      map: map,
      position: myPosition,
      title: "My Position (Live)",
      icon: {
        url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%23e53935" d="M16 2C9.373 2 4 7.373 4 14c0 7.732 10.25 15.25 11.125 15.875a1 1 0 0 0 1.75 0C17.75 29.25 28 21.732 28 14c0-6.627-5.373-12-12-12zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>',
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 32),
      },
    });
    return () => {
      if (myMarkerRef.current) {
        myMarkerRef.current.setMap(null);
        myMarkerRef.current = null;
      }
    };
  }, [map, myPosition]);

  // Geolocation: only request on user gesture

  const handleOnLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      mapRef.current = mapInstance;
      setMap(mapInstance);
      setIsLoading(false);
      if (onMapReady) {
        onMapReady((lat: number, lng: number) => {
          if (
            lat !== null &&
            lng !== null &&
            lat !== undefined &&
            lng !== undefined &&
            typeof lat === "number" &&
            typeof lng === "number" &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          ) {
            mapInstance.setCenter({ lat, lng });
            mapInstance.setZoom(15);
            // Always force roadmap mode when centering on user position
            mapInstance.setMapTypeId("roadmap");
          }
        });
      }
    },
    [onMapReady]
  );

  if (!apiKey) {
    return (
      <div className="flex flex-col h-full bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="text-center max-w-md mx-auto mb-6">
          <p className="font-semibold mb-2">Google Maps API key not found.</p>
          <p className="text-sm mb-4">
            Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="text-center max-w-md mx-auto mb-6">
          <p className="font-semibold mb-2">Error loading map</p>
          <p className="text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <LoaderIcon className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading Map...</p>
          </div>
        </div>
      )}
      <GoogleMap
        mapContainerClassName="w-full h-full min-h-[500px] rounded-lg"
        center={defaultCenter}
        zoom={myPosition ? 15 : 10}
        onLoad={handleOnLoad}
      >
        {/* KML Layer */}
        {kmlData && kmlData.url && (
          <KmlLayer
            key={kmlData.url}
            url={kmlData.url}
            options={{ preserveViewport: false, suppressInfoWindows: false }}
            onStatusChanged={() => setIsLoading(false)}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default KMLViewer;
