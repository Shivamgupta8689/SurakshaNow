import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously  // ✅ Added
} from 'firebase/auth';
import { getDatabase, ref, push, set, update, onValue, off, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = database;

// ── Auth helpers ────────────────────────────────────────────────────────────
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
export { signInAnonymously }; // ✅ Export karo

// ── Incident helpers ────────────────────────────────────────────────────────
export const writeIncident = async (incidentData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated'); // ✅ Auth check

  const incidentRef = push(ref(database, 'asap/incidents'));
  const id = incidentRef.key;

  const cleanData = Object.fromEntries(
    Object.entries(incidentData).filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0))
  );

  const incident = {
    ...cleanData,
    id,
    reportedBy: user.uid,           // ✅ Real UID
    isAnonymous: user.isAnonymous,  // ✅ Guest flag
    reportedAt: Date.now(),
    status: 'active',
    escalationTimer: Date.now() + 5 * 60 * 1000,
  };
  await set(incidentRef, incident);
  return id;
};

export const updateIncident = async (incidentId, updates) => {
  const incidentRef = ref(database, `asap/incidents/${incidentId}`);
  await update(incidentRef, updates);
};

export const listenToIncident = (incidentId, callback) => {
  const incidentRef = ref(database, `asap/incidents/${incidentId}`);
  onValue(incidentRef, (snapshot) => {
    callback(snapshot.val());
  });
  return incidentRef;
};

export const listenToAllIncidents = (callback) => {
  const incidentsRef = ref(database, 'asap/incidents');
  onValue(incidentsRef, (snapshot) => {
    const data = snapshot.val();
    const incidents = data ? Object.values(data) : [];
    callback(incidents);
  });
  return incidentsRef;
};

// ── Chat helpers ────────────────────────────────────────────────────────────
export const writeMessage = async (incidentId, messageData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated'); // ✅ Auth check

  const chatRef = push(ref(database, `asap/incidents/${incidentId}/chat`));
  await set(chatRef, {
    ...messageData,
    senderId: user.uid,             // ✅ Real UID override
    isAnonymous: user.isAnonymous,  // ✅ Guest flag
    timestamp: Date.now(),
  });
};

export const listenToChat = (incidentId, callback) => {
  const user = auth.currentUser;
  if (!user) return null; // ✅ Auth check

  const chatRef = ref(database, `asap/incidents/${incidentId}/chat`);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const allMessages = data
      ? Object.values(data).sort((a, b) => a.timestamp - b.timestamp)
      : [];

    // ✅ Guest sirf apne + staff/manager/AI messages dekhe
    const messages = user.isAnonymous
      ? allMessages.filter(msg =>
          msg.senderId === user.uid ||
          msg.senderRole === 'Staff' ||
          msg.senderRole === 'Manager' ||
          msg.senderRole === 'AI'
        )
      : allMessages; // Staff/Manager sab dekhe

    callback(messages);
  });
  return chatRef;
};

// ── Staff helpers ───────────────────────────────────────────────────────────
export const getStaffProfile = async (uid) => {
  const staffRef = ref(database, `asap/staff/${uid}`);
  const snapshot = await get(staffRef);
  return snapshot.val();
};

export const getManagerProfile = async (uid) => {
  const managerRef = ref(database, `asap/managers/${uid}`);
  const snapshot = await get(managerRef);
  return snapshot.val();
};

export const updateStaffStatus = async (staffId, updates) => {
  const staffRef = ref(database, `asap/staff/${staffId}`);
  await update(staffRef, updates);
};

// ── Listener detach ─────────────────────────────────────────────────────────
export const detachListener = (refInstance) => {
  if (refInstance) off(refInstance);
};

// ── Broadcast helpers ───────────────────────────────────────────────────────
export const sendBroadcast = (floorKey, data) => {
  const broadcastRef = ref(database, `asap/broadcasts/${floorKey}`);
  return set(broadcastRef, {
    active: true,
    floorKey,
    message: data.message || '',
    incidentType: data.incidentType || '',
    incidentId: data.incidentId || '',
    broadcastAt: Date.now(),
  });
};

export const clearBroadcast = (floorKey) => {
  const broadcastRef = ref(database, `asap/broadcasts/${floorKey}`);
  return set(broadcastRef, { active: false });
};

// ── Seed demo data ──────────────────────────────────────────────────────────
export const seedDemoData = async () => {
  const now = Date.now();
  const demoData = {
    staff: {
      'staff-001': {
        id: 'staff-001',
        name: 'Aarav Sharma',
        role: 'Response Staff',
        floor: '3',
        phone: '+91-98765-43001',
        status: 'available',
      },
      'staff-002': {
        id: 'staff-002',
        name: 'Meera Iyer',
        role: 'Medical Response',
        floor: '2',
        phone: '+91-98765-43002',
        status: 'available',
      },
      'staff-003': {
        id: 'staff-003',
        name: 'Rohan Verma',
        role: 'Security Lead',
        floor: 'ground',
        phone: '+91-98765-43003',
        status: 'busy',
      },
    },
    managers: {
      'manager-001': {
        id: 'manager-001',
        name: 'Operations Manager',
        role: 'Duty Manager',
        phone: '+91-98765-44001',
        email: 'manager@asap.demo',
      },
    },
    incidents: {
      'demo-fire-floor3': {
        id: 'demo-fire-floor3',
        type: 'Fire',
        severity: 'High',
        description: 'Smoke detected near corridor outside Room 304.',
        immediateAction: 'Avoid Floor 3 corridor and wait for staff instructions.',
        roomNumber: '304',
        floor: '3',
        locationName: 'Room 304',
        floorLabel: 'Floor 3',
        hotelName: 'Grand Hotel',
        reportedBy: 'Guest-304',
        status: 'active',
        reportedAt: now - 8 * 60 * 1000,
        escalationTimer: now - 3 * 60 * 1000,
        evacuationNeeded: true,
      },
      'demo-medical-floor2': {
        id: 'demo-medical-floor2',
        type: 'Medical',
        severity: 'Medium',
        description: 'Guest reported dizziness and breathing discomfort.',
        immediateAction: 'Send medical response staff with first aid kit.',
        roomNumber: '205',
        floor: '2',
        locationName: 'Room 205',
        floorLabel: 'Floor 2',
        hotelName: 'Grand Hotel',
        reportedBy: 'Guest-205',
        status: 'inprogress',
        assignedStaff: 'Meera Iyer',
        assignedStaffPosition: 'Medical Response',
        reportedAt: now - 18 * 60 * 1000,
        escalationTimer: now - 13 * 60 * 1000,
        evacuationNeeded: false,
      },
      'demo-resolved-ground': {
        id: 'demo-resolved-ground',
        type: 'Security',
        severity: 'Low',
        description: 'Unattended bag reported near reception. Cleared by security.',
        immediateAction: 'Security verified the item and reopened the area.',
        roomNumber: 'reception',
        floor: 'ground',
        locationName: 'Reception',
        floorLabel: 'Ground Floor',
        hotelName: 'Grand Hotel',
        reportedBy: 'Guest-Reception',
        status: 'resolved',
        assignedStaff: 'Rohan Verma',
        assignedStaffPosition: 'Security Lead',
        reportedAt: now - 3 * 60 * 60 * 1000,
        resolvedAt: now - 2 * 60 * 60 * 1000,
        escalationTimer: now - 175 * 60 * 1000,
        evacuationNeeded: false,
      },
    },
  };

  await update(ref(database, 'asap'), demoData);
  return demoData;
};

export default app;