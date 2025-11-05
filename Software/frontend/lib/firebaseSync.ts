// Firebase synchronization service
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { db, storage } from './firebase'
import { InspeccionData } from './database'

export interface CloudInspeccion {
  id: string
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
  capturedFrames: string[] // URLs de las imágenes en Firebase Storage
  recordings: string[] // URLs de los videos en Firebase Storage
  recordingTime: number
  observaciones?: string
  reportImages?: string[] // URLs de las imágenes del informe
  createdAt: Timestamp
  updatedAt: Timestamp
  syncedAt: Timestamp
  userId?: string
}

class FirebaseSyncService {
  private collectionName = 'inspecciones'

  // Convert local inspeccion to cloud format
  private convertToCloudFormat(localInspeccion: InspeccionData): Omit<CloudInspeccion, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'> {
    return {
      nombreInspeccion: localInspeccion.nombreInspeccion,
      lugarInspeccion: localInspeccion.lugarInspeccion,
      fechaInspeccion: localInspeccion.fechaInspeccion,
      descripcion: localInspeccion.descripcion,
      nombreApellido: localInspeccion.nombreApellido,
      matricula: localInspeccion.matricula,
      capturedFrames: [], // Will be populated after uploading images
      recordings: [], // Will be populated after uploading videos
      recordingTime: localInspeccion.recordingTime,
      observaciones: localInspeccion.observaciones || '',
      reportImages: [], // Will be populated after uploading images
      userId: 'default-user' // You can implement user authentication later
    }
  }

  // Convert cloud inspeccion to local format
  private convertToLocalFormat(cloudInspeccion: CloudInspeccion): InspeccionData {
    return {
      id: cloudInspeccion.id,
      nombreInspeccion: cloudInspeccion.nombreInspeccion,
      lugarInspeccion: cloudInspeccion.lugarInspeccion,
      fechaInspeccion: cloudInspeccion.fechaInspeccion,
      descripcion: cloudInspeccion.descripcion,
      nombreApellido: cloudInspeccion.nombreApellido,
      matricula: cloudInspeccion.matricula,
      capturedFrames: cloudInspeccion.capturedFrames,
      recordings: cloudInspeccion.recordings,
      recordingTime: cloudInspeccion.recordingTime,
      observaciones: cloudInspeccion.observaciones,
      reportImages: cloudInspeccion.reportImages,
      createdAt: cloudInspeccion.createdAt.toDate().toISOString(),
      updatedAt: cloudInspeccion.updatedAt.toDate().toISOString(),
      syncedToCloud: true
    }
  }

  // Upload base64 image to Firebase Storage
  private async uploadImage(base64Data: string, path: string): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data)
      const blob = await response.blob()
      
      // Create storage reference
      const storageRef = ref(storage, path)
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  // Upload base64 video to Firebase Storage
  private async uploadVideo(base64Data: string, path: string): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data)
      const blob = await response.blob()
      
      // Create storage reference
      const storageRef = ref(storage, path)
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Error uploading video:', error)
      throw error
    }
  }

  // Sync single inspeccion to cloud
  async syncInspeccionToCloud(localInspeccion: InspeccionData): Promise<{ success: boolean; cloudId?: string; error?: string }> {
    try {
      console.log('Syncing inspeccion to cloud:', localInspeccion.id)
      
      // Convert to cloud format
      const cloudData = this.convertToCloudFormat(localInspeccion)
      
      // Upload captured frames
      const capturedFrameUrls: string[] = []
      for (let i = 0; i < localInspeccion.capturedFrames.length; i++) {
        const frame = localInspeccion.capturedFrames[i]
        if (frame.startsWith('data:')) {
          const path = `inspecciones/${localInspeccion.id}/capturedFrames/frame_${i}.jpg`
          const url = await this.uploadImage(frame, path)
          capturedFrameUrls.push(url)
        } else {
          // Already a URL, keep as is
          capturedFrameUrls.push(frame)
        }
      }
      
      // Upload recordings
      const recordingUrls: string[] = []
      for (let i = 0; i < localInspeccion.recordings.length; i++) {
        const recording = localInspeccion.recordings[i]
        if (recording.startsWith('data:')) {
          const path = `inspecciones/${localInspeccion.id}/recordings/recording_${i}.webm`
          const url = await this.uploadVideo(recording, path)
          recordingUrls.push(url)
        } else {
          // Already a URL, keep as is
          recordingUrls.push(recording)
        }
      }
      
      // Upload report images
      const reportImageUrls: string[] = []
      for (let i = 0; i < (localInspeccion.reportImages?.length || 0); i++) {
        const image = localInspeccion.reportImages![i]
        if (image.startsWith('data:')) {
          const path = `inspecciones/${localInspeccion.id}/reportImages/image_${i}.jpg`
          const url = await this.uploadImage(image, path)
          reportImageUrls.push(url)
        } else {
          // Already a URL, keep as is
          reportImageUrls.push(image)
        }
      }
      
      // Update cloud data with uploaded URLs
      const finalCloudData = {
        ...cloudData,
        capturedFrames: capturedFrameUrls,
        recordings: recordingUrls,
        reportImages: reportImageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      }
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), finalCloudData)
      
      console.log('Inspeccion synced to cloud with ID:', docRef.id)
      
      return { success: true, cloudId: docRef.id }
      
    } catch (error) {
      console.error('Error syncing inspeccion to cloud:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Get all inspecciones from cloud
  async getAllInspeccionesFromCloud(): Promise<InspeccionData[]> {
    try {
      console.log('Getting all inspecciones from cloud...')
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const inspecciones: InspeccionData[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CloudInspeccion
        const localInspeccion = this.convertToLocalFormat({
          ...data,
          id: doc.id
        })
        inspecciones.push(localInspeccion)
      })
      
      console.log('Retrieved inspecciones from cloud:', inspecciones.length)
      return inspecciones
      
    } catch (error) {
      console.error('Error getting inspecciones from cloud:', error)
      throw error
    }
  }

  // Get single inspeccion from cloud
  async getInspeccionFromCloud(cloudId: string): Promise<InspeccionData | null> {
    try {
      console.log('Getting inspeccion from cloud:', cloudId)
      
      const docRef = doc(db, this.collectionName, cloudId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CloudInspeccion
        const localInspeccion = this.convertToLocalFormat({
          ...data,
          id: docSnap.id
        })
        return localInspeccion
      } else {
        console.log('No such inspeccion in cloud')
        return null
      }
      
    } catch (error) {
      console.error('Error getting inspeccion from cloud:', error)
      throw error
    }
  }

  // Update inspeccion in cloud
  async updateInspeccionInCloud(cloudId: string, localInspeccion: InspeccionData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating inspeccion in cloud:', cloudId)
      
      const cloudData = this.convertToCloudFormat(localInspeccion)
      
      const docRef = doc(db, this.collectionName, cloudId)
      await updateDoc(docRef, {
        ...cloudData,
        updatedAt: serverTimestamp()
      })
      
      console.log('Inspeccion updated in cloud')
      return { success: true }
      
    } catch (error) {
      console.error('Error updating inspeccion in cloud:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Delete inspeccion from cloud
  async deleteInspeccionFromCloud(cloudId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting inspeccion from cloud:', cloudId)
      
      // TODO: Also delete associated files from Storage
      
      const docRef = doc(db, this.collectionName, cloudId)
      await deleteDoc(docRef)
      
      console.log('Inspeccion deleted from cloud')
      return { success: true }
      
    } catch (error) {
      console.error('Error deleting inspeccion from cloud:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const firebaseSync = new FirebaseSyncService()
