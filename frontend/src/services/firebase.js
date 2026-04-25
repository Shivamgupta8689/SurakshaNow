import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
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

// keep 'db' as alias so existing code doesn't break
export const db = database;

// Auth helpers
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Incident helpers
export const writeIncident = async (incidentData) => {
  const incidentRef = push(ref(database, 'surakshanow/incidents'));
  const id = incidentRef.key;

  const cleanData = Object.fromEntries(
    Object.entries(incidentData).filter(([_, v]) => v != null && !(Array.isArray(v) && v.length === 0))
  );

  const incident = {
    ...cleanData,
    id,
    reportedAt: Date.now(),
    status: 'active',
    escalationTimer: Date.now() + 5 * 60 * 1000,
  };
  await set(incidentRef, incident);
  return id;
};

export const updateIncident = async (incidentId, updates) => {
  const incidentRef = ref(database, `surakshanow/incidents/${incidentId}`);
  await update(incidentRef, updates);
};

export const listenToIncident = (incidentId, callback) => {
  const incidentRef = ref(database, `surakshanow/incidents/${incidentId}`);
  onValue(incidentRef, (snapshot) => {
    callback(snapshot.val());
  });
  return incidentRef;
};

export const listenToAllIncidents = (callback) => {
  const incidentsRef = ref(database, 'surakshanow/incidents');
  onValue(incidentsRef, (snapshot) => {
    const data = snapshot.val();
    const incidents = data ? Object.values(data) : [];
    callback(incidents);
  });
  return incidentsRef;
};

// Chat helpers
export const writeMessage = async (incidentId, messageData) => {
  const chatRef = push(ref(database, `surakshanow/incidents/${incidentId}/chat`));
  await set(chatRef, {
    ...messageData,
    timestamp: Date.now(),
  });
};

export const listenToChat = (incidentId, callback) => {
  const chatRef = ref(database, `surakshanow/incidents/${incidentId}/chat`);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const messages = data
      ? Object.values(data).sort((a, b) => a.timestamp - b.timestamp)
      : [];
    callback(messages);
  });
  return chatRef;
};

// Staff helpers
export const getStaffProfile = async (uid) => {
  const staffRef = ref(database, `surakshanow/staff/${uid}`);
  const snapshot = await get(staffRef);
  return snapshot.val();
};

export const getManagerProfile = async (uid) => {
  const managerRef = ref(database, `surakshanow/managers/${uid}`);
  const snapshot = await get(managerRef);
  return snapshot.val();
};

export const updateStaffStatus = async (staffId, updates) => {
  const staffRef = ref(database, `surakshanow/staff/${staffId}`);
  await update(staffRef, updates);
};

// Detach listener
export const detachListener = (refInstance) => {
  if (refInstance) off(refInstance);
};

// Broadcast helpers
export const sendBroadcast = (floorKey, data) => {
  const broadcastRef = ref(database, `surakshanow/broadcasts/${floorKey}`);
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
  const broadcastRef = ref(database, `surakshanow/broadcasts/${floorKey}`);
  return set(broadcastRef, { active: false });
};

export default app;