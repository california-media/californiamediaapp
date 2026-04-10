// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import { Platform, Alert, Linking } from 'react-native';

// export interface FileInfo {
//   url: string;
//   type: 'pdf' | 'image' | 'video' | 'other';
//   name: string;
// }

// // Get file extension and type
// export const getFileType = (url: string): FileInfo['type'] => {
//   const extension = url.split('.').pop()?.toLowerCase() || '';

//   if (extension === 'pdf') return 'pdf';
//   if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
//   if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return 'video';
//   return 'other';
// };

// // Get filename from URL
// export const getFileName = (url: string): string => {
//   // Handle URLs with query parameters
//   const urlWithoutParams = url.split('?')[0];
//   const parts = urlWithoutParams.split('/');
//   let filename = parts[parts.length - 1];

//   // If no filename, generate one
//   if (!filename || filename.length === 0 || filename === '') {
//     const timestamp = Date.now();
//     const type = getFileType(url);
//     if (type === 'pdf') filename = `document_${timestamp}.pdf`;
//     else if (type === 'image') filename = `image_${timestamp}.jpg`;
//     else if (type === 'video') filename = `video_${timestamp}.mp4`;
//     else filename = `file_${timestamp}`;
//   }

//   return filename;
// };

// // Download file to local storage using new API
// export const downloadFile = async (url: string, onProgress?: (progress: number) => void): Promise<string | null> => {
//   try {
//     const filename = getFileName(url);
//     const downloadDest = `${FileSystem.documentDirectory}${filename}`;

//     // Check if file already exists using new API
//     try {
//       const fileInfo = await FileSystem.getInfoAsync(downloadDest);
//       if (fileInfo.exists) {
//         console.log('File already exists:', downloadDest);
//         return downloadDest;
//       }
//     } catch (error) {
//       console.log('Error checking file existence:', error);
//     }

//     // Download file
//     const downloadResumable = FileSystem.createDownloadResumable(
//       url,
//       downloadDest,
//       {},
//       (downloadProgress) => {
//         const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
//         if (onProgress) {
//           onProgress(progress * 100);
//         }
//       }
//     );

//     const result = await downloadResumable.downloadAsync();

//     if (result && result.uri) {
//       console.log('Download completed:', result.uri);
//       return result.uri;
//     }
//     return null;
//   } catch (error) {
//     console.error('Download error:', error);
//     Alert.alert('Download Error', 'Failed to download file. Please check your internet connection and try again.');
//     return null;
//   }
// };

// // Preview PDF file
// export const previewPDF = async (filePath: string): Promise<void> => {
//   try {
//     // Check if file exists
//     const fileInfo = await FileSystem.getInfoAsync(filePath);
//     if (!fileInfo.exists) {
//       Alert.alert('Error', 'File not found. Please download again.');
//       return;
//     }

//     // Use sharing to open with default app
//     if (await Sharing.isAvailableAsync()) {
//       await Sharing.shareAsync(filePath, {
//         mimeType: 'application/pdf',
//         dialogTitle: 'Open PDF with',
//       });
//     } else {
//       Alert.alert('Error', 'Sharing is not available on this device');
//     }
//   } catch (error) {
//     console.error('Preview error:', error);
//     Alert.alert('Error', 'Unable to open PDF. Please try again.');
//   }
// };

// // Share file
// export const shareFile = async (filePath: string): Promise<void> => {
//   try {
//     if (await Sharing.isAvailableAsync()) {
//       await Sharing.shareAsync(filePath);
//     } else {
//       Alert.alert('Error', 'Sharing is not available on this device');
//     }
//   } catch (error) {
//     console.error('Share error:', error);
//     Alert.alert('Error', 'Failed to share file');
//   }
// };

// // Open URL in browser
// export const openUrl = async (url: string): Promise<void> => {
//   try {
//     const supported = await Linking.canOpenURL(url);
//     if (supported) {
//       await Linking.openURL(url);
//     } else {
//       Alert.alert('Error', `Cannot open URL: ${url}`);
//     }
//   } catch (error) {
//     console.error('Open URL error:', error);
//     Alert.alert('Error', 'Failed to open URL');
//   }
// };

// // Delete file
// export const deleteFile = async (filePath: string): Promise<boolean> => {
//   try {
//     await FileSystem.deleteAsync(filePath);
//     return true;
//   } catch (error) {
//     console.error('Delete file error:', error);
//     return false;
//   }
// };
