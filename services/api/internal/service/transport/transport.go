package transport

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type TransportService struct {
	q     db.Querier
	audit *audit.Logger
}

func NewTransportService(q db.Querier, audit *audit.Logger) *TransportService {
	return &TransportService{q: q, audit: audit}
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
	if p.VehicleID != "" { vUUID.Scan(p.VehicleID) }

	dUUID := pgtype.UUID{}
	if p.DriverID != "" { dUUID.Scan(p.DriverID) }

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

	return s.q.CreateRouteStop(ctx, db.CreateRouteStopParams{
		RouteID:       rUUID,
		Name:          p.Name,
		SequenceOrder: p.SequenceOrder,
		// Assuming other fields are optional or have defaults for now based on sql content
	})
}

func (s *TransportService) ListStops(ctx context.Context, routeID string) ([]db.TransportRouteStop, error) {
    rUUID := pgtype.UUID{}
    rUUID.Scan(routeID)
    return s.q.ListRouteStops(ctx, rUUID)
}

// Allocations

type CreateAllocationParams struct {
    TenantID string
    StudentID string
    RouteID string
    StopID string
    StartDate pgtype.Date
    Status string
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
    if p.StopID != "" { stopUUID.Scan(p.StopID) }

    return s.q.CreateAllocation(ctx, db.CreateAllocationParams{
        TenantID: tUUID,
        StudentID: stUUID,
        RouteID: rUUID,
        StopID: stopUUID,
        StartDate: p.StartDate,
        Status: p.Status,
    })
}

func (s *TransportService) ListAllocations(ctx context.Context, tenantID string) ([]db.ListAllocationsRow, error) {
    tUUID := pgtype.UUID{}
    tUUID.Scan(tenantID)
    return s.q.ListAllocations(ctx, tUUID)
}
