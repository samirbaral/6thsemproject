import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRooms, bookRoom, getMyBookings, getRoom, cancelBooking } from '../services/tenantService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Search, Calendar, MapPin, Bed, Bath, Home } from 'lucide-react';

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
    checkIn: '',
    checkOut: '',
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
    try {
      await bookRoom({
        roomId: selectedRoom.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
      });
      setShowBookingForm(false);
      setSelectedRoom(null);
      setBookingData({ checkIn: '', checkOut: '' });
      loadBookings();
      alert('Room booked successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book room');
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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Tenant Dashboard</h1>
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
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('rooms');
                setLoading(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rooms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Rooms
            </button>
            <button
              onClick={() => {
                setActiveTab('bookings');
                setLoading(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Bookings
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'rooms' && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="Search city..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Price ($)</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Price ($)</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={filters.bedrooms}
                  onChange={handleFilterChange}
                  placeholder="Bedrooms"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingForm && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Book {selectedRoom.title}</h3>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                    <input
                      type="date"
                      name="checkIn"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                    <input
                      type="date"
                      name="checkOut"
                      required
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Book Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false);
                        setSelectedRoom(null);
                        setBookingData({ checkIn: '', checkOut: '' });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Rooms List */}
        {activeTab === 'rooms' && (
          <>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {room.images && (
                      <img
                        src={room.images.split(',')[0].trim() || 'https://via.placeholder.com/400x300'}
                        alt={room.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {room.address}, {room.city}, {room.state}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Bed className="h-4 w-4 mr-1" />
                        {room.bedrooms} bed
                        <Bath className="h-4 w-4 ml-3 mr-1" />
                        {room.bathrooms} bath
                      </div>
                      {room.amenities && (
                        <p className="text-xs text-gray-500 mb-4">{room.amenities}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">${room.price}</span>
                        <span className="text-sm text-gray-500">/day</span>
                      </div>
                      <button
                        onClick={() => handleBookRoom(room)}
                        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && rooms.length === 0 && (
              <div className="text-center py-12">
                <Home className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}

        {/* Bookings List */}
        {activeTab === 'bookings' && (
          <>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {bookings.length === 0 ? (
                  <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <li key={booking.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">{booking.room.title}</h3>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1" />
                                {booking.room.address}, {booking.room.city}
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-lg font-semibold text-gray-900">${booking.totalAmount}</p>
                              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;

