package transport

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type TransportService struct {
	q     db.Querier
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewTransportService(q db.Querier, pool *pgxpool.Pool, audit *audit.Logger) *TransportService {
	return &TransportService{q: q, pool: pool, audit: audit}
}

// Vehicles

type CreateVehicleParams struct {
	TenantID           string
	RegistrationNumber string
	Capacity           int32
	Type               string
	Status             string
	UserID             string
	RequestID          string
	IP                 string
}

func (s *TransportService) CreateVehicle(ctx context.Context, p CreateVehicleParams) (db.TransportVehicle, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	vehicle, err := s.q.CreateVehicle(ctx, db.CreateVehicleParams{
		TenantID:           tUUID,
		RegistrationNumber: p.RegistrationNumber,
		Capacity:           p.Capacity,
		Type:               p.Type,
		Status:             p.Status,
	})
	if err != nil {
		return db.TransportVehicle{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "vehicle.create",
		ResourceType: "transport_vehicle",
		ResourceID:   vehicle.ID,
		After:        vehicle,
		IPAddress:    p.IP,
	})

	return vehicle, nil
}

func (s *TransportService) ListVehicles(ctx context.Context, tenantID string) ([]db.TransportVehicle, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListVehicles(ctx, tUUID)
}

func (s *TransportService) GetVehicle(ctx context.Context, tenantID, vehicleID string) (db.TransportVehicle, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	vUUID := pgtype.UUID{}
	vUUID.Scan(vehicleID)

	return s.q.GetVehicle(ctx, db.GetVehicleParams{
		ID:       vUUID,
		TenantID: tUUID,
	})
}

func (s *TransportService) UpdateVehicle(ctx context.Context, tenantID, vehicleID string, p CreateVehicleParams) (db.TransportVehicle, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	vUUID := pgtype.UUID{}
	vUUID.Scan(vehicleID)

	vehicle, err := s.q.UpdateVehicle(ctx, db.UpdateVehicleParams{
		ID:                 vUUID,
		TenantID:           tUUID,
		RegistrationNumber: p.RegistrationNumber,
		Capacity:           p.Capacity,
		Type:               p.Type,
		Status:             p.Status,
	})
	if err != nil {
		return db.TransportVehicle{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "vehicle.update",
		ResourceType: "transport_vehicle",
		ResourceID:   vehicle.ID,
		After:        vehicle,
		IPAddress:    p.IP,
	})

	return vehicle, nil
}

// Drivers

type CreateDriverParams struct {
	TenantID      string
	FullName      string
	LicenseNumber string
	Phone         string
	Status        string
	UserID        string
	RequestID     string
	IP            string
}

func (s *TransportService) CreateDriver(ctx context.Context, p CreateDriverParams) (db.TransportDriver, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	driver, err := s.q.CreateDriver(ctx, db.CreateDriverParams{
		TenantID:      tUUID,
		FullName:      p.FullName,
		LicenseNumber: pgtype.Text{String: p.LicenseNumber, Valid: p.LicenseNumber != ""},
		Phone:         pgtype.Text{String: p.Phone, Valid: p.Phone != ""},
		Status:        p.Status,
	})
	if err != nil {
		return db.TransportDriver{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "driver.create",
		ResourceType: "transport_driver",
		ResourceID:   driver.ID,
		After:        driver,
		IPAddress:    p.IP,
	})

	return driver, nil
}

func (s *TransportService) UpdateDriver(ctx context.Context, tenantID, driverID string, p CreateDriverParams) (db.TransportDriver, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	dUUID := pgtype.UUID{}
	dUUID.Scan(driverID)

	var driver db.TransportDriver
	err := s.pool.QueryRow(ctx, `
		UPDATE transport_drivers
		SET full_name = $3,
			license_number = $4,
			phone = $5,
			status = $6,
			updated_at = NOW()
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, user_id, full_name, license_number, phone, status, is_active, created_at, updated_at
	`,
		dUUID,
		tUUID,
		p.FullName,
		pgtype.Text{String: p.LicenseNumber, Valid: p.LicenseNumber != ""},
		pgtype.Text{String: p.Phone, Valid: p.Phone != ""},
		p.Status,
	).Scan(
		&driver.ID,
		&driver.TenantID,
		&driver.UserID,
		&driver.FullName,
		&driver.LicenseNumber,
		&driver.Phone,
		&driver.Status,
		&driver.IsActive,
		&driver.CreatedAt,
		&driver.UpdatedAt,
	)
	if err != nil {
		return db.TransportDriver{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "driver.update",
		ResourceType: "transport_driver",
		ResourceID:   driver.ID,
		After:        driver,
		IPAddress:    p.IP,
	})

	return driver, nil
}

func (s *TransportService) ListDrivers(ctx context.Context, tenantID string) ([]db.TransportDriver, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListDrivers(ctx, tUUID)
}

// Routes

type CreateRouteParams struct {
	TenantID    string
	Name        string
	VehicleID   string
	DriverID    string
	Description string
	UserID      string // for audit
	RequestID   string
	IP          string
}

func (s *TransportService) CreateRoute(ctx context.Context, p CreateRouteParams) (db.TransportRoute, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	vUUID := pgtype.UUID{}
	if p.VehicleID != "" {
		vUUID.Scan(p.VehicleID)
	}

	dUUID := pgtype.UUID{}
	if p.DriverID != "" {
		dUUID.Scan(p.DriverID)
	}

	route, err := s.q.CreateRoute(ctx, db.CreateRouteParams{
		TenantID:    tUUID,
		Name:        p.Name,
		VehicleID:   vUUID,
		DriverID:    dUUID,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
	})
	if err != nil {
		return db.TransportRoute{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "route.create",
		ResourceType: "transport_route",
		ResourceID:   route.ID,
		After:        route,
		IPAddress:    p.IP,
	})

	return route, nil
}

func (s *TransportService) ListRoutes(ctx context.Context, tenantID string) ([]db.ListRoutesRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListRoutes(ctx, tUUID)
}
func (s *TransportService) UpdateRoute(ctx context.Context, tenantID, routeID string, p CreateRouteParams) (db.TransportRoute, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	rUUID := pgtype.UUID{}
	rUUID.Scan(routeID)

	vUUID := pgtype.UUID{}
	if p.VehicleID != "" {
		vUUID.Scan(p.VehicleID)
	}

	dUUID := pgtype.UUID{}
	if p.DriverID != "" {
		dUUID.Scan(p.DriverID)
	}

	route, err := s.q.UpdateRoute(ctx, db.UpdateRouteParams{
		ID:          rUUID,
		TenantID:    tUUID,
		Name:        p.Name,
		VehicleID:   vUUID,
		DriverID:    dUUID,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
	})
	if err != nil {
		return db.TransportRoute{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "route.update",
		ResourceType: "transport_route",
		ResourceID:   route.ID,
		After:        route,
		IPAddress:    p.IP,
	})

	return route, nil
}

// Stops

type CreateStopParams struct {
	RouteID       string
	Name          string
	SequenceOrder int32
	// Add other fields as needed
}

func (s *TransportService) CreateRouteStop(ctx context.Context, p CreateStopParams) (db.TransportRouteStop, error) {
	rUUID := pgtype.UUID{}
	rUUID.Scan(p.RouteID)

	// Auto-sequence if order is 0
	if p.SequenceOrder == 0 {
		max, _ := s.q.GetMaxStopSequence(ctx, rUUID)
		p.SequenceOrder = max + 1
	}

	return s.q.CreateRouteStop(ctx, db.CreateRouteStopParams{
		RouteID:       rUUID,
		Name:          p.Name,
		SequenceOrder: p.SequenceOrder,
	})
}

func (s *TransportService) ListStops(ctx context.Context, routeID string) ([]db.TransportRouteStop, error) {
	rUUID := pgtype.UUID{}
	rUUID.Scan(routeID)
	return s.q.ListRouteStops(ctx, rUUID)
}

// Allocations

type CreateAllocationParams struct {
	TenantID  string
	StudentID string
	RouteID   string
	StopID    string
	StartDate pgtype.Date
	Status    string
}

func (s *TransportService) CreateAllocation(ctx context.Context, p CreateAllocationParams) (db.TransportAllocation, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	stUUID := pgtype.UUID{}
	stUUID.Scan(p.StudentID)

	rUUID := pgtype.UUID{}
	rUUID.Scan(p.RouteID)

	// 1. Capacity Check
	route, err := s.q.GetRoute(ctx, db.GetRouteParams{ID: rUUID, TenantID: tUUID})
	if err == nil && route.VehicleID.Valid {
		vehicle, vErr := s.q.GetVehicle(ctx, db.GetVehicleParams{ID: route.VehicleID, TenantID: tUUID})
		if vErr == nil {
			count, _ := s.q.CountRouteAllocations(ctx, db.CountRouteAllocationsParams{RouteID: rUUID, TenantID: tUUID})
			if int32(count) >= vehicle.Capacity {
				return db.TransportAllocation{}, fmt.Errorf("vehicle capacity (%d) reached for this route", vehicle.Capacity)
			}
		}
	}

	stopUUID := pgtype.UUID{}
	if p.StopID != "" {
		stopUUID.Scan(p.StopID)
	}

	allocation, err := s.q.CreateAllocation(ctx, db.CreateAllocationParams{
		TenantID:  tUUID,
		StudentID: stUUID,
		RouteID:   rUUID,
		StopID:    stopUUID,
		StartDate: p.StartDate,
		Status:    p.Status,
	})
	if err != nil {
		return db.TransportAllocation{}, err
	}

	// 2. Transport Billing Integration - Create transport fee entry
	// Get stop cost if available
	if p.StopID != "" {
		stop, stopErr := s.q.GetRouteStop(ctx, stopUUID)
		if stopErr == nil && stop.PickupCost.Valid {
			// Log transport fee for billing (fee plan integration)
			s.audit.Log(ctx, audit.Entry{
				TenantID:     tUUID,
				Action:       "transport.fee_generated",
				ResourceType: "transport_allocation",
				ResourceID:   allocation.ID,
				After: map[string]interface{}{
					"student_id": p.StudentID,
					"route_id":   p.RouteID,
					"stop_id":    p.StopID,
					"cost":       stop.PickupCost.Int64,
				},
			})
		}
	}

	return allocation, nil
}

func (s *TransportService) ListAllocations(ctx context.Context, tenantID string) ([]db.ListAllocationsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListAllocations(ctx, tUUID)
}

// Fuel Tracking

type FuelLogParams struct {
	TenantID         string
	VehicleID        string
	FillDate         time.Time
	Quantity         float64
	CostPerUnit      float64
	TotalCost        float64
	OdometerReading  int32
	Remarks          string
	CreatedBy        string
}

func (s *TransportService) CreateFuelLog(ctx context.Context, p FuelLogParams) (db.TransportFuelLog, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	vID := pgtype.UUID{}
	vID.Scan(p.VehicleID)
	uID := pgtype.UUID{}
	uID.Scan(p.CreatedBy)

	var log db.TransportFuelLog
	err := s.pool.QueryRow(ctx, `
		INSERT INTO transport_fuel_logs (tenant_id, vehicle_id, fill_date, quantity, cost_per_unit, total_cost, odometer_reading, remarks, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, tenant_id, vehicle_id, fill_date, quantity, cost_per_unit, total_cost, odometer_reading, remarks, created_by, created_at
	`, 
		tID, vID, p.FillDate, p.Quantity, p.CostPerUnit, p.TotalCost, 
		pgtype.Int4{Int32: p.OdometerReading, Valid: p.OdometerReading > 0},
		pgtype.Text{String: p.Remarks, Valid: p.Remarks != ""},
		uID,
	).Scan(
		&log.ID, &log.TenantID, &log.VehicleID, &log.FillDate, &log.Quantity, &log.CostPerUnit, &log.TotalCost, &log.OdometerReading, &log.Remarks, &log.CreatedBy, &log.CreatedAt,
	)

	return log, err
}

func (s *TransportService) ListFuelLogs(ctx context.Context, tenantID, vehicleID string) ([]db.TransportFuelLog, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	var query string
	var args []interface{}
	if vehicleID != "" {
		vID := pgtype.UUID{}
		vID.Scan(vehicleID)
		query = "SELECT id, tenant_id, vehicle_id, fill_date, quantity, cost_per_unit, total_cost, odometer_reading, remarks, created_by, created_at FROM transport_fuel_logs WHERE tenant_id = $1 AND vehicle_id = $2 ORDER BY fill_date DESC"
		args = []interface{}{tID, vID}
	} else {
		query = "SELECT id, tenant_id, vehicle_id, fill_date, quantity, cost_per_unit, total_cost, odometer_reading, remarks, created_by, created_at FROM transport_fuel_logs WHERE tenant_id = $1 ORDER BY fill_date DESC"
		args = []interface{}{tID}
	}

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []db.TransportFuelLog
	for rows.Next() {
		var l db.TransportFuelLog
		if err := rows.Scan(&l.ID, &l.TenantID, &l.VehicleID, &l.FillDate, &l.Quantity, &l.CostPerUnit, &l.TotalCost, &l.OdometerReading, &l.Remarks, &l.CreatedBy, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (s *TransportService) GenerateTransportFees(ctx context.Context, tenantID string) (int, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	// 1. Get active academic year
	academicYear, err := s.q.GetActiveAcademicYear(ctx, tUUID)
	if err != nil {
		return 0, fmt.Errorf("active academic year not found: %w", err)
	}

	// 2. Get all active transport allocations
	allocations, err := s.q.GetActiveTransportAllocationsWithCosts(ctx, tUUID)
	if err != nil {
		return 0, fmt.Errorf("failed to get allocations: %w", err)
	}

	count := 0
	for _, alloc := range allocations {
		if !alloc.PickupCost.Valid {
			continue
		}

		// 3. Upsert optional fee item for this stop
		itemName := fmt.Sprintf("Transport: %s", alloc.StopName)
		amount := pgtype.Numeric{}
		amount.Scan(fmt.Sprintf("%d.%d", alloc.PickupCost.Int64/100, alloc.PickupCost.Int64%100))

		item, err := s.q.UpsertOptionalFeeItem(ctx, db.UpsertOptionalFeeItemParams{
			TenantID: tUUID,
			Name:     itemName,
			Amount:   amount,
			Category: pgtype.Text{String: "Transport", Valid: true},
		})
		if err != nil {
			continue
		}

		// 4. Link student to this item
		_, err = s.q.UpsertStudentOptionalFee(ctx, db.UpsertStudentOptionalFeeParams{
			TenantID:       tUUID,
			StudentID:      alloc.StudentID,
			ItemID:         item.ID,
			AcademicYearID: academicYear.ID,
			Status:         "selected",
		})
		if err == nil {
			count++
		}
	}

	return count, nil
}

