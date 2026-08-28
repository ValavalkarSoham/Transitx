import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import TransitBot from './components/TransitBot';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Student Routes */}
              <Route
                path="/student"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </PrivateRoute>
                }
              />

              {/* Protected Employee Routes */}
              <Route
                path="/employee"
                element={
                  <PrivateRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </PrivateRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          <TransitBot />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
