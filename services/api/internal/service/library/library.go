package library

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type LibraryService struct {
	q          db.Querier
	pool       *pgxpool.Pool
	audit      *audit.Logger
	finePerDay float64
}

func NewLibraryService(q db.Querier, pool *pgxpool.Pool, audit *audit.Logger) *LibraryService {
	return &LibraryService{
		q:          q,
		pool:       pool,
		audit:      audit,
		finePerDay: 1.0, // Default $1 per day, can be externalized to DB/Config
	}
}

// Book Management

type CreateBookParams struct {
	TenantID        string
	Title           string
	ISBN            string
	Publisher       string
	PublishedYear   int32
	CategoryID      string
	TotalCopies     int32
	ShelfLocation   string
	Price           float64
	Language        string
	AuthorID        string // For simplicity, assume one author for MVP, or handle separately
	UserID          string
	RequestID       string
	IP              string
}

func parseUserUUID(userID string) pgtype.UUID {
	uID := pgtype.UUID{}
	_ = uID.Scan(strings.TrimSpace(userID))
	return uID
}

func (s *LibraryService) ISBNLookup(ctx context.Context, isbn string) (map[string]interface{}, error) {
	normalizedISBN := strings.TrimSpace(isbn)
	if normalizedISBN == "" {
		return nil, errors.New("invalid isbn")
	}

	requestURL := fmt.Sprintf("https://openlibrary.org/api/books?bibkeys=ISBN:%s&format=json&jscmd=data", normalizedISBN)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("isbn lookup failed: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var payload map[string]map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}

	key := "ISBN:" + normalizedISBN
	book, ok := payload[key]
	if !ok {
		return nil, errors.New("isbn not found")
	}

	result := map[string]interface{}{}
	title, _ := book["title"].(string)
	if strings.TrimSpace(title) != "" {
		result["title"] = strings.TrimSpace(title)
	}

	publisher := ""
	if publishers, ok := book["publishers"].([]interface{}); ok {
		for _, item := range publishers {
			if row, ok := item.(map[string]interface{}); ok {
				name, _ := row["name"].(string)
				if strings.TrimSpace(name) != "" {
					publisher = strings.TrimSpace(name)
					break
				}
			}
		}
	}
	if publisher != "" {
		result["publisher"] = publisher
	}

	if publishDate, ok := book["publish_date"].(string); ok {
		re := regexp.MustCompile(`\b(19|20)\d{2}\b`)
		if year := re.FindString(publishDate); year != "" {
			result["year"] = year
		}
	}

	return result, nil
}

func (s *LibraryService) CreateBook(ctx context.Context, p CreateBookParams) (db.LibraryBook, error) {
	tenantUuid := pgtype.UUID{}
	tenantUuid.Scan(p.TenantID)

	// Auto-fill from ISBN if title/publisher missing
	if p.Title == "" && p.ISBN != "" {
		if data, err := s.ISBNLookup(ctx, p.ISBN); err == nil {
			if title, _ := data["title"].(string); strings.TrimSpace(title) != "" {
				p.Title = strings.TrimSpace(title)
			}
			if publisher, _ := data["publisher"].(string); strings.TrimSpace(publisher) != "" {
				p.Publisher = strings.TrimSpace(publisher)
			}
			if yearText, _ := data["year"].(string); len(yearText) == 4 {
				var parsedYear int
				if _, parseErr := fmt.Sscanf(yearText, "%d", &parsedYear); parseErr == nil && parsedYear > 0 {
					p.PublishedYear = int32(parsedYear)
				}
			}
		}
	}

	catUuid := pgtype.UUID{}
	if p.CategoryID != "" {
		catUuid.Scan(p.CategoryID)
	}

	price := pgtype.Numeric{}
	price.Scan(fmt.Sprintf("%.2f", p.Price))

	book, err := s.q.CreateBook(ctx, db.CreateBookParams{
		TenantID:        tenantUuid,
		Title:           p.Title,
		Isbn:            pgtype.Text{String: p.ISBN, Valid: p.ISBN != ""},
		Publisher:       pgtype.Text{String: p.Publisher, Valid: p.Publisher != ""},
		PublishedYear:   pgtype.Int4{Int32: p.PublishedYear, Valid: p.PublishedYear > 0},
		CategoryID:      catUuid,
		TotalCopies:     p.TotalCopies,
		AvailableCopies: p.TotalCopies,
		ShelfLocation:   pgtype.Text{String: p.ShelfLocation, Valid: p.ShelfLocation != ""},
		Price:           price,
		Language:        pgtype.Text{String: p.Language, Valid: p.Language != ""},
		Status:          "active",
	})
	if err != nil {
		return db.LibraryBook{}, fmt.Errorf("failed to create book: %w", err)
	}

	// Link Author if provided
	if p.AuthorID != "" {
		bookUuid := book.ID
		authorUuid := pgtype.UUID{}
		authorUuid.Scan(p.AuthorID)
		if err := s.q.CreateBookAuthor(ctx, db.CreateBookAuthorParams{
			BookID:   bookUuid,
			AuthorID: authorUuid,
		}); err != nil {
			// Log error but don't fail book creation? Or verify consistency?
			// For MVP, proceed.
		}
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tenantUuid,
		UserID:       parseUserUUID(p.UserID),
		RequestID:    p.RequestID,
		Action:       "CREATE_BOOK",
		ResourceType: "library_book",
		ResourceID:   book.ID,
		After:        map[string]interface{}{"title": p.Title}, // Or pass book object
		IPAddress:    p.IP,
	})

	return book, nil
}

func (s *LibraryService) ListBooks(ctx context.Context, tenantID string, limit, offset int32) ([]db.LibraryBook, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListBooks(ctx, db.ListBooksParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *LibraryService) ListCategories(ctx context.Context, tenantID string) ([]db.LibraryCategory, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListCategories(ctx, tID)
}

func (s *LibraryService) ListAuthors(ctx context.Context, tenantID string) ([]db.LibraryAuthor, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListAuthors(ctx, tID)
}

func (s *LibraryService) UpdateBook(ctx context.Context, tenantID, bookID string, p CreateBookParams) (db.LibraryBook, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	bID := pgtype.UUID{}
	bID.Scan(bookID)

	catUuid := pgtype.UUID{}
	if p.CategoryID != "" {
		catUuid.Scan(p.CategoryID)
	}

	price := pgtype.Numeric{}
	price.Scan(fmt.Sprintf("%.2f", p.Price))

	book, err := s.q.UpdateBook(ctx, db.UpdateBookParams{
		ID:              bID,
		TenantID:        tID,
		Title:           p.Title,
		Isbn:            pgtype.Text{String: p.ISBN, Valid: p.ISBN != ""},
		Publisher:       pgtype.Text{String: p.Publisher, Valid: p.Publisher != ""},
		PublishedYear:   pgtype.Int4{Int32: p.PublishedYear, Valid: p.PublishedYear > 0},
		CategoryID:      catUuid,
		TotalCopies:     p.TotalCopies,
		ShelfLocation:   pgtype.Text{String: p.ShelfLocation, Valid: p.ShelfLocation != ""},
		Price:           price,
		Language:        pgtype.Text{String: p.Language, Valid: p.Language != ""},
	})
	if err != nil {
		return db.LibraryBook{}, fmt.Errorf("failed to update book: %w", err)
	}

	// Update Author logic simplified: just re-create link if changed? 
	// For MVP allow adding multiple? 
	// Let's assume we just add the new author relationship if not exists.
	if p.AuthorID != "" {
		authorUuid := pgtype.UUID{}
		authorUuid.Scan(p.AuthorID)
		_ = s.q.CreateBookAuthor(ctx, db.CreateBookAuthorParams{
			BookID:   bID,
			AuthorID: authorUuid,
		})
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       parseUserUUID(p.UserID),
		RequestID:    p.RequestID,
		Action:       "UPDATE_BOOK",
		ResourceType: "library_book",
		ResourceID:   book.ID,
		After:        map[string]interface{}{"title": p.Title},
		IPAddress:    p.IP,
	})

	return book, nil
}

// Issue Management

type IssueBookParams struct {
	TenantID  string
	BookID    string
	StudentID string
	UserID    string
	Days      int
	RequestID string
	IP        string
}

func (s *LibraryService) IssueBook(ctx context.Context, p IssueBookParams) (db.LibraryIssue, error) {
	if p.Days <= 0 {
		p.Days = 14
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	// 1. Check Availability
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	bID := pgtype.UUID{}
	bID.Scan(p.BookID)
	
	book, err := qtx.GetBook(ctx, db.GetBookParams{ID: bID, TenantID: tID})
	if err != nil {
		return db.LibraryIssue{}, errors.New("book not found")
	}
	
	if book.AvailableCopies <= 0 {
		return db.LibraryIssue{}, errors.New("book not available")
	}

	// 2. Decrement Copies
	copyID := pgtype.UUID{}
	copyID.Scan(p.BookID)
	if err := qtx.UpdateBookCopies(ctx, db.UpdateBookCopiesParams{
		ID:              copyID,
		AvailableCopies: -1,
	}); err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to update copies: %w", err)
	}

	// 3. Create Issue Record
	sID := pgtype.UUID{}
	sID.Scan(p.StudentID)
	uID := pgtype.UUID{}
	uID.Scan(p.UserID)
	
	dueDate := time.Now().AddDate(0, 0, p.Days)
	
	issue, err := qtx.IssueBook(ctx, db.IssueBookParams{
		TenantID:  tID,
		BookID:    bID,
		StudentID: sID,
		UserID:    uID,
		IssueDate: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		DueDate:   pgtype.Timestamptz{Time: dueDate, Valid: true},
		Status:    "issued",
	})
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to issue book: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to commit issue transaction: %w", err)
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    p.RequestID,
		Action:       "ISSUE_BOOK",
		ResourceType: "library_issue",
		ResourceID:   issue.ID,
		After:        map[string]interface{}{"book_id": p.BookID, "student_id": p.StudentID},
		IPAddress:    p.IP,
	})

	return issue, nil
}

type ReturnBookParams struct {
	TenantID string
	IssueID  string
	UserID   string // Staff processing the return
	Remarks  string
}

func (s *LibraryService) ReturnBook(ctx context.Context, p ReturnBookParams) (db.LibraryIssue, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	iID := pgtype.UUID{}
	iID.Scan(p.IssueID)

	// 1. Fetch the Issue to get Due Date
	issue, err := qtx.GetIssue(ctx, db.GetIssueParams{ID: iID, TenantID: tID})
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("issue not found: %w", err)
	}

	if issue.Status == "returned" {
		return issue, nil // Already returned
	}

	// 2. Calculate Fine
	var fineAmount float64 = 0.0
	now := time.Now()
	if issue.DueDate.Valid && now.After(issue.DueDate.Time) {
		daysOverdue := int(now.Sub(issue.DueDate.Time).Hours() / 24)
		if daysOverdue > 0 {
			fineAmount = float64(daysOverdue) * s.finePerDay
		}
	}

	fineNumeric := pgtype.Numeric{}
	fineNumeric.Scan(fmt.Sprintf("%.2f", fineAmount))

	// 3. Update Issue
	updatedIssue, err := qtx.ReturnBook(ctx, db.ReturnBookParams{
		ID:         iID,
		TenantID:   tID,
		ReturnDate: pgtype.Timestamptz{Time: now, Valid: true},
		FineAmount: fineNumeric,
		Status:     "returned",
		Remarks:    pgtype.Text{String: p.Remarks, Valid: p.Remarks != ""},
	})
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to return book: %w", err)
	}

	// 4. Increment Copies
	bID := issue.BookID
	if err := qtx.UpdateBookCopies(ctx, db.UpdateBookCopiesParams{
		ID:              bID,
		AvailableCopies: 1,
	}); err != nil {
		return updatedIssue, fmt.Errorf("book returned but failed to update copies: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to commit return transaction: %w", err)
	}

	return updatedIssue, nil
}

func (s *LibraryService) ListIssues(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListIssuesRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListIssues(ctx, db.ListIssuesParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// ==================== Digital Assets ====================

type CreateDigitalAssetParams struct {
	TenantID    string
	BookID      string
	AssetType   string // pdf, epub, link, video
	Title       string
	URL         string
	FileSizeBytes int64
	AccessLevel string
}

func (s *LibraryService) CreateDigitalAsset(ctx context.Context, p CreateDigitalAssetParams) (db.LibraryDigitalAsset, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	bID := pgtype.UUID{}
	bID.Scan(p.BookID)

	return s.q.CreateDigitalAsset(ctx, db.CreateDigitalAssetParams{
		TenantID:      tID,
		BookID:        bID,
		AssetType:     p.AssetType,
		Title:         p.Title,
		Url:           p.URL,
		FileSizeBytes: pgtype.Int8{Int64: p.FileSizeBytes, Valid: p.FileSizeBytes > 0},
		AccessLevel:   p.AccessLevel,
	})
}

func (s *LibraryService) ListDigitalAssets(ctx context.Context, tenantID, bookID string) ([]db.LibraryDigitalAsset, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	bID := pgtype.UUID{}
	bID.Scan(bookID)
	return s.q.ListDigitalAssets(ctx, db.ListDigitalAssetsParams{
		BookID:   bID,
		TenantID: tID,
	})
}

func (s *LibraryService) DeleteDigitalAsset(ctx context.Context, tenantID, id string) error {
	// Verify tenant matches if needed, or just delete by ID if globally unique
	uID := pgtype.UUID{}
	uID.Scan(id)
	return s.q.DeleteDigitalAsset(ctx, uID)
}

func (s *LibraryService) ScanBookForIssue(ctx context.Context, p IssueBookParams, barcode string) (db.LibraryIssue, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	
	book, err := s.q.GetBookByBarcode(ctx, db.GetBookByBarcodeParams{
		Barcode:  pgtype.Text{String: barcode, Valid: true},
		TenantID: tID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.LibraryIssue{}, errors.New("book not found with this barcode")
		}
		return db.LibraryIssue{}, fmt.Errorf("lookup failed: %w", err)
	}

	p.BookID = book.ID.String()
	return s.IssueBook(ctx, p)
}

func (s *LibraryService) ScanBookForReturn(ctx context.Context, tenantID, userID, barcode, remarks string) (db.LibraryIssue, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	
	book, err := s.q.GetBookByBarcode(ctx, db.GetBookByBarcodeParams{
		Barcode:  pgtype.Text{String: barcode, Valid: true},
		TenantID: tID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.LibraryIssue{}, errors.New("book not found with this barcode")
		}
		return db.LibraryIssue{}, fmt.Errorf("lookup failed: %w", err)
	}

	// Find the active issue
	issue, err := s.q.GetActiveIssueByBook(ctx, db.GetActiveIssueByBookParams{
		BookID:   book.ID,
		TenantID: tID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.LibraryIssue{}, errors.New("no active issue found for this book")
		}
		return db.LibraryIssue{}, fmt.Errorf("failed to find active issue: %w", err)
	}

	return s.ReturnBook(ctx, ReturnBookParams{
		TenantID: tenantID,
		IssueID:  issue.ID.String(),
		UserID:   userID,
		Remarks:  remarks,
	})
}

func (s *LibraryService) UpsertReadingLog(ctx context.Context, p db.UpsertReadingLogParams) (db.LibraryReadingLog, error) {
	return s.q.UpsertReadingLog(ctx, p)
}

func (s *LibraryService) GetStudentReadingLogs(ctx context.Context, tenantID, studentID string) ([]db.GetStudentReadingLogsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	return s.q.GetStudentReadingLogs(ctx, db.GetStudentReadingLogsParams{
		TenantID:  tID,
		StudentID: sID,
	})
}

func (s *LibraryService) ListRecentReadingLogs(ctx context.Context, tenantID string, limit int32) ([]db.ListRecentReadingLogsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.ListRecentReadingLogs(ctx, db.ListRecentReadingLogsParams{
		TenantID: tID,
		Limit:    limit,
	})
}

func (s *LibraryService) UpdateReadingProgress(ctx context.Context, tenantID, studentID, bookID string, pagesRead, totalPages int) (db.LibraryReadingProgress, error) {
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	bID := pgtype.UUID{}
	bID.Scan(bookID)
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	progress, err := s.q.CreateReadingProgress(ctx, db.CreateReadingProgressParams{
		StudentID:  sID,
		AssetID:    bID,
		PagesRead:  int32(pagesRead),
		TotalPages: int32(totalPages),
	})
	if err != nil {
		return db.LibraryReadingProgress{}, err
	}

	// Also update the current log state for quick lookup
	_, _ = s.q.UpsertReadingLog(ctx, db.UpsertReadingLogParams{
		TenantID:    tID,
		StudentID:   sID,
		BookID:      bID,
		Status:      "reading",
		CurrentPage: pgtype.Int4{Int32: int32(pagesRead), Valid: true},
		TotalPages:  pgtype.Int4{Int32: int32(totalPages), Valid: true},
	})
	
	return progress, nil
}

func (s *LibraryService) GetReadingVelocity(ctx context.Context, studentID, bookID string) ([]db.GetReadingVelocityRow, error) {
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	bID := pgtype.UUID{}
	bID.Scan(bookID)

	return s.q.GetReadingVelocity(ctx, db.GetReadingVelocityParams{
		StudentID: sID,
		AssetID:   bID,
	})
}
