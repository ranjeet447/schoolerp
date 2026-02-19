package sis

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type HostelService struct {
	db    *pgxpool.Pool
	audit *audit.Logger
}

func NewHostelService(db *pgxpool.Pool, audit *audit.Logger) *HostelService {
	return &HostelService{db: db, audit: audit}
}

type HostelBuilding struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	Address    string `json:"address"`
	WardenID   string `json:"warden_id"`
	TotalRooms int    `json:"total_rooms"`
	IsActive   bool   `json:"is_active"`
}

type HostelRoom struct {
	ID          string   `json:"id"`
	BuildingID  string   `json:"building_id"`
	RoomNumber  string   `json:"room_number"`
	RoomType    string   `json:"room_type"`
	Capacity    int      `json:"capacity"`
	Occupancy   int      `json:"occupancy"`
	CostOfMonth float64  `json:"cost_per_month"`
	Amenities   []string `json:"amenities"`
}

type HostelAllocation struct {
	ID        string `json:"id"`
	RoomID    string `json:"room_id"`
	StudentID string `json:"student_id"`
	Student   string `json:"student_name,omitempty"`
	Room      string `json:"room_number,omitempty"`
	Building  string `json:"building_name,omitempty"`
	Since     string `json:"allotted_on"`
	Status    string `json:"status"`
}

func (s *HostelService) CreateBuilding(ctx context.Context, tenantID string, b HostelBuilding, userID, reqID, ip string) (HostelBuilding, error) {
	var id string
	query := `INSERT INTO hostel_buildings (tenant_id, name, type, address, warden_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := s.db.QueryRow(ctx, query, tenantID, b.Name, b.Type, b.Address, nullUUID(b.WardenID)).Scan(&id)
	if err != nil {
		return HostelBuilding{}, err
	}
	b.ID = id

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "hostel.building.create",
		ResourceType: "hostel_building",
		ResourceID:   toPgUUID(id),
		After:        b,
		IPAddress:    ip,
	})

	return b, nil
}

func (s *HostelService) ListBuildings(ctx context.Context, tenantID string) ([]HostelBuilding, error) {
	query := `SELECT id, name, type, address, warden_id, total_rooms, is_active FROM hostel_buildings WHERE tenant_id = $1 AND is_active = true`
	rows, err := s.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buildings []HostelBuilding
	for rows.Next() {
		var b HostelBuilding
		var wID *string
		err := rows.Scan(&b.ID, &b.Name, &b.Type, &b.Address, &wID, &b.TotalRooms, &b.IsActive)
		if err != nil {
			return nil, err
		}
		if wID != nil { b.WardenID = *wID }
		buildings = append(buildings, b)
	}
	return buildings, nil
}

func (s *HostelService) CreateRoom(ctx context.Context, bID string, r HostelRoom) (HostelRoom, error) {
	var id string
	query := `INSERT INTO hostel_rooms (building_id, room_number, room_type, capacity, cost_per_month, amenities) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err := s.db.QueryRow(ctx, query, bID, r.RoomNumber, r.RoomType, r.Capacity, r.CostOfMonth, r.Amenities).Scan(&id)
	if err != nil {
		return HostelRoom{}, err
	}
	r.ID = id
	r.BuildingID = bID

	// Update total rooms count
	s.db.Exec(ctx, `UPDATE hostel_buildings SET total_rooms = total_rooms + 1 WHERE id = $1`, bID)

	return r, nil
}

func (s *HostelService) ListRooms(ctx context.Context, bID string) ([]HostelRoom, error) {
	query := `SELECT id, building_id, room_number, room_type, capacity, occupancy, cost_per_month, amenities FROM hostel_rooms WHERE building_id = $1 AND is_active = true`
	rows, err := s.db.Query(ctx, query, bID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []HostelRoom
	for rows.Next() {
		var r HostelRoom
		err := rows.Scan(&r.ID, &r.BuildingID, &r.RoomNumber, &r.RoomType, &r.Capacity, &r.Occupancy, &r.CostOfMonth, &r.Amenities)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, r)
	}
	return rooms, nil
}

func (s *HostelService) AllocateRoom(ctx context.Context, tenantID, roomID, studentID string, userID, reqID, ip string) error {
	// Check capacity
	var capacity, occupancy int
	err := s.db.QueryRow(ctx, `SELECT capacity, occupancy FROM hostel_rooms WHERE id = $1`, roomID).Scan(&capacity, &occupancy)
	if err != nil {
		return err
	}
	if occupancy >= capacity {
		return fmt.Errorf("room is full")
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `INSERT INTO hostel_allocations (room_id, student_id) VALUES ($1, $2)`, roomID, studentID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `UPDATE hostel_rooms SET occupancy = occupancy + 1 WHERE id = $1`, roomID)
	if err != nil {
		return err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "hostel.allocation.create",
		ResourceType: "hostel_allocation",
		After:        map[string]string{"room_id": roomID, "student_id": studentID},
		IPAddress:    ip,
	})

	return nil
}

func (s *HostelService) ListAllocations(ctx context.Context, tenantID string) ([]HostelAllocation, error) {
	query := `
		SELECT ha.id, ha.room_id, ha.student_id, hr.room_number, hb.name as building_name, s.full_name as student_name, ha.allotted_on, ha.status
		FROM hostel_allocations ha
		JOIN hostel_rooms hr ON ha.room_id = hr.id
		JOIN hostel_buildings hb ON hr.building_id = hb.id
		JOIN students s ON ha.student_id = s.id
		WHERE hb.tenant_id = $1 AND ha.status = 'active'
	`
	rows, err := s.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allocations []HostelAllocation
	for rows.Next() {
		var a HostelAllocation
		var allottedOn time.Time
		err := rows.Scan(&a.ID, &a.RoomID, &a.StudentID, &a.Room, &a.Building, &a.Student, &allottedOn, &a.Status)
		if err != nil {
			return nil, err
		}
		a.Since = allottedOn.Format("2006-01-02")
		allocations = append(allocations, a)
	}
	return allocations, nil
}

func (s *HostelService) VacateRoom(ctx context.Context, tenantID, allocationID string, userID, reqID, ip string) error {
	var roomID string
	err := s.db.QueryRow(ctx, `UPDATE hostel_allocations SET status = 'vacated', vacated_on = CURRENT_DATE WHERE id = $1 RETURNING room_id`, allocationID).Scan(&roomID)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(ctx, `UPDATE hostel_rooms SET occupancy = occupancy - 1 WHERE id = $1`, roomID)
	if err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "hostel.allocation.vacate",
		ResourceType: "hostel_allocation",
		ResourceID:   toPgUUID(allocationID),
		IPAddress:    ip,
	})

	return nil
}
