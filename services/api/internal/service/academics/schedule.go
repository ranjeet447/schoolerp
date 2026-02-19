package academics

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type ScheduleService struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewScheduleService(pool *pgxpool.Pool, audit *audit.Logger) *ScheduleService {
	return &ScheduleService{pool: pool, audit: audit}
}

// Relational Scheduling Structs
type RelationalVariant struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	IsActive  bool      `json:"is_active"`
	StartDate time.Time `json:"start_date,omitempty"`
	EndDate   time.Time `json:"end_date,omitempty"`
}

type RelationalPeriod struct {
	ID         string `json:"id"`
	VariantID  string `json:"variant_id"`
	PeriodName string `json:"period_name"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	IsBreak    bool   `json:"is_break"`
	SortOrder  int    `json:"sort_order"`
}

type RelationalTimetableEntry struct {
	ID             string `json:"id"`
	VariantID      string `json:"variant_id"`
	PeriodID       string `json:"period_id"`
	DayOfWeek      int    `json:"day_of_week"`
	SectionID      string `json:"section_id"`
	SubjectID      string `json:"subject_id"`
	TeacherID      string `json:"teacher_id"`
	RoomNumber     string `json:"room_number,omitempty"`
}

// --- Variant Logic ---

func (s *ScheduleService) CreateVariant(ctx context.Context, tenantID string, v RelationalVariant) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO timetable_variants (tenant_id, name, is_active, start_date, end_date)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, tenantID, v.Name, v.IsActive, v.StartDate, v.EndDate).Scan(&id)
	return id, err
}

func (s *ScheduleService) ListVariants(ctx context.Context, tenantID string) ([]RelationalVariant, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, name, is_active, COALESCE(start_date, '0001-01-01'), COALESCE(end_date, '0001-01-01')
		FROM timetable_variants 
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var variants []RelationalVariant
	for rows.Next() {
		var v RelationalVariant
		if err := rows.Scan(&v.ID, &v.Name, &v.IsActive, &v.StartDate, &v.EndDate); err != nil {
			return nil, err
		}
		variants = append(variants, v)
	}
	return variants, nil
}

// --- Period Logic ---

func (s *ScheduleService) CreatePeriod(ctx context.Context, p RelationalPeriod) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO timetable_periods (variant_id, period_name, start_time, end_time, is_break, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, p.VariantID, p.PeriodName, p.StartTime, p.EndTime, p.IsBreak, p.SortOrder).Scan(&id)
	return id, err
}

func (s *ScheduleService) GetPeriods(ctx context.Context, variantID string) ([]RelationalPeriod, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, variant_id, period_name, start_time::text, end_time::text, is_break, sort_order
		FROM timetable_periods
		WHERE variant_id = $1
		ORDER BY sort_order ASC, start_time ASC
	`, variantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var periods []RelationalPeriod
	for rows.Next() {
		var p RelationalPeriod
		if err := rows.Scan(&p.ID, &p.VariantID, &p.PeriodName, &p.StartTime, &p.EndTime, &p.IsBreak, &p.SortOrder); err != nil {
			return nil, err
		}
		periods = append(periods, p)
	}
	return periods, nil
}

// --- Timetable Entry Logic (with Conflict Check) ---

func (s *ScheduleService) CreateEntry(ctx context.Context, tenantID string, e RelationalTimetableEntry) (string, error) {
	// Conflict check 1: Teacher Busy
	var conflictTeacher string
	err := s.pool.QueryRow(ctx, `
		SELECT id FROM timetable_entries 
		WHERE variant_id = $1 AND day_of_week = $2 AND period_id = $3 AND teacher_id = $4
	`, e.VariantID, e.DayOfWeek, e.PeriodID, e.TeacherID).Scan(&conflictTeacher)
	if err == nil {
		return "", fmt.Errorf("teacher is already busy in this period")
	}

	// Conflict check 2: Class Section Busy
	var conflictSection string
	err = s.pool.QueryRow(ctx, `
		SELECT id FROM timetable_entries 
		WHERE variant_id = $1 AND day_of_week = $2 AND period_id = $3 AND class_section_id = $4
	`, e.VariantID, e.DayOfWeek, e.PeriodID, e.SectionID).Scan(&conflictSection)
	if err == nil {
		return "", fmt.Errorf("class section already has a scheduled subject in this period")
	}

	var id string
	err = s.pool.QueryRow(ctx, `
		INSERT INTO timetable_entries (tenant_id, variant_id, period_id, day_of_week, class_section_id, subject_id, teacher_id, room_number)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, tenantID, e.VariantID, e.PeriodID, e.DayOfWeek, e.SectionID, e.SubjectID, e.TeacherID, e.RoomNumber).Scan(&id)
	return id, err
}

func (s *ScheduleService) GetTimetable(ctx context.Context, variantID string, sectionID string) ([]map[string]interface{}, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT 
			te.id, te.day_of_week, tp.period_name, tp.start_time::text, tp.end_time::text,
			sub.name as subject_name, u.full_name as teacher_name, te.room_number
		FROM timetable_entries te
		JOIN timetable_periods tp ON te.period_id = tp.id
		JOIN subjects sub ON te.subject_id = sub.id
		JOIN users u ON te.teacher_id = u.id
		WHERE te.variant_id = $1 AND te.class_section_id = $2
		ORDER BY te.day_of_week, tp.sort_order
	`, variantID, sectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []map[string]interface{}
	for rows.Next() {
		var id, pName, start, end, sName, tName, room string
		var dow int
		if err := rows.Scan(&id, &dow, &pName, &start, &end, &sName, &tName, &room); err != nil {
			return nil, err
		}
		entries = append(entries, map[string]interface{}{
			"id":           id,
			"day_of_week":  dow,
			"period_name":  pName,
			"start_time":   start,
			"end_time":     end,
			"subject":      sName,
			"teacher":      tName,
			"room":         room,
		})
	}
	return entries, nil
}

// --- Substitution Logic ---

func (s *ScheduleService) GetFreeTeachersForDate(ctx context.Context, tenantID string, date time.Time, periodID string) ([]map[string]interface{}, error) {
	dow := int(date.Weekday())
	
	rows, err := s.pool.Query(ctx, `
		SELECT u.id, u.full_name 
		FROM users u
		JOIN user_roles ur ON u.id = ur.user_id
		WHERE u.tenant_id = $1 AND ur.role_code = 'teacher'
		AND u.id NOT IN (
			-- Busy in regular timetable
			SELECT teacher_id FROM timetable_entries 
			WHERE tenant_id = $1 AND day_of_week = $2 AND period_id = $3
		)
		AND u.id NOT IN (
			-- Already assigned as substitute
			SELECT substitute_teacher_id FROM teacher_substitutions
			WHERE tenant_id = $1 AND substitution_date = $4 AND timetable_entry_id IN (
				SELECT id FROM timetable_entries WHERE period_id = $3
			)
		)
		AND u.id NOT IN (
			-- Is absent
			SELECT teacher_id FROM teacher_absences
			WHERE tenant_id = $1 AND absence_date = $4
		)
	`, tenantID, dow, periodID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teachers []map[string]interface{}
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		teachers = append(teachers, map[string]interface{}{"id": id, "name": name})
	}
	return teachers, nil
}

func (s *ScheduleService) CreateSubstitution(ctx context.Context, tenantID string, date time.Time, entryID, subTeacherID, remarks string) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO teacher_substitutions (tenant_id, substitution_date, timetable_entry_id, substitute_teacher_id, remarks)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, tenantID, date, entryID, subTeacherID, remarks).Scan(&id)
	return id, err
}

func (s *ScheduleService) MarkTeacherAbsence(ctx context.Context, tenantID, teacherID string, date time.Time, reason string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO teacher_absences (tenant_id, teacher_id, absence_date, reason)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT DO NOTHING
	`, tenantID, teacherID, date, reason)
	return err
}

func (s *ScheduleService) GetAbsentTeachers(ctx context.Context, tenantID string, date time.Time) ([]map[string]interface{}, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT u.id, u.full_name, ta.reason, ta.created_at
		FROM teacher_absences ta
		JOIN users u ON ta.teacher_id = u.id
		WHERE ta.tenant_id = $1 AND ta.absence_date = $2
	`, tenantID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id, name, reason string
		var createdAt time.Time
		if err := rows.Scan(&id, &name, &reason, &createdAt); err != nil {
			return nil, err
		}
		list = append(list, map[string]interface{}{
			"id":         id,
			"name":       name,
			"reason":     reason,
			"created_at": createdAt,
		})
	}
	return list, nil
}

func (s *ScheduleService) GetTeacherLessonsForDate(ctx context.Context, tenantID, teacherID string, date time.Time) ([]map[string]interface{}, error) {
	dow := int(date.Weekday())
	rows, err := s.pool.Query(ctx, `
		SELECT 
			te.id, tp.period_name, tp.start_time::text, tp.end_time::text,
			sub.name as subject_name, c.name as class_name, sec.name as section_name,
			(SELECT substitute_teacher_id FROM teacher_substitutions ts WHERE ts.timetable_entry_id = te.id AND ts.substitution_date = $4) as substitute_id,
			(SELECT u.full_name FROM teacher_substitutions ts JOIN users u ON ts.substitute_teacher_id = u.id WHERE ts.timetable_entry_id = te.id AND ts.substitution_date = $4) as substitute_name,
			te.period_id
		FROM timetable_entries te
		JOIN timetable_periods tp ON te.period_id = tp.id
		JOIN subjects sub ON te.subject_id = sub.id
		JOIN sections sec ON te.class_section_id = sec.id
		JOIN classes c ON sec.class_id = c.id
		WHERE te.tenant_id = $1 AND te.teacher_id = $2 AND te.day_of_week = $3
		ORDER BY tp.start_time
	`, tenantID, teacherID, dow, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []map[string]interface{}
	for rows.Next() {
		var id, pName, start, end, sName, cName, secName, pID string
		var subID, subName *string
		if err := rows.Scan(&id, &pName, &start, &end, &sName, &cName, &secName, &subID, &subName, &pID); err != nil {
			return nil, err
		}
		lessons = append(lessons, map[string]interface{}{
			"id":              id,
			"period_name":     pName,
			"start_time":      start,
			"end_time":        end,
			"subject":         sName,
			"class_section":   cName + " " + secName,
			"substitute_id":   subID,
			"substitute_name": subName,
			"period_id":       pID,
		})
	}
	return lessons, nil
}

func (s *ScheduleService) GetTeacherDailyTimetable(ctx context.Context, tenantID, teacherID string, date time.Time) ([]map[string]interface{}, error) {
	dow := int(date.Weekday())
	
	// Fetch regular timetable slots + active substitutions for this teacher
	rows, err := s.pool.Query(ctx, `
		SELECT 
			te.id, tp.period_name, tp.start_time::text, tp.end_time::text,
			sub.name as subject_name, c.name as class_name, sec.name as section_name, te.room_number,
			false as is_substitution, '' as substitution_remarks, te.class_section_id, te.subject_id
		FROM timetable_entries te
		JOIN timetable_periods tp ON te.period_id = tp.id
		JOIN subjects sub ON te.subject_id = sub.id
		JOIN sections sec ON te.class_section_id = sec.id
		JOIN classes c ON sec.class_id = c.id
		WHERE te.tenant_id = $1 AND te.teacher_id = $2 AND te.day_of_week = $3
		AND te.teacher_id NOT IN (
			SELECT teacher_id FROM teacher_absences WHERE absence_date = $4 AND tenant_id = $1
		)

		UNION ALL

		-- Substitutions where this teacher is assigned
		SELECT 
			te.id, tp.period_name, tp.start_time::text, tp.end_time::text,
			sub.name as subject_name, c.name as class_name, sec.name as section_name, te.room_number,
			true as is_substitution, ts.remarks as substitution_remarks, te.class_section_id, te.subject_id
		FROM teacher_substitutions ts
		JOIN timetable_entries te ON ts.timetable_entry_id = te.id
		JOIN timetable_periods tp ON te.period_id = tp.id
		JOIN subjects sub ON te.subject_id = sub.id
		JOIN sections sec ON te.class_section_id = sec.id
		JOIN classes c ON sec.class_id = c.id
		WHERE ts.tenant_id = $1 AND ts.substitute_teacher_id = $2 AND ts.substitution_date = $4

		ORDER BY start_time
	`, tenantID, teacherID, dow, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []map[string]interface{}
	for rows.Next() {
		var id, pName, start, end, sName, cName, secName, room, subRemarks, sectionID, subjectID string
		var isSub bool
		err := rows.Scan(&id, &pName, &start, &end, &sName, &cName, &secName, &room, &isSub, &subRemarks, &sectionID, &subjectID)
		if err != nil {
			return nil, err
		}
		
		entries = append(entries, map[string]interface{}{
			"id":                id,
			"period_name":       pName,
			"start_time":        start,
			"end_time":          end,
			"subject":           sName,
			"class_section":     cName + " " + secName,
			"class_section_id":  sectionID,
			"room":              room,
			"is_substitution":   isSub,
			"sub_remarks":       subRemarks,
			"subject_id":        subjectID,
		})
	}
	return entries, nil
}

// --- Teacher Specializations & Assignments ---

func (s *ScheduleService) SetTeacherSubjectSpecializations(ctx context.Context, tenantID, teacherID string, subjectIDs []string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clear existing
	_, err = tx.Exec(ctx, `DELETE FROM teacher_subject_specializations WHERE tenant_id = $1 AND teacher_id = $2`, tenantID, teacherID)
	if err != nil {
		return err
	}

	// Insert new
	for _, sid := range subjectIDs {
		_, err = tx.Exec(ctx, `
			INSERT INTO teacher_subject_specializations (tenant_id, teacher_id, subject_id)
			VALUES ($1, $2, $3)
		`, tenantID, teacherID, sid)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *ScheduleService) SetTeacherClassSpecializations(ctx context.Context, tenantID, teacherID string, classIDs []string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clear existing
	_, err = tx.Exec(ctx, `DELETE FROM teacher_class_specializations WHERE tenant_id = $1 AND teacher_id = $2`, tenantID, teacherID)
	if err != nil {
		return err
	}

	// Insert new
	for _, cid := range classIDs {
		_, err = tx.Exec(ctx, `
			INSERT INTO teacher_class_specializations (tenant_id, teacher_id, class_id)
			VALUES ($1, $2, $3)
		`, tenantID, teacherID, cid)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *ScheduleService) AssignClassTeacher(ctx context.Context, tenantID, academicYearID, sectionID, teacherID, remarks string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Deactivate existing active assignment for this section/year
	_, err = tx.Exec(ctx, `
		UPDATE class_teacher_assignments 
		SET is_active = false 
		WHERE tenant_id = $1 AND academic_year_id = $2 AND class_section_id = $3 AND is_active = true
	`, tenantID, academicYearID, sectionID)
	if err != nil {
		return err
	}

	// Insert new
	_, err = tx.Exec(ctx, `
		INSERT INTO class_teacher_assignments (tenant_id, academic_year_id, class_section_id, teacher_id, remarks)
		VALUES ($1, $2, $3, $4, $5)
	`, tenantID, academicYearID, sectionID, teacherID, remarks)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *ScheduleService) GetTeacherSpecializations(ctx context.Context, tenantID, teacherID string) (map[string][]string, error) {
	specs := make(map[string][]string)

	// Subjs
	rows, _ := s.pool.Query(ctx, `SELECT subject_id FROM teacher_subject_specializations WHERE tenant_id = $1 AND teacher_id = $2`, tenantID, teacherID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			specs["subjects"] = append(specs["subjects"], id)
		}
	}

	// Classes
	rows, _ = s.pool.Query(ctx, `SELECT class_id FROM teacher_class_specializations WHERE tenant_id = $1 AND teacher_id = $2`, tenantID, teacherID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			specs["classes"] = append(specs["classes"], id)
		}
	}

	return specs, nil
}
