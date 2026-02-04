import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getMyRooms, getRoom, updateRoom, deleteRoom, updateBookingStatus } from '../services/ownerService';
import { signout } from '../services/authService';
import { clearAuth, getUser } from '../utils/auth';
import { Plus, Edit, Trash2, Home, Calendar, X, Check, LogOut, Building2, MapPin, Bed, Eye, ChevronUp, ChevronDown, Bell } from 'lucide-react';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [lastAttachedIndex, setLastAttachedIndex] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [formExpanded, setFormExpanded] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    monthly_rent: '',
    bedrooms: '1',
    amenities: '',
    images: [],
    imageFiles: [],
    isAvailable: true,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value.trim()) error = 'Title is required';
        else if (value.trim().length < 3) error = 'Title must be at least 3 characters';
        break;
      case 'monthly_rent':
        if (!value) error = 'Monthly rent is required';
        else if (parseFloat(value) <= 0) error = 'Rent must be greater than 0';
        break;
      case 'address':
        if (!value.trim()) error = 'Address is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'bedrooms':
        if (!value) error = 'Bedrooms is required';
        else if (parseInt(value) < 1) error = 'At least 1 bedroom is required';
        break;
      case 'description':
        if (!value.trim()) error = 'Description is required';
        else if (value.trim().length < 10) error = 'Description must be at least 10 characters';
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    Object.keys(formData).forEach((key) => {
      if (key !== 'images' && key !== 'imageFiles' && key !== 'isAvailable' && key !== 'amenities') {
        const error = validateField(key, formData[key]);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };

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
    const newValue = type === 'checkbox' ? checked : value;
    setFormData({
      ...formData,
      [name]: newValue,
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

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
        if (index < prev.imageFiles.length) {
          newFiles = prev.imageFiles.filter((_, i) => i !== index);
        } else {
          newFiles = prev.imageFiles;
        }
      }
      return { ...(prev || {}), images: newImgs, imageFiles: newFiles };
    });
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
    
    if (!validateForm()) {
      showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('address', formData.address);
      payload.append('city', formData.city);
      payload.append('monthly_rent', formData.monthly_rent);
      payload.append('bedrooms', formData.bedrooms);
      payload.append('amenities', formData.amenities || '');
      payload.append('isAvailable', formData.isAvailable ? 'true' : 'false');

      (formData.imageFiles || []).forEach((file) => {
        payload.append('images', file);
      });

      if ((formData.imageFiles || []).length === 0 && Array.isArray(formData.images)) {
        payload.append('images', JSON.stringify(formData.images));
      }

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        showToast('Room updated successfully!', 'success');
      } else {
        await createRoom(payload);
        showToast('Room created successfully!', 'success');
      }

      setShowRoomForm(false);
      setEditingRoom(null);
      resetForm();
      setFormErrors({});
      loadRooms();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save room', 'error');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      title: room.title,
      description: room.description,
      address: room.address,
      city: room.city,
      monthly_rent: room.monthly_rent.toString(),
      bedrooms: room.bedrooms?.toString() || '1',
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
      monthly_rent: '',
      bedrooms: '1',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your owner account is pending approval from the administrator.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Owner Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600">
                {user?.name || user?.email}
              </span>
              <button
                onClick={() => {
                  resetForm();
                  setEditingRoom(null);
                  setShowRoomForm(!showRoomForm);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Room
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Room Form */}
        {showRoomForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button
                onClick={() => {
                  setShowRoomForm(false);
                  setEditingRoom(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter room title"
                    className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                      formErrors.title
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Monthly Rent (NPR) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      name="monthly_rent"
                      step="0.01"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full px-4 pr-4 py-2.5 border rounded-lg outline-none transition-all ${
                        formErrors.monthly_rent
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                      }`}
                    />
                  </div>
                  {formErrors.monthly_rent && <p className="text-sm text-red-500">{formErrors.monthly_rent}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full address"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none transition-all ${
                        formErrors.address
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                      }`}
                    />
                  </div>
                  {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                      formErrors.city
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Bedrooms <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      placeholder="1"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none transition-all ${
                        formErrors.bedrooms
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                      }`}
                    />
                  </div>
                  {formErrors.bedrooms && <p className="text-sm text-red-500">{formErrors.bedrooms}</p>}
                </div>
                
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label className="ml-3 text-sm text-gray-700 cursor-pointer">Room is available for booking</label>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your room in detail..."
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all resize-none ${
                    formErrors.description
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-400'
                  }`}
                />
                {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Amenities</label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  placeholder="WiFi, Parking, AC, Kitchen, etc."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Images</label>
                
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleAttachClick} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Choose File
                  </button>
                  {attachedFileName ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{attachedFileName}</span>
                      <button type="button" onClick={removeAttached} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No file chosen</span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAttachSelect}
                />

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">Upload multiple images</p>
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`preview-${idx}`} className="h-20 w-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomForm(false);
                    setEditingRoom(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
                {(room.images && (Array.isArray(room.images) ? room.images.length > 0 : room.images)) && (
                  <img
                    src={Array.isArray(room.images) ? (room.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop') : (room.images.split(',')[0].trim() || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop')}
                    alt={room.title}
                    className="w-full h-44 object-cover"
                  />
                )}
                {room.bookings && room.bookings.filter(b => b.status === 'PENDING').length > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-full shadow-lg">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs font-semibold">{room.bookings.filter(b => b.status === 'PENDING').length}</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{room.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      room.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {room.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{room.address}, {room.city}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bed className="h-4 w-4 text-gray-400" />
                        <span>{room.bedrooms} bedroom</span>
                      </div>
                      <span className="font-semibold text-gray-900">NPR {room.monthly_rent}/mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first room</p>
            <button
              onClick={() => setShowRoomForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </button>
          </div>
        )}
      </div>

      {/* Room Detail Modal */}
      {isModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">{selectedRoom.title}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedRoom.address}, {selectedRoom.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-400">NPR</span>
                  <span className="font-semibold text-gray-900">{selectedRoom.monthly_rent}/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bed className="h-4 w-4 text-gray-400" />
                  <span>{selectedRoom.bedrooms} bedroom</span>
                </div>
                {selectedRoom.amenities && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Amenities:</span> {typeof selectedRoom.amenities === 'string' ? selectedRoom.amenities : Array.isArray(selectedRoom.amenities) ? selectedRoom.amenities.join(', ') : 'None'}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> <span className={selectedRoom.isAvailable ? 'text-emerald-600' : 'text-red-600'}>{selectedRoom.isAvailable ? 'Available' : 'Unavailable'}</span>
                </p>
                <p className="text-xs text-gray-400">Created: {selectedRoom.createdAt ? new Date(selectedRoom.createdAt).toLocaleDateString() : ''}</p>
              </div>

              {selectedRoom.bookings && selectedRoom.bookings.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Rent Requests ({selectedRoom.bookings.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedRoom.bookings.map((booking) => (
                      <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">{booking.tenant.name || booking.tenant.email}</p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {booking.start_month} to {booking.end_month}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">NPR {booking.totalAmount}</p>
                        {booking.status === 'PENDING' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')}
                              className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleBookingStatus(booking.id, 'CANCELLED')}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
