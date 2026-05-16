import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Load config
const configPath = './firebase-applet-config.json';
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connect to Emulator if VITE_USE_FIREBASE_EMULATOR is set
import { connectFirestoreEmulator } from 'firebase/firestore';
if (process.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('Firebase Emulators connected for seeding.');
}

async function seed() {
  console.log('Seeding initial data...');
  try {
    // Top 1 Anime data (Frieren)
    await setDoc(doc(db, 'global_media_stats', '52991'), {
      favoritesCount: 1500,
      lists: {
        completed: 12000,
        watching: 5000,
        dropped: 100,
        planToWatch: 20000,
        onHold: 500
      },
      lastUpdated: new Date()
    });

    // Test anime data (Steins;Gate)
    await setDoc(doc(db, 'global_media_stats', '9253'), {
      favoritesCount: 5000,
      lists: {
        completed: 45000,
        watching: 1200,
        dropped: 500,
        planToWatch: 8000,
        onHold: 200
      },
      lastUpdated: new Date()
    });

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
