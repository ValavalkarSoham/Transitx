import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { busService, routeService, authService } from '../services/api';
import Map from '../components/Map';
import {
  Navigation,
  Clock,
  MapPin,
  Search,
  Bus as BusIcon,
  CreditCard,
  QrCode,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  Calendar,
  X,
  FileText,
  Download,
  Check,
  Bell,
  Send,
  Radio,
  Volume2,
  VolumeX,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, setUser } = useAuth();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [trackingLocation, setTrackingLocation] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [eta, setEta] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState('map-tracker'); // map-tracker, digital-pass, plans, billing
  const [passLoading, setPassLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Dummy Payment Gateway States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForPay, setSelectedPlanForPay] = useState(null); // { name, price }
  const [paymentStep, setPaymentStep] = useState('form'); // form, processing, success
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [processingMsg, setProcessingMsg] = useState('');
  const [selectedSubRoute, setSelectedSubRoute] = useState('Route 17 - Margao Line');

  // Late notification states
  const [isLatePanelOpen, setIsLatePanelOpen] = useState(false);
  const [lateMinutes, setLateMinutes] = useState('5');
  const [lateSent, setLateSent] = useState(false);

  // Proximity Geofence Alert States
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(1000); // meters: 500, 1000, 2000
  const [geofenceSound, setGeofenceSound] = useState(true);
  const [geofenceVibrate, setGeofenceVibrate] = useState(true);
  const [geofenceAlert, setGeofenceAlert] = useState(null); // { busNumber, stopName, distanceMeters, timeMins, timestamp }
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const hasAlertedRef = useRef(false);

  const routePrices = {
    'Route 1 - Marcel Line': 45000,
    'Route 2 - Bicholim Line': 45000,
    'Route 3 - Sanquelim Line': 45000,
    'Route 4 - Mapusa Line': 45000,
    'Route 5 - Porvorim Line': 45000,
    'Route 6 - Panjim Line': 40000,
    'Route 7 - Bambolim Line': 40000,
    'Route 8 - Vasco Line': 40000,
    'Route 9 - Ponda Line': 40000,
    'Route 10 - Old Goa Line': 40000,
    'Route 11 - Canacona Line': 35000,
    'Route 12 - Sanguem Line': 35000,
    'Route 13 - Curchorem Line': 35000,
    'Route 14 - Verna Line': 35000,
    'Route 15 - Cortalim Line': 35000,
    'Route 16 - Pillar Line': 35000,
    'Route 17 - Margao Line': 30000,
    'Route 18 - Quepem Line': 30000,
    'Route 19 - Cuncolim Line': 25000,
    'Route 20 - Chinchinim Line': 25000,
  };

  const basePrice = routePrices[selectedSubRoute] || 30000;
  const monthlyPrice = Math.floor(basePrice / 10);
  const semesterPrice = Math.floor(basePrice / 2);
  const annualPrice = basePrice;

  const socketRef = useRef(null);

  // Haversine formula to calculate distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket connection for live bus tracking
  useEffect(() => {
    if (selectedBus) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 
        (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : null) || 
        (window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`);
      
      socketRef.current = io(socketServerUrl);
      socketRef.current.emit('joinBus', { busId: selectedBus._id });

      socketRef.current.on('busLocation', ({ lat, lng, busId, busNumber }) => {
        setTrackingLocation({
          busId: busId || selectedBus._id,
          busNumber: busNumber || selectedBus.busNumber,
          lat,
          lng,
        });
      });

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
      
      const speedKmh = 30; // avg bus speed
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

  // Web Audio synthesizer chime for proximity radar alert
  const playProximityChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // 3-tone retro synth chord progression (E5 -> G#5 -> B5)
      const tones = [659.25, 830.61, 987.77];
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (err) {
      console.error('Audio chime error:', err);
    }
  };

  // Request browser Web Notification permissions
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('📡 TransitX Proximity Radar Active', {
          body: 'Proximity Geofence alerts are now armed. You will be notified when your bus approaches!',
          icon: '/logo.svg',
        });
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
  };

  // Test sample alert immediately
  const handleTestProximityAlert = () => {
    if (geofenceSound) playProximityChime();
    if (geofenceVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
    setGeofenceAlert({
      busNumber: selectedBus?.busNumber || 'GA-08-F-1234',
      stopName: selectedStop?.name || 'Assigned Campus Stop',
      distanceMeters: Math.round(geofenceRadius * 0.75),
      timeMins: 2,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`🚌 Bus Approaching Alert (Test)`, {
          body: `Bus is within your ${geofenceRadius}m geofence perimeter! (~2 min ETA)`,
          icon: '/logo.svg',
          tag: 'transitx-geofence-test',
        });
      } catch (err) {
        console.error('Web notification error:', err);
      }
    }
  };

  // Geofence Proximity Alert Trigger Effect
  useEffect(() => {
    if (!geofenceEnabled || !trackingLocation || !selectedStop || !selectedBus || selectedBus.status !== 'active') {
      return;
    }

    const distKm = getDistance(
      trackingLocation.lat,
      trackingLocation.lng,
      selectedStop.lat,
      selectedStop.lng
    );
    const distMeters = Math.round(distKm * 1000);
    const speedKmh = 30;
    const timeMins = Math.max(1, Math.round((distKm / speedKmh) * 60));

    // If within radius and hasn't alerted for this approach
    if (distMeters <= geofenceRadius && !hasAlertedRef.current) {
      hasAlertedRef.current = true;
      const alertPayload = {
        busNumber: selectedBus.busNumber,
        stopName: selectedStop.name,
        distanceMeters: distMeters,
        timeMins,
        timestamp: new Date().toLocaleTimeString(),
      };
      setGeofenceAlert(alertPayload);

      // Play Sound Chime
      if (geofenceSound) {
        playProximityChime();
      }

      // Trigger Haptic Vibration on Mobile
      if (geofenceVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([250, 100, 250, 100, 400]);
      }

      // Trigger Native Web Notification (even if tab is minimized)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(`🚌 Bus ${selectedBus.busNumber} is Approaching!`, {
            body: `Now ${distMeters}m away from ${selectedStop.name} (~${timeMins} min ETA). Be ready at the stop!`,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: 'transitx-geofence',
          });
        } catch (err) {
          console.error('Web notification error:', err);
        }
      }
    } else if (distMeters > geofenceRadius * 1.5) {
      // Reset alert trigger once the bus has moved past/away
      hasAlertedRef.current = false;
    }
  }, [trackingLocation, selectedStop, geofenceEnabled, geofenceRadius, selectedBus, geofenceSound, geofenceVibrate]);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    hasAlertedRef.current = false;
    setGeofenceAlert(null);
    setTrackingLocation({
      busId: bus._id,
      busNumber: bus.busNumber,
      lat: bus.currentLocation.lat,
      lng: bus.currentLocation.lng,
    });
    if (bus.routeId && bus.routeId.stops.length > 0) {
      setSelectedStop(bus.routeId.stops[bus.routeId.stops.length - 1]);
    } else {
      setSelectedStop(null);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = (planName, price) => {
    console.log('handleOpenCheckout called with:', planName, price);
    setSelectedPlanForPay({ name: planName, price });
    setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
    setPaymentStep('form');
    setCheckoutModalOpen(true);
  };

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails({ ...cardDetails, number: formatted.substring(0, 19) });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setCardDetails({ ...cardDetails, expiry: formatted.substring(0, 5) });
  };

  // Process Mock Payment
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentStep('processing');

    const steps = [
      'Establishing secure 256-bit SSL connection...',
      'Encrypting card details via RSA token...',
      'Validating transaction with bank host...',
      'Awaiting 3D-Secure response verification...',
      'Completing transaction capture...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingMsg(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const res = await authService.updatePass(
        selectedPlanForPay.name,
        selectedPlanForPay.price,
        selectedSubRoute
      );
      if (res.success) {
        setUser(res.data);
        setPaymentStep('success');
      } else {
        throw new Error(res.message || 'Payment was declined by card issuer.');
      }
    } catch (err) {
      alert(err.message || 'Error processing payment.');
      setPaymentStep('form');
    }
  };

  // Emit late notification to the driver
  const handleSendLateNotice = () => {
    if (socketRef.current && selectedBus) {
      socketRef.current.emit('lateNotice', {
        busId: selectedBus._id,
        studentName: user.name,
        rollNumber: user.rollNumber || 'N/A',
        delayMinutes: lateMinutes,
        stopName: selectedStop ? selectedStop.stopName : 'Assigned Stop'
      });
      setLateSent(true);
      setTimeout(() => {
        setLateSent(false);
        setIsLatePanelOpen(false);
      }, 3000);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase();
    const matchesNumber = bus.busNumber.toLowerCase().includes(query);
    const matchesRoute = bus.routeId?.routeName.toLowerCase().includes(query) || false;
    return matchesNumber || matchesRoute;
  });

  const isPassActive = user?.passStatus === 'active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col font-sans bg-[#09090b] text-zinc-100">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-yellow-400" />
            </div>
            Student Space
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Department: <span className="font-bold text-yellow-400">{user?.department || 'N/A'}</span> | Roll No:{' '}
            <span className="font-bold text-white">{user?.rollNumber || 'N/A'}</span>
          </p>
        </div>

        {/* Pass Status Badge */}
        <div className="flex items-center gap-3 bg-[#121214] border border-yellow-500/30 px-4 py-2.5 rounded-xl shadow-lg">
          <CreditCard className="h-5 w-5 text-yellow-400" />
          <div className="text-left">
            <span className="block text-[10px] font-bold text-zinc-400 uppercase leading-none">Pass Status</span>
            <span
              className={`text-xs font-black capitalize ${
                isPassActive ? 'text-yellow-400' : 'text-red-400'
              }`}
            >
              {isPassActive ? '● Pass Active' : '● Inactive / Expired'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('map-tracker')}
            className={`whitespace-nowrap pb-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeSubTab === 'map-tracker'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            Live Bus Map
          </button>
          <button
            onClick={() => setActiveSubTab('digital-pass')}
            className={`whitespace-nowrap pb-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeSubTab === 'digital-pass'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            My Digital Pass
          </button>
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`whitespace-nowrap pb-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeSubTab === 'plans'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            Bus Plans Subscriptions
          </button>
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`whitespace-nowrap pb-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeSubTab === 'billing'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            Billing & Receipts
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col">
        {/* PANEL 1: LIVE MAP TRACKING */}
        {activeSubTab === 'map-tracker' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6">
            {/* Search sidebar */}
            <div className="w-full md:w-80 flex flex-col h-full bg-[#121214] p-5 rounded-2xl border border-zinc-800 shadow-xl shrink-0 text-left">
              <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-yellow-400" />
                Select Campus Bus
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search route or bus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-700 bg-[#09090b] rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] md:max-h-[500px]">
                {filteredBuses.map((bus) => {
                  const isSelected = selectedBus?._id === bus._id;
                  const isRunning = bus.status === 'active';

                  return (
                    <div
                      key={bus._id}
                      onClick={() => handleSelectBus(bus)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400 text-white shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                          : 'border-zinc-800 hover:border-zinc-700 bg-[#09090b]/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-white flex items-center text-xs">
                          <BusIcon className="h-4 w-4 text-yellow-400 mr-1.5" />
                          {bus.busNumber}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isRunning ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isRunning ? 'Running' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 truncate font-medium">
                        {bus.routeId?.routeName || 'No Assigned Route'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking map details */}
            <div className="flex-1 bg-[#121214] p-5 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
              {selectedBus ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="mb-4 bg-[#09090b] p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="p-3.5 bus-led-sign text-left shrink-0 w-full sm:w-auto">
                      <div className="text-[9px] font-bold text-yellow-400 opacity-80 leading-none">ROUTE BOARD</div>
                      <h3 className="text-base font-black mt-1 flex items-center gap-1.5 text-yellow-400">
                        <BusIcon className="h-4.5 w-4.5 text-yellow-400" />
                        {selectedBus.busNumber}
                      </h3>
                      <span className="block text-[11px] font-bold text-yellow-400/90 truncate max-w-xs mt-0.5">
                        {selectedBus.routeId?.routeName || 'No route assigned'}
                      </span>
                    </div>

                    {selectedBus.routeId && (
                      <div className="text-right">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Calculate ETA To</label>
                        <select
                          value={selectedStop?.name || ''}
                          onChange={(e) => {
                            const stop = selectedBus.routeId.stops.find((s) => s.name === e.target.value);
                            setSelectedStop(stop);
                          }}
                          className="mt-1 text-xs font-bold text-white bg-[#121214] border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:border-yellow-400 outline-none"
                        >
                          {selectedBus.routeId.stops.map((stop) => (
                            <option key={stop._id} value={stop.name}>
                              {stop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {selectedBus.status === 'active' && eta ? (
                    <>
                      <div className="mb-4 grid grid-cols-2 gap-4 bg-yellow-400/10 border border-yellow-400/30 p-4 rounded-xl text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.15)] text-left">
                        <div className="flex items-center gap-3">
                          <Clock className="h-6 w-6 text-yellow-400 shrink-0" />
                          <div>
                            <span className="block text-[10px] font-bold text-yellow-500 uppercase leading-none">Estimated Arrival</span>
                            <span className="text-xl font-black text-white">{eta.minutes} mins</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-6 w-6 text-yellow-400 shrink-0" />
                          <div>
                            <span className="block text-[10px] font-bold text-yellow-500 uppercase leading-none">Distance Remaining</span>
                            <span className="text-xl font-black text-white">{eta.distance} km</span>
                          </div>
                        </div>
                      </div>

                      {/* Late notification panel */}
                      <div className="mb-4 bg-[#09090b] border border-zinc-800 rounded-xl p-3">
                        {!isLatePanelOpen ? (
                          <button
                            onClick={() => setIsLatePanelOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 rounded-lg text-red-400 text-xs font-bold transition-colors"
                          >
                            <Bell className="h-4 w-4" />
                            Notify Driver: I'm Running Late
                          </button>
                        ) : (
                          <div className="space-y-2.5 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">REPORT DELAY AT STOP</span>
                              <button
                                onClick={() => setIsLatePanelOpen(false)}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300"
                              >
                                Cancel
                              </button>
                            </div>
                            
                            {lateSent ? (
                              <div className="py-2 px-3 bg-green-950/40 border border-green-900/40 text-green-400 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                Late notice sent to driver!
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <select
                                  value={lateMinutes}
                                  onChange={(e) => setLateMinutes(e.target.value)}
                                  className="flex-1 py-1.5 px-2.5 border border-zinc-700 bg-[#121214] text-xs text-white rounded-lg font-bold"
                                >
                                  <option value="5">Delay: 5 mins</option>
                                  <option value="10">Delay: 10 mins</option>
                                  <option value="15">Delay: 15 mins</option>
                                </select>
                                <button
                                  onClick={handleSendLateNotice}
                                  className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : selectedBus.status !== 'active' ? (
                    <div className="mb-4 bg-yellow-950/20 border border-yellow-500/30 text-yellow-300 p-3.5 rounded-xl text-xs font-bold text-left">
                      ⚠️ This bus is not running active duty shifts right now. Showing last recorded coordinates.
                    </div>
                  ) : (
                    <div className="mb-4 bg-[#09090b] border border-zinc-800 p-3 text-center text-xs text-zinc-400">
                      Connecting to live satellite stream...
                    </div>
                  )}

                  {/* ACTIVE PROXIMITY GEOFENCE ALERT BANNER */}
                  {geofenceAlert && (
                    <div className="mb-4 p-4 bg-black border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-pulse rounded-xl text-left flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center shrink-0">
                          <Radio className="h-5 w-5 text-yellow-400 animate-ping" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider rounded">
                              🚨 PROXIMITY ALERT
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">{geofenceAlert.timestamp}</span>
                          </div>
                          <h4 className="text-base font-black text-white mt-1">
                            Bus {geofenceAlert.busNumber} is Approaching {geofenceAlert.stopName}!
                          </h4>
                          <p className="text-xs text-zinc-300 mt-0.5">
                            Current Distance: <span className="font-bold text-yellow-400">{geofenceAlert.distanceMeters} meters</span> • Estimated Arrival: <span className="font-bold text-yellow-300">~{geofenceAlert.timeMins} mins</span>. Please head to your boarding spot now!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGeofenceAlert(null)}
                        className="text-zinc-400 hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* PROXIMITY GEOFENCE RADAR CONTROLS */}
                  <div className="mb-4 p-4 bg-[#09090b] border border-yellow-500/30 rounded-xl text-left shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <Radio className={`h-5 w-5 ${geofenceEnabled ? 'text-yellow-400 animate-pulse' : 'text-zinc-500'}`} />
                        <div>
                          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            Proximity Geofence Radar
                            {geofenceEnabled && (
                              <span className="px-2 py-0.2 bg-yellow-400 text-black text-[9px] font-mono font-black rounded">
                                ARMED ({geofenceRadius}m)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Get alerted on your phone when bus approaches {selectedStop?.name || 'your stop'}.
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !geofenceEnabled;
                          setGeofenceEnabled(next);
                          if (next && notificationPermission !== 'granted') {
                            requestNotificationPermission();
                          }
                        }}
                        className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                          geofenceEnabled
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                            : 'bg-[#121214] text-zinc-400 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {geofenceEnabled ? 'Radar Active' : 'Arm Radar'}
                      </button>
                    </div>

                    {geofenceEnabled && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        {/* Radius Selector */}
                        <div className="bg-[#121214] p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
                          <span className="text-zinc-400 font-bold uppercase block mb-1">Alert Perimeter</span>
                          <div className="flex gap-1">
                            {[500, 1000, 2000].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setGeofenceRadius(r);
                                  hasAlertedRef.current = false;
                                }}
                                className={`flex-1 py-1 text-center font-mono font-bold rounded border ${
                                  geofenceRadius === r
                                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/15'
                                    : 'border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Audio & Haptics */}
                        <div className="bg-[#121214] p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
                          <span className="text-zinc-400 font-bold uppercase block mb-1">Feedback Engine</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setGeofenceSound(!geofenceSound)}
                              className={`flex-1 py-1 flex items-center justify-center gap-1 rounded border font-bold ${
                                geofenceSound
                                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/15'
                                  : 'border-zinc-800 text-zinc-500'
                              }`}
                            >
                              {geofenceSound ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                              Chime
                            </button>
                            <button
                              type="button"
                              onClick={() => setGeofenceVibrate(!geofenceVibrate)}
                              className={`flex-1 py-1 flex items-center justify-center gap-1 rounded border font-bold ${
                                geofenceVibrate
                                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/15'
                                  : 'border-zinc-800 text-zinc-500'
                              }`}
                            >
                              <Smartphone className="h-3 w-3" />
                              Vibrate
                            </button>
                          </div>
                        </div>

                        {/* Browser Notification & Test */}
                        <div className="bg-[#121214] p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
                          <span className="text-zinc-400 font-bold uppercase block mb-1">Notification Test</span>
                          <div className="flex gap-1">
                            {notificationPermission !== 'granted' ? (
                              <button
                                type="button"
                                onClick={requestNotificationPermission}
                                className="flex-1 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 hover:bg-yellow-400/30 text-[9px] font-bold uppercase rounded"
                              >
                                Allow Web Push
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleTestProximityAlert}
                                className="flex-1 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/20 text-[9px] font-bold uppercase flex items-center justify-center gap-1 rounded"
                              >
                                <Zap className="h-3 w-3" />
                                Test Radar Alert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-[300px]">
                    <Map
                      activeBusLocation={trackingLocation}
                      routeStops={selectedBus.routeId?.stops || []}
                      geofenceCircle={
                        geofenceEnabled && selectedStop
                          ? {
                              lat: selectedStop.lat,
                              lng: selectedStop.lng,
                              radius: geofenceRadius,
                              active: true,
                            }
                          : null
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center bg-[#09090b] border border-dashed border-zinc-800 rounded-xl">
                  <BusIcon className="h-14 w-14 text-zinc-700 animate-pulse mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">No Bus Selected</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    Select a bus from the sidebar list to verify its route coordinates and real-time movement.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: MY DIGITAL TRANSPORT PASS */}
        {activeSubTab === 'digital-pass' && (
          <div className="max-w-md mx-auto w-full bg-[#121214] p-6 rounded-2xl border border-yellow-500/40 shadow-[0_0_30px_rgba(250,204,21,0.2)] flex flex-col items-center text-center">
            <h2 className="text-xl font-black text-white mb-6">Digital Campus Transport Pass</h2>
            
            {isPassActive ? (
              <div className="w-full bus-window-frame p-4 bg-black">
                {/* Visual Pass Card styled like an authentic Bus Ticket */}
                <div className="relative overflow-hidden bg-gradient-to-br from-yellow-950/60 to-[#121214] text-zinc-100 p-6 rounded-xl shadow-[0_0_25px_rgba(250,204,21,0.2)] bus-ticket text-left">
                  {/* Watermark Logo */}
                  <div className="absolute right-4 bottom-4 text-yellow-500/10 font-black text-6xl select-none">
                    T-X
                  </div>

                  <div className="flex justify-between items-start border-b border-yellow-500/30 pb-3 mb-4">
                    <div>
                      <h3 className="font-black text-lg tracking-tight text-yellow-400">TRANSITX TICKET</h3>
                      <span className="text-[10px] text-yellow-300/80 uppercase tracking-widest font-bold">
                        Campus Transport Authorization
                      </span>
                    </div>
                    <CheckCircle className="h-6 w-6 text-yellow-400 fill-yellow-400/20 animate-pulse" />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Student Name</span>
                      <span className="font-black text-base text-white">{user?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Roll Number</span>
                        <span className="font-bold text-white">{user?.rollNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Department</span>
                        <span className="font-bold text-white">{user?.department}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
                      <div>
                        <span className="block text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Plan Subscribed</span>
                        <span className="font-black text-xs bg-yellow-400/15 text-yellow-400 px-2.5 py-0.5 rounded border border-yellow-400/40 inline-block mt-0.5">
                          {user?.passPlan}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Valid Until</span>
                        <span className="font-bold text-xs text-white flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-yellow-400" />
                          {new Date(user?.passValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Perforation Line */}
                  <div className="bus-ticket-perforation" />

                  {/* QR code scanner stub */}
                  <div className="flex flex-col items-center pt-2">
                    <div className="qr-code-wrapper p-3 rounded-xl border-2 border-yellow-400 shadow-lg flex items-center justify-center bg-white">
                      <QrCode className="h-32 w-32 text-black" />
                    </div>
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-3">
                      QR ID: TX-PASS-{user?._id?.substring(18)}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-2 font-medium text-center max-w-xs">
                      Scan ticket stub upon boarding at campus shuttle gates.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 flex flex-col items-center">
                <AlertTriangle className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-white">No Active Pass</h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  You do not have an active transport pass. Please visit the **Bus Plans** tab to subscribe to a semester, monthly, or annual plan to activate your digital card.
                </p>
                <button
                  onClick={() => setActiveSubTab('plans')}
                  className="mt-6 inline-flex items-center px-6 py-2.5 text-xs font-black rounded-xl text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all"
                >
                  View Subscription Plans
                </button>
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: BUS PLANS SUBSCRIPTIONS */}
        {activeSubTab === 'plans' && (
          <div className="max-w-5xl mx-auto w-full text-zinc-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white">Choose Your Transport Plan</h2>
              <p className="text-xs text-zinc-400 mt-1">Activate your digital bus pass instantly with mock subscription payments.</p>
            </div>

            {/* Route Pricing Selector */}
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 mb-8 max-w-xl mx-auto text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">Select Route for Pricing</h4>
                <p className="text-[11px] text-zinc-400">Longer distances (e.g. Mapusa/Marcel) cost more due to route mileage.</p>
              </div>
              <select
                value={selectedSubRoute}
                onChange={(e) => setSelectedSubRoute(e.target.value)}
                className="w-full sm:w-64 py-2 px-3 border border-zinc-700 bg-[#09090b] rounded-xl text-xs text-white font-bold focus:border-yellow-400 outline-none"
              >
                {routes.map((r) => {
                  const price = routePrices[r.routeName] || 30000;
                  return (
                    <option key={r._id} value={r.routeName}>
                      {r.routeName} (₹{price.toLocaleString()} PA)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly Plan */}
              <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all text-left">
                <div>
                  <h3 className="text-lg font-black text-white">Monthly Pass</h3>
                  <p className="text-xs text-zinc-400 mt-1">Best for short temporary terms</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">₹{monthlyPrice.toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 font-bold ml-1">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Valid for exactly 30 days
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Access to all route lines
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Real-time Leaflet tracking
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Monthly Pass', monthlyPrice)}
                  className="mt-8 w-full py-2.5 rounded-xl border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-xs font-black transition-all"
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* Semester Plan (Popular) */}
              <div className="bg-[#121214] rounded-2xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.25)] p-6 flex flex-col justify-between hover:border-yellow-300 transition-all relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider py-1 px-3.5 rounded-bl-xl">
                  Popular Choice
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Semester Pass</h3>
                  <p className="text-xs text-zinc-400 mt-1">Perfect fit for full semesters</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-yellow-400">₹{semesterPrice.toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 font-bold ml-1">/ semester</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Valid for 180 days (6 months)
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Unlimited boarding access
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Digital pass QR code activation
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Semester Pass', semesterPrice)}
                  className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black text-xs font-black shadow-lg transition-all"
                >
                  Subscribe Semester
                </button>
              </div>

              {/* Annual Plan */}
              <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all text-left">
                <div>
                  <h3 className="text-lg font-black text-white">Annual Pass</h3>
                  <p className="text-xs text-zinc-400 mt-1">Best value for full year</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">₹{annualPrice.toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 font-bold ml-1">/ year</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Valid for 365 days (1 year)
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Save ₹3,000 vs monthly rates
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-yellow-400 mr-2 font-bold">✓</span> Priority customer support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Annual Pass', annualPrice)}
                  className="mt-8 w-full py-2.5 rounded-xl border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-xs font-black transition-all"
                >
                  Subscribe Annual
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PANEL 4: BILLING & RECEIPTS HISTORY */}
        {activeSubTab === 'billing' && (
          <div className="max-w-5xl mx-auto w-full text-zinc-100 flex-1 flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white">Billing & Payments History</h2>
              <p className="text-xs text-zinc-400 mt-1">Review your current subscription plan details and access downloadable payment receipts.</p>
            </div>

            {/* Current Active Plan Status Card */}
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 mb-8 text-left grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
              <div className="flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Current plan</span>
                  <h3 className="text-xl font-black text-white">{user?.passPlan || 'No Active Pass Plan'}</h3>
                </div>
                <div className="mt-4">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">VALIDITY PERIOD</span>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    {user?.passValidUntil ? (
                      <>Valid until {new Date(user.passValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>

              <div className="border-l border-zinc-800 pl-6 flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Active Pass Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                    user?.passStatus === 'active' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {user?.passStatus === 'active' ? '● Pass Active' : '● Inactive / Expired'}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AUTHORIZED GATEWAYS</span>
                  <p className="text-xs text-zinc-400 mt-0.5">TransitX Mock SSL Gateway</p>
                </div>
              </div>

              <div className="border-l border-zinc-800 pl-6 flex flex-col justify-center gap-3">
                <button
                  onClick={() => setActiveSubTab('plans')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black text-xs shadow-md transition-colors"
                >
                  Renew / Change Pass Plan
                </button>
                <button
                  onClick={() => setActiveSubTab('digital-pass')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs shadow-md transition-colors"
                >
                  View Digital Card QR
                </button>
              </div>
            </div>

            {/* Payment Receipts History Table */}
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex-1">
              <div className="px-6 py-4 border-b border-zinc-800 bg-[#09090b]/60 flex justify-between items-center">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Payment Transaction History</h4>
                <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-2.5 py-0.5 rounded-full font-black">
                  {user?.paymentHistory?.length || 0} Transactions
                </span>
              </div>

              {user?.paymentHistory && user.paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-xs text-zinc-300">
                    <thead className="bg-[#09090b] text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Transaction ID</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Plan</th>
                        <th className="px-6 py-3 font-semibold">Route Line</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                        <th className="px-6 py-3 font-semibold text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 bg-[#121214]">
                      {user.paymentHistory.map((t) => (
                        <tr key={t.transactionId} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-yellow-400">{t.transactionId}</td>
                          <td className="px-6 py-4">
                            {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">{t.planName}</td>
                          <td className="px-6 py-4 text-zinc-400 font-semibold">{t.route}</td>
                          <td className="px-6 py-4 font-black text-white text-right">₹{t.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedReceipt(t);
                                setReceiptModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-lg font-bold text-[11px] transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 font-semibold text-xs flex flex-col items-center">
                  <FileText className="h-12 w-12 text-zinc-700 mb-2" />
                  <span>No payment transactions found.</span>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">Once you purchase a pass plan using the subscription checkout portal, your tax invoices and receipts will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal Form Overlay */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-800 overflow-hidden flex flex-col md:flex-row min-h-[450px]">
            
            {/* Left Column: Order Summary */}
            <div className="w-full md:w-80 bg-[#09090b] border-r border-zinc-800 p-6 flex flex-col justify-between shrink-0 text-left">
              <div>
                <span className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1">
                  Secure Checkout
                </span>
                <h3 className="text-xl font-black text-white mb-6">Order Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-start text-sm pb-3 border-b border-zinc-800">
                    <div>
                      <span className="font-bold text-zinc-200">{selectedPlanForPay?.name}</span>
                      <span className="block text-[11px] text-zinc-500 font-semibold mt-0.5">Transit Authorization Pass</span>
                    </div>
                    <span className="font-black text-white">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold">
                    <span>Processing Fee</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold">
                    <span>Tax (GST/VAT)</span>
                    <span>₹0.00</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 mt-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-zinc-400">Total Amount</span>
                  <span className="text-2xl font-black text-yellow-400">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Form / Progress / Success states */}
            <div className="flex-1 p-6 relative flex flex-col justify-between text-left">
              
              {/* Close Button (only active if not processing) */}
              {paymentStep !== 'processing' && (
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Step 1: Form View */}
              {paymentStep === 'form' && (
                <form onSubmit={handleProcessPayment} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                      <CreditCard className="h-5 w-5 text-yellow-400" />
                      Card Payment Details
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          placeholder="e.g. Alex Student"
                          className="mt-1 block w-full border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 bg-[#09090b] text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardDetails.number}
                          onChange={handleCardNumberChange}
                          placeholder="1111 2222 3333 4444"
                          className="mt-1 block w-full border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 bg-[#09090b] text-white font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleExpiryChange}
                            className="mt-1 block w-full border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 bg-[#09090b] text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">CVV</label>
                          <input
                            type="password"
                            required
                            placeholder="•••"
                            maxLength="3"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                            className="mt-1 block w-full border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 bg-[#09090b] text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black text-xs shadow-lg mt-6 transition-all"
                  >
                    Authorize Payment — ₹{selectedPlanForPay?.price?.toLocaleString()}
                  </button>
                </form>
              )}

              {/* Step 2: Processing View */}
              {paymentStep === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-6"></div>
                  <h4 className="text-base font-bold text-white mb-2">Authorizing Transaction</h4>
                  <p className="text-xs text-yellow-400 font-bold animate-pulse">{processingMsg}</p>
                  <p className="text-[10px] text-zinc-500 mt-6 font-semibold">Please do not refresh the window or click back.</p>
                </div>
              )}

              {/* Step 3: Success View */}
              {paymentStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-between text-center p-6">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-yellow-400 fill-yellow-400/20 mb-4 animate-bounce" />
                    <h4 className="text-lg font-black text-white">Payment Successful!</h4>
                    <p className="text-xs text-zinc-400 mt-1.5 max-w-xs font-semibold">
                      Your student transport pass has been generated and validated in your profile registers.
                    </p>

                    <div className="mt-6 bg-[#09090b] border border-zinc-800 rounded-xl p-4 text-left w-full text-xs space-y-1.5 font-semibold text-zinc-300">
                      <div className="flex justify-between">
                        <span>Receipt ID:</span>
                        <span className="font-mono font-black text-yellow-400">TX-REC-{Math.floor(100000 + Math.random() * 900000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="font-black text-white">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pass Validated:</span>
                        <span className="font-black text-yellow-400">Active</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setActiveSubTab('digital-pass');
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black text-xs shadow-md mt-6 transition-colors"
                  >
                    View My Digital Pass
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Popup Modal */}
      {receiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col p-6 relative text-left bg-[#121214] text-white">
            
            <button
              onClick={() => {
                setReceiptModalOpen(false);
                setSelectedReceipt(null);
              }}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-6 border-b border-dashed border-zinc-800">
              <div className="inline-flex items-center gap-1.5 text-yellow-400 font-black text-xl mb-1 tracking-tight">
                <BusIcon className="h-6 w-6 text-yellow-400" />
                Transit<span className="text-white">X</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Official Payment Tax Invoice</p>
            </div>

            {/* Receipt Body */}
            <div className="py-5 space-y-4">
              
              {/* Institution and Student Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-yellow-400 uppercase">Provider</span>
                  <span className="font-extrabold text-white">Parul University Goa Campus</span>
                  <span className="block text-[10px] text-zinc-400 font-medium">Betul, Quitol, South Goa, India</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-yellow-400 uppercase">Billed To</span>
                  <span className="font-extrabold text-white">{user?.name}</span>
                  <span className="block text-[10px] text-zinc-400 font-medium">Roll: {user?.rollNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Transaction specifics */}
              <div className="border border-zinc-800 rounded-xl p-4 space-y-2 text-xs bg-[#09090b]">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Transaction Reference:</span>
                  <span className="font-mono font-extrabold text-yellow-400">{selectedReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Date & Time:</span>
                  <span className="font-semibold text-zinc-200">
                    {new Date(selectedReceipt.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Payment Gateway:</span>
                  <span className="font-semibold text-zinc-200">Mock Secured SSL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Payment Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-yellow-400">
                    <Check className="h-3 w-3" /> SUCCESS
                  </span>
                </div>
              </div>

              {/* Item details */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="block text-[10px] font-bold text-yellow-400 uppercase mb-2">Invoice Particulars</span>
                <div className="flex justify-between text-xs py-1.5 border-b border-zinc-800">
                  <div className="font-bold text-white">
                    {selectedReceipt.planName}
                    <span className="block text-[10px] text-zinc-400 font-medium">{selectedReceipt.route}</span>
                  </div>
                  <span className="font-black text-white">₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
                
                {/* Total Calculations */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Subtotal:</span>
                    <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Tax (GST @0%):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white border-t border-zinc-800 pt-2">
                    <span>Total Paid (INR):</span>
                    <span className="text-yellow-400 font-black">₹{selectedReceipt.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Receipt Footer */}
            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
              {/* PAID Badge */}
              <div className="border-2 border-yellow-400 text-yellow-400 px-4 py-1.5 rounded-lg font-black text-sm tracking-widest rotate-[-5deg]">
                PAID
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 bg-[#09090b] hover:bg-zinc-800 border border-zinc-700 text-zinc-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setReceiptModalOpen(false);
                    setSelectedReceipt(null);
                  }}
                  className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
