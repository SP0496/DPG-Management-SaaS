import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { BedStatus, SharingType } from '../../types/domain';
import { formatINR } from '../../utils/displayFormatters';

const SHARING_OPTIONS: { value: SharingType; label: string }[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'TRIPLE', label: 'Triple' },
  { value: 'FOUR_SHARING', label: '4 Sharing' },
  { value: 'DORMITORY', label: 'Dorm' },
];

export const RoomsBedsScreen: React.FC = () => {
  const {
    properties,
    rooms,
    roomsMeta,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchRooms,
    createRoom,
    addBed,
    updateBedStatus,
    deleteBed,
  } = usePortalData();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);

  const [newRoomPropertyId, setNewRoomPropertyId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('1');
  const [sharingType, setSharingType] = useState<SharingType>('DOUBLE');
  const [baseRent, setBaseRent] = useState('9000');
  const [newBedCodes, setNewBedCodes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const propertyOptions = useMemo(
    () => [
      { value: 'ALL', label: 'All PGs' },
      ...properties.map((p) => ({ value: p.id, label: p.name })),
    ],
    [properties]
  );

  const floorOptions = useMemo(() => {
    const distinctFloors = Array.from(new Set(rooms.map((r) => r.floorNumber))).sort((a, b) => a - b);
    const items = [{ value: 'ALL', label: 'All Floors' }];
    distinctFloors.forEach((f) => items.push({ value: String(f), label: `Floor ${f}` }));
    return items;
  }, [rooms]);

  const applyFilter = async (propId: string, floorStr: string, query: string) => {
    await fetchRooms({
      propertyId: propId === 'ALL' ? undefined : propId,
      floorNumber: floorStr === 'ALL' ? undefined : Number(floorStr),
      search: query.trim() || undefined,
      page: 0,
    });
  };

  const handleCreateRoom = async () => {
    const targetPropertyId =
      newRoomPropertyId ||
      (selectedPropertyId !== 'ALL' ? selectedPropertyId : properties[0]?.id);
    if (!targetPropertyId) {
      setFeedback('Create a PG property first before adding rooms.');
      return;
    }
    if (!roomNumber.trim()) {
      setFeedback('Enter a room number such as 101 or 204.');
      return;
    }
    const created = await createRoom({
      propertyId: targetPropertyId,
      roomNumber: roomNumber.trim(),
      floorNumber: Math.max(0, Number(floorNumber) || 0),
      sharingType,
      baseMonthlyRent: Math.max(1000, Number(baseRent) || 8500),
      hasAttachedBathroom: true,
      hasBalcony: false,
    });
    setFeedback(`Added Room ${created.roomNumber} on Floor ${created.floorNumber}.`);
    setRoomNumber('');
    setShowAddRoom(false);
  };

  const handleAddBed = async (roomId: string) => {
    const code = (newBedCodes[roomId] || '').trim();
    if (!code) {
      setFeedback('Enter a bed code like 101-A before adding.');
      return;
    }
    await addBed(roomId, code);
    setNewBedCodes((prev) => ({ ...prev, [roomId]: '' }));
    setFeedback(`Added bed ${code}.`);
  };

  const toggleBedMaintenance = async (bedId: string, current: BedStatus) => {
    if (current === 'OCCUPIED') {
      setFeedback('Occupied beds are released by checking out the resident.');
      return;
    }
    const next: BedStatus = current === 'MAINTENANCE' ? 'VACANT' : 'MAINTENANCE';
    await updateBedStatus(bedId, next);
  };

  if (loading && rooms.length === 0) {
    return <LoadingView fullscreen message="Loading floor-wise rooms and bed occupancy..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="Rooms & Beds (Floor-Wise)"
        actionLabel={showAddRoom ? 'Close Form' : 'Add Room'}
        onActionPress={() => setShowAddRoom((prev) => !prev)}
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <FilterChips
        options={propertyOptions}
        selectedValue={selectedPropertyId}
        onSelect={(val) => {
          setSelectedPropertyId(val);
          applyFilter(val, selectedFloor, searchQuery);
        }}
      />

      <FilterChips
        options={floorOptions}
        selectedValue={selectedFloor}
        onSelect={(val) => {
          setSelectedFloor(val);
          applyFilter(selectedPropertyId, val, searchQuery);
        }}
      />

      <AppCard style={styles.searchCard}>
        <AppInput
          label="Search Room Number"
          placeholder="e.g. 101, 202..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <AppButton
          label="Apply Room Filter"
          variant="secondary"
          onPress={() => applyFilter(selectedPropertyId, selectedFloor, searchQuery)}
        />
      </AppCard>

      {showAddRoom ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Add Floor-Wise Room</Text>
          {properties.length > 0 ? (
            <FilterChips
              options={properties.map((p) => ({ value: p.id, label: p.name }))}
              selectedValue={newRoomPropertyId || properties[0].id}
              onSelect={setNewRoomPropertyId}
            />
          ) : null}
          <FilterChips
            options={SHARING_OPTIONS}
            selectedValue={sharingType}
            onSelect={setSharingType}
          />
          <View style={styles.rowThree}>
            <View style={styles.third}>
              <AppInput label="Room No" value={roomNumber} onChangeText={setRoomNumber} placeholder="201" testID="room-number-input" />
            </View>
            <View style={styles.third}>
              <AppInput label="Floor" value={floorNumber} onChangeText={setFloorNumber} keyboardType="number-pad" testID="room-floor-input" />
            </View>
            <View style={styles.third}>
              <AppInput label="Base Rent" value={baseRent} onChangeText={setBaseRent} keyboardType="number-pad" testID="room-rent-input" />
            </View>
          </View>
          <AppButton label="Create Room" onPress={handleCreateRoom} loading={mutating} testID="create-room-button" />
        </AppCard>
      ) : null}

      {rooms.length === 0 ? (
        <EmptyState
          iconName="bed-outline"
          title="No Rooms Found"
          message="Add rooms floor-wise and configure individual beds to track live occupancy."
          actionLabel="Add Room"
          onActionPress={() => setShowAddRoom(true)}
        />
      ) : (
        rooms.map((room) => (
          <AppCard key={room.id} style={styles.roomCard}>
            <View style={styles.roomHeader}>
              <View>
                <Text style={TYPOGRAPHY.h2}>
                  Room {room.roomNumber} - Floor {room.floorNumber}
                </Text>
                <Text style={TYPOGRAPHY.caption}>
                  {room.sharingType.replace('_', ' ')} - Base {formatINR(room.baseMonthlyRent)}/mo
                </Text>
              </View>
              <StatusBadge
                label={`${room.occupancyPercentage.toFixed(0)}% Full`}
                tone={room.vacantBeds === 0 && room.totalBeds > 0 ? 'navy' : 'accent'}
              />
            </View>

            <View style={styles.occBar}>
              <Text style={styles.occMetric}>Total: {room.totalBeds}</Text>
              <Text style={styles.occMetric}>Occupied: {room.occupiedBeds}</Text>
              <Text style={styles.occMetric}>Vacant: {room.vacantBeds}</Text>
              <Text style={styles.occMetric}>Maint: {room.maintenanceBeds}</Text>
            </View>

            <View style={styles.bedsWrap}>
              {room.beds.map((bed) => (
                <View key={bed.id} style={styles.bedChipRow}>
                  <Pressable
                    onPress={() => toggleBedMaintenance(bed.id, bed.status)}
                    style={[
                      styles.bedBadge,
                      bed.status === 'OCCUPIED'
                        ? styles.bedOccupied
                        : bed.status === 'MAINTENANCE'
                          ? styles.bedMaint
                          : styles.bedVacant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bedCodeText,
                        bed.status === 'OCCUPIED' && styles.bedOccupiedText,
                      ]}
                    >
                      {bed.bedCode} ({bed.status})
                    </Text>
                  </Pressable>
                  {bed.status !== 'OCCUPIED' ? (
                    <AppButton
                      label="Remove"
                      variant="secondary"
                      onPress={() => deleteBed(bed.id)}
                    />
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.addBedRow}>
              <View style={styles.bedInputWrap}>
                <AppInput
                  label="Add Bed Code"
                  value={newBedCodes[room.id] || ''}
                  onChangeText={(txt) =>
                    setNewBedCodes((prev) => ({ ...prev, [room.id]: txt }))
                  }
                  placeholder={`${room.roomNumber}-A`}
                />
              </View>
              <View style={styles.bedBtnWrap}>
                <AppButton
                  label="Add Bed"
                  onPress={() => handleAddBed(room.id)}
                  loading={mutating}
                />
              </View>
            </View>
          </AppCard>
        ))
      )}

      {roomsMeta.hasNext ? (
        <AppButton
          label={`Load More Rooms (${rooms.length}/${roomsMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchRooms({
              propertyId: selectedPropertyId === 'ALL' ? undefined : selectedPropertyId,
              floorNumber: selectedFloor === 'ALL' ? undefined : Number(selectedFloor),
              search: searchQuery.trim() || undefined,
              page: roomsMeta.page + 1,
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
  rowThree: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  third: {
    flex: 1,
  },
  roomCard: {
    gap: SPACING.sm,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  occBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.iceBlueShade,
    padding: SPACING.sm,
    borderRadius: RADII.sm,
  },
  occMetric: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  bedsWrap: {
    gap: SPACING.xs,
  },
  bedChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bedBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  bedVacant: {
    backgroundColor: COLORS.iceBlue,
    borderColor: COLORS.navyBorder,
  },
  bedOccupied: {
    backgroundColor: COLORS.midnightNavy,
    borderColor: COLORS.midnightNavy,
  },
  bedMaint: {
    backgroundColor: COLORS.tangerineTint,
    borderColor: COLORS.tangerine,
  },
  bedCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  bedOccupiedText: {
    color: COLORS.iceBlue,
  },
  addBedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  bedInputWrap: {
    flex: 1,
  },
  bedBtnWrap: {
    width: 110,
  },
});
