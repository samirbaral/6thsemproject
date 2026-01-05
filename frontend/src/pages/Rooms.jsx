import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import AddRoom from './AddRoom';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { data } = await roomService.getAll();
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await roomService.delete(id);
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingRoom(null);
    loadRooms();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <button
          onClick={() => {
            setEditingRoom(null);
            setShowAddForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Room
        </button>
      </div>

      {showAddForm && (
        <AddRoom room={editingRoom} onClose={handleFormClose} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white border rounded-lg overflow-hidden shadow">
            {room.images && room.images.split(',')[0] && (
              <img
                src={room.images.split(',')[0].trim()}
                alt={room.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{room.title}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{room.description}</p>
              <p className="text-sm text-gray-500 mb-2">{room.address}, {room.city}, {room.state}</p>
              <p className="text-lg font-bold text-blue-600 mb-4">${room.monthly_rent}/month</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No rooms found. Click "Add Room" to create one.
        </div>
      )}
    </div>
  );
};

export default Rooms;

