// import React, { useState, useRef } from 'react';
// import {
//   Modal,
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Video, ResizeMode } from 'expo-av';

// const { width, height } = Dimensions.get('window');

// interface VideoPlayerProps {
//   visible: boolean;
//   url: string;
//   onClose: () => void;
//   title?: string;
// }

// export default function VideoPlayer({ visible, url, onClose, title }: VideoPlayerProps) {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);
//   const videoRef = useRef<any>(null);

//   const handleError = () => {
//     setError(true);
//     setLoading(false);
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
//             <Ionicons name="close" size={28} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {!error ? (
//           <Video
//             ref={videoRef}
//             source={{ uri: url }}
//             style={styles.video}
//             useNativeControls
//             resizeMode={ResizeMode.CONTAIN}
//             onLoadStart={() => setLoading(true)}
//             onLoad={() => setLoading(false)}
//             onError={handleError}
//             isLooping={false}
//             shouldPlay
//           />
//         ) : (
//           <View style={styles.errorContainer}>
//             <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
//             <View style={styles.errorText}>Failed to load video</View>
//             <TouchableOpacity style={styles.retryButton} onPress={() => {
//               setError(false);
//               setLoading(true);
//               videoRef.current?.loadAsync({ uri: url });
//             }}>
//               <Text style={styles.retryButtonText}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {loading && (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#6366f1" />
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     paddingTop: 50,
//     paddingHorizontal: 20,
//     zIndex: 10,
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 20,
//   },
//   video: {
//     width,
//     height,
//   },
//   loadingContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
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
