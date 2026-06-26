import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Configuración dinámica por nodo operativo (SismoVZLA Principal vs AyudaSismoVZLA Espejo Independiente)
const isMirrorNode = typeof window !== 'undefined' && window.location.hostname.includes('ayudasismovzla');

const firebaseConfig = isMirrorNode ? {
  apiKey: "AIzaSyAXTcOxcet9I62OX3iNVwfwwMtlTwLUUUA",
  authDomain: "ayudasismovzla.firebaseapp.com",
  projectId: "ayudasismovzla",
  storageBucket: "ayudasismovzla.firebasestorage.app",
  messagingSenderId: "205236066019",
  appId: "1:205236066019:web:8b2efd3f232a17ea0317d6"
} : {
  apiKey: "AIzaSyDRhh38Iwzu_3BinBpOzD8UyQDBi7F5cgk",
  authDomain: "sismovzla.firebaseapp.com",
  projectId: "sismovzla",
  storageBucket: "sismovzla.firebasestorage.app",
  messagingSenderId: "117037078216",
  appId: "1:117037078216:web:46d7013c295c34589e37fd"
};

const app = initializeApp(firebaseConfig);

// Inicializar Firestore con persistencia offline robusta y base de datos independiente según nodo
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true,
}, "ai-studio-f3f26e74-6430-4ef9-aee7-153a8a133537");

const auth = getAuth(app);

export { app, db, auth };
export default app;
