// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const Map = dynamic(() => import("./PubMap"), { ssr: false });

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [pubs, setPubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [radius, setRadius] = useState(3000);
  const fizzSoundRef = useRef<HTMLAudioElement | null>(null);

  const GEO_KEY = "6d1b8643a80b4d76a4c5048d24b21b84";

  // Get GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Could not fetch GPS location")
    );
  };

  // Geocode
  const geocodeAddress = async () => {
    if (!address.trim()) return setError("Please enter an address");
    setError("");
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEO_KEY}`
      );
      const json = await res.json();
      const feat = json.features?.[0]?.properties;
      if (feat) setLocation({ lat: feat.lat, lng: feat.lon });
      else setError("Address not found");
    } catch {
      setError("Geocoding error");
    }
  };

  // Fetch pubs
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setError("");
    fetch(`/api/places?lat=${location.lat}&lng=${location.lng}&radius=${radius}`)
      .then((r) => r.json())
      .then(setPubs)
      .catch(() => setError("Error fetching pubs"))
      .finally(() => setLoading(false));
  }, [location, radius]);

  return (
    <main className="p-4 max-w-5xl mx-auto text-center font-sans">
      {/* Only these beer emojis bounce */}
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .beer-bounce {
          display: inline-block;
          animation: bounce 1.5s ease-in-out infinite;
        }
      `}</style>

      <h1 className="text-3xl font-bold mb-4">🍻 Pub Find</h1>
      <audio ref={fizzSoundRef} src="/sounds/beer-fizz.mp3" preload="auto" />

      {!location ? (
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="beer-bounce text-2xl">🍺 🍺 🍺</div>
          <button
            onClick={() => {
              fizzSoundRef.current?.play().catch(console.warn);
              getCurrentLocation();
            }}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-white text-xl rounded-lg shadow-md"
          >
            Find A Pub
          </button>
          <div className="beer-bounce text-2xl">🍺 🍺 🍺</div>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex justify-center gap-6 mb-6 text-lg">
            <div className="flex items-center gap-1">
              <span className="text-green-600">✅</span> <span>Open Now</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600">❌</span> <span>Closed</span>
            </div>
          </div>

          {/* Search controls */}
          <div className="mt-10 w-full max-w-sm mx-auto">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter suburb or address"
              className="w-full border rounded px-3 py-2"
            />
            <div className="mt-4 flex justify-between">
              <button
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                📍 Find My Location
              </button>
              <button
                onClick={geocodeAddress}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
              >
                📍 Search Location
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="my-4 flex justify-center">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
                className="accent-yellow-500"
              />
              <span className="text-lg">Show only pubs open now</span>
            </label>
          </div>

          {/* Radius */}
          <div className="my-4 flex flex-col items-center">
            <label htmlFor="radius" className="mb-1 text-lg">
              Radius: {(radius / 1000).toFixed(0)} km
            </label>
            <input
              id="radius"
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-64"
            />
          </div>

          {/* Status */}
          {loading && <p className="text-yellow-500">Loading pubs…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {/* Results & map */}
          {!loading && !error && (
            <div className="flex flex-col md:flex-row gap-6 mt-6">
              <div className="flex-1">
                {pubs
                  .filter((p) => {
                    const openNow = p.opening_hours?.open_now;
                    return !openNowOnly || openNow === true;
                  })
                  .map((pub) => {
                    const opening = pub.opening_hours || { open_now: null, text: [] };
                    const hoursArr = Array.isArray(opening.text)
                      ? opening.text
                      : opening.text
                      ? [opening.text]
                      : [];
                    const openNow = opening.open_now;
                    const rate = pub.rate ?? 0;
                    const rounded = rate.toFixed(1);
                    const stars = rate
                      ? "★".repeat(Math.round(rate)).padEnd(5, "☆")
                      : "☆☆☆☆☆";

                    return (
                      <div
                        key={pub.place_id}
                        className="bg-white rounded-lg shadow p-4 mb-4 text-left"
                      >
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          {pub.name}
                          {openNow === true && <span className="text-green-600">✅</span>}
                          {openNow === false && <span className="text-red-600">❌</span>}
                        </h2>
                        <p className="text-gray-700">{pub.formatted}</p>
                        <p className="text-sm text-gray-500">
                          {(pub.distance / 1000).toFixed(2)} km away
                        </p>
                        {hoursArr.length > 0 && (
                          <p className="text-gray-600 text-sm mt-1">
                            Hours: {hoursArr.join("; ")}
                          </p>
                        )}
                        <p className="text-yellow-500 text-lg font-bold mt-2">
                          {stars} {rounded}
                        </p>
                      </div>
                    );
                  })}
              </div>
              <div className="flex-1 h-[500px]">
                <Map
                  center={location}
                  pubs={pubs.filter((p) => {
                    const openNow = p.opening_hours?.open_now;
                    return !openNowOnly || openNow === true;
                  })}
                />
              </div>
            </div>
          )}
        </>
      )}

      <footer className="mt-10 text-sm text-gray-500">
        Proudly Designed and Powered by Wades Apps
      </footer>
    </main>
  );
}
