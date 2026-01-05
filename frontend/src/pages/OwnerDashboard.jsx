import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getMyRooms, getRoom, updateRoom, deleteRoom, updateBookingStatus } from '../services/ownerService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Plus, Edit, Trash2, Home, Calendar } from 'lucide-react';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const fileInputRef = useRef(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [lastAttachedIndex, setLastAttachedIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    monthly_rent: '',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
    amenities: '',
    images: [], // preview data URLs
    imageFiles: [], // actual File objects for upload
    isAvailable: true,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const roomsRes = await getMyRooms();
      setRooms(roomsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Read files as data URLs and append to images array
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const dataUrls = await Promise.all(
        files.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        )
      );
      setFormData((prev) => ({
        ...(prev || {}),
        images: [...(prev.images || []), ...dataUrls],
        imageFiles: [...(prev.imageFiles || []), ...files],
      }));
    } catch (err) {
      console.error('Error reading files', err);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const newImgs = prev.images.filter((_, i) => i !== index);
      let newFiles = prev.imageFiles || [];
      if (prev.imageFiles && prev.imageFiles.length > 0) {
        // If the removed index corresponds to an uploaded file, remove it from imageFiles
        if (index < prev.imageFiles.length) {
          newFiles = prev.imageFiles.filter((_, i) => i !== index);
        } else {
          // otherwise leave files as-is (existing remote images removed)
          newFiles = prev.imageFiles;
        }
      }
      return { ...(prev || {}), images: newImgs, imageFiles: newFiles };
    });
    // update attached file tracking if necessary
    setLastAttachedIndex((prevIdx) => {
      if (prevIdx === null) return prevIdx;
      if (index === prevIdx) {
        setAttachedFileName('');
        return null;
      }
      return index < prevIdx ? prevIdx - 1 : prevIdx;
    });
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setFormData((prev) => {
        const imgs = [...(prev.images || []), dataUrl];
        const newIndex = imgs.length - 1;
        setLastAttachedIndex(newIndex);
        setAttachedFileName(file.name);
        return { ...(prev || {}), images: imgs, imageFiles: [...(prev.imageFiles || []), file] };
      });
      // clear the input so same file can be selected again if needed
      e.target.value = '';
    } catch (err) {
      console.error('Error reading attached file', err);
    }
  };

  const removeAttached = () => {
    if (lastAttachedIndex === null) return;
    removeImage(lastAttachedIndex);
    setAttachedFileName('');
    setLastAttachedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build FormData for file upload
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('address', formData.address);
      payload.append('city', formData.city);
      payload.append('state', formData.state);
      payload.append('zipCode', formData.zipCode);
      payload.append('monthly_rent', formData.monthly_rent);
      payload.append('bedrooms', formData.bedrooms);
      payload.append('bathrooms', formData.bathrooms);
      payload.append('area', formData.area || '');
      payload.append('amenities', formData.amenities || '');
      payload.append('isAvailable', formData.isAvailable ? 'true' : 'false');

      // Attach files if present
      (formData.imageFiles || []).forEach((file) => {
        payload.append('images', file);
      });

      // If no new files but existing image URLs (editing case), pass them as JSON so backend keeps them
      if ((formData.imageFiles || []).length === 0 && Array.isArray(formData.images)) {
        payload.append('images', JSON.stringify(formData.images));
      }

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
      } else {
        await createRoom(payload);
      }

      setShowRoomForm(false);
      setEditingRoom(null);
      resetForm();
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save room');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      title: room.title,
      description: room.description,
      address: room.address,
      city: room.city,
      state: room.state,
      zipCode: room.zipCode,
      monthly_rent: room.monthly_rent.toString(),
      bedrooms: room.bedrooms.toString(),
      bathrooms: room.bathrooms.toString(),
      area: room.area?.toString() || '',
      amenities: room.amenities,
      images: Array.isArray(room.images) ? room.images : (room.images ? room.images.split(',').map(s => s.trim()) : []),
      imageFiles: [],
      isAvailable: room.isAvailable,
    });
    setAttachedFileName('');
    setLastAttachedIndex(null);
    setShowRoomForm(true);
  };

  const handleDelete = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await deleteRoom(roomId);
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update booking status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      monthly_rent: '',
      bedrooms: '1',
      bathrooms: '1',
      area: '',
      amenities: '',
      images: [],
      isAvailable: true,
    });
    setAttachedFileName('');
    setLastAttachedIndex(null);
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

  if (user?.ownerStatus !== 'APPROVED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-4">
            Your owner account is pending approval from the administrator.
          </p>
          <button
            onClick={handleLogout}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={() => {
                  resetForm();
                  setEditingRoom(null);
                  setShowRoomForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </button>
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
        {showRoomForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Rent (NPR)</label>
                  <input
                    type="number"
                    name="monthly_rent"
                    required
                    step="0.01"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    required
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    required
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area (sq ft)</label>
                  <input
                    type="number"
                    name="area"
                    step="0.01"
                    value={formData.area}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Available</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  placeholder="WiFi, Parking, AC, etc."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Images</label>

                <div className="flex items-center space-x-2">
                  <button type="button" onClick={handleAttachClick} className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300">
                    Attach Image
                  </button>
                  {attachedFileName ? (
                    <div className="text-sm text-gray-700">
                      Selected: <span className="font-medium">{attachedFileName}</span>
                      <button type="button" onClick={removeAttached} className="ml-3 text-red-500 text-sm">Remove</button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No file selected</div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAttachSelect}
                />

                <div className="mt-2">
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="mt-1 block w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">You can select multiple images or paste image URLs in the box below.</p>
                </div>

                <div className="mt-2 flex space-x-2 overflow-x-auto">
                  {formData.images && formData.images.length > 0 && (
                    formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt={`preview-${idx}`} className="h-20 w-28 object-cover rounded mr-2" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded">x</button>
                      </div>
                    ))
                  )}
                </div>

                <input
                  type="text"
                  name="images"
                  value={Array.isArray(formData.images) ? formData.images.filter(Boolean).join(', ') : formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="Or paste image URLs, comma-separated"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div> 
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomForm(false);
                    setEditingRoom(null);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden">
                {(room.images && (Array.isArray(room.images) ? room.images.length > 0 : room.images)) && (
                  <img
                    src={Array.isArray(room.images) ? (room.images[0] || 'https://via.placeholder.com/400x300') : (room.images.split(',')[0].trim() || 'https://via.placeholder.com/400x300')}
                    alt={room.title}
                    className="w-full h-48 object-cover"
                  />
                )} 
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{room.city}, {room.state}</span>
                    <span className="font-bold text-blue-600">${room.monthly_rent}/month</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{room.bedrooms} bed • {room.bathrooms} bath</span>
                    <span className={room.isAvailable ? 'text-green-600' : 'text-red-600'}>
                      {room.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Additional metadata */}
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="mb-1"><strong>Address:</strong> {room.address}, {room.city}, {room.state} {room.zipCode}</p>
                    <p className="mb-1"><strong>Area:</strong> {room.area ? `${room.area}` : 'N/A'}</p>
                    <p className="mb-1">
                      <strong>Amenities:</strong> {typeof room.amenities === 'string' ? room.amenities : Array.isArray(room.amenities) ? room.amenities.join(', ') : ''}
                    </p>
                    <p className="mb-1"><strong>Status:</strong> <span className={room.status === 'APPROVED' ? 'text-green-600' : room.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-800'}>{room.status}</span></p>
                    <p className="text-xs text-gray-500"><strong>Created:</strong> {room.createdAt ? new Date(room.createdAt).toLocaleString() : ''}</p>
                  </div>
                  
                  {room.bookings && room.bookings.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Rent Requests ({room.bookings.length})
                      </h4>
                      <div className="space-y-2">
                        {room.bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="text-sm bg-gray-50 p-2 rounded">
                            <p className="font-medium">{booking.tenant.name || booking.tenant.email}</p>
                            <p className="text-gray-600">
                              {booking.start_month} to {booking.end_month}
                            </p>
                            <p className="text-gray-600">${booking.totalAmount}</p>
                            <div className="mt-2 flex space-x-2">
                              {booking.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => handleBookingStatus(booking.id, 'CANCELLED')}
                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleEdit(room)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new room.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;

