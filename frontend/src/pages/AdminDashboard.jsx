import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingOwners, approveOwner, rejectOwner, getStats, getPendingRooms, approveRoom, rejectRoom } from '../services/adminService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Users, Home, Calendar, Clock, CheckCircle, XCircle, Building2, BarChart3, LogOut, ChevronRight, MapPin } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [pendingOwners, setPendingOwners] = useState([]);
  const [stats, setStats] = useState(null);
  const [pendingRooms, setPendingRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ownersRes, statsRes, roomsRes] = await Promise.allSettled([
        getPendingOwners(),
        getStats(),
        getPendingRooms(),
      ]);
      if (ownersRes.status === 'fulfilled') {
        setPendingOwners(ownersRes.value.data);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (roomsRes.status === 'fulfilled') {
        setPendingRooms(roomsRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ownerId) => {
    try {
      await approveOwner(ownerId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve owner');
    }
  };

  const handleReject = async (ownerId) => {
    try {
      await rejectOwner(ownerId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject owner');
    }
  };

  const handleApproveRoom = async (roomId) => {
    try {
      await approveRoom(roomId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve room');
    }
  };

  const handleRejectRoom = async (roomId) => {
    try {
      await rejectRoom(roomId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject room');
    }
  };

  const handleLogout = async () => {
    clearAuth();
    navigate('/login');
    try {
      await signout();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-700"></div>
          <span className="text-slate-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="page-container">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <span className="text-sm text-slate-600">Welcome,</span>
                <span className="text-sm font-medium text-slate-800">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-primary text-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="page-container py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Rooms</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalRooms}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Owners</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pendingOwners}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Owners */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-800">Pending Owner Approvals</h3>
              </div>
              {pendingOwners.length > 0 && (
                <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {pendingOwners.length} pending
                </span>
              )}
            </div>
            {pendingOwners.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-500">No pending owners</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingOwners.map((owner) => (
                  <div key={owner.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium">
                        {(owner.name || owner.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{owner.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{owner.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Registered: {new Date(owner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="btn-soft text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(owner.id)}
                        className="btn-secondary text-sm text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Rooms */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-800">Pending Room Approvals</h3>
              </div>
              {pendingRooms.length > 0 && (
                <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {pendingRooms.length} pending
                </span>
              )}
            </div>
            {pendingRooms.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-500">No pending rooms</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRooms.map((room) => (
                  <div key={room.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop'} 
                        alt={room.title} 
                        className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{room.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {room.address}, {room.city}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Owner: {room.owner?.name || room.owner?.email || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Created: {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRoom(room.id)}
                          className="btn-soft text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRoom(room.id)}
                          className="btn-secondary text-sm text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
