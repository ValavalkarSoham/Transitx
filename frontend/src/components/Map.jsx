import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const Map = ({ activeBusLocation, routeStops, allBuses, geofenceCircle }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Keep track of layers to remove them easily on updates
  const markersRef = useRef({});
  const routeLayersRef = useRef([]);
  const geofenceLayerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize map if not already initialized
    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Default center: Quitol, South Goa (PU Goa College Location)
      const defaultCenter = [15.1389, 73.9669];
      const defaultZoom = 11;

      const map = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline and Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isCurrent = true;

    // Clear old route layers
    routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    routeLayersRef.current = [];

    if (routeStops && routeStops.length > 0) {
      const coordinates = routeStops.map((stop) => [stop.lat, stop.lng]);

      // Add markers for each stop
      routeStops.forEach((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === routeStops.length - 1;

        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: `<div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-md text-xs font-bold text-white ${
            isFirst ? 'bg-green-600' : isLast ? 'bg-red-600' : 'bg-sky-500'
          }">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<b>Stop ${index + 1}: ${stop.name}</b>`);

        routeLayersRef.current.push(stopMarker);
      });

      // Fetch actual road directions from OSRM
      const coordString = routeStops.map((s) => `${s.lng},${s.lat}`).join(';');
      fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
        .then((res) => res.json())
        .then((data) => {
          if (!isCurrent) return;
          if (data.routes && data.routes.length > 0) {
            const routeCoords = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
            const polyline = L.polyline(routeCoords, {
              color: '#0284c7', // primary sky-600
              weight: 5,
              opacity: 0.9,
            }).addTo(map);
            routeLayersRef.current.push(polyline);
          } else {
            throw new Error('No OSRM route found');
          }
        })
        .catch((err) => {
          if (!isCurrent) return;
          console.warn('OSRM router error, falling back to straight lines:', err);
          const polyline = L.polyline(coordinates, {
            color: '#0284c7',
            weight: 4,
            opacity: 0.8,
            dashArray: '5, 10',
          }).addTo(map);
          routeLayersRef.current.push(polyline);
        });

      // Fit map bounds to show the entire route
      try {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }

    return () => {
      isCurrent = false;
    };
  }, [routeStops]);

  // Update Active Bus Marker (Single Tracking View)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeBusLocation || !activeBusLocation.lat) return;

    const { busId, lat, lng, busNumber } = activeBusLocation;

    // Clear old active bus markers (if any other exists)
    Object.keys(markersRef.current).forEach((id) => {
      if (id.startsWith('active_')) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    const key = `active_${busId}`;

    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 border-2 border-white shadow-lg text-white">
            🚌
          </div>
          <div class="absolute -bottom-6 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-gray-700 whitespace-nowrap">
            ${busNumber || 'Bus'}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (markersRef.current[key]) {
      // Update position if already exists
      markersRef.current[key].setLatLng([lat, lng]);
    } else {
      // Create new marker
      const marker = L.marker([lat, lng], { icon: busIcon })
        .addTo(map)
        .bindPopup(`<b>Bus: ${busNumber || 'Tracking'}</b><br/>Live Location`);
      
      markersRef.current[key] = marker;
    }

    // Recenter map on active bus marker
    map.setView([lat, lng], map.getZoom() < 13 ? 14 : map.getZoom());

  }, [activeBusLocation]);

  // Render All Buses (Global Admin Dashboard View)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !allBuses) return;

    // Clear any previous global bus markers
    Object.keys(markersRef.current).forEach((key) => {
      if (key.startsWith('global_')) {
        map.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    // Create markers for active buses
    allBuses.forEach((bus) => {
      if (!bus.currentLocation || !bus.currentLocation.lat) return;

      const key = `global_${bus._id}`;
      const isActive = bus.status === 'active';

      const busIcon = L.divIcon({
        className: 'custom-bus-icon-global',
        html: `
          <div class="relative flex items-center justify-center">
            ${isActive ? '<span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-green-400 opacity-75"></span>' : ''}
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg text-white ${
              isActive ? 'bg-green-600' : bus.status === 'maintenance' ? 'bg-orange-500' : 'bg-gray-500'
            }">
              🚌
            </div>
            <div class="absolute -bottom-6 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-gray-700 whitespace-nowrap">
              ${bus.busNumber}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([bus.currentLocation.lat, bus.currentLocation.lng], { icon: busIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-sm font-sans">
            <h3 class="font-bold">${bus.busNumber}</h3>
            <p>Status: <span class="capitalize font-semibold ${isActive ? 'text-green-600' : 'text-gray-500'}">${bus.status}</span></p>
            <p>Capacity: ${bus.capacity}</p>
            ${bus.routeId ? `<p>Route: ${bus.routeId.routeName}</p>` : ''}
            ${bus.driverId ? `<p>Driver: ${bus.driverId.name}</p>` : ''}
          </div>
        `);

      markersRef.current[key] = marker;
    });
  }, [allBuses]);

  // Render Proximity Geofence Radar Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geofenceLayerRef.current) {
      map.removeLayer(geofenceLayerRef.current);
      geofenceLayerRef.current = null;
    }

    if (geofenceCircle && geofenceCircle.active && geofenceCircle.lat && geofenceCircle.lng) {
      const circle = L.circle([geofenceCircle.lat, geofenceCircle.lng], {
        radius: geofenceCircle.radius || 1000,
        color: '#00FFFF',
        weight: 2,
        opacity: 0.9,
        fillColor: '#00FFFF',
        fillOpacity: 0.12,
        dashArray: '6, 6',
      }).addTo(map);

      circle.bindTooltip(`📡 Radar Perimeter: ${geofenceCircle.radius}m Alert Zone`, {
        permanent: false,
        direction: 'top',
      });

      geofenceLayerRef.current = circle;
    }
  }, [geofenceCircle]);

  return (
    <div className="relative shadow-sm rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};

export default Map;
