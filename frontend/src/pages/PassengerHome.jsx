import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { busService, routeService } from '../services/api';
import Map from '../components/Map';
import { Search, Bus as BusIcon, MapPin, Navigation, Clock } from 'lucide-react';

const PassengerHome = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [trackingLocation, setTrackingLocation] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [eta, setEta] = useState(null);
  
  const socketRef = useRef(null);

  // Haversine formula to calculate distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch initial buses and routes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const busRes = await busService.getBuses();
        const routeRes = await routeService.getRoutes();
        if (busRes.success) setBuses(busRes.data);
        if (routeRes.success) setRoutes(routeRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();

    // Set up a periodic poll to refresh list status
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket connection for real-time tracking
  useEffect(() => {
    if (selectedBus) {
      // Connect to Socket.IO server
      socketRef.current = io('http://localhost:5001');

      // Join room for this bus
      socketRef.current.emit('joinBus', { busId: selectedBus._id });

      // Listen for location updates
      socketRef.current.on('busLocation', ({ lat, lng }) => {
        setTrackingLocation((prev) => ({
          ...prev,
          lat,
          lng,
        }));
      });

      // Cleanup on change or unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [selectedBus]);

  // Recalculate ETA whenever trackingLocation or selectedStop changes
  useEffect(() => {
    if (trackingLocation && selectedStop) {
      const dist = getDistance(
        trackingLocation.lat,
        trackingLocation.lng,
        selectedStop.lat,
        selectedStop.lng
      );
      
      // Assume average bus speed = 30 km/h
      const speedKmh = 30;
      const timeHours = dist / speedKmh;
      const timeMins = Math.round(timeHours * 60);

      setEta({
        distance: dist.toFixed(2),
        minutes: timeMins < 1 ? 'Less than 1' : timeMins,
      });
    } else {
      setEta(null);
    }
  }, [trackingLocation, selectedStop]);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setTrackingLocation({
      busId: bus._id,
      busNumber: bus.busNumber,
      lat: bus.currentLocation.lat,
      lng: bus.currentLocation.lng,
    });
    // Set default stop to the last stop in the route
    if (bus.routeId && bus.routeId.stops.length > 0) {
      setSelectedStop(bus.routeId.stops[bus.routeId.stops.length - 1]);
    } else {
      setSelectedStop(null);
    }
  };

  // Filter buses by route name or stop name
  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase();
    const matchesNumber = bus.busNumber.toLowerCase().includes(query);
    const matchesRouteName = bus.routeId?.routeName.toLowerCase().includes(query) || false;
    const matchesStop =
      bus.routeId?.stops.some((stop) => stop.name.toLowerCase().includes(query)) || false;

    return matchesNumber || matchesRouteName || matchesStop;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar: Search & Bus List */}
      <div className="w-full md:w-96 flex flex-col h-full overflow-hidden bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Navigation className="h-5 w-5 text-sky-600 mr-2" />
          Find Your Bus
        </h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search route or stop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
        </div>

        {/* Bus List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredBuses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No matching buses found.</p>
          ) : (
            filteredBuses.map((bus) => {
              const isActive = bus.status === 'active';
              const isSelected = selectedBus?._id === bus._id;

              return (
                <div
                  key={bus._id}
                  onClick={() => handleSelectBus(bus)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <BusIcon className="h-4 w-4 text-sky-600 mr-1.5" />
                        {bus.busNumber}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {bus.routeId?.routeName || 'Unassigned Route'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : bus.status === 'maintenance'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {bus.status === 'active' ? '● Running' : bus.status}
                    </span>
                  </div>

                  {bus.routeId && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p className="flex items-center">
                        <span className="font-semibold text-gray-500 w-16">Starts:</span>
                        <span className="truncate">{bus.routeId.stops[0]?.name}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold text-gray-500 w-16">Ends:</span>
                        <span className="truncate">
                          {bus.routeId.stops[bus.routeId.stops.length - 1]?.name}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel: Map & Tracking Details */}
      <div className="flex-1 flex flex-col h-full bg-white p-5 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {selectedBus ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header info */}
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  Tracking Bus: {selectedBus.busNumber}
                </h2>
                <p className="text-xs text-sky-600 font-medium mt-0.5">
                  Route: {selectedBus.routeId?.routeName}
                </p>
              </div>

              {/* Destination/ETA selectors */}
              {selectedBus.routeId && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Calculate ETA To
                    </label>
                    <select
                      value={selectedStop?.name || ''}
                      onChange={(e) => {
                        const stop = selectedBus.routeId.stops.find((s) => s.name === e.target.value);
                        setSelectedStop(stop);
                      }}
                      className="mt-0.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {selectedBus.routeId.stops.map((stop) => (
                        <option key={stop._id} value={stop.name}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Status Card */}
            {selectedBus.status === 'active' && eta ? (
              <div className="mb-4 grid grid-cols-2 gap-4 bg-sky-50 border border-sky-100 p-4 rounded-lg text-sky-900">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500 text-white p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-sky-600 uppercase">Estimated Arrival</span>
                    <span className="text-lg font-extrabold">{eta.minutes} mins</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500 text-white p-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-sky-600 uppercase">Distance Remaining</span>
                    <span className="text-lg font-extrabold">{eta.distance} km</span>
                  </div>
                </div>
              </div>
            ) : selectedBus.status !== 'active' ? (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm font-medium">
                ⚠️ This bus is not running active trips right now. Showing last known coordinates.
              </div>
            ) : (
              <div className="mb-4 bg-gray-50 border border-gray-200 text-gray-600 p-4 rounded-lg text-sm text-center">
                Connecting to live stream...
              </div>
            )}

            {/* Map Component */}
            <div className="flex-1 min-h-[300px]">
              <Map
                activeBusLocation={trackingLocation}
                routeStops={selectedBus.routeId?.stops || []}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BusIcon className="h-16 w-16 text-gray-300 animate-pulse mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Bus Selected</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              Select a bus from the sidebar list to start live tracking, view stops, and compute estimated times of arrival.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerHome;
