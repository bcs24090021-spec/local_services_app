import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address: string;
  isOwnMessage?: boolean;
}

export function LocationMessage({
  latitude,
  longitude,
  address,
  isOwnMessage = false,
}: LocationMessageProps) {
  const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x200&markers=color:red%7C${latitude},${longitude}&key=AIzaSyBq5ZkACbUHct_xqTEE8Cgui1_0bjUsWBo`;

  return (
    <div className="space-y-2">
      <div
        className={`rounded-lg overflow-hidden border-2 ${
          isOwnMessage ? "border-blue-500" : "border-gray-300"
        }`}
      >
        {/* Map Preview */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative group"
        >
          <img
            src={staticMapUrl}
            alt="Location map"
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback if map image fails to load
              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' dy='.3em' fill='%23999'%3EMap Preview%3C/text%3E%3C/svg%3E`;
            }}
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>

        {/* Location Info */}
        <div className={`p-3 ${isOwnMessage ? "bg-blue-50" : "bg-gray-50"}`}>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 break-words">
                {address}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Open in Maps
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => {
                const text = `📍 ${address}\n${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                navigator.clipboard.writeText(text);
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
