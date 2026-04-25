import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, set, update, onValue, off, get, query, orderByChild, equalTo } from 'firebase/database';

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
export const db = getDatabase(app);

// Auth helpers
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Incident helpers
export const writeIncident = async (incidentData) => {
  const incidentRef = push(ref(db, 'surakshanow/incidents'));
  const id = incidentRef.key;
  
  // Clean up undefined/null/empty from incidentData
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
  const incidentRef = ref(db, `surakshanow/incidents/${incidentId}`);
  await update(incidentRef, updates);
};

export const listenToIncident = (incidentId, callback) => {
  const incidentRef = ref(db, `surakshanow/incidents/${incidentId}`);
  onValue(incidentRef, (snapshot) => {
    callback(snapshot.val());
  });
  return incidentRef;
};

export const listenToAllIncidents = (callback) => {
  const incidentsRef = ref(db, 'surakshanow/incidents');
  onValue(incidentsRef, (snapshot) => {
    const data = snapshot.val();
    const incidents = data ? Object.values(data) : [];
    callback(incidents);
  });
  return incidentsRef;
};

// Chat helpers
export const writeMessage = async (incidentId, messageData) => {
  const chatRef = push(ref(db, `surakshanow/incidents/${incidentId}/chat`));
  await set(chatRef, {
    ...messageData,
    timestamp: Date.now(),
  });
};

export const listenToChat = (incidentId, callback) => {
  const chatRef = ref(db, `surakshanow/incidents/${incidentId}/chat`);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const messages = data ? Object.values(data).sort((a, b) => a.timestamp - b.timestamp) : [];
    callback(messages);
  });
  return chatRef;
};

// Staff helpers
export const getStaffProfile = async (uid) => {
  const staffRef = ref(db, `surakshanow/staff/${uid}`);
  const snapshot = await get(staffRef);
  return snapshot.val();
};

export const getManagerProfile = async (uid) => {
  const managerRef = ref(db, `surakshanow/managers/${uid}`);
  const snapshot = await get(managerRef);
  return snapshot.val();
};

export const updateStaffStatus = async (staffId, updates) => {
  const staffRef = ref(db, `surakshanow/staff/${staffId}`);
  await update(staffRef, updates);
};

// Detach listener
export const detachListener = (refInstance) => {
  if (refInstance) off(refInstance);
};

export default app;
