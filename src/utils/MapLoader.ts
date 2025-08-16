// Alternative Google Maps loader with better error handling
export class AlternativeMapLoader {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async loadGoogleMapsAPI(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if Google Maps is already loaded and fully available
            if (window.google && window.google.maps && window.google.maps.Map) {
                console.log('Google Maps API already loaded and available');
                resolve();
                return;
            }

            // Check if a Google Maps script is already being loaded
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                console.log('Google Maps script already exists, waiting for it to load...');

                const checkApiAvailable = () => {
                    if (window.google && window.google.maps && window.google.maps.Map) {
                        console.log('Existing Google Maps API became available');
                        resolve();
                    } else {
                        setTimeout(checkApiAvailable, 100);
                    }
                };

                checkApiAvailable();

                // Timeout for existing script
                setTimeout(() => {
                    if (!window.google || !window.google.maps || !window.google.maps.Map) {
                        reject(new Error('Existing Google Maps script failed to load'));
                    }
                }, 15000);

                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=geometry,marker&loading=async`;

            script.onload = () => {
                console.log('Google Maps script loaded, waiting for API to be available...');

                // Wait for the API to be fully available
                const checkApiAvailable = () => {
                    if (window.google && window.google.maps && window.google.maps.Map) {
                        console.log('Google Maps API fully available');
                        resolve();
                    } else {
                        // Check again after a short delay
                        setTimeout(checkApiAvailable, 50);
                    }
                };

                // Start checking immediately
                checkApiAvailable();
            };

            script.onerror = (error) => {
                console.error('Failed to load Google Maps API script:', error);
                reject(new Error('Failed to load Google Maps API - network or API key issue'));
            };

            // Add script to document head
            document.head.appendChild(script);

            // Set timeout to catch hanging requests
            setTimeout(() => {
                if (!window.google || !window.google.maps || !window.google.maps.Map) {
                    reject(new Error('Google Maps API loading timeout - API not available after 15 seconds'));
                }
            }, 15000);
        });
    }
}

// Global window interface for Google Maps
declare global {
    interface Window {
        google: any;
    }
}
