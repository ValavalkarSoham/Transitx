const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');

dotenv.config();

const users = [
  {
    name: 'TransitX Admin',
    email: 'admin@transitx.com',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    name: 'Vipul Driver (Margao)',
    email: 'vipul@transitx.com',
    password: 'employeepassword',
    role: 'employee',
    employeeId: 'EMP050',
    designation: 'Driver',
    shiftStart: '08:00',
    shiftEnd: '16:00',
  },
  {
    name: 'Shubham Driver (Marcel)',
    email: 'shubham@transitx.com',
    password: 'employeepassword',
    role: 'employee',
    employeeId: 'EMP043',
    designation: 'Driver',
    shiftStart: '07:00',
    shiftEnd: '15:00',
  },
  {
    name: 'Alex Student (Goa Campus)',
    email: 'alex@transitx.com',
    password: 'studentpassword',
    role: 'student',
    rollNumber: 'PU-GOA-2026',
    department: 'Computer Applications',
    passStatus: 'active',
    passPlan: 'Semester Pass',
    passValidUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
  },
];

// All 20 routes from Parul University Goa transport sheet
const routes = [
  {
    routeName: 'Route 1 - Marcel Line',
    stops: [
      { name: 'Marcel Busstand', lat: 15.5186, lng: 73.9669 },
      { name: 'Banastarim Junction', lat: 15.4984, lng: 73.9786 },
      { name: 'Corlim Stop', lat: 15.5009, lng: 73.9242 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 2 - Bicholim Line',
    stops: [
      { name: 'ITI College', lat: 15.5901, lng: 73.961 },
      { name: 'Sarvan Bus Stop', lat: 15.603, lng: 73.9702 },
      { name: 'Kudnem Bus Stop', lat: 15.5684, lng: 74.004 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 3 - Sanquelim Line',
    stops: [
      { name: 'Shivaji Circle', lat: 15.5639, lng: 74.018 },
      { name: 'Sanquelim Hospital', lat: 15.5645, lng: 74.02 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 4 - Mapusa Line',
    stops: [
      { name: 'Mapusa Bus Stand', lat: 15.5908, lng: 73.8118 },
      { name: 'Guirim Tisk', lat: 15.5562, lng: 73.8164 },
      { name: 'Ocoquerio', lat: 15.5342, lng: 73.8157 },
      { name: 'Mall de Goa', lat: 15.5204, lng: 73.8211 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 5 - Porvorim Line',
    stops: [
      { name: 'Maruti Sai Service', lat: 15.527, lng: 73.82 },
      { name: 'Three Buildings', lat: 15.531, lng: 73.83 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 6 - Panjim Line',
    stops: [
      { name: 'Hira Petrol Pump', lat: 15.495, lng: 73.825 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 7 - Bambolim Line',
    stops: [
      { name: 'Goa Medical College', lat: 15.459, lng: 73.858 },
      { name: 'GMC Hostel', lat: 15.46, lng: 73.861 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 8 - Vasco Line',
    stops: [
      { name: 'Vasco Municipality', lat: 15.398, lng: 73.8114 },
      { name: 'Goa Shipyard', lat: 15.3971, lng: 73.821 },
      { name: 'Chicalim Junction', lat: 15.4011, lng: 73.8398 },
      { name: 'Jaisanto (MES)', lat: 15.3895, lng: 73.8569 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 9 - Ponda Line',
    stops: [
      { name: 'Ponda KTC Busstand', lat: 15.4018, lng: 74.0124 },
      { name: 'Old Busstand', lat: 15.398, lng: 74.014 },
      { name: 'Ponda Tisk', lat: 15.4069, lng: 74.025 },
      { name: 'Borim Bridge', lat: 15.3533, lng: 73.9926 },
      { name: 'Khandepar', lat: 15.421, lng: 74.038 },
      { name: 'Bethoda Signal', lat: 15.381, lng: 74.021 },
      { name: 'Shivaji Circle Usgao', lat: 15.441, lng: 74.053 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 10 - Old Goa Line',
    stops: [
      { name: 'Nearby Overbridge', lat: 15.503, lng: 73.914 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 11 - Canacona Line',
    stops: [
      { name: 'Mashem', lat: 14.981, lng: 74.039 },
      { name: 'Canacona KTC Busstand', lat: 15.002, lng: 74.045 },
      { name: 'Four Road', lat: 15.011, lng: 74.048 },
      { name: 'Barshem', lat: 15.051, lng: 74.072 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 12 - Sanguem Line',
    stops: [
      { name: 'Sanguem Busstand', lat: 15.228, lng: 74.155 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 13 - Curchorem Line',
    stops: [
      { name: 'Savordem Tisk Circle', lat: 15.259, lng: 74.119 },
      { name: 'Shivaji Circle', lat: 15.247, lng: 74.112 },
      { name: 'Ambedkar Circle', lat: 15.245, lng: 74.11 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 14 - Verna Line',
    stops: [
      { name: 'Birla Cross', lat: 15.391, lng: 73.882 },
      { name: 'Pirni Circle', lat: 15.361, lng: 73.931 },
      { name: 'Cansaulim Highway Junction', lat: 15.352, lng: 73.889 },
      { name: 'Nuem', lat: 15.321, lng: 73.939 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 15 - Cortalim Line',
    stops: [
      { name: 'Cortalim Junction', lat: 15.392, lng: 73.914 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 16 - Pillar Line',
    stops: [
      { name: 'NH Highway Turning Point', lat: 15.441, lng: 73.905 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 17 - Margao Line',
    stops: [
      { name: 'Margao KTC Bustand', lat: 15.2891, lng: 73.9592 },
      { name: 'Easybuy Navelim', lat: 15.2678, lng: 73.9691 },
      { name: 'Navelim Church', lat: 15.2662, lng: 73.9744 },
      { name: 'Furtado Petrol Pump Junction', lat: 15.265, lng: 73.979 },
      { name: 'Darmapur Stop', lat: 15.2638, lng: 73.9992 },
      { name: 'Rai Bus Stop', lat: 15.2758, lng: 74.0204 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 18 - Quepem Line',
    stops: [
      { name: 'Tilamol Circle', lat: 15.215, lng: 74.062 },
      { name: 'Quepem Municipal Market', lat: 15.221, lng: 74.072 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 19 - Cuncolim Line',
    stops: [
      { name: 'Cuncolim KTC Bus Stand', lat: 15.178, lng: 73.985 },
      { name: 'Balli', lat: 15.161, lng: 74.004 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
  {
    routeName: 'Route 20 - Chinchinim Line',
    stops: [
      { name: 'Chinchinim - Our Lady of Hope Church', lat: 15.211, lng: 73.955 },
      { name: 'PU Goa Campus (Quitol)', lat: 15.1389, lng: 73.9669 },
    ],
  },
];

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitx');
    console.log('MongoDB connected for seeding Goa routes...');

    // Clear existing data
    await User.deleteMany();
    await Route.deleteMany();
    await Bus.deleteMany();
    await Trip.deleteMany();
    console.log('Data cleared...');

    // Seed Users
    const createdUsers = [];
    for (const u of users) {
      const user = new User(u);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`${createdUsers.length} Users seeded.`);

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const employees = createdUsers.filter((u) => u.role === 'employee');

    // Seed Routes
    const createdRoutes = await Route.insertMany(routes);
    console.log(`${createdRoutes.length} Routes seeded.`);

    // Seed Buses and assign route/employee
    const buses = [
      {
        busNumber: 'GA-08-F-1234', // Margao
        capacity: 50,
        routeId: createdRoutes.find(r => r.routeName.includes('Margao'))._id,
        driverId: employees[0]._id,
        status: 'inactive',
        currentLocation: {
          lat: createdRoutes.find(r => r.routeName.includes('Margao')).stops[0].lat,
          lng: createdRoutes.find(r => r.routeName.includes('Margao')).stops[0].lng,
        },
      },
      {
        busNumber: 'GA-01-H-5678', // Marcel
        capacity: 45,
        routeId: createdRoutes.find(r => r.routeName.includes('Marcel'))._id,
        driverId: employees[1]._id,
        status: 'inactive',
        currentLocation: {
          lat: createdRoutes.find(r => r.routeName.includes('Marcel')).stops[0].lat,
          lng: createdRoutes.find(r => r.routeName.includes('Marcel')).stops[0].lng,
        },
      },
    ];

    const createdBuses = await Bus.insertMany(buses);
    console.log(`${createdBuses.length} Buses seeded.`);

    console.log('Database Seeding Completed Successfully with All 20 Goa Routes!');
    process.exit();
  } catch (error) {
    console.error('Error with seeding data:', error);
    process.exit(1);
  }
};

seedData();
