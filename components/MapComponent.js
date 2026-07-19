import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14);
        }
    }, [center, map]);
    return null;
}

function MapClickListener({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        }
    });
    return null;
}

export default function MapComponent({ latitude, longitude, onLocationChange }) {
    const defaultCenter = [28.6139, 77.2090]; // New Delhi
    const hasLocation = latitude !== null && longitude !== null && latitude !== "" && longitude !== "" && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
    const center = hasLocation ? [parseFloat(latitude), parseFloat(longitude)] : defaultCenter;

    const setPosition = (latlng) => {
        onLocationChange(latlng.lat, latlng.lng);
    };

    return (
        <div style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", zIndex: 0, position: "relative" }}>
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasLocation && <Marker position={center} />}
                <MapClickListener setPosition={setPosition} />
                {hasLocation && <MapUpdater center={center} />}
            </MapContainer>
        </div>
    );
}
