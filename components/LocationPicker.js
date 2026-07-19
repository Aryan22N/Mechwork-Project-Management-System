"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import the Map container to prevent SSR issues with Leaflet
const Map = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => <div style={{ height: "300px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>Loading Map...</div>
});

export default function LocationPicker({ latitude, longitude, onLocationChange }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                onLocationChange(parseFloat(lat), parseFloat(lon));
            } else {
                alert("Location not found.");
            }
        } catch (error) {
            console.error("Search error", error);
            alert("Error searching for location.");
        } finally {
            setSearching(false);
        }
    };

    const fetchCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    onLocationChange(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    alert("Unable to retrieve your location.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert("Geolocation not supported by this browser.");
        }
    };

    return (
        <div style={{ marginBottom: "16px", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", background: "rgba(0,0,0,0.01)" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                Location (Latitude & Longitude)
            </label>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center", width: "100%" }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Search location (e.g. New Delhi)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    style={{ flex: 1, height: "44px", margin: 0, minWidth: "200px" }}
                />
                <button type="button" className="btn-primary" onClick={handleSearch} disabled={searching} style={{ height: "44px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", width: "60px" }}>
                    {searching ? "..." : "Search"}
                </button>
                <button type="button" className="btn-ghost" onClick={fetchCurrentLocation} style={{ height: "44px", padding: "0 16px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }} title="Use My Location">
                    📍 Current
                </button>
            </div>

            <Map latitude={latitude} longitude={longitude} onLocationChange={onLocationChange} />

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Latitude</label>
                    <input
                        type="number"
                        step="any"
                        className="input-field"
                        value={latitude || ""}
                        onChange={(e) => onLocationChange(e.target.value, longitude)}
                        placeholder="Latitude"
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Longitude</label>
                    <input
                        type="number"
                        step="any"
                        className="input-field"
                        value={longitude || ""}
                        onChange={(e) => onLocationChange(latitude, e.target.value)}
                        placeholder="Longitude"
                    />
                </div>
            </div>
        </div>
    );
}
