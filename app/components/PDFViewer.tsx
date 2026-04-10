// import React, { useState, useEffect } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Platform,
//   Dimensions,
//   Alert,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { WebView } from 'react-native-webview';
// import * as FileSystem from 'expo-file-system';
// import { downloadFile, shareFile } from '../utils/fileHandler';

// const { width, height } = Dimensions.get('window');

// interface PDFViewerProps {
//   visible: boolean;
//   url: string;
//   onClose: () => void;
//   title?: string;
// }

// export default function PDFViewer({ visible, url, onClose, title }: PDFViewerProps) {
//   const [loading, setLoading] = useState(true);
//   const [localPath, setLocalPath] = useState<string | null>(null);
//   const [downloadProgress, setDownloadProgress] = useState(0);
//   const [isDownloading, setIsDownloading] = useState(false);

//   useEffect(() => {
//     if (visible && url) {
//       loadPDF();
//     }
//   }, [visible, url]);

//   const loadPDF = async () => {
//     setLoading(true);
//     setDownloadProgress(0);

//     // For direct web viewing, use the URL directly
//     if (url.startsWith('http') && !url.includes('drive.google.com')) {
//       setLocalPath(url);
//       setLoading(false);
//       return;
//     }

//     // Download the file
//     setIsDownloading(true);
//     const downloadedPath = await downloadFile(url, (progress) => {
//       setDownloadProgress(progress);
//     });
//     setIsDownloading(false);

//     if (downloadedPath) {
//       setLocalPath(downloadedPath);
//     } else {
//       Alert.alert('Error', 'Failed to load PDF. Please try again.');
//       onClose();
//     }
//     setLoading(false);
//   };

//   const handleShare = async () => {
//     if (localPath && localPath !== url && !localPath.startsWith('http')) {
//       await shareFile(localPath);
//     }
//   };

//   const renderContent = () => {
//     if (loading || isDownloading) {
//       return (
//         <View style={styles.loadingContainer}>
//           {isDownloading && (
//             <View style={styles.progressContainer}>
//               <ActivityIndicator size="large" color="#6366f1" />
//               <Text style={styles.progressText}>
//                 Downloading... {Math.round(downloadProgress)}%
//               </Text>
//             </View>
//           )}
//           {loading && !isDownloading && (
//             <ActivityIndicator size="large" color="#6366f1" />
//           )}
//         </View>
//       );
//     }

//     // Use WebView for PDF preview
//     if (localPath) {
//       const pdfUri = localPath.startsWith('http') ? localPath : `file://${localPath}`;
//       return (
//         <WebView
//           source={{ uri: pdfUri }}
//           style={styles.webview}
//           onLoadEnd={() => setLoading(false)}
//           onError={() => {
//             Alert.alert('Error', 'Failed to load PDF preview');
//             setLoading(false);
//           }}
//           startInLoadingState={true}
//           renderLoading={() => (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#6366f1" />
//             </View>
//           )}
//         />
//       );
//     }

//     return (
//       <View style={styles.errorContainer}>
//         <Ionicons name="document-text-outline" size={64} color="#ef4444" />
//         <Text style={styles.errorText}>Failed to load document</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={loadPDF}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={onClose}
//     >
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={28} color="#1e293b" />
//           </TouchableOpacity>
//           <Text style={styles.title} numberOfLines={1}>
//             {title || 'Document Preview'}
//           </Text>
//           <View style={styles.headerActions}>
//             {localPath && localPath !== url && !localPath.startsWith('http') && (
//               <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//                 <Ionicons name="share-outline" size={24} color="#6366f1" />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//         <View style={styles.content}>
//           {renderContent()}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingTop: Platform.OS === 'ios' ? 50 : 40,
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e2e8f0',
//     backgroundColor: '#fff',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginHorizontal: 12,
//     textAlign: 'center',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   actionButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//   },
//   webview: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   progressContainer: {
//     alignItems: 'center',
//     gap: 16,
//   },
//   progressText: {
//     fontSize: 14,
//     color: '#64748b',
//     marginTop: 12,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#64748b',
//     marginTop: 16,
//   },
//   retryButton: {
//     marginTop: 20,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     backgroundColor: '#6366f1',
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
// });
