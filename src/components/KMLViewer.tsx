import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Loader as LoaderIcon } from "lucide-react";
import { AlternativeMapLoader } from "../utils/MapLoader";
import "./KMLViewer.css";

interface KMLData {
  name: string;
  url: string; // Direct URL to the KML file
}

interface KMLViewerProps {
  kmlData: KMLData | null;
  onMapReady?: (centerFunction: (lat: number, lng: number) => void) => void;
  initialPosition?: { lat: number; lng: number } | null;
}

const KMLViewer: React.FC<KMLViewerProps> = ({
  kmlData,
  onMapReady,
  initialPosition,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kmlLayerRef = useRef<google.maps.KmlLayer | null>(null);
  const currentLocationMarkerRef = useRef<
    google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null
  >(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if API key is available
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;
        console.log("API Key check:", apiKey ? "Found" : "Missing");

        if (!apiKey) {
          throw new Error(
            "Google Maps API key not found. Please check your environment variables."
          );
        }

        // Test if we can reach Google Maps API
        console.log("Testing API endpoint...");

        // Try the alternative loader first
        try {
          const alternativeLoader = new AlternativeMapLoader(apiKey);
          await alternativeLoader.loadGoogleMapsAPI();
        } catch (altError) {
          console.warn(
            "Alternative loader failed, trying @googlemaps/js-api-loader:",
            altError
          );

          try {
            // Check if Google Maps is already partially loaded (to avoid loading geometry twice)
            if (window.google && window.google.maps && window.google.maps.Map) {
              console.log(
                "Google Maps already loaded, skipping standard loader"
              );
            } else {
              // Fallback to the standard loader
              const loader = new Loader({
                apiKey: apiKey,
                version: "weekly",
                libraries: ["geometry", "marker"],
              });

              await loader.load();
            }
          } catch (loaderError) {
            console.warn(
              "Standard loader failed, trying direct script injection:",
              loaderError
            );

            // Final fallback: direct script injection (only if Google Maps isn't loaded yet)
            if (
              !window.google ||
              !window.google.maps ||
              !window.google.maps.Map
            ) {
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker&loading=async`;
                script.async = true;
                script.defer = true;

                script.onload = () => {
                  // Poll for availability
                  const checkAvailable = () => {
                    if (
                      window.google &&
                      window.google.maps &&
                      window.google.maps.Map
                    ) {
                      resolve();
                    } else {
                      setTimeout(checkAvailable, 100);
                    }
                  };
                  checkAvailable();
                };

                script.onerror = () =>
                  reject(new Error("Direct script injection failed"));

                document.head.appendChild(script);

                setTimeout(
                  () => reject(new Error("Script loading timeout")),
                  20000
                );
              });
            } else {
              console.log(
                "Google Maps already loaded, skipping direct script injection"
              );
            }
          }
        }

        console.log("Google Maps API loaded successfully");

        if (mapRef.current) {
          // Use initialPosition if available, otherwise default to San Francisco
          const defaultCenter = initialPosition || {
            lat: 37.7749,
            lng: -122.4194,
          };

          console.log("Creating map with center:", defaultCenter);

          const mapInstance = new google.maps.Map(mapRef.current, {
            zoom: initialPosition ? 15 : 10, // Zoom closer if we have user's position
            center: defaultCenter,
            mapTypeId: google.maps.MapTypeId?.ROADMAP || "roadmap", // Changed to default ROADMAP
            // Enable built-in Google Maps controls
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true,
            // Removed custom styles array to use default Google Maps styling
          });

          console.log("Map created successfully:", mapInstance);
          setMap(mapInstance);

          // Set loading to false immediately after map creation
          setIsLoading(false);

          // If we have an initial position, center on it and add a marker
          if (initialPosition) {
            console.log("Centering map on initial position:", initialPosition);
            mapInstance.setCenter(initialPosition);
            mapInstance.setZoom(15);

            // Add marker for current location
            console.log("Adding marker for initial position:", initialPosition);
            // Use AdvancedMarkerElement if available (recommended), fallback to Marker
            if (
              google.maps.marker &&
              google.maps.marker.AdvancedMarkerElement
            ) {
              currentLocationMarkerRef.current =
                new google.maps.marker.AdvancedMarkerElement({
                  position: initialPosition,
                  map: mapInstance,
                  title: "Your Current Location",
                });
            } else {
              // Fallback to deprecated Marker (suppress console warning)
              const originalConsoleWarn = console.warn;
              console.warn = () => {}; // Temporarily suppress warnings

              currentLocationMarkerRef.current = new google.maps.Marker({
                position: initialPosition,
                map: mapInstance,
                title: "Your Current Location",
                icon: {
                  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v6l4 2'/%3E%3C/svg%3E",
                  scaledSize: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(15, 15),
                },
              });

              console.warn = originalConsoleWarn; // Restore console.warn
            }
            console.log("Marker added successfully");
          }
        } else {
          console.error("Map container ref is null");
          throw new Error("Map container not found");
        }
      } catch (err) {
        console.error("Error initializing Google Maps:", err);

        let errorMessage = "Failed to load Google Maps.";

        if (err instanceof Error) {
          if (err.message.includes("API key")) {
            errorMessage =
              "Invalid Google Maps API key. Please check your API key configuration.";
          } else if (err.message.includes("RefererNotAllowedMapError")) {
            errorMessage =
              "Domain not allowed. Please add your domain to the API key restrictions.";
          } else if (err.message.includes("ApiNotActivatedMapError")) {
            errorMessage =
              "Maps JavaScript API not activated. Please enable it in Google Cloud Console.";
          } else if (err.message.includes("QuotaExceededError")) {
            errorMessage =
              "API quota exceeded. Please check your billing and usage limits.";
          } else if (
            err.message.includes("network") ||
            err.message.includes("blocked")
          ) {
            errorMessage =
              "Network request blocked. Please disable ad blockers or check firewall settings.";
          } else {
            errorMessage = `Google Maps error: ${err.message}`;
          }
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, []); // Only initialize once, don't re-initialize on position changes

  // Load KML when map or KML data changes
  useEffect(() => {
    if (!map) return;

    // Always provide center function to parent when map is ready
    if (onMapReady && map) {
      onMapReady((lat: number, lng: number) => {
        // More strict validation to prevent invalid coordinates
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
          map.setCenter({ lat, lng });
          map.setZoom(15);
        } else {
          console.warn("Invalid coordinates provided to center function:", {
            lat,
            lng,
            latType: typeof lat,
            lngType: typeof lng,
          });
        }
      });
    }

    // If no KML data, just show the map without KML layer
    if (!kmlData || !kmlData.url) {
      console.log("No KML data, map ready for display");
      // Don't set loading to false here since it should already be false from map init
      return;
    }

    // Clear existing KML layer
    if (kmlLayerRef.current) {
      if (kmlLayerRef.current.setMap) {
        kmlLayerRef.current.setMap(null);
      }
      kmlLayerRef.current = null;
    }

    try {
      console.log(
        "Loading KML directly from URL (preserves all KML configurations)..."
      );

      // Load KML directly from URL - let Google Maps handle everything
      const kmlLayer = new google.maps.KmlLayer({
        url: kmlData.url,
        map: map,
        preserveViewport: false,
        suppressInfoWindows: false,
      });

      kmlLayerRef.current = kmlLayer;

      // Listen for KML layer events
      kmlLayer.addListener("status_changed", () => {
        const status = kmlLayer.getStatus();
        console.log("KML Layer status:", status);

        if (status === "OK") {
          console.log(
            "KML loaded successfully with all original configurations!"
          );
          setIsLoading(false);

          // Auto-fit to KML bounds
          const bounds = kmlLayer.getDefaultViewport();
          if (bounds) {
            map.fitBounds(bounds);
          }
        } else {
          console.error("KML Layer failed with status:", status);
          setError(
            `Unable to load KML file. Google Maps KML Layer status: ${status}`
          );
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Error loading KML:", error);
      setError(
        "Failed to load KML file: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setIsLoading(false);
    }
  }, [map, kmlData, onMapReady]);

  // Update map center when initial position changes (separate from map initialization)
  useEffect(() => {
    if (map && initialPosition && !kmlData) {
      map.setCenter(initialPosition);
      map.setZoom(15);

      // Clear existing current location marker
      if (currentLocationMarkerRef.current) {
        try {
          if ("setMap" in currentLocationMarkerRef.current) {
            // It's a regular Marker
            (currentLocationMarkerRef.current as google.maps.Marker).setMap(
              null
            );
          } else if ("map" in currentLocationMarkerRef.current) {
            // It's an AdvancedMarkerElement
            (currentLocationMarkerRef.current as any).map = null;
          }
        } catch (error) {
          console.warn("Error clearing marker:", error);
        }
        currentLocationMarkerRef.current = null;
      }

      // Add new marker for the updated position
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        currentLocationMarkerRef.current =
          new google.maps.marker.AdvancedMarkerElement({
            position: initialPosition,
            map: map,
            title: "Your Current Location",
          });
      } else {
        const originalConsoleWarn = console.warn;
        console.warn = () => {}; // Temporarily suppress warnings

        currentLocationMarkerRef.current = new google.maps.Marker({
          position: initialPosition,
          map: map,
          title: "Your Current Location",
          icon: {
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v6l4 2'/%3E%3C/svg%3E",
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15),
          },
        });

        console.warn = originalConsoleWarn; // Restore console.warn
      }
    }
  }, [map, initialPosition, kmlData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (kmlLayerRef.current) {
        kmlLayerRef.current.setMap(null);
      }
      if (currentLocationMarkerRef.current) {
        try {
          if ("setMap" in currentLocationMarkerRef.current) {
            (currentLocationMarkerRef.current as google.maps.Marker).setMap(
              null
            );
          } else if ("map" in currentLocationMarkerRef.current) {
            (currentLocationMarkerRef.current as any).map = null;
          }
        } catch (error) {
          console.warn("Error cleaning up marker:", error);
        }
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col h-full bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="text-center max-w-md mx-auto mb-6">
          <p className="font-semibold mb-2">Error loading map</p>
          <p className="text-sm mb-4">{error}</p>

          {/* Debug information */}
          <div className="text-xs bg-white p-3 rounded border text-left mb-4">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>
              API Key:{" "}
              {import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY
                ? "✓ Found"
                : "✗ Missing"}
            </p>
            <p>Environment: {import.meta.env.MODE}</p>
            <p>URL: {window.location.href}</p>
          </div>

          <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded">
            <p>
              💡 <strong>Common Solutions:</strong>
            </p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Disable ad blockers</li>
              <li>• Check API key restrictions in Google Cloud Console</li>
              <li>• Ensure Maps JavaScript API is enabled</li>
              <li>• Verify billing account is active</li>
            </ul>
          </div>
        </div>

        {/* Fallback coordinate display */}
        <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-center">
            📍 KML Loading Failed
          </h3>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              The KML file could not be loaded from the provided URL.
            </p>
            <p className="text-xs text-gray-500">
              Try accessing the KML URL directly in your browser to verify it's
              accessible
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono break-all">
              {kmlData
                ? `${kmlData.name}: ${kmlData.url}`
                : "No KML data provided"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {isLoading && kmlData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <LoaderIcon className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading KML...</p>
          </div>
        </div>
      )}
      {isLoading && !kmlData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <LoaderIcon className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading Map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-lg" />
    </div>
  );
};

export default KMLViewer;
