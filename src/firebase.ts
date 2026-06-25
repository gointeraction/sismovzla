import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Configuración cargada desde el entorno o firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDRhh38Iwzu_3BinBpOzD8UyQDBi7F5cgk",
  authDomain: "sismovzla.firebaseapp.com",
  projectId: "sismovzla",
  storageBucket: "sismovzla.firebasestorage.app",
  messagingSenderId: "117037078216",
  appId: "1:117037078216:web:46d7013c295c34589e37fd"
};

const app = initializeApp(firebaseConfig);

// Inicializar Firestore con persistencia offline robusta (soporte multi-pestaña) y base de datos personalizada
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true,
}, "ai-studio-f3f26e74-6430-4ef9-aee7-153a8a133537");

const auth = getAuth(app);

export { app, db, auth };
export default app;
