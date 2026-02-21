package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type SearchStudentsParams struct {
	TenantID   pgtype.UUID
	Column2    string
	SectionIds []pgtype.UUID
	ClassIds   []pgtype.UUID
	Limit      int32
}

type SearchStudentsRow struct {
	ID              pgtype.UUID
	FullName        string
	AdmissionNumber string
	Status          pgtype.Text
	SectionID       pgtype.UUID
	ClassID         pgtype.UUID
	SectionName     pgtype.Text
	ClassName       pgtype.Text
}

const searchStudents = `
SELECT s.id, s.full_name, s.admission_number, s.status, s.section_id, c.id as class_id, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.tenant_id = $1
  AND (
    $2::text = '' 
    OR s.full_name ILIKE '%' || $2 || '%' 
    OR s.admission_number ILIKE '%' || $2 || '%'
  )
  AND (array_length($3::uuid[], 1) IS NULL OR s.section_id = ANY($3::uuid[]))
  AND (array_length($4::uuid[], 1) IS NULL OR sec.class_id = ANY($4::uuid[]))
  AND s.status = 'active'
LIMIT $5;
`

func (q *Queries) SearchStudents(ctx context.Context, arg SearchStudentsParams) ([]SearchStudentsRow, error) {
	rows, err := q.db.Query(ctx, searchStudents,
		arg.TenantID,
		arg.Column2,
		arg.SectionIds,
		arg.ClassIds,
		arg.Limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SearchStudentsRow
	for rows.Next() {
		var i SearchStudentsRow
		if err := rows.Scan(
			&i.ID,
			&i.FullName,
			&i.AdmissionNumber,
			&i.Status,
			&i.SectionID,
			&i.ClassID,
			&i.SectionName,
			&i.ClassName,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
