import { useState } from 'react';

const floorData = {
  1: {
    label: 'Floor 1',
    rooms: ['101', '102', '103', '104', '105', '106', '107', '108'],
    locations: [
      { id: 'lobby-ground', label: 'Lobby', type: 'location' },
      { id: 'reception-ground', label: 'Reception', type: 'location' },
    ],
  },
  2: {
    label: 'Floor 2',
    rooms: ['201', '202', '203', '204', '205', '206', '207', '208'],
    locations: [
      { id: 'restaurant-floor2', label: 'Restaurant', type: 'location' },
      { id: 'gym-floor2', label: 'Gym', type: 'location' },
    ],
  },
  3: {
    label: 'Floor 3',
    rooms: ['301', '302', '303', '304', '305', '306', '307', '308'],
    locations: [
      { id: 'banquet-floor3', label: 'Banquet Hall', type: 'location' },
    ],
  },
  4: {
    label: 'Floor 4',
    rooms: ['401', '402', '403', '404', '405', '406', '407', '408'],
    locations: [],
  },
  5: {
    label: 'Floor 5',
    rooms: ['501', '502', '503', '504', '505', '506', '507', '508'],
    locations: [],
  },
  terrace: {
    label: 'Terrace',
    rooms: [],
    locations: [
      { id: 'pool-terrace', label: 'Swimming Pool', type: 'location' },
      { id: 'garden-terrace', label: 'Garden', type: 'location' },
    ],
  },
  basement: {
    label: 'Basement',
    rooms: [],
    locations: [
      { id: 'parking-basement', label: 'Parking', type: 'location' },
    ],
  },
};

const HotelMap = ({ incidents = [] }) => {
  const [selectedFloor, setSelectedFloor] = useState(1);

  const currentFloorData = floorData[selectedFloor] || { rooms: [], locations: [] };

  const getRoomStatus = (roomNumber) => {
    const incident = incidents.find(
      (i) =>
        i.roomNumber === roomNumber &&
        i.floor === String(selectedFloor) &&
        i.status !== 'resolved'
    );
    if (!incident) {
      const resolved = incidents.find(
        (i) =>
          i.roomNumber === roomNumber &&
          i.floor === String(selectedFloor) &&
          i.status === 'resolved'
      );
      return resolved ? 'resolved' : 'clear';
    }
    return 'active';
  };

  const getLocationStatus = (locationId) => {
    const parts = locationId.split('-');
    const locName = parts[0];
    const incident = incidents.find(
      (i) =>
        i.roomNumber &&
        i.roomNumber.toLowerCase() === locName.toLowerCase() &&
        i.status !== 'resolved'
    );
    if (!incident) {
      const resolved = incidents.find(
        (i) =>
          i.roomNumber &&
          i.roomNumber.toLowerCase() === locName.toLowerCase() &&
          i.status === 'resolved'
      );
      return resolved ? 'resolved' : 'clear';
    }
    return 'active';
  };

  const getRoomIncident = (roomNumber) => {
    return incidents.find(
      (i) =>
        i.roomNumber === roomNumber &&
        i.floor === String(selectedFloor) &&
        i.status !== 'resolved'
    );
  };

  const getLocationIncident = (locationId) => {
    const parts = locationId.split('-');
    const locName = parts[0];
    return incidents.find(
      (i) =>
        i.roomNumber &&
        i.roomNumber.toLowerCase() === locName.toLowerCase() &&
        i.status !== 'resolved'
    );
  };

  const statusColors = {
    clear: 'bg-navy-600 border-border hover:border-text-secondary',
    active: 'bg-accent-red border-accent-red animate-pulse-red',
    resolved: 'bg-status-success border-green-700',
  };

  const locationStatusColors = {
    clear: 'bg-navy-750 border-border hover:border-text-secondary border-dashed',
    active: 'bg-accent-red border-accent-red animate-pulse-red border-dashed',
    resolved: 'bg-status-success border-green-700 border-dashed',
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Hotel Floor Plan
          </h2>
          <p className="text-text-muted text-[10px] uppercase tracking-wider mt-0.5">
            {currentFloorData.label} — Operational Zone
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline text-[10px] px-3 py-1.5">Zoom</button>
          <button className="btn-outline text-[10px] px-3 py-1.5">Layers</button>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(floorData).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSelectedFloor(isNaN(key) ? key : Number(key))}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
              String(selectedFloor) === String(key)
                ? 'bg-accent-red text-white'
                : 'bg-navy-750 text-text-secondary border border-border hover:text-white'
            }`}
          >
            {value.label}
          </button>
        ))}
      </div>

      {/* Map Area */}
      <div className="card-dark p-4 sm:p-6">

        {/* Rooms Section */}
        {currentFloorData.rooms.length > 0 && (
          <div className="mb-6">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-border pb-2">
              Rooms
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentFloorData.rooms.map((room) => {
                const status = getRoomStatus(room);
                const incident = getRoomIncident(room);
                return (
                  <div
                    key={room}
                    className={`p-4 border text-center transition-all cursor-pointer ${statusColors[status]}`}
                  >
                    <span className="text-white text-sm font-bold block">{room}</span>
                    {incident && (
                      <span className="text-white text-[9px] uppercase tracking-wider mt-1 block">
                        {incident.type || incident.incidentType}
                      </span>
                    )}
                    {status === 'clear' && (
                      <span className="text-text-muted text-[9px] mt-1 block">Clear</span>
                    )}
                    {status === 'resolved' && (
                      <span className="text-green-300 text-[9px] mt-1 block">Resolved</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Corridor Divider */}
        {currentFloorData.rooms.length > 0 && currentFloorData.locations.length > 0 && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-dashed border-border" />
            <span className="text-text-muted text-[9px] uppercase tracking-widest">
              Corridor Zone
            </span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
        )}

        {/* Common Locations Section */}
        {currentFloorData.locations.length > 0 && (
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-border pb-2">
              Common Areas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentFloorData.locations.map((loc) => {
                const status = getLocationStatus(loc.id);
                const incident = getLocationIncident(loc.id);
                return (
                  <div
                    key={loc.id}
                    className={`p-4 border text-center transition-all cursor-pointer ${locationStatusColors[status]}`}
                  >
                    <span className="text-white text-sm font-bold block">{loc.label}</span>
                    {incident && (
                      <span className="text-white text-[9px] uppercase tracking-wider mt-1 block">
                        {incident.type || incident.incidentType}
                      </span>
                    )}
                    {status === 'clear' && (
                      <span className="text-text-muted text-[9px] mt-1 block">Clear</span>
                    )}
                    {status === 'resolved' && (
                      <span className="text-green-300 text-[9px] mt-1 block">Resolved</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty Floor */}
        {currentFloorData.rooms.length === 0 && currentFloorData.locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted text-xs uppercase tracking-wider">
              No zones configured for this floor
            </p>
          </div>
        )}

      </div>

      {/* Coordinates Bar */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-text-muted text-[10px] font-mono">
          LAT: 28.6139° N &nbsp; LONG: 77.2090° E
        </p>
        <p className="text-text-muted text-[10px] font-mono">
          REF_ID: {String(selectedFloor).toUpperCase()}-HK-9942
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-4">
        {[
          { color: 'bg-accent-red', label: 'Active Incident' },
          { color: 'bg-status-success', label: 'Resolved' },
          { color: 'bg-navy-600', label: 'Clear' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${item.color}`} />
            <span className="text-text-muted text-[10px] uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-navy-750 border border-dashed border-text-muted" />
          <span className="text-text-muted text-[10px] uppercase tracking-wider">
            Common Area
          </span>
        </div>
      </div>

    </div>
  );
};

export default HotelMap;