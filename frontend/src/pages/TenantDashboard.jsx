import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRooms, bookRoom, getMyBookings, getRoom, cancelBooking } from '../services/tenantService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Search, Calendar, MapPin, Bed, Bath, Home, X, Check, Clock, LogOut, Filter, ChevronRight } from 'lucide-react';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    start_month: '',
    end_month: '',
  });

  useEffect(() => {
    if (activeTab === 'rooms') {
      loadRooms();
    } else {
      loadBookings();
    }
  }, [activeTab, filters]);

  const loadRooms = async () => {
    try {
      const res = await getAllRooms(filters);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (bookingData.end_month <= bookingData.start_month) {
      alert('End month must be after start month. Minimum rental period is 1 month.');
      return;
    }
    
    try {
      await bookRoom({
        roomId: selectedRoom.id,
        start_month: bookingData.start_month,
        end_month: bookingData.end_month,
      });
      setShowBookingForm(false);
      setSelectedRoom(null);
      setBookingData({ start_month: '', end_month: '' });
      loadBookings();
      alert('Rent request submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rent request');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">RoomFinder</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-700">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('rooms');
              setLoading(true);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'rooms'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Search className="h-4 w-4" />
            Browse Rooms
          </button>
          <button
            onClick={() => {
              setActiveTab('bookings');
              setLoading(true);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'bookings'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            My Bookings
            {bookings.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                {bookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="City"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <input
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min price"
                  className="w-full px-4 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <input
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max price"
                  className="w-full px-4 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="bedrooms"
                  value={filters.bedrooms}
                  onChange={handleFilterChange}
                  placeholder="Bedrooms"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rooms List */}
        {activeTab === 'rooms' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                    <div className="relative h-44 overflow-hidden">
                      {room.images && ((Array.isArray(room.images) && room.images.length > 0) || (typeof room.images === 'string' && room.images.trim())) ? (
                        <img
                          src={Array.isArray(room.images) ? (room.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop') : (room.images.split(',')[0].trim() || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop')}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Home className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-bold text-gray-900">NPR {room.monthly_rent}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{room.title}</h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{room.description}</p>
                      
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{room.city}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5 text-gray-400" />
                            <span>{room.bedrooms} bed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5 text-gray-400" />
                            <span>{room.bathrooms || 1} bath</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBookRoom(room)}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        Book Now
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </>
        )}

        {/* Bookings List */}
        {activeTab === 'bookings' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">{booking.room.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {booking.status === 'CONFIRMED' && <Check className="h-3 w-3" />}
                              {booking.status === 'CANCELLED' && <X className="h-3 w-3" />}
                              {booking.status === 'PENDING' && <Clock className="h-3 w-3" />}
                              {booking.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{booking.room.address}, {booking.room.city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{booking.start_month} to {booking.end_month}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                            <p className="text-xl font-bold text-gray-900">NPR {booking.totalAmount}</p>
                          </div>
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-4">Start browsing rooms to make your first request.</p>
                <button
                  onClick={() => {
                    setActiveTab('rooms');
                    setLoading(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Browse Rooms
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request to Rent</h3>
                <p className="text-sm text-gray-500 mt-0.5">{selectedRoom.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedRoom(null);
                  setBookingData({ start_month: '', end_month: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  name="start_month"
                  required
                  min={new Date().toISOString().slice(0, 7)}
                  value={bookingData.start_month}
                  onChange={(e) => setBookingData({ ...bookingData, start_month: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  name="end_month"
                  required
                  min={bookingData.start_month || new Date().toISOString().slice(0, 7)}
                  value={bookingData.end_month}
                  onChange={(e) => setBookingData({ ...bookingData, end_month: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                />
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Minimum rental period is 1 month
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedRoom(null);
                    setBookingData({ start_month: '', end_month: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
