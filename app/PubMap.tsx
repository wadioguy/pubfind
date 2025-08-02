// app/PubMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// 1) Ensure default icons load (avoids broken images)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// 2) Create a custom beer-pin icon
const beerIcon = new L.Icon({
  iconUrl: "/icons/beer-pin.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// 3) Component to auto-fit map to all markers
function FitBounds({ pubs }: { pubs: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (pubs.length === 0) return;
    const bounds = pubs.map((p) => {
      const [lng, lat] = p.geometry.coordinates;
      return [lat, lng] as [number, number];
    });
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [pubs, map]);
  return null;
}

export default function PubMap({
  center,
  pubs,
}: {
  center: { lat: number; lng: number };
  pubs: any[];
}) {
  if (!center) return null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      {/* Basemap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fit to show all pubs */}
      <FitBounds pubs={pubs} />

      {/* Markers */}
      {pubs.map((pub) => {
        const [lng, lat] = pub.geometry.coordinates;
        const opening = pub.opening_hours || { open_now: null, text: [] };
        const hoursArr = Array.isArray(opening.text)
          ? opening.text
          : opening.text
          ? [opening.text]
          : [];
        const rate = pub.rate ?? 0;
        const stars = rate
          ? "★".repeat(Math.round(rate)).padEnd(5, "☆")
          : "☆☆☆☆☆";

        return (
          <Marker
            key={pub.place_id}
            position={[lat, lng]}
            icon={beerIcon}
            eventHandlers={{
              click: (e) => (e.target as any).openPopup(),
            }}
          >
            <Popup>
              <div className="text-left">
                <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
                  {pub.name}
                  {opening.open_now === true && <span className="text-green-600">✅</span>}
                  {opening.open_now === false && <span className="text-red-600">❌</span>}
                </h2>
                <p className="text-sm text-gray-700 mb-1">{pub.formatted}</p>
                {hoursArr.length > 0 && (
                  <p className="text-gray-600 text-sm mb-1">
                    <strong>Hours:</strong> {hoursArr.join("; ")}
                  </p>
                )}
                <p className="text-yellow-500 font-bold">
                  {stars} {rate.toFixed(1)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
