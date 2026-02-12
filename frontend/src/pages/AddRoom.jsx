import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';

const AddRoom = ({ room, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    monthly_rent: '',
    bedrooms: '1',
    bathrooms: '1',
    amenities: '',
    ownerId: '1',
    isAvailable: true,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        title: room.title || '',
        description: room.description || '',
        address: room.address || '',
        city: room.city || '',
        monthly_rent: room.monthly_rent?.toString() || '',
        bedrooms: room.bedrooms?.toString() || '1',
        bathrooms: room.bathrooms?.toString() || '1',
        amenities: room.amenities || '',
        ownerId: room.ownerId?.toString() || '1',
        isAvailable: room.isAvailable ?? true,
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          const value = typeof formData[key] === 'boolean' ? formData[key].toString() : formData[key];
          formDataToSend.append(key, value);
        }
      });

      if (selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          formDataToSend.append('images', file);
        });
      }

      if (room) {
        await roomService.update(room.id, formDataToSend);
      } else {
        await roomService.create(formDataToSend);
      }
      setSelectedImages([]);
      onClose();
    } catch (err) {
      console.error('Error saving room:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to save room';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 w-full max-w-2xl card">
        <h2 className="text-2xl font-bold mb-4">{room ? 'Edit Room' : 'Add Room'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent (NPR) *</label>
              <input
                type="number"
                name="monthly_rent"
                required
                step="0.01"
                value={formData.monthly_rent}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address *</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                step="0.5"
                value={formData.bathrooms}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner ID *</label>
              <input
                type="number"
                name="ownerId"
                required
                value={formData.ownerId}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 text-orange-500 focus:ring-orange-200 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Available</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              required
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amenities</label>
            <input
              type="text"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="WiFi, Parking, AC, etc."
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {selectedImages.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedImages.length} file(s) selected
              </div>
            )}
            {room && room.images && (
              <div className="mt-2 text-sm text-gray-500">
                Current images: {room.images.split(',').length} image(s)
              </div>
            )}
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (room ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoom;

