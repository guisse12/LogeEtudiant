import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AFRICAN_COUNTRIES, DEFAULT_COUNTRY, filterAfricanCountries } from '../services/countryService';
import { useTranslation } from '../i18n';

/**
 * Bouton sélecteur de pays avec drapeau et indicatif
 */
export function CountryPickerButton({ selectedCountry = DEFAULT_COUNTRY, onPress, style }) {
  const country = selectedCountry || DEFAULT_COUNTRY;
  return (
    <TouchableOpacity
      style={[styles.pickerButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    >
      <Text style={styles.buttonFlag}>{country.flag}</Text>
      <Text style={styles.buttonDial}>{country.dialCode}</Text>
      <Ionicons name="chevron-down" size={14} color="#64748B" style={styles.buttonChevron} />
    </TouchableOpacity>
  );
}

/**
 * Modale de sélection d'un pays africain avec recherche instantanée tolérante
 */
export default function CountryPickerModal({
  visible,
  onClose,
  onSelectCountry,
  selectedCountry = DEFAULT_COUNTRY,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    return filterAfricanCountries(search);
  }, [search]);

  const handleSelect = (country) => {
    onSelectCountry(country);
    setSearch('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalCard}>
          {/* Poignée de glissement */}
          <View style={styles.modalBar} />

          {/* En-tête */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>{t('common.countryModalTitle')}</Text>
              <Text style={styles.modalSubtitle}>{t('common.countryModalSubtitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('common.countryModalSearch')}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste des pays - SEULEMENT DRAPEAU, NOM ET INDICATIF */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedCountry?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.dialBadge}>
                    <Text style={styles.dialBadgeText}>{item.dialCode}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#003880"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonFlag: {
    fontSize: 20,
    marginRight: 5,
  },
  buttonDial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003880',
    marginRight: 4,
  },
  buttonChevron: {
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  modalBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#003880',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  countryItemSelected: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: 'transparent',
  },
  countryFlag: {
    fontSize: 26,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  countryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  countryNameSelected: {
    color: '#003880',
  },
  dialBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dialBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003880',
  },
});
