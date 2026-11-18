import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      currentUserId,
      ({ notifications: notifs, unreadCount: unread }) => {
        setNotifications(notifs);
        setUnreadCount(unread);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUserId]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await markAllNotificationsAsRead(currentUserId);
  };

  const handlePressNotification = async (item) => {
    if (!item.read) {
      await markNotificationAsRead(item.id);
    }

    // Redirection intelligente selon le type de notification
    if (item.type === 'chat' && item.data?.conversationId) {
      navigation.navigate('Chat', {
        conversationId: item.data.conversationId,
        recipientId: item.data.recipientId,
        recipientName: item.data.recipientName || 'Discussion',
      });
    } else if (item.type === 'new_property' && item.data?.propertyId) {
      navigation.navigate('PropertyDetails', {
        property: { id: item.data.propertyId },
      });
    } else if (item.type === 'new_coloc') {
      navigation.navigate('ColocatairesScreen');
    } else if (item.type === 'bailleur_status') {
      navigation.navigate('Profile');
    }
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Récemment';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'chat':
        return {
          icon: 'chatbubbles',
          color: '#003880',
          bg: '#EFF6FF',
          badgeText: 'Message',
        };
      case 'bailleur_status':
        return {
          icon: 'shield-checkmark',
          color: '#10B981',
          bg: '#ECFDF5',
          badgeText: 'Profil Bailleur',
        };
      case 'new_property':
        return {
          icon: 'home',
          color: '#E8A008',
          bg: '#FFFBEB',
          badgeText: 'Logement',
        };
      case 'new_coloc':
        return {
          icon: 'people',
          color: '#8B5CF6',
          bg: '#F5F3FF',
          badgeText: 'Colocation',
        };
      default:
        return {
          icon: 'notifications',
          color: '#003880',
          bg: '#F1F5F9',
          badgeText: 'Information',
        };
    }
  };

  const filteredList = notifications.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const renderItem = ({ item }) => {
    const config = getTypeConfig(item.type);

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => handlePressNotification(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.topRow}>
            <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.badgeText}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTimestamp(item.createdAt)}</Text>
          </View>

          <Text style={[styles.titleText, !item.read && styles.titleTextUnread]}>
            {item.title}
          </Text>

          <Text style={styles.bodyText} numberOfLines={3}>
            {item.body}
          </Text>
        </View>

        <View style={styles.rightActions}>
          {!item.read && <View style={styles.unreadDot} />}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#003880" />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* FILTRES PAR CATÉGORIES */}
      <View style={styles.filterScroll}>
        {[
          { key: 'ALL', label: 'Toutes' },
          { key: 'chat', label: '💬 Messages' },
          { key: 'new_property', label: '🏠 Logements' },
          { key: 'new_coloc', label: '👥 Colocations' },
          { key: 'bailleur_status', label: '🛡️ Bailleur' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, filterType === tab.key && styles.filterChipActive]}
            onPress={() => setFilterType(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === tab.key && styles.filterChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENU PRINCIPAL */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003880" />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filteredList.length === 0 && { flex: 1, justifyContent: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              colors={['#003880']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={42} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyDesc}>
                Vous serez notifié dès qu'un nouveau message, logement ou demande de colocation sera disponible.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: '#003880',
    fontSize: 13,
    fontWeight: '700',
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#003880',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    paddingBottom: 30,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#BFDBFE',
    borderLeftWidth: 4,
    borderLeftColor: '#003880',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  titleTextUnread: {
    color: '#003880',
  },
  bodyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  rightActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003880',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});
