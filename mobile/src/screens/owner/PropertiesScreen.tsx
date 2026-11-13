import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FilterChips } from '../../components/FilterChips';
import { LoadingView } from '../../components/LoadingView';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { PropertyItem, PropertyType } from '../../types/domain';
import { formatINR } from '../../utils/displayFormatters';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'MENS_PG', label: 'Mens PG' },
  { value: 'WOMENS_PG', label: 'Womens PG' },
  { value: 'CO_LIVING', label: 'Co-Living' },
  { value: 'HOSTEL', label: 'Hostel' },
];

export const PropertiesScreen: React.FC = () => {
  const {
    properties,
    propertiesMeta,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchProperties,
    createProperty,
    updateProperty,
    updatePropertyRentConfig,
    deactivateProperty,
  } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [rentConfigProperty, setRentConfigProperty] = useState<PropertyItem | null>(null);

  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('CO_LIVING');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560001');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [billingDay, setBillingDay] = useState('5');
  const [graceDays, setGraceDays] = useState('3');
  const [lateFee, setLateFee] = useState('250');
  const [amenities, setAmenities] = useState('WiFi, Power Backup, RO Water');

  const [cfgBillingDay, setCfgBillingDay] = useState('5');
  const [cfgGraceDays, setCfgGraceDays] = useState('3');
  const [cfgLateFee, setCfgLateFee] = useState('250');
  const [feedback, setFeedback] = useState<string | null>(null);

  const resetForm = () => {
    setEditingProperty(null);
    setName('');
    setPropertyType('CO_LIVING');
    setAddressLine1('');
    setCity('');
    setStateName('Karnataka');
    setPostalCode('560001');
    setEmergencyContact('');
    setBillingDay('5');
    setGraceDays('3');
    setLateFee('250');
    setAmenities('WiFi, Power Backup, RO Water');
  };

  const openEditForm = (item: PropertyItem) => {
    setEditingProperty(item);
    setName(item.name);
    setPropertyType(item.propertyType);
    setAddressLine1(item.addressLine1);
    setCity(item.city);
    setStateName(item.state);
    setPostalCode(item.postalCode);
    setEmergencyContact(item.emergencyContact);
    setBillingDay(String(item.defaultBillingDay));
    setGraceDays(String(item.gracePeriodDays));
    setLateFee(String(item.lateFeeAmount));
    setAmenities(item.amenities ?? '');
    setShowForm(true);
  };

  const handleSaveProperty = async () => {
    if (!name.trim() || !addressLine1.trim() || !city.trim() || !emergencyContact.trim()) {
      setFeedback('Fill property name, address, city and emergency contact.');
      return;
    }
    const payload = {
      name: name.trim(),
      propertyType,
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      state: stateName.trim() || 'India',
      postalCode: postalCode.trim() || '560001',
      emergencyContact: emergencyContact.trim(),
      defaultBillingDay: Math.min(28, Math.max(1, Number(billingDay) || 5)),
      gracePeriodDays: Math.min(15, Math.max(0, Number(graceDays) || 3)),
      lateFeeAmount: Math.max(0, Number(lateFee) || 0),
      amenities: amenities.trim() || undefined,
    };

    if (editingProperty) {
      await updateProperty(editingProperty.id, payload);
      setFeedback(`Updated property ${payload.name}.`);
    } else {
      await createProperty(payload);
      setFeedback(`Created property ${payload.name}.`);
    }
    resetForm();
    setShowForm(false);
  };

  const handleSaveRentConfig = async () => {
    if (!rentConfigProperty) return;
    await updatePropertyRentConfig(rentConfigProperty.id, {
      defaultBillingDay: Math.min(28, Math.max(1, Number(cfgBillingDay) || 5)),
      gracePeriodDays: Math.min(15, Math.max(0, Number(cfgGraceDays) || 3)),
      lateFeeAmount: Math.max(0, Number(cfgLateFee) || 0),
    });
    setFeedback(`Updated due date & late fee rules for ${rentConfigProperty.name}.`);
    setRentConfigProperty(null);
  };

  const handleSearch = async () => {
    await fetchProperties({ search: searchQuery.trim() || undefined, page: 0 });
  };

  if (loading && properties.length === 0) {
    return <LoadingView fullscreen message="Loading your PG properties..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="PG Properties"
        actionLabel={showForm ? 'Close Form' : 'Add PG'}
        onActionPress={() => {
          if (showForm) {
            resetForm();
          }
          setShowForm((prev) => !prev);
        }}
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.searchCard}>
        <AppInput
          label="Search Properties"
          placeholder="Search by PG name or city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="properties-search-input"
        />
        <AppButton
          label="Search Properties"
          variant="secondary"
          onPress={handleSearch}
          testID="properties-search-button"
        />
      </AppCard>

      {showForm ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>
            {editingProperty ? `Edit ${editingProperty.name}` : 'Create New PG Property'}
          </Text>
          <FilterChips
            options={PROPERTY_TYPES}
            selectedValue={propertyType}
            onSelect={setPropertyType}
          />
          <AppInput label="Property Name" value={name} onChangeText={setName} placeholder="Sunrise Mens PG" testID="property-name-input" />
          <AppInput label="Street Address" value={addressLine1} onChangeText={setAddressLine1} placeholder="12th Main Road, BTM Layout" testID="property-address-input" />
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppInput label="City" value={city} onChangeText={setCity} placeholder="Bengaluru" testID="property-city-input" />
            </View>
            <View style={styles.half}>
              <AppInput label="State" value={stateName} onChangeText={setStateName} placeholder="Karnataka" />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppInput label="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
            </View>
            <View style={styles.half}>
              <AppInput label="Emergency Phone" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="+919876543210" testID="property-contact-input" />
            </View>
          </View>
          <View style={styles.rowThree}>
            <View style={styles.third}>
              <AppInput label="Billing Day" value={billingDay} onChangeText={setBillingDay} keyboardType="number-pad" />
            </View>
            <View style={styles.third}>
              <AppInput label="Grace Days" value={graceDays} onChangeText={setGraceDays} keyboardType="number-pad" />
            </View>
            <View style={styles.third}>
              <AppInput label="Late Fee" value={lateFee} onChangeText={setLateFee} keyboardType="number-pad" />
            </View>
          </View>
          <AppInput label="Amenities" value={amenities} onChangeText={setAmenities} placeholder="WiFi, Laundry, Meals" />
          <AppButton
            label={editingProperty ? 'Save Property Changes' : 'Create Property'}
            onPress={handleSaveProperty}
            loading={mutating}
            testID="save-property-button"
          />
        </AppCard>
      ) : null}

      {rentConfigProperty ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Rent & Due Date Settings: {rentConfigProperty.name}</Text>
          <View style={styles.rowThree}>
            <View style={styles.third}>
              <AppInput label="Due Day (1-28)" value={cfgBillingDay} onChangeText={setCfgBillingDay} keyboardType="number-pad" />
            </View>
            <View style={styles.third}>
              <AppInput label="Grace Days" value={cfgGraceDays} onChangeText={setCfgGraceDays} keyboardType="number-pad" />
            </View>
            <View style={styles.third}>
              <AppInput label="Late Fee" value={cfgLateFee} onChangeText={setCfgLateFee} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppButton label="Save Rent Rules" onPress={handleSaveRentConfig} loading={mutating} />
            </View>
            <View style={styles.half}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setRentConfigProperty(null)} />
            </View>
          </View>
        </AppCard>
      ) : null}

      {properties.length === 0 ? (
        <EmptyState
          iconName="business-outline"
          title="No PG Properties Yet"
          message="Add your first PG property to start organizing floors, rooms, and beds."
          actionLabel="Add First PG"
          onActionPress={() => setShowForm(true)}
        />
      ) : (
        properties.map((prop) => (
          <AppCard key={prop.id} style={styles.propCard}>
            <View style={styles.cardHeader}>
              <View style={styles.propTitleWrap}>
                <Text style={TYPOGRAPHY.h2}>{prop.name}</Text>
                <Text style={TYPOGRAPHY.caption}>
                  {prop.addressLine1}, {prop.city}, {prop.state} - {prop.postalCode}
                </Text>
              </View>
              <StatusBadge label={prop.propertyType.replace('_', ' ')} tone="accent" />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Due Day: {prop.defaultBillingDay}</Text>
              <Text style={styles.metaText}>Grace: {prop.gracePeriodDays}d</Text>
              <Text style={styles.metaText}>Late Fee: {formatINR(prop.lateFeeAmount)}</Text>
            </View>

            {prop.amenities ? (
              <Text style={TYPOGRAPHY.caption}>Amenities: {prop.amenities}</Text>
            ) : null}

            <View style={styles.actionRow}>
              <AppButton
                label="Edit"
                variant="secondary"
                onPress={() => openEditForm(prop)}
                style={styles.smallBtn}
              />
              <AppButton
                label="Due Rules"
                variant="secondary"
                onPress={() => {
                  setRentConfigProperty(prop);
                  setCfgBillingDay(String(prop.defaultBillingDay));
                  setCfgGraceDays(String(prop.gracePeriodDays));
                  setCfgLateFee(String(prop.lateFeeAmount));
                }}
                style={styles.smallBtn}
              />
              <AppButton
                label="Deactivate"
                variant="secondary"
                onPress={() => deactivateProperty(prop.id)}
                style={styles.smallBtn}
              />
            </View>
          </AppCard>
        ))
      )}

      {propertiesMeta.hasNext ? (
        <AppButton
          label={`Load More Properties (${properties.length}/${propertiesMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchProperties({
              search: searchQuery.trim() || undefined,
              page: propertiesMeta.page + 1,
              append: true,
            })
          }
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  searchCard: {
    gap: SPACING.sm,
  },
  formCard: {
    gap: SPACING.sm,
  },
  propCard: {
    gap: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  propTitleWrap: {
    flex: 1,
    gap: 2,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  half: {
    flex: 1,
  },
  rowThree: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  third: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.iceBlueShade,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  smallBtn: {
    flex: 1,
  },
});
