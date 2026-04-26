import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Location config — must match QRLanding.jsx locationMap
const FLOORS = [
  {
    label: 'Basement',
    floorKey: 'basement',
    locations: [
      { name: 'Parking', id: 'parking' },
      { name: 'Storage', id: 'storage' },
    ],
  },
  {
    label: 'Ground Floor',
    floorKey: 'ground',
    locations: [
      { name: 'Lobby', id: 'lobby' },
      { name: 'Restaurant', id: 'restaurant' },
      { name: 'Reception', id: 'reception' },
    ],
  },
  {
    label: 'Floor 1',
    floorKey: 'floor1',
    rooms: [101, 102, 103, 104, 105, 106],
    locations: [{ name: 'Gym', id: 'gym' }],
  },
  {
    label: 'Floor 2',
    floorKey: 'floor2',
    rooms: [201, 202, 203, 204, 205, 206],
    locations: [{ name: 'Conference Room', id: 'conference' }],
  },
  {
    label: 'Floor 3',
    floorKey: 'floor3',
    rooms: [301, 302, 303, 304, 305, 306],
    locations: [],
  },
  {
    label: 'Floor 4',
    floorKey: 'floor4',
    rooms: [401, 402, 403, 404, 405, 406],
    locations: [],
  },
  {
    label: 'Terrace',
    floorKey: 'terrace',
    locations: [
      { name: 'Swimming Pool', id: 'pool' },
      { name: 'Sky Lounge', id: 'lounge' },
    ],
  },
];

const BASE_URL = window.location.origin;

// Build roomId slug the same way QRLanding.jsx expects it
const makeRoomId = (identifier, floorKey) => `${identifier}-${floorKey}`;

const QRCard = ({ label, roomId, size = 140 }) => {
  const url = `${BASE_URL}/guest/${roomId}`;
  const cardRef = useRef(null);

  const handlePrint = () => {
    const svg = cardRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>ASAP — ${label}</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: sans-serif; }
        .card { border: 2px solid #0A0F1E; padding: 20px; text-align: center; width: 220px; }
        .logo { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #D32F2F; margin-bottom: 8px; }
        .label { font-size: 14px; font-weight: 700; color: #0A0F1E; margin: 10px 0 4px; }
        .sub { font-size: 10px; color: #666; margin-bottom: 6px; }
        .hint { font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; }
      </style></head><body>
      <div class="card">
        <div class="logo">ASAP</div>
        ${svgData}
        <div class="label">${label}</div>
        <div class="sub">Scan to report an emergency</div>
        <div class="hint">Available 24/7 — No login required</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="border border-border p-4 flex flex-col items-center gap-3 hover:border-text-secondary transition-colors">
      <div className="bg-white p-2">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#0A0F1E"
          level="M"
          ref={cardRef}
        />
      </div>
      <div className="text-center">
        <p className="text-white text-xs font-semibold">{label}</p>
        <p className="text-text-muted text-[10px] mt-0.5 font-mono break-all">
          /guest/{roomId}
        </p>
      </div>
      <button
        onClick={handlePrint}
        className="btn-outline w-full text-[10px] py-1.5"
      >
        Print
      </button>
    </div>
  );
};

const QRGenerator = () => {
  const [selectedFloor, setSelectedFloor] = useState(FLOORS[1]); // default Ground
  const [view, setView] = useState('grid'); // 'grid' | 'all'

  // Collect all entries for the selected floor
  const entries = [];
  if (selectedFloor.rooms) {
    selectedFloor.rooms.forEach((room) =>
      entries.push({ label: `Room ${room}`, roomId: makeRoomId(room, selectedFloor.floorKey) })
    );
  }
  if (selectedFloor.locations) {
    selectedFloor.locations.forEach((loc) =>
      entries.push({ label: loc.name, roomId: makeRoomId(loc.id, selectedFloor.floorKey) })
    );
  }

  // All entries across all floors (for bulk print)
  const allEntries = [];
  FLOORS.forEach((floor) => {
    if (floor.rooms) {
      floor.rooms.forEach((room) =>
        allEntries.push({ label: `Room ${room}`, roomId: makeRoomId(room, floor.floorKey) })
      );
    }
    if (floor.locations) {
      floor.locations.forEach((loc) =>
        allEntries.push({ label: loc.name, roomId: makeRoomId(loc.id, floor.floorKey) })
      );
    }
  });

  return (
    <div className="min-h-screen bg-navy-950 px-4 sm:px-6 py-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-white text-xl font-bold uppercase tracking-wide">
              Room QR Codes
            </h1>
            <p className="text-text-secondary text-xs mt-1">
              Print and laminate these cards — place inside every room and common area
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView(view === 'grid' ? 'all' : 'grid')}
              className="btn-outline text-xs px-4 py-2"
            >
              {view === 'grid' ? 'Show All Floors' : 'Floor View'}
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <>
            {/* ── Floor Selector ────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap mb-6">
              {FLOORS.map((floor) => (
                <button
                  key={floor.floorKey}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    selectedFloor.floorKey === floor.floorKey
                      ? 'bg-accent-red border-accent-red text-white'
                      : 'border-border text-text-secondary hover:border-text-secondary hover:text-white'
                  }`}
                >
                  {floor.label}
                </button>
              ))}
            </div>

            {/* ── QR Grid ───────────────────────────────────────────── */}
            <div className="mb-2 flex items-center justify-between">
              <p className="text-text-muted text-[10px] uppercase tracking-wider">
                {selectedFloor.label} — {entries.length} QR code{entries.length !== 1 ? 's' : ''}
              </p>
            </div>

            {entries.length === 0 ? (
              <div className="border border-border p-8 text-center">
                <p className="text-text-muted text-sm">No rooms or areas on this floor</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {entries.map((entry) => (
                  <QRCard
                    key={entry.roomId}
                    label={entry.label}
                    roomId={entry.roomId}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── All floors grouped ────────────────────────────────── */}
            {FLOORS.map((floor) => {
              const fe = [];
              if (floor.rooms)
                floor.rooms.forEach((room) =>
                  fe.push({ label: `Room ${room}`, roomId: makeRoomId(room, floor.floorKey) })
                );
              if (floor.locations)
                floor.locations.forEach((loc) =>
                  fe.push({ label: loc.name, roomId: makeRoomId(loc.id, floor.floorKey) })
                );
              if (fe.length === 0) return null;
              return (
                <div key={floor.floorKey} className="mb-8">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3 border-b border-border pb-2">
                    {floor.label}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {fe.map((entry) => (
                      <QRCard
                        key={entry.roomId}
                        label={entry.label}
                        roomId={entry.roomId}
                        size={110}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── Instructions ─────────────────────────────────────────── */}
        <div className="border border-border p-4 mt-8">
          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3">
            How to deploy these QR codes
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-xs text-text-secondary">
            <div>
              <p className="text-white font-semibold mb-1">1. Print</p>
              <p>Click Print on each card or use Show All Floors for bulk printing. Use cardstock or glossy paper.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">2. Laminate</p>
              <p>Laminate each card so it survives spills and humidity. A5 size recommended.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">3. Place</p>
              <p>Stick inside room near the door, on bedside table, and at all common area entrances.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
