package marketing

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidReviewToken  = errors.New("invalid review token")
	ErrExpiredReviewToken  = errors.New("review token expired")
	ErrReviewTokenUsed     = errors.New("review token already used")
	ErrPDFJobNotFound      = errors.New("pdf job not found")
	ErrPDFJobNotReady      = errors.New("pdf job is not ready")
	ErrInvalidBookingState = errors.New("invalid booking status")
	ErrBookingNotFound     = errors.New("booking not found")
)

var (
	studentCountPattern = regexp.MustCompile(`\d+`)
	slugPattern         = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{db: pool}
}

type CreateDemoBookingParams struct {
	Name              string
	Email             string
	Phone             string
	SchoolName        string
	City              string
	StudentCountRange string
	Message           string
	SourcePage        string
	UtmSource         string
	UtmCampaign       string
	UtmMedium         string
	Timezone          string
	StartAtUTC        time.Time
	RequestIP         string
	IdempotencyKey    string
}

type DemoBooking struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	SchoolName string    `json:"school_name"`
	Status     string    `json:"status"`
	StartAt    time.Time `json:"start_at"`
	CreatedAt  time.Time `json:"created_at"`
}

func (s *Service) CreateDemoBooking(ctx context.Context, p CreateDemoBookingParams) (DemoBooking, error) {
	p.Name = strings.TrimSpace(p.Name)
	p.Email = strings.TrimSpace(strings.ToLower(p.Email))
	p.Phone = strings.TrimSpace(p.Phone)
	p.SchoolName = strings.TrimSpace(p.SchoolName)

	if p.Name == "" || p.Email == "" || p.Phone == "" || p.SchoolName == "" {
		return DemoBooking{}, fmt.Errorf("missing required fields")
	}
	if _, err := mail.ParseAddress(p.Email); err != nil {
		return DemoBooking{}, fmt.Errorf("invalid email")
	}
	if p.Timezone == "" {
		p.Timezone = "UTC"
	}

	startAt := p.StartAtUTC
	if startAt.IsZero() {
		startAt = time.Now().UTC().Add(24 * time.Hour).Truncate(30 * time.Minute)
	}
	endAt := startAt.Add(30 * time.Minute)

	confirmationToken := uuid.Must(uuid.NewV7()).String()

	var booking DemoBooking
	err := s.db.QueryRow(ctx, `
		INSERT INTO demo_bookings (
			start_at_utc, end_at_utc, timezone, status,
			name, email, phone, school_name,
			city, student_count_range, message, source_page,
			utm_source, utm_campaign, utm_medium,
			confirmation_token, idempotency_key, request_ip
		) VALUES (
			$1, $2, $3, 'pending',
			$4, $5, $6, $7,
			NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''), NULLIF($11, ''),
			NULLIF($12, ''), NULLIF($13, ''), NULLIF($14, ''),
			$15, NULLIF($16, ''), NULLIF($17, '')
		)
		RETURNING id::text, name, email, school_name, status, start_at_utc, created_at
	`,
		startAt, endAt, p.Timezone,
		p.Name, p.Email, p.Phone, p.SchoolName,
		p.City, p.StudentCountRange, p.Message, p.SourcePage,
		p.UtmSource, p.UtmCampaign, p.UtmMedium,
		confirmationToken, p.IdempotencyKey, p.RequestIP,
	).Scan(
		&booking.ID,
		&booking.Name,
		&booking.Email,
		&booking.SchoolName,
		&booking.Status,
		&booking.StartAt,
		&booking.CreatedAt,
	)
	if err != nil {
		return DemoBooking{}, err
	}

	_, _ = s.db.Exec(ctx, `
		INSERT INTO leads (
			name, phone, email, school_name, city, student_count, message,
			source_page, utm_campaign, utm_source, utm_medium, status
		) VALUES (
			$1, $2, $3, $4, NULLIF($5, ''), $6, NULLIF($7, ''),
			NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''), NULLIF($11, ''), 'new'
		)
	`,
		p.Name, p.Phone, p.Email, p.SchoolName, p.City, parseStudentCount(p.StudentCountRange), p.Message,
		defaultIfEmpty(p.SourcePage, "book-demo"), p.UtmCampaign, p.UtmSource, p.UtmMedium,
	)

	return booking, nil
}

func (s *Service) ListDemoBookings(ctx context.Context, limit, offset int32) ([]DemoBooking, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := s.db.Query(ctx, `
		SELECT id::text, name, email, school_name, status, start_at_utc, created_at
		FROM demo_bookings
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DemoBooking, 0, limit)
	for rows.Next() {
		var b DemoBooking
		if err := rows.Scan(&b.ID, &b.Name, &b.Email, &b.SchoolName, &b.Status, &b.StartAt, &b.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, b)
	}
	return items, rows.Err()
}

func (s *Service) UpdateDemoBookingStatus(ctx context.Context, bookingID, status string) error {
	status = strings.TrimSpace(strings.ToLower(status))
	switch status {
	case "pending", "confirmed", "cancelled", "rescheduled", "completed", "no_show":
	default:
		return ErrInvalidBookingState
	}

	if _, err := uuid.Parse(bookingID); err != nil {
		return ErrBookingNotFound
	}

	tag, err := s.db.Exec(ctx, `
		UPDATE demo_bookings
		SET status = $2, updated_at = NOW()
		WHERE id = $1::uuid
	`, bookingID, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBookingNotFound
	}
	return nil
}

type ContactRequest struct {
	Name       string
	Email      string
	Phone      string
	SchoolName string
	Message    string
	City       string
}

func (s *Service) SubmitContact(ctx context.Context, p ContactRequest) (string, error) {
	p.Name = strings.TrimSpace(p.Name)
	p.Email = strings.TrimSpace(strings.ToLower(p.Email))
	p.Phone = strings.TrimSpace(p.Phone)
	p.SchoolName = strings.TrimSpace(p.SchoolName)
	p.Message = strings.TrimSpace(p.Message)

	if p.Name == "" || p.Email == "" || p.Phone == "" || p.SchoolName == "" {
		return "", fmt.Errorf("missing required fields")
	}
	if _, err := mail.ParseAddress(p.Email); err != nil {
		return "", fmt.Errorf("invalid email")
	}

	var leadID string
	err := s.db.QueryRow(ctx, `
		INSERT INTO leads (
			name, phone, email, school_name, city, message, source_page, status
		) VALUES (
			$1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), 'contact', 'new'
		) RETURNING id::text
	`, p.Name, p.Phone, p.Email, p.SchoolName, p.City, p.Message).Scan(&leadID)
	if err != nil {
		return "", err
	}
	return leadID, nil
}

type PartnerApplicationRequest struct {
	CompanyName string
	Name        string
	Email       string
	Phone       string
	Website     string
	Category    string
	Description string
}

func (s *Service) SubmitPartnerApplication(ctx context.Context, p PartnerApplicationRequest) (string, error) {
	p.CompanyName = strings.TrimSpace(p.CompanyName)
	p.Name = strings.TrimSpace(p.Name)
	p.Email = strings.TrimSpace(strings.ToLower(p.Email))
	p.Phone = strings.TrimSpace(p.Phone)
	p.Website = strings.TrimSpace(p.Website)
	p.Category = strings.TrimSpace(p.Category)
	p.Description = strings.TrimSpace(p.Description)

	if p.CompanyName == "" || p.Name == "" || p.Email == "" || p.Category == "" {
		return "", fmt.Errorf("missing required fields")
	}
	if _, err := mail.ParseAddress(p.Email); err != nil {
		return "", fmt.Errorf("invalid email")
	}

	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO partner_applications (
			company_name, name, email, phone, website, category, description, status
		) VALUES (
			$1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), $6, NULLIF($7, ''), 'pending'
		) RETURNING id::text
	`,
		p.CompanyName, p.Name, p.Email, p.Phone, p.Website, p.Category, p.Description,
	).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

type ReviewRequestInfo struct {
	Token      string    `json:"token"`
	SchoolName string    `json:"school_name"`
	ExpiresAt  time.Time `json:"expires_at"`
}

func (s *Service) GetReviewRequest(ctx context.Context, token string) (ReviewRequestInfo, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return ReviewRequestInfo{}, ErrInvalidReviewToken
	}

	var info ReviewRequestInfo
	var status string
	err := s.db.QueryRow(ctx, `
		SELECT token, school_name, expires_at, COALESCE(status, 'pending')
		FROM review_requests
		WHERE token = $1
	`, token).Scan(&info.Token, &info.SchoolName, &info.ExpiresAt, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReviewRequestInfo{}, ErrInvalidReviewToken
		}
		return ReviewRequestInfo{}, err
	}

	now := time.Now().UTC()
	if now.After(info.ExpiresAt.UTC()) {
		return ReviewRequestInfo{}, ErrExpiredReviewToken
	}
	if status != "pending" {
		return ReviewRequestInfo{}, ErrReviewTokenUsed
	}
	return info, nil
}

type SubmitReviewParams struct {
	Token   string
	Rating  int
	Content string
	Consent bool
	Name    string
	Role    string
	City    string
}

func (s *Service) SubmitReview(ctx context.Context, p SubmitReviewParams) (string, error) {
	p.Content = strings.TrimSpace(p.Content)
	p.Name = strings.TrimSpace(p.Name)
	p.Role = strings.TrimSpace(p.Role)
	p.City = strings.TrimSpace(p.City)
	if p.Name == "" {
		p.Name = "Anonymous User"
	}
	if p.Role == "" {
		p.Role = "School Representative"
	}

	if p.Rating < 1 || p.Rating > 5 || p.Content == "" {
		return "", fmt.Errorf("invalid rating or content")
	}

	info, err := s.GetReviewRequest(ctx, p.Token)
	if err != nil {
		return "", err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var reviewID string
	err = tx.QueryRow(ctx, `
		INSERT INTO reviews (
			token, rating, content, name, role, school_name, city, status, consent
		) VALUES (
			$1, $2, $3, $4, $5, $6, NULLIF($7, ''), 'pending', $8
		)
		RETURNING id::text
	`,
		info.Token, p.Rating, p.Content, p.Name, p.Role, info.SchoolName, p.City, p.Consent,
	).Scan(&reviewID)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(ctx, `
		UPDATE review_requests
		SET status = 'used'
		WHERE token = $1
	`, info.Token)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	return reviewID, nil
}

type PDFJob struct {
	ID          string `json:"id"`
	Slug        string `json:"slug"`
	Status      string `json:"status"`
	Error       string `json:"error,omitempty"`
	DownloadURL string `json:"download_url,omitempty"`
}

func (s *Service) CreateCaseStudyPDFJob(ctx context.Context, slug, locale, requestIP string) (string, error) {
	slug = strings.TrimSpace(strings.ToLower(slug))
	if !slugPattern.MatchString(slug) {
		return "", fmt.Errorf("invalid slug")
	}

	if strings.TrimSpace(locale) == "" {
		locale = "en"
	}

	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO marketing_pdf_jobs (slug, locale, status, request_ip, updated_at)
		VALUES ($1, $2, 'completed', NULLIF($3, ''), NOW())
		RETURNING id::text
	`, slug, locale, requestIP).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (s *Service) GetPDFJob(ctx context.Context, jobID string) (PDFJob, error) {
	if _, err := uuid.Parse(jobID); err != nil {
		return PDFJob{}, ErrPDFJobNotFound
	}

	var job PDFJob
	err := s.db.QueryRow(ctx, `
		SELECT id::text, slug, COALESCE(status, 'pending'), COALESCE(error, '')
		FROM marketing_pdf_jobs
		WHERE id = $1::uuid
	`, jobID).Scan(&job.ID, &job.Slug, &job.Status, &job.Error)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PDFJob{}, ErrPDFJobNotFound
		}
		return PDFJob{}, err
	}

	if job.Status == "completed" {
		job.DownloadURL = fmt.Sprintf("/v1/public/pdf-jobs/%s/download", job.ID)
	}
	return job, nil
}

func (s *Service) BuildPDFDownload(ctx context.Context, jobID string) (string, []byte, error) {
	job, err := s.GetPDFJob(ctx, jobID)
	if err != nil {
		return "", nil, err
	}
	if job.Status != "completed" {
		return "", nil, ErrPDFJobNotReady
	}

	title := slugToTitle(job.Slug)
	body := "This one-pager was generated from the School ERP growth case study pipeline."
	pdf := renderSimplePDF(title, body)

	filename := fmt.Sprintf("%s-one-pager.pdf", job.Slug)
	return filename, pdf, nil
}

func parseStudentCount(raw string) int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0
	}
	match := studentCountPattern.FindString(raw)
	if match == "" {
		return 0
	}
	count, _ := strconv.Atoi(match)
	return count
}

func defaultIfEmpty(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func slugToTitle(slug string) string {
	parts := strings.Split(strings.TrimSpace(slug), "-")
	for i, p := range parts {
		if p == "" {
			continue
		}
		parts[i] = strings.ToUpper(p[:1]) + p[1:]
	}
	return strings.Join(parts, " ")
}

func escapePDFText(s string) string {
	replacer := strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)")
	return replacer.Replace(s)
}

func renderSimplePDF(title, body string) []byte {
	title = escapePDFText(title)
	body = escapePDFText(body)

	content := fmt.Sprintf("BT /F1 24 Tf 50 780 Td (%s) Tj ET\nBT /F1 12 Tf 50 750 Td (%s) Tj ET\n", title, body)

	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%sendstream", len(content), content),
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	}

	var buf bytes.Buffer
	buf.WriteString("%PDF-1.4\n")

	offsets := make([]int, len(objects)+1)
	for i, obj := range objects {
		offsets[i+1] = buf.Len()
		buf.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", i+1, obj))
	}

	xrefOffset := buf.Len()
	buf.WriteString(fmt.Sprintf("xref\n0 %d\n", len(objects)+1))
	buf.WriteString("0000000000 65535 f \n")
	for i := 1; i <= len(objects); i++ {
		buf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	buf.WriteString("trailer\n")
	buf.WriteString(fmt.Sprintf("<< /Size %d /Root 1 0 R >>\n", len(objects)+1))
	buf.WriteString("startxref\n")
	buf.WriteString(fmt.Sprintf("%d\n", xrefOffset))
	buf.WriteString("%%EOF\n")

	return buf.Bytes()
}
