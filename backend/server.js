const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const Bus = require('./models/Bus');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/employees', employeeRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('TransitX API is running...');
});

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Driver starts a trip
  socket.on('startTrip', async ({ busId }) => {
    try {
      const bus = await Bus.findByIdAndUpdate(
        busId,
        { status: 'active' },
        { new: true }
      ).populate('routeId');

      if (bus) {
        console.log(`Bus ${bus.busNumber} started trip`);
        socket.join(`bus_${busId}`);
        io.emit('tripStarted', { busId, status: 'active', busNumber: bus.busNumber });
      }
    } catch (err) {
      console.error('Error starting trip in socket:', err.message);
    }
  });

  // Client joins a bus room to receive location updates for that bus
  socket.on('joinBus', ({ busId }) => {
    socket.join(`bus_${busId}`);
    console.log(`Socket ${socket.id} joined bus room: bus_${busId}`);
  });

  // Driver updates location (supports both 'locationUpdate' and 'busLocation' event names)
  const handleLocationUpdate = async ({ busId, lat, lng }) => {
    try {
      if (!busId || lat === undefined || lng === undefined) return;
      
      // Update location in DB
      const bus = await Bus.findByIdAndUpdate(
        busId,
        { currentLocation: { lat, lng }, status: 'active' },
        { new: true }
      );

      if (bus) {
        console.log(`[LIVE GPS] Bus ${bus.busNumber} location: [${lat.toFixed ? lat.toFixed(5) : lat}, ${lng.toFixed ? lng.toFixed(5) : lng}]`);
        // Broadcast new location to clients in the room
        io.to(`bus_${busId}`).emit('busLocation', {
          busId,
          lat,
          lng,
          lastUpdated: new Date(),
        });
        
        // Also broadcast general update for admin map
        io.emit('globalLocationUpdate', {
          busId,
          lat,
          lng,
          busNumber: bus.busNumber
        });
      }
    } catch (err) {
      console.error('Error updating location in socket:', err.message);
    }
  };

  socket.on('locationUpdate', handleLocationUpdate);
  socket.on('busLocation', handleLocationUpdate);

  // Driver stops a trip
  socket.on('stopTrip', async ({ busId }) => {
    try {
      const bus = await Bus.findByIdAndUpdate(
        busId,
        { status: 'inactive' },
        { new: true }
      );

      if (bus) {
        console.log(`Bus ${bus.busNumber} stopped trip`);
        io.emit('tripEnded', { busId, status: 'inactive' });
      }
    } catch (err) {
      console.error('Error stopping trip in socket:', err.message);
    }
  });

  // Student notifies driver they are running late
  socket.on('lateNotice', ({ busId, studentName, rollNumber, delayMinutes, stopName }) => {
    console.log(`Student ${studentName} is running ${delayMinutes} mins late for Bus ${busId}`);
    // Broadcast notification to all clients in the bus room (including the driver)
    io.to(`bus_${busId}`).emit('lateNoticeReceived', {
      studentName,
      rollNumber,
      delayMinutes,
      stopName,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
