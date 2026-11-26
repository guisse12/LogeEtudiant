import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n';

/**
 * Bouton sélecteur de langue sous forme de pilule compacte pour les en-têtes (Login, Register, Profile, Home)
 */
export function LanguagePill({ style }) {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = language === 'fr' ? 'en' : 'fr';
    setLanguage(nextLang);
  };

  return (
    <TouchableOpacity
      style={[styles.pillContainer, style]}
      onPress={toggleLanguage}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.pillFlag}>{language === 'fr' ? '🇫🇷' : '🇬🇧'}</Text>
      <Text style={styles.pillText}>{language === 'fr' ? 'FR' : 'EN'}</Text>
      <Ionicons name="swap-horizontal" size={13} color="#003880" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

/**
 * Sélecteur de langue complet sous forme de carte élégante pleine largeur (Profil / Paramètres)
 */
export default function LanguageSelectorCard({ style }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <View style={[styles.card, style]}>
      {/* En-tête de la carte */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerIconBox}>
          <Ionicons name="globe-outline" size={20} color="#003880" />
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>{t('profile.languageSetting')}</Text>
          <Text style={styles.subtitle}>{t('profile.languageNotice')}</Text>
        </View>
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeFlag}>{language === 'fr' ? '🇫🇷' : '🇬🇧'}</Text>
          <Text style={styles.currentBadgeText}>{language === 'fr' ? 'FR' : 'EN'}</Text>
        </View>
      </View>

      {/* Onglets de sélection modernes */}
      <View style={styles.segmentContainer}>
        {SUPPORTED_LANGUAGES.map((item) => {
          const isSelected = language === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.segmentButton,
                isSelected && styles.segmentButtonActive,
              ]}
              onPress={() => setLanguage(item.code)}
              activeOpacity={0.85}
            >
              <Text style={styles.flagEmoji}>{item.flag}</Text>
              <Text
                style={[
                  styles.segmentLabel,
                  isSelected && styles.segmentLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color="#E8A008"
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  pillFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003880',
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 6,
  },
  currentBadgeFlag: {
    fontSize: 12,
    marginRight: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003880',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: '#003880',
    shadowColor: '#003880',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
