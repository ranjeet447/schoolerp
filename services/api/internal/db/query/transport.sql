-- name: CreateVehicle :one
INSERT INTO transport_vehicles (tenant_id, registration_number, capacity, type, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetVehicle :one
SELECT * FROM transport_vehicles
WHERE id = $1 AND tenant_id = $2;

-- name: ListVehicles :many
SELECT * FROM transport_vehicles
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: UpdateVehicle :one
UPDATE transport_vehicles
SET registration_number = $3, capacity = $4, type = $5, status = $6, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: DeleteVehicle :exec
DELETE FROM transport_vehicles
WHERE id = $1 AND tenant_id = $2;

-- name: CreateDriver :one
INSERT INTO transport_drivers (tenant_id, full_name, license_number, phone, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListDrivers :many
SELECT * FROM transport_drivers
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: CreateRoute :one
INSERT INTO transport_routes (tenant_id, name, vehicle_id, driver_id, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListRoutes :many
SELECT tr.*, tv.registration_number as vehicle_number, td.full_name as driver_name
FROM transport_routes tr
LEFT JOIN transport_vehicles tv ON tr.vehicle_id = tv.id
LEFT JOIN transport_drivers td ON tr.driver_id = td.id
WHERE tr.tenant_id = $1;

-- name: CreateRouteStop :one
INSERT INTO transport_route_stops (route_id, name, sequence_order, arrival_time, pickup_cost, drop_cost)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListRouteStops :many
SELECT * FROM transport_route_stops
WHERE route_id = $1
ORDER BY sequence_order ASC;

-- name: CreateAllocation :one
INSERT INTO transport_allocations (tenant_id, student_id, route_id, stop_id, start_date, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListAllocations :many
SELECT ta.*, s.full_name as student_name, tr.name as route_name, trs.name as stop_name
FROM transport_allocations ta
JOIN students s ON ta.student_id = s.id
JOIN transport_routes tr ON ta.route_id = tr.id
LEFT JOIN transport_route_stops trs ON ta.stop_id = trs.id
WHERE ta.tenant_id = $1;
