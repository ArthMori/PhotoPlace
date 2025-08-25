import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const App = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('https://api-mural.onrender.com/photos');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      setPhotos(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.image_url }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.coordinates}>
          📍 Lat: {item.latitude}, Long: {item.longitude}
        </Text>
        <Text style={styles.date}>
          📅 {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
        <Text style={styles.time}>
          ⏰ {new Date(item.created_at).toLocaleTimeString('pt-BR')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando fotos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        <Text style={styles.retryText} onPress={fetchPhotos}>
          Toque para tentar novamente
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📸 Mural de Fotos</Text>
            <Text style={styles.headerSubtitle}>
              {photos.length} foto{photos.length !== 1 ? 's' : ''} encontrada{photos.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma foto encontrada</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: width * 0.05,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: width * 0.04,
    paddingHorizontal: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: width * 0.05, // ~18px
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: width * 0.032, // ~12px
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: width * 0.03,
    paddingBottom: width * 0.08,
  },
  photoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E2E8F0',
  },
  photoInfo: {
    padding: width * 0.03,
  },
  coordinates: {
    fontSize: width * 0.032,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  date: {
    fontSize: width * 0.03,
    color: '#64748B',
  },
  time: {
    fontSize: width * 0.03,
    color: '#64748B',
  },
  loadingText: {
    marginTop: 12,
    fontSize: width * 0.04,
    color: '#475569',
    textAlign: 'center',
  },
  errorText: {
    fontSize: width * 0.04,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: width * 0.032,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.15,
  },
  emptyText: {
    fontSize: width * 0.038,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default App;
