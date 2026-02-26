package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type SectionProfile struct {
	SectionID pgtype.UUID        `json:"section_id"`
	TenantID  pgtype.UUID        `json:"tenant_id"`
	Tags      []string           `json:"tags"`
	Notes     pgtype.Text        `json:"notes"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

type UpsertSectionProfileParams struct {
	SectionID pgtype.UUID `json:"section_id"`
	TenantID  pgtype.UUID `json:"tenant_id"`
	Tags      []string    `json:"tags"`
	Notes     pgtype.Text `json:"notes"`
}

func (q *Queries) UpsertSectionProfile(ctx context.Context, arg UpsertSectionProfileParams) (SectionProfile, error) {
	row := q.db.QueryRow(ctx, `
		INSERT INTO section_profiles (section_id, tenant_id, tags, notes)
		VALUES ($1, $2, COALESCE($3::text[], '{}'), NULLIF($4, ''))
		ON CONFLICT (section_id)
		DO UPDATE SET
			tags = COALESCE(EXCLUDED.tags, '{}'),
			notes = EXCLUDED.notes,
			updated_at = NOW()
		RETURNING section_id, tenant_id, tags, notes, created_at, updated_at
	`, arg.SectionID, arg.TenantID, arg.Tags, arg.Notes)

	var p SectionProfile
	err := row.Scan(&p.SectionID, &p.TenantID, &p.Tags, &p.Notes, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (q *Queries) ListSectionProfilesByClass(ctx context.Context, tenantID, classID pgtype.UUID) ([]SectionProfile, error) {
	rows, err := q.db.Query(ctx, `
		SELECT sp.section_id, sp.tenant_id, sp.tags, sp.notes, sp.created_at, sp.updated_at
		FROM section_profiles sp
		JOIN sections s ON s.id = sp.section_id
		WHERE sp.tenant_id = $1 AND s.class_id = $2
	`, tenantID, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []SectionProfile
	for rows.Next() {
		var p SectionProfile
		if err := rows.Scan(&p.SectionID, &p.TenantID, &p.Tags, &p.Notes, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

type UpdateSectionBasicParams struct {
	ID       pgtype.UUID `json:"id"`
	TenantID pgtype.UUID `json:"tenant_id"`
	Name     string      `json:"name"`
	Capacity pgtype.Int4 `json:"capacity"`
}

func (q *Queries) UpdateSectionBasic(ctx context.Context, arg UpdateSectionBasicParams) (Section, error) {
	row := q.db.QueryRow(ctx, `
		UPDATE sections
		SET
			name = $1,
			capacity = $2
		WHERE id = $3 AND tenant_id = $4
		RETURNING id, tenant_id, class_id, name, capacity, created_at
	`, arg.Name, arg.Capacity, arg.ID, arg.TenantID)

	var s Section
	err := row.Scan(&s.ID, &s.TenantID, &s.ClassID, &s.Name, &s.Capacity, &s.CreatedAt)
	return s, err
}

type UpdateClassBasicParams struct {
	ID       pgtype.UUID `json:"id"`
	TenantID pgtype.UUID `json:"tenant_id"`
	Name     string      `json:"name"`
	Level    pgtype.Int4 `json:"level"`
	Stream   pgtype.Text `json:"stream"`
}

func (q *Queries) UpdateClassBasic(ctx context.Context, arg UpdateClassBasicParams) (Class, error) {
	row := q.db.QueryRow(ctx, `
		UPDATE classes
		SET
			name = $1,
			level = $2,
			stream = $3
		WHERE id = $4 AND tenant_id = $5
		RETURNING id, tenant_id, name, level, stream, created_at
	`, arg.Name, arg.Level, arg.Stream, arg.ID, arg.TenantID)

	var c Class
	err := row.Scan(&c.ID, &c.TenantID, &c.Name, &c.Level, &c.Stream, &c.CreatedAt)
	return c, err
}

func (q *Queries) DeleteClassByTenant(ctx context.Context, tenantID, classID pgtype.UUID) (Class, error) {
	row := q.db.QueryRow(ctx, `
		DELETE FROM classes
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, name, level, stream, created_at
	`, classID, tenantID)

	var c Class
	err := row.Scan(&c.ID, &c.TenantID, &c.Name, &c.Level, &c.Stream, &c.CreatedAt)
	return c, err
}

func (q *Queries) DeleteSectionByTenant(ctx context.Context, tenantID, sectionID pgtype.UUID) (Section, error) {
	row := q.db.QueryRow(ctx, `
		DELETE FROM sections
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, class_id, name, capacity, created_at
	`, sectionID, tenantID)

	var s Section
	err := row.Scan(&s.ID, &s.TenantID, &s.ClassID, &s.Name, &s.Capacity, &s.CreatedAt)
	return s, err
}

type UpdateAcademicYearBasicParams struct {
	ID        pgtype.UUID `json:"id"`
	TenantID  pgtype.UUID `json:"tenant_id"`
	Name      string      `json:"name"`
	StartDate pgtype.Date `json:"start_date"`
	EndDate   pgtype.Date `json:"end_date"`
	IsActive  pgtype.Bool `json:"is_active"`
}

func (q *Queries) DeactivateAcademicYearsExcept(ctx context.Context, tenantID, keepID pgtype.UUID) error {
	_, err := q.db.Exec(ctx, `
		UPDATE academic_years
		SET is_active = FALSE
		WHERE tenant_id = $1 AND id <> $2 AND is_active = TRUE
	`, tenantID, keepID)
	return err
}

func (q *Queries) UpdateAcademicYearBasic(ctx context.Context, arg UpdateAcademicYearBasicParams) (AcademicYear, error) {
	row := q.db.QueryRow(ctx, `
		UPDATE academic_years
		SET
			name = $1,
			start_date = $2,
			end_date = $3,
			is_active = $4
		WHERE id = $5 AND tenant_id = $6
		RETURNING id, tenant_id, name, start_date, end_date, is_active, created_at
	`, arg.Name, arg.StartDate, arg.EndDate, arg.IsActive, arg.ID, arg.TenantID)

	var y AcademicYear
	err := row.Scan(&y.ID, &y.TenantID, &y.Name, &y.StartDate, &y.EndDate, &y.IsActive, &y.CreatedAt)
	return y, err
}

func (q *Queries) DeleteAcademicYearByTenant(ctx context.Context, tenantID, yearID pgtype.UUID) (AcademicYear, error) {
	row := q.db.QueryRow(ctx, `
		DELETE FROM academic_years
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, name, start_date, end_date, is_active, created_at
	`, yearID, tenantID)

	var y AcademicYear
	err := row.Scan(&y.ID, &y.TenantID, &y.Name, &y.StartDate, &y.EndDate, &y.IsActive, &y.CreatedAt)
	return y, err
}

type UpdateSubjectBasicParams struct {
	ID       pgtype.UUID `json:"id"`
	TenantID pgtype.UUID `json:"tenant_id"`
	Name     string      `json:"name"`
	Code     pgtype.Text `json:"code"`
	Type     pgtype.Text `json:"type"`
}

func (q *Queries) UpdateSubjectBasic(ctx context.Context, arg UpdateSubjectBasicParams) (Subject, error) {
	row := q.db.QueryRow(ctx, `
		UPDATE subjects
		SET
			name = $1,
			code = $2,
			type = $3
		WHERE id = $4 AND tenant_id = $5
		RETURNING id, tenant_id, name, code, type, created_at
	`, arg.Name, arg.Code, arg.Type, arg.ID, arg.TenantID)

	var s Subject
	err := row.Scan(&s.ID, &s.TenantID, &s.Name, &s.Code, &s.Type, &s.CreatedAt)
	return s, err
}

func (q *Queries) DeleteSubjectByTenant(ctx context.Context, tenantID, subjectID pgtype.UUID) (Subject, error) {
	row := q.db.QueryRow(ctx, `
		DELETE FROM subjects
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, name, code, type, created_at
	`, subjectID, tenantID)

	var s Subject
	err := row.Scan(&s.ID, &s.TenantID, &s.Name, &s.Code, &s.Type, &s.CreatedAt)
	return s, err
}
