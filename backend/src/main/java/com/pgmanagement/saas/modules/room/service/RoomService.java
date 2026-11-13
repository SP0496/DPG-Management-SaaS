package com.pgmanagement.saas.modules.room.service;

import com.pgmanagement.saas.modules.booking.repository.BookingRepository;
import com.pgmanagement.saas.modules.property.service.PropertyService;
import com.pgmanagement.saas.modules.room.dto.request.BedRequest;
import com.pgmanagement.saas.modules.room.dto.request.RoomRequest;
import com.pgmanagement.saas.modules.room.dto.request.UpdateBedStatusRequest;
import com.pgmanagement.saas.modules.room.dto.response.BedResponse;
import com.pgmanagement.saas.modules.room.dto.response.RoomResponse;
import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.BedStatus;
import com.pgmanagement.saas.modules.room.entity.Room;
import com.pgmanagement.saas.modules.room.repository.BedRepository;
import com.pgmanagement.saas.modules.room.repository.RoomRepository;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.ConflictException;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final BookingRepository bookingRepository;
    private final PropertyService propertyService;

    @Transactional
    public RoomResponse createRoom(UUID ownerId, RoomRequest request) {
        propertyService.assertActivePropertyOwnedBy(request.getPropertyId(), ownerId);

        String roomNumber = request.getRoomNumber().trim();
        if (roomRepository.existsByPropertyIdAndRoomNumberIgnoreCase(request.getPropertyId(), roomNumber)) {
            throw new ConflictException("Room number already exists in this property");
        }

        Room room = Room.builder()
                .ownerId(ownerId)
                .propertyId(request.getPropertyId())
                .roomNumber(roomNumber)
                .floorNumber(request.getFloorNumber())
                .sharingType(request.getSharingType())
                .baseMonthlyRent(request.getBaseMonthlyRent())
                .hasAttachedBathroom(request.isHasAttachedBathroom())
                .hasBalcony(request.isHasBalcony())
                .active(true)
                .build();

        return RoomResponse.from(roomRepository.save(room));
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> listRooms(UUID ownerId, UUID propertyId) {
        List<Room> rooms;
        if (propertyId != null) {
            propertyService.assertActivePropertyOwnedBy(propertyId, ownerId);
            rooms = roomRepository.findAllByPropertyIdAndOwnerIdAndActiveTrue(propertyId, ownerId);
        } else {
            rooms = roomRepository.findAllByOwnerIdAndActiveTrue(ownerId);
        }
        return enrichRoomsWithBeds(rooms, ownerId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RoomResponse> searchRooms(
            UUID ownerId,
            UUID propertyId,
            Integer floorNumber,
            String search,
            int page,
            int size) {
        List<Room> rooms;
        if (propertyId != null) {
            propertyService.assertActivePropertyOwnedBy(propertyId, ownerId);
            rooms = roomRepository.findAllByPropertyIdAndOwnerIdAndActiveTrue(propertyId, ownerId);
        } else {
            rooms = roomRepository.findAllByOwnerIdAndActiveTrue(ownerId);
        }

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<Room> filtered = rooms.stream()
                .filter(room -> floorNumber == null || room.getFloorNumber() == floorNumber)
                .filter(room -> normalizedSearch.isEmpty()
                        || room.getRoomNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || room.getSharingType().name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .sorted(Comparator.comparingInt(Room::getFloorNumber).thenComparing(Room::getRoomNumber))
                .toList();

        return PagedResponse.ofList(enrichRoomsWithBeds(filtered, ownerId), page, size);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoom(UUID roomId, UUID ownerId) {
        Room room = getOwnedRoomEntity(roomId, ownerId);
        List<Bed> beds = bedRepository.findAllByRoomIdAndOwnerId(roomId, ownerId);
        return RoomResponse.from(room, beds);
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, UUID ownerId, RoomRequest request) {
        Room room = getOwnedRoomEntity(roomId, ownerId);
        propertyService.assertActivePropertyOwnedBy(request.getPropertyId(), ownerId);

        String roomNumber = request.getRoomNumber().trim();
        if (!room.getRoomNumber().equalsIgnoreCase(roomNumber)
                && roomRepository.existsByPropertyIdAndRoomNumberIgnoreCase(request.getPropertyId(), roomNumber)) {
            throw new ConflictException("Room number already exists in this property");
        }

        room.setPropertyId(request.getPropertyId());
        room.setRoomNumber(roomNumber);
        room.setFloorNumber(request.getFloorNumber());
        room.setSharingType(request.getSharingType());
        room.setBaseMonthlyRent(request.getBaseMonthlyRent());
        room.setHasAttachedBathroom(request.isHasAttachedBathroom());
        room.setHasBalcony(request.isHasBalcony());

        Room saved = roomRepository.save(room);
        List<Bed> beds = bedRepository.findAllByRoomIdAndOwnerId(roomId, ownerId);
        return RoomResponse.from(saved, beds);
    }

    @Transactional
    public BedResponse addBed(UUID roomId, UUID ownerId, BedRequest request) {
        Room room = getOwnedRoomEntity(roomId, ownerId);
        String bedCode = request.getBedCode().trim();
        if (bedRepository.existsByRoomIdAndBedCodeIgnoreCase(roomId, bedCode)) {
            throw new ConflictException("Bed code already exists in this room");
        }

        Bed bed = Bed.builder()
                .ownerId(ownerId)
                .propertyId(room.getPropertyId())
                .roomId(room.getId())
                .bedCode(bedCode)
                .status(BedStatus.VACANT)
                .build();

        return BedResponse.from(bedRepository.save(bed));
    }

    @Transactional(readOnly = true)
    public List<BedResponse> listBeds(UUID roomId, UUID ownerId) {
        getOwnedRoomEntity(roomId, ownerId);
        return bedRepository.findAllByRoomIdAndOwnerId(roomId, ownerId)
                .stream()
                .map(BedResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BedResponse> listOwnerBeds(UUID ownerId, UUID propertyId, BedStatus status) {
        List<Bed> beds;
        if (propertyId != null) {
            propertyService.assertActivePropertyOwnedBy(propertyId, ownerId);
            beds = bedRepository.findAllByPropertyIdAndOwnerId(propertyId, ownerId);
        } else {
            beds = bedRepository.findAllByOwnerId(ownerId);
        }

        return beds.stream()
                .filter(bed -> status == null || bed.getStatus() == status)
                .sorted(Comparator.comparing(Bed::getBedCode))
                .map(BedResponse::from)
                .toList();
    }

    @Transactional
    public BedResponse updateBedStatus(UUID bedId, UUID ownerId, UpdateBedStatusRequest request) {
        Bed bed = bedRepository.findByIdAndOwnerIdForUpdate(bedId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found for this owner"));
        if (bed.getStatus() == BedStatus.OCCUPIED && request.getStatus() == BedStatus.VACANT) {
            throw new BadRequestException("Occupied beds must be released through booking checkout");
        }
        bed.setStatus(request.getStatus());
        return BedResponse.from(bedRepository.save(bed));
    }

    @Transactional
    public void deleteBed(UUID bedId, UUID ownerId) {
        Bed bed = bedRepository.findByIdAndOwnerIdForUpdate(bedId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found for this owner"));
        if (bed.getStatus() == BedStatus.OCCUPIED) {
            throw new ConflictException("Cannot delete an occupied bed; check out the resident first");
        }
        if (bookingRepository.existsByBedId(bedId)) {
            throw new ConflictException("Bed has booking history; set status to MAINTENANCE instead");
        }
        bedRepository.delete(bed);
    }

    @Transactional
    public Bed allocateVacantBed(UUID bedId, UUID ownerId) {
        Bed bed = bedRepository.findByIdAndOwnerIdForUpdate(bedId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found for this owner"));
        if (bed.getStatus() != BedStatus.VACANT && bed.getStatus() != BedStatus.RESERVED) {
            throw new ConflictException("Bed is not currently available for allocation");
        }
        bed.setStatus(BedStatus.OCCUPIED);
        return bedRepository.save(bed);
    }

    @Transactional
    public void releaseBed(UUID bedId, UUID ownerId) {
        Bed bed = bedRepository.findByIdAndOwnerIdForUpdate(bedId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found for this owner"));
        bed.setStatus(BedStatus.VACANT);
        bedRepository.save(bed);
    }

    @Transactional(readOnly = true)
    public Room findRoomEntityForRead(UUID roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    @Transactional(readOnly = true)
    public Bed findBedEntityForRead(UUID bedId) {
        return bedRepository.findById(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found"));
    }

    private Room getOwnedRoomEntity(UUID roomId, UUID ownerId) {
        return roomRepository.findByIdAndOwnerId(roomId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found for this owner"));
    }

    private List<RoomResponse> enrichRoomsWithBeds(List<Room> rooms, UUID ownerId) {
        if (rooms.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> roomIds = rooms.stream().map(Room::getId).toList();
        Map<UUID, List<Bed>> bedsByRoomId = bedRepository.findAllByRoomIdInAndOwnerId(roomIds, ownerId)
                .stream()
                .collect(Collectors.groupingBy(Bed::getRoomId));
        return rooms.stream()
                .map(room -> RoomResponse.from(room, bedsByRoomId.getOrDefault(room.getId(), Collections.emptyList())))
                .toList();
    }
}
