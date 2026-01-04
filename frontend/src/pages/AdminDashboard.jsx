import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingOwners, approveOwner, rejectOwner, getStats } from '../services/adminService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Users, Home, Calendar, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [pendingOwners, setPendingOwners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ownersRes = await getPendingOwners();
      const statsRes = await getStats();
      setPendingOwners(ownersRes.data);
      setStats(statsRes.data);
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

  const handleLogout = async () => {
    try {
      await signout();
    } catch (err) {
      console.error(err);
    }
    clearAuth();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Home className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Rooms</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalRooms}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalBookings}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Owners</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingOwners}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Owners */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Owner Approvals</h3>
          </div>
          {pendingOwners.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
              No pending owners
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingOwners.map((owner) => (
                <li key={owner.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{owner.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{owner.email}</p>
                      <p className="text-xs text-gray-400">
                        Registered: {new Date(owner.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(owner.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

