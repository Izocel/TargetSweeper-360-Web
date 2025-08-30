import type { Library } from "@googlemaps/js-api-loader";
import {
  GoogleMap,
  KmlLayer,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Loader as LoaderIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import "./KMLViewer.css";

// Google Maps libraries to load (must be static to avoid LoadScript reloads)
const GOOGLE_MAPS_LIBRARIES: Library[] = ["marker"];

interface KMLData {
  name: string;
  url: string;
}

interface KMLViewerProps {
  kmlData?: KMLData;
  userPosition?: GeolocationCoordinates;
}
const KMLViewer: React.FC<KMLViewerProps> = ({ kmlData, userPosition }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [kml, setKml] = useState<google.maps.KmlLayer | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    console.log("Data changed:");
    console.log("KML Data:", kmlData);
    console.log("User Position:", userPosition);

    fitBounds();
  }, [userPosition, kmlData]);

  function fitBounds() {
    if (map && userPosition) {
      const bounds = new window.google.maps.LatLngBounds({
        north: userPosition.latitude + 0.01,
        south: userPosition.latitude - 0.01,
        east: userPosition.longitude + 0.01,
        west: userPosition.longitude - 0.01,
      });
      if (kml && kmlData) {
        const kmlBounds = kml.getDefaultViewport()?.getNorthEast();
        if (kmlBounds) {
          bounds.extend(kmlBounds);
        }
      }

      map.fitBounds(bounds);
    }
  }

  function handleMapLoaded(instance: google.maps.Map) {
    console.log("Map Layer loaded");
    setMap(instance);
    fitBounds();
  }

  function handleKmlLoad(instance: google.maps.KmlLayer) {
    console.log("KML Layer loaded");
    setKml(instance);
    fitBounds();
  }

  function handleKmlStatusChanged() {
    console.log("KML Layer status changed:");
    fitBounds();
  }

  function renderMapLoading() {
    if (isLoaded) return;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
        <div className="text-center">
          <LoaderIcon className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Map...</p>
        </div>
      </div>
    );
  }

  function renderApiError() {
    if (!loadError) return;

    return (
      <div className="flex flex-col h-full bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="text-center max-w-md mx-auto mb-6">
          <p className="font-semibold mb-2">Error loading map</p>
          <p className="text-sm mb-4">{loadError?.message}</p>
        </div>
      </div>
    );
  }

  function renderMap() {
    if (!isLoaded) return;

    return (
      <GoogleMap
        mapContainerClassName="w-full h-full min-h-[500px] rounded-lg"
        onLoad={handleMapLoaded}
      >
        <KmlLayer
          url={kmlData?.url}
          onLoad={handleKmlLoad}
          onStatusChanged={handleKmlStatusChanged}
        />
        {userPosition && (
          <Marker
            position={{
              lat: userPosition.latitude,
              lng: userPosition.longitude,
            }}
          />
        )}
      </GoogleMap>
    );
  }

  function render() {
    return (
      <div className="relative w-full h-full min-h-[500px]">
        {renderApiError()}
        {renderMapLoading()}
        {renderMap()}
      </div>
    );
  }

  return render();
};

export default KMLViewer;
