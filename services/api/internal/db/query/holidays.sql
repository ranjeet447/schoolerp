-- name: CreateHoliday :one
INSERT INTO holidays (
    tenant_id, name, holiday_date, holiday_type
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListHolidays :many
SELECT * FROM holidays
WHERE tenant_id = $1 AND holiday_date >= $2 AND holiday_date <= $3
ORDER BY holiday_date ASC;

-- name: DeleteHoliday :exec
DELETE FROM holidays WHERE id = $1 AND tenant_id = $2;
