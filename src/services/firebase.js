import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

export async function fetchMusicList() {
    const musicRef = ref(storage, 'music');
    const result = await listAll(musicRef);
    return result.items.map((item) => ({
        name: item.name,
        fullPath: item.fullPath,
    }));
}

export async function getMusicURL(fullPath) {
    const fileRef = ref(storage, fullPath);
    return getDownloadURL(fileRef);
}

function pathToDocId(fullPath) {
    return encodeURIComponent(fullPath);
}

export async function fetchAllRatings() {
    const snapshot = await getDocs(collection(db, 'ratings'));
    const map = new Map();
    snapshot.forEach(d => {
        map.set(d.data().fullPath, d.data().rating);
    });
    return map;
}

export async function setRating(fullPath, rating) {
    await setDoc(doc(db, 'ratings', pathToDocId(fullPath)), { fullPath, rating });
}

export async function removeRating(fullPath) {
    await deleteDoc(doc(db, 'ratings', pathToDocId(fullPath)));
}

export { storage };
