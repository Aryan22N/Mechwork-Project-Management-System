import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Checks whether the app is currently running as a native mobile application (Capacitor Android/iOS shell)
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Captures a photo using native device Camera (Capacitor) or falls back to Web Camera input
 */
export const capturePhoto = async () => {
  if (isNativePlatform()) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      return image.webPath;
    } catch (error) {
      console.warn('Native camera cancelled or failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Retrieves high accuracy current GPS position using native Capacitor Geolocation API
 * or falls back to Browser navigator.geolocation API
 */
export const getCurrentPosition = async () => {
  if (isNativePlatform()) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error) {
      console.warn('Native geolocation failed:', error);
      return null;
    }
  }

  // Fallback to standard web geolocation if running on Web Browser
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        console.warn('Web geolocation error:', err);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};
