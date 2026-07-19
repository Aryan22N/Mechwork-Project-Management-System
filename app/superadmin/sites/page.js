"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function ManageSitesPage() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: "", latitude: "", longitude: "", radius: 30 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSites = async () => {
        try {
            const res = await fetch("/api/admin/sites");
            const data = await res.json();
            if (data.success) {
                setSites(data.sites);
            } else {
                toast.error(data.message || "Failed to load sites");
            }
        } catch (error) {
            toast.error("Error fetching sites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/sites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Site created successfully");
                setFormData({ name: "", latitude: "", longitude: "", radius: 30 });
                fetchSites();
            } else {
                toast.error(data.message || "Failed to create site");
            }
        } catch (error) {
            toast.error("Error creating site");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8">Loading sites...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Manage Work Locations</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Add New Site</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Site Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                        <input
                            type="number"
                            step="any"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.latitude}
                            onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.longitude}
                            onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                        <input
                            type="number"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.radius}
                            onChange={(e) => setFormData({...formData, radius: e.target.value})}
                        />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Create Site"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radius</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sites.map((site) => (
                            <tr key={site.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{site.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{site.latitude}, {site.longitude}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{site.radius}m</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${site.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {site.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{site.creator?.name || 'Unknown'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
