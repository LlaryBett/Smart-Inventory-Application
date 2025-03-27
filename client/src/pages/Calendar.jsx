import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../context/AuthContext';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '',
    type: 'inventory'
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await axios.get('https://smart-inventory-application-1.onrender.com/api/calendar/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Error fetching events. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Get calendar data
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  // Calendar navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  // Event handlers
  const handleDateClick = (day) => {
    const selectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(selectedDate);
    setIsModalOpen(true);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDate || !newEvent.title) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.post('https://smart-inventory-application-1.onrender.com/api/calendar/events', 
        {
          ...newEvent,
          date: selectedDate.toISOString() // Send date in ISO format
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setEvents([...events, response.data]);
      setNewEvent({ title: '', description: '', time: '', type: 'inventory' });
      setIsModalOpen(false);
      toast.success('Event created successfully!'); // Use react-toastify
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.response && error.response.status === 403) {
        toast.error('Unauthorized: Only admins can add events.');
      } else {
        toast.error('Failed to create event. Please try again.');
      }
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const getRandomColor = () => {
    const colors = ['bg-red-100', 'bg-green-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <div className="max-w-6xl mx-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Inventory Calendar</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-700">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg">
          {/* Day names */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {[...Array(firstDayOfMonth)].map((_, index) => (
              <div key={`empty-${index}`} className="bg-white p-4 min-h-[120px]" />
            ))}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`bg-white p-4 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${dayEvents.length > 0 ? getRandomColor() : ''}`}
                >
                  <div className={`font-semibold text-gray-700 mb-2 ${isToday(day) ? 'relative' : ''}`}>
                    {day}
                    {isToday(day) && (
                      <span className="absolute top-0 right-0 inline-block w-6 h-6 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-sm p-1 mb-1 rounded bg-blue-100 text-blue-800 relative group"
                    >
                      {event.title}
                      <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-white border border-gray-300 rounded shadow-lg text-gray-700 text-xs hidden group-hover:block">
                        {event.description}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Event Modal */}
        {isModalOpen && user?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add Event - {selectedDate?.toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddEvent}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, type: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inventory">Inventory</option>
                      <option value="delivery">Delivery</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;