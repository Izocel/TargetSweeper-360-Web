import { useState, useEffect } from "react";
import { Target, MapPin, Upload, Settings, Info } from "lucide-react";
import KMLViewer from "./components/KMLViewer";
import Header from "./components/Header";

interface KMLData {
  name: string;
  url: string; // Direct URL to the KML file
}

function App() {
  const [kmlData, setKMLData] = useState<KMLData | null>(null);
  const [mapCenterCallback, setMapCenterCallback] = useState<
    ((lat: number, lng: number) => void) | null
  >(null);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [positionAccuracy, setPositionAccuracy] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Function to check and request geolocation permission
  const requestGeolocationPermission = async (): Promise<boolean> => {
    // Check if Permissions API is supported
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        console.log("Current geolocation permission:", permission.state);
        return permission.state === "granted" || permission.state === "prompt";
      } catch (error) {
        console.log(
          "Permissions API not fully supported, proceeding with geolocation request"
        );
        return true; // Fallback to attempting geolocation directly
      }
    }
    return true; // If Permissions API not supported, proceed with geolocation
  };


  // Set default position on page load (don't automatically request geolocation)
  useEffect(() => {
    // Set default position immediately to avoid loading issues
    // Don't request geolocation automatically - this prevents permission prompt on mobile
    setCurrentPosition({ lat: 37.7749, lng: -122.4194 });
  }, []);

  const handleLoadFromURL = async (url: string) => {
    try {
      // Simple URL validation
      new URL(url); // This will throw if URL is invalid

      const kmlData: KMLData = {
        name: `KML from URL`,
        url: url,
      };

      setKMLData(kmlData);
    } catch (error) {
      setNotification({
        message: `Invalid URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : notification.type === "error"
                ? "bg-red-100 border border-red-400 text-red-700"
                : "bg-blue-100 border border-blue-400 text-blue-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {notification.type === "success" && (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {notification.type === "error" && (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {notification.type === "info" && (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium">
                  {notification.message}
                </span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Close notification"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* KML Management Section - Full Width Horizontal Layout */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KML Loader Card */}
            <div className="card">
              <div className="flex items-center mb-4">
                <Upload className="w-5 h-5 text-military-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Load KML File
                </h2>
              </div>

              {/* URL Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const url = formData.get("kml-url") as string;
                  if (url.trim()) {
                    // Store the form reference before async operation
                    const form = e.currentTarget;
                    await handleLoadFromURL(url.trim());
                    // Reset the form with null check
                    if (form && typeof form.reset === "function") {
                      form.reset();
                    }
                  }
                }}
                className="space-y-4"
              >
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
                    defaultValue={import.meta.env.VITE_DEFAULT_KML_URL}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Load KML from URL
                </button>
                <p className="text-xs text-gray-500">
                  Note: URL must be publicly accessible. Google Maps KmlLayer
                  preserves all original styling and features.
                </p>
              </form>
            </div>

            {/* Project Info Card */}
            <div className="card">
              <div className="flex items-center mb-4">
                <Info className="w-5 h-5 text-military-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Project Info
                </h2>
              </div>
              {kmlData ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-800">{kmlData.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">URL:</span>
                    <span className="ml-2 text-gray-800 break-all text-xs">
                      {kmlData.url}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Load a KML file to view project details
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Map Viewer - Full width */}
        <section className="mb-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-military-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Viewer</h2>
            </div>

            {/* Always show the map, with or without KML data */}
            <div className="map-container">
              <KMLViewer
                kmlData={kmlData}
                onMapReady={setMapCenterCallback}
                initialPosition={currentPosition}
              />
            </div>
          </div>
        </section>

        {/* View Controls - Full Width Under Map */}
        <section className="mb-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-military-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                View Controls
              </h2>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <button
                className="btn-primary flex items-center justify-center px-6"
                onClick={async (event) => {
                  if (!navigator.geolocation) {
                    setNotification({
                      message: "Geolocation is not supported by this browser.",
                      type: "error",
                    });
                    return;
                  }

                  // Check permissions first
                  const canUseLocation = await requestGeolocationPermission();
                  if (!canUseLocation) {
                    setNotification({
                      message:
                        "Location permissions are required. Please enable them in your browser settings.",
                      type: "error",
                    });
                    return;
                  }

                  // Show loading state immediately
                  const button = event.currentTarget as HTMLButtonElement;
                  const originalText = button?.innerHTML;
                  if (button) {
                    button.innerHTML =
                      '<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Getting location...';
                    button.disabled = true;
                  }

                  console.log("Requesting geolocation...");

                  // Use getCurrentPosition directly - this MUST be called synchronously from user gesture
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      const accuracy = position.coords.accuracy;

                      console.log("Location obtained:", { lat, lng, accuracy });

                      // Validate coordinates
                      if (
                        typeof lat === "number" &&
                        typeof lng === "number" &&
                        !isNaN(lat) &&
                        !isNaN(lng) &&
                        lat >= -90 &&
                        lat <= 90 &&
                        lng >= -180 &&
                        lng <= 180
                      ) {
                        // Update current position state
                        setCurrentPosition({ lat, lng });
                        setPositionAccuracy(accuracy);

                        // Center map on current position
                        if (mapCenterCallback) {
                          mapCenterCallback(lat, lng);
                        }

                        // Show success message with accuracy
                        if (accuracy < 10) {
                          setNotification({
                            message: `High accuracy location: ±${Math.round(
                              accuracy
                            )}m`,
                            type: "success",
                          });
                        } else if (accuracy < 50) {
                          setNotification({
                            message: `Good accuracy location: ±${Math.round(
                              accuracy
                            )}m`,
                            type: "success",
                          });
                        } else {
                          setNotification({
                            message: `Location found: ±${Math.round(
                              accuracy
                            )}m accuracy`,
                            type: "info",
                          });
                        }
                      } else {
                        setNotification({
                          message: "Invalid location coordinates received.",
                          type: "error",
                        });
                      }

                      // Restore button
                      if (button && originalText) {
                        button.innerHTML = originalText;
                        button.disabled = false;
                      }
                    },
                    (error) => {
                      console.error("Geolocation error:", error);
                      let errorMessage = "Location access failed. ";

                      switch (error.code) {
                        case error.PERMISSION_DENIED:
                          errorMessage =
                            "Location access denied. Please allow location access in your browser and try again.";
                          break;
                        case error.POSITION_UNAVAILABLE:
                          errorMessage =
                            "Location unavailable. Please check your GPS/location settings.";
                          break;
                        case error.TIMEOUT:
                          errorMessage =
                            "Location request timed out. Please try again.";
                          break;
                        default:
                          errorMessage += "Please try again.";
                          break;
                      }

                      setNotification({
                        message: errorMessage,
                        type: "error",
                      });

                      // Restore button
                      if (button && originalText) {
                        button.innerHTML = originalText;
                        button.disabled = false;
                      }
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 30000, // Longer timeout for mobile
                      maximumAge: 0, // Always get fresh location
                    }
                  );
                }}
                title="Get your current location and center the map on it"
              >
                <MapPin className="w-4 h-4 mr-2" />
                My Position
              </button>

              {/* Position accuracy display */}
              {currentPosition && positionAccuracy && (
                <div className="text-xs text-gray-500 text-center">
                  <div>Lat: {currentPosition.lat.toFixed(6)}</div>
                  <div>Lng: {currentPosition.lng.toFixed(6)}</div>
                  <div>Accuracy: ±{Math.round(positionAccuracy)}m</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Note: InfoPanel removed since we're letting Google Maps handle KML parsing */}
      </main>
    </div>
  );
}

export default App;
