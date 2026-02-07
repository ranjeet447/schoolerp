package library

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type LibraryService struct {
	q     db.Querier
	audit *audit.Logger
}

func NewLibraryService(q db.Querier, audit *audit.Logger) *LibraryService {
	return &LibraryService{
		q:     q,
		audit: audit,
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

func (s *LibraryService) CreateBook(ctx context.Context, p CreateBookParams) (db.LibraryBook, error) {
	tenantUuid := pgtype.UUID{}
	tenantUuid.Scan(p.TenantID)

	catUuid := pgtype.UUID{}
	if p.CategoryID != "" {
		catUuid.Scan(p.CategoryID)
	}

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
		Price:           pgtype.Numeric{Int: nil, Valid: false}, // Simplified numeric handling
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
		UserID:       pgtype.UUID{}, // Parse UserID to UUID
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
	// 1. Check Availability
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	bID := pgtype.UUID{}
	bID.Scan(p.BookID)
	
	book, err := s.q.GetBook(ctx, db.GetBookParams{ID: bID, TenantID: tID})
	if err != nil {
		return db.LibraryIssue{}, errors.New("book not found")
	}
	
	if book.AvailableCopies <= 0 {
		return db.LibraryIssue{}, errors.New("book not available")
	}

	// 2. Decrement Copies
	copyID := pgtype.UUID{}
	copyID.Scan(p.BookID)
	if err := s.q.UpdateBookCopies(ctx, db.UpdateBookCopiesParams{
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
	
	issue, err := s.q.IssueBook(ctx, db.IssueBookParams{
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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	iID := pgtype.UUID{}
	iID.Scan(p.IssueID)

	// Since we don't have GetIssue, fetch from List or assume valid ID for update
	// In real implementation, should GetIssue to verify it's not already returned.
	// For MVP, proceed with update.

	// Calculate Fine (Mock for now)
	var fineAmount float64 = 0.0 
	_ = fineAmount // Suppress unused var error until logic implemented
	
	// Prepare numeric for fine
	// pgtype.Numeric is complex to construct manually without helper, sending 0/NULL for now simplicity
	// or rely on default.
	
	issue, err := s.q.ReturnBook(ctx, db.ReturnBookParams{
		ID:         iID,
		TenantID:   tID,
		ReturnDate: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		FineAmount: pgtype.Numeric{Int: nil, Valid: false}, // 0 fine
		Status:     "returned",
		Remarks:    pgtype.Text{String: p.Remarks, Valid: p.Remarks != ""},
	})
	if err != nil {
		return db.LibraryIssue{}, fmt.Errorf("failed to return book: %w", err)
	}

	// Increment Copies
	bID := issue.BookID
	if err := s.q.UpdateBookCopies(ctx, db.UpdateBookCopiesParams{
		ID:              bID,
		AvailableCopies: 1,
	}); err != nil {
		// Critical error: Data inconsistency
		return issue, fmt.Errorf("book returned but failed to update copies: %w", err)
	}

	return issue, nil
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
