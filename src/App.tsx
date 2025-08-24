import { MapPin, Settings, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import KMLLoader from "./components/KMLLoader";
import KMLViewer from "./components/KMLViewer";
import SweeperProjectGenerator from "./components/SweeperProjectGenerator";

type KMLData = {
  name: string;
  url: string;
};

function App(props: any) {
  // Tab state for loader/generator/uploader
  const [tab, setTab] = useState<"kml" | "json">("kml");
  const [kmlData, setKMLData] = useState<KMLData | undefined>();
  // Accept externalKmlUrl from props for loading generated KML
  const externalKmlUrl = props.externalKmlUrl;
  const [mapCenterCallback] = useState<
    ((lat: number, lng: number) => void) | null
  >(null);
  const [userPosition, setUserPosition] = useState<
    | {
        lat: number;
        lng: number;
      }
    | undefined
  >();
  const [_positionAccuracy, setPositionAccuracy] = useState<number | null>(
    null
  );
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
    // Check if Permissions T360Api is supported
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return permission.state === "granted" || permission.state === "prompt";
      } catch (error) {
        console.log(
          "Permissions T360Api not fully supported, proceeding with geolocation request"
        );
        return true; // Fallback to attempting geolocation directly
      }
    }
    return true; // If Permissions T360Api not supported, proceed with geolocation
  };

  // Do not set userPosition on page load; wait for user action

  // Helper to load a KML URL into the map
  const handleLoadKmlToMap = (url: string) => {
    setKMLData({ name: "Generated KML", url });
    // Optionally, switch to the map tab if needed
    setTab("kml");
  };

  // If externalKmlUrl changes, load it into the map
  useEffect(() => {
    if (externalKmlUrl) {
      handleLoadKmlToMap(externalKmlUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalKmlUrl]);

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
          <div className="card">
            {/* Tab Switcher */}
            <div className="flex border-b mb-4">
              <button
                type="button"
                className={`px-4 py-2 font-medium focus:outline-none border-b-2 transition-colors duration-200 ${
                  tab === "kml"
                    ? "border-military-600 text-military-700"
                    : "border-transparent text-gray-500 hover:text-military-600"
                }`}
                onClick={() => setTab("kml")}
              >
                KML Loader
              </button>
              <button
                type="button"
                className={`px-4 py-2 font-medium focus:outline-none border-b-2 transition-colors duration-200 ${
                  tab === "json"
                    ? "border-military-600 text-military-700"
                    : "border-transparent text-gray-500 hover:text-military-600"
                }`}
                onClick={() => setTab("json")}
              >
                Sweeper KML Generator
              </button>
            </div>

            {/* Tab Content */}
            {tab === "kml" && (
              <KMLLoader
                onLoad={(kmlData) => {
                  if (!kmlData) {
                    setKMLData(undefined);
                    return;
                  }
                  setKMLData({
                    ...kmlData,
                    url: kmlData.url + "?t=" + Date.now(),
                  });
                  setUserPosition(undefined); // Reset myPosition so map doesn't recenter after KML load
                }}
                defaultUrl={import.meta.env.VITE_DEFAULT_KML_URL}
              />
            )}
            {tab === "json" &&
              (props.SweeperProjectGeneratorComponent ? (
                props.SweeperProjectGeneratorComponent({})
              ) : (
                <SweeperProjectGenerator onLoadKmlToMap={handleLoadKmlToMap} />
              ))}
          </div>
        </section>

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

                  // Use posiotn directly - this MUST be called synchronously from user gesture
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      const accuracy = position.coords.accuracy;

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
                        setUserPosition(undefined);
                        setTimeout(() => setUserPosition({ lat, lng }), 0);
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
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-military-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Viewer</h2>
            </div>

            <div className="map-container">
              <KMLViewer kmlData={kmlData} userPosition={userPosition} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Patch: pass loadKmlUrl to App for map loading
export default App;
