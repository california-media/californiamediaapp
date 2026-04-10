// import React, { useState, useRef } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   FlatList,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const { width, height } = Dimensions.get('window');

// interface ImageViewerProps {
//   visible: boolean;
//   images: Array<{ url: string; name?: string }>;
//   initialIndex?: number;
//   onClose: () => void;
// }

// export default function ImageViewer({ visible, images, initialIndex = 0, onClose }: ImageViewerProps) {
//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
//   const flatListRef = useRef<FlatList>(null);

//   const handleScroll = (event: any) => {
//     const index = Math.round(event.nativeEvent.contentOffset.x / width);
//     setCurrentIndex(index);
//   };

//   const renderImage = ({ item, index }: { item: { url: string; name?: string }; index: number }) => (
//     <View style={styles.imageContainer}>
//       {!imageErrors[index] ? (
//         <Image
//           source={{ uri: item.url }}
//           style={styles.image}
//           resizeMode="contain"
//           onError={() => setImageErrors(prev => ({ ...prev, [index]: true }))}
//         />
//       ) : (
//         <View style={styles.errorContainer}>
//           <Ionicons name="image-outline" size={64} color="#64748b" />
//           <Text style={styles.errorText}>Failed to load image</Text>
//         </View>
//       )}
//     </View>
//   );

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
//           <Text style={styles.counter}>
//             {currentIndex + 1} / {images.length}
//           </Text>
//           <View style={styles.placeholder} />
//         </View>

//         <FlatList
//           ref={flatListRef}
//           data={images}
//           renderItem={renderImage}
//           keyExtractor={(_, index) => index.toString()}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onScroll={handleScroll}
//           scrollEventThrottle={16}
//           initialScrollIndex={initialIndex}
//           getItemLayout={(_, index) => ({
//             length: width,
//             offset: width * index,
//             index,
//           })}
//         />

//         {images[currentIndex]?.name && (
//           <View style={styles.footer}>
//             <Text style={styles.imageName} numberOfLines={2}>
//               {images[currentIndex].name}
//             </Text>
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
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 50,
//     paddingHorizontal: 20,
//     zIndex: 10,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   counter: {
//     fontSize: 16,
//     color: '#fff',
//     fontWeight: '500',
//   },
//   placeholder: {
//     width: 40,
//   },
//   imageContainer: {
//     width,
//     height,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   image: {
//     width: width - 40,
//     height: height - 100,
//   },
//   errorContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#64748b',
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 20,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   imageName: {
//     fontSize: 14,
//     color: '#fff',
//     textAlign: 'center',
//   },
// });
