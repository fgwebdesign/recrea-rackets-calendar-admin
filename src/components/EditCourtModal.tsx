import React, { useState, useEffect } from 'react';

interface EditCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditCourt: (court: { id: number; name: string; isCovered: boolean; availableTimeSlots: string[]; type: string }) => void;
  court: { id: number; name: string; isCovered: boolean; availableTimeSlots: string[]; type: string };
}

const EditCourtModal: React.FC<EditCourtModalProps> = ({ isOpen, onClose, onEditCourt, court }) => {
  const [courtName, setCourtName] = useState(court.name);
  const [isCovered, setIsCovered] = useState(court.isCovered);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(court.availableTimeSlots);
  const [courtType, setCourtType] = useState(court.type);

  useEffect(() => {
    setCourtName(court.name);
    setIsCovered(court.isCovered);
    setSelectedTimeSlots(court.availableTimeSlots);
    setCourtType(court.type);
  }, [court]);

  const timeSlots = [
    '08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30', '12:30 - 14:00',
    '14:00 - 15:30', '15:30 - 17:00', '17:00 - 18:30', '18:30 - 20:00',
    '20:00 - 21:30', '21:30 - 23:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCourt = {
      id: court.id,
      name: courtName,
      isCovered,
      availableTimeSlots: selectedTimeSlots,
      type: courtType,
    };
    onEditCourt(updatedCourt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl border-4 border-gradient-to-r from-blue-500 to-purple-600">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Court</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-blue-300 rounded-lg p-4">
            <label htmlFor="courtName" className="block text-sm font-semibold text-gray-700 mb-1">Court Name</label>
            <input
              type="text"
              id="courtName"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="border-2 border-purple-300 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Court Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="padel"
                  checked={courtType === 'padel'}
                  onChange={() => setCourtType('padel')}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">🎾 Padel</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="football"
                  checked={courtType === 'football'}
                  onChange={() => setCourtType('football')}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">⚽ Football</span>
              </label>
            </div>
          </div>
          <div className="border-2 border-green-300 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 font-semibold text-gray-700">Covered Court</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {isCovered ? "This court is protected from weather conditions." : "This court is open-air."}
            </p>
          </div>
          <div className="border-2 border-yellow-300 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Available Time Slots</label>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => (
                <label key={slot} className="inline-flex items-center bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    value={slot}
                    checked={selectedTimeSlots.includes(slot)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTimeSlots([...selectedTimeSlots, slot]);
                      } else {
                        setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{slot}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourtModal;