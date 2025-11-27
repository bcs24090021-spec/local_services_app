import { useState } from "react";
import { MapPin, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface LocationMapProps {
  onLocationSelect?: (location: { latitude: number; longitude: number; address: string }) => void;
}

export function LocationMap({ onLocationSelect }: LocationMapProps) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address from coordinates using reverse geocoding
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        try {
          // Using OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.address) {
            address = data.address.road || data.address.suburb || data.address.city || address;
          }
        } catch (err) {
          console.log("Could not fetch address, using coordinates");
        }

        const locationData = { latitude, longitude, address };
        setLocation(locationData);
        onLocationSelect?.(locationData);
        setLoading(false);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
      }
    );
  };

  const copyToClipboard = () => {
    if (location) {
      const text = `📍 Location: ${location.address}\nCoordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\nGoogle Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getGoogleMapsUrl = () => {
    if (location) {
      return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
    return "";
  };

  return (
    <div className="space-y-3">
      {!location ? (
        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {loading ? "Getting location..." : "Share My Location"}
        </Button>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">📍 Your Location</p>
              <p className="text-sm text-gray-700 mt-1 break-words">{location.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200 flex gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {location && (
        <Button
          onClick={() => {
            setLocation(null);
            setError(null);
          }}
          variant="outline"
          className="w-full text-xs"
        >
          Clear Location
        </Button>
      )}
    </div>
  );
}
