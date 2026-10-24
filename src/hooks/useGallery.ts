import { useState, useEffect } from 'react';
import { db, storage, isFirebaseConfigured } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveToIDB, getAllFromIDB, getFromIDB } from '../utils/idb';

export type GalleryItem = {
  id: string;
  imageUrl: string; // Firebase URL or local blob URL
  videoUrl?: string; // Firebase URL or local blob URL
  gifUrl?: string; // Firebase URL or local blob URL
  caption?: string;
  sessionData?: string; // Serialized JSON string of the session state
  timestamp: number;
};

export const uploadToCloudinary = async (blob: Blob, resourceType: 'image' | 'video' = 'image'): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary config missing in .env");
  }

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
};

export const useGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGallery = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
        setItems(fetched);
      } else {
        const localItems = await getAllFromIDB();
        // Convert Blob to ObjectURL for display
        const displayItems = localItems.map(item => ({
          ...item,
          imageUrl: item.imageBlob ? URL.createObjectURL(item.imageBlob) : "",
          videoUrl: item.videoBlob ? URL.createObjectURL(item.videoBlob) : undefined,
          gifUrl: item.gifBlob ? URL.createObjectURL(item.gifBlob) : undefined,
          sessionData: item.sessionData,
        })).sort((a, b) => b.timestamp - a.timestamp);
        setItems(displayItems);
      }
    } catch (e) {
      console.error("Failed to load gallery:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const saveToGallery = async (id: string, imageBlob: Blob | null, videoBlob?: Blob | null, gifBlob?: Blob | null, caption?: string, sessionData?: string): Promise<GalleryItem | null> => {
    try {
      const timestamp = Date.now();
      
      if (isFirebaseConfigured()) {
        let imageUrl = "";
        if (imageBlob) {
          if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
            imageUrl = await uploadToCloudinary(imageBlob, 'image');
          } else {
            const imageRef = ref(storage, `gallery/${id}.jpg`);
            await uploadBytes(imageRef, imageBlob);
            imageUrl = await getDownloadURL(imageRef);
          }
        }
        
        let videoUrl;
        if (videoBlob) {
          if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
            videoUrl = await uploadToCloudinary(videoBlob, 'video');
          } else {
            const videoRef = ref(storage, `gallery/${id}.mp4`);
            await uploadBytes(videoRef, videoBlob);
            videoUrl = await getDownloadURL(videoRef);
          }
        }

        let gifUrl;
        if (gifBlob) {
          if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
            gifUrl = await uploadToCloudinary(gifBlob, 'image'); // GIFs are images in Cloudinary
          } else {
            const gifRef = ref(storage, `gallery/${id}.gif`);
            await uploadBytes(gifRef, gifBlob);
            gifUrl = await getDownloadURL(gifRef);
          }
        }
        
        const rawItem = { id, imageUrl, videoUrl, gifUrl, caption, sessionData, timestamp };
        const item = Object.fromEntries(Object.entries(rawItem).filter(([_, v]) => v !== undefined)) as GalleryItem;
        await addDoc(collection(db, "gallery"), item);
        setItems(prev => [item, ...prev]);
        return item;
      } else {
        const item = { id, imageBlob, videoBlob, gifBlob, caption, sessionData, timestamp };
        await saveToIDB(item);
        
        const displayItem: GalleryItem = {
          id,
          imageUrl: imageBlob ? URL.createObjectURL(imageBlob) : "",
          videoUrl: videoBlob ? URL.createObjectURL(videoBlob) : undefined,
          gifUrl: gifBlob ? URL.createObjectURL(gifBlob) : undefined,
          caption,
          sessionData,
          timestamp,
        };
        setItems(prev => [displayItem, ...prev]);
        return displayItem;
      }
    } catch (e) {
      console.error("Failed to save to gallery:", e);
      return null;
    }
  };

  return { items, loading, saveToGallery, refresh: loadGallery };
};

export const getGalleryItemById = async (id: string): Promise<GalleryItem | null> => {
  try {
    if (isFirebaseConfigured()) {
      const q = query(collection(db, "gallery"), where("id", "==", id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GalleryItem;
      }
      return null;
    } else {
      const item = await getFromIDB(id);
      if (item) {
        return {
          ...item,
          imageUrl: item.imageBlob ? URL.createObjectURL(item.imageBlob) : "",
          videoUrl: item.videoBlob ? URL.createObjectURL(item.videoBlob) : undefined,
          gifUrl: item.gifBlob ? URL.createObjectURL(item.gifBlob) : undefined,
          sessionData: item.sessionData,
        } as GalleryItem;
      }
      return null;
    }
  } catch (e) {
    console.error("Failed to fetch gallery item by id:", e);
    return null;
  }
};
