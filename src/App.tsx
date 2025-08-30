import { MapPin, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import KMLLoader from "./components/KMLLoader";
import KMLViewer from "./components/KMLViewer";
import SweeperProjectGenerator, {
  type KmlData,
} from "./components/SweeperProjectGenerator";

const PositionTrakingOptions: PositionOptions = {
  timeout: 15_000,
  maximumAge: 3_000,
  enableHighAccuracy: true,
};

type KMLData = {
  name: string;
  url: string;
};

function App(props: any) {
  const [tab, setTab] = useState<"kml" | "json">("kml");
  const [kmlData, setKMLData] = useState<KMLData | undefined>();
  const [trackerId, setTrackerId] = useState<number | undefined>();
  const [allowTracking, setAllowTracking] = useState<boolean>(false);

  const [userPosition, setUserPosition] = useState<
    GeolocationCoordinates | undefined
  >();

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setAllowTracking(true);
  }, []);

  useEffect(() => {
    if (!allowTracking) {
      trackerId && navigator?.geolocation?.clearWatch?.(trackerId);
      return;
    }

    setTrackerId(
      navigator.geolocation.watchPosition(
        onPositionUpdateSuccess,
        onPositionUpdateError,
        PositionTrakingOptions
      )
    );
  }, [allowTracking]);

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
    let granted = false;

    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        granted =
          permission.state === "granted" || permission.state === "prompt";
      } catch (error) {
        setNotification({
          message:
            "Permissions not fully supported, proceeding with geolocation request.",
          type: "error",
        });
      }
    }

    if (!granted) {
      setNotification({
        message:
          "Location permissions are required. Please enable them in your browser settings.",
        type: "error",
      });
    }

    if (!navigator.geolocation) {
      setNotification({
        message: "Geolocation is not supported by this browser.",
        type: "error",
      });
      return false;
    }

    return granted;
  };

  const handleLoadKmlToMap = (data?: KmlData) => {
    setKMLData(data);
    setTab("kml");
  };

  const onPositionUpdateSuccess = (position: GeolocationPosition) => {
    setUserPosition(position.coords);
  };

  const onPositionUpdateError = (error: GeolocationPositionError) => {
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
        errorMessage = "Location request timed out. Please try again.";
        break;
      default:
        errorMessage += "Please try again.";
        break;
    }

    setNotification({
      message: errorMessage,
      type: "error",
    });
  };

  const handleTrackingToggle = async () => {
    const canUseLocation = await requestGeolocationPermission();
    if (!canUseLocation) {
      setAllowTracking(false);
      return;
    }

    setAllowTracking(!allowTracking);
  };

  /* Notification Toast */
  function renderNotification() {
    if (!notification) return null;

    return (
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
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function renderMapViewControls() {
    return (
      <section className="mb-6">
        <button
          title="Get your current location and center the map on it"
          className="btn-primary flex items-center justify-center px-6"
          onClick={handleTrackingToggle}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Track My Position
        </button>
      </section>
    );
  }

  function renderMapViewer() {
    return (
      <section className="mb-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-military-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Viewer</h2>
          </div>

          <div>{renderMapViewControls()}</div>
          <div className="map-container">
            <KMLViewer kmlData={kmlData} userPosition={userPosition} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {renderNotification()}

      <main className="container mx-auto px-4 py-8">
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
                KML Loaders
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
                KML Generators
              </button>
            </div>

            {/* Tab Content */}
            {tab === "kml" && (
              <KMLLoader
                onLoadKmlToMap={handleLoadKmlToMap}
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

        {renderMapViewer()}
      </main>
    </div>
  );
}

// Patch: pass loadKmlUrl to App for map loading
export default App;
