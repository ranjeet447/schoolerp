package auth

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image/png"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pquerna/otp/totp"
	"github.com/schoolerp/api/internal/db"
)

type MFAService struct {
	q db.Querier
}

func NewMFAService(q db.Querier) *MFAService {
	return &MFAService{q: q}
}

type MFAConfiguration struct {
	Secret        string `json:"secret"`
	QRCode        []byte `json:"qr_code"`
	RecoveryCodes []string `json:"recovery_codes"`
}

// GenerateSecret creates a new TOTP secret for the user but does not enable it yet.
func (s *MFAService) GenerateSecret(ctx context.Context, userID, email string) (*MFAConfiguration, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "SchoolERP",
		AccountName: email,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	// Generate QR code
	var buf bytes.Buffer
	img, err := key.Image(200, 200)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}
	if err := png.Encode(&buf, img); err != nil {
		return nil, fmt.Errorf("failed to encode QR code: %w", err)
	}

	// Store temporarily or return to user to confirm?
	// We need to store it in DB, but mark as disabled.
	// Or we can just return it and expect the user to send it back with a code to confirm.
	// But usually we store it in a pending state or just update the user's secret but keep enabled=false.
	
	// Let's store it with enabled=false.
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err = s.q.UpsertMFASecret(ctx, db.UpsertMFASecretParams{
		UserID:  uID,
		Secret:  key.Secret(),
		Enabled: pgtype.Bool{Bool: false, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to store MFA secret: %w", err)
	}

	return &MFAConfiguration{
		Secret: key.Secret(),
		QRCode: buf.Bytes(),
	}, nil
}

// EnableMFA verify the code and enables MFA for the user.
func (s *MFAService) EnableMFA(ctx context.Context, userID, code string) error {
	uID := pgtype.UUID{}
	uID.Scan(userID)

	// Fetch secret
	secret, err := s.q.GetMFASecret(ctx, uID)
	if err != nil {
		return fmt.Errorf("MFA not set up: %w", err)
	}

	valid := totp.Validate(code, secret.Secret)
	if !valid {
		return errors.New("invalid TOTP code")
	}

	// Enable
	err = s.q.SetMFAEnabled(ctx, db.SetMFAEnabledParams{
		UserID:  uID,
		Enabled: pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to enable MFA: %w", err)
	}

	return nil
}

// ValidateMFA checks the code against the stored secret.
func (s *MFAService) ValidateMFA(ctx context.Context, userID, code string) (bool, error) {
	uID := pgtype.UUID{}
	uID.Scan(userID)

	secret, err := s.q.GetMFASecret(ctx, uID)
	if err != nil {
		// If no secret, MFA is not enabled.
		// BUT if this method is called, it implies MFA *should* be checked.
		// If err is sql.ErrNoRows, maybe return false?
		return false, err
	}

	if !secret.Enabled.Bool {
		return false, errors.New("MFA is not enabled")
	}

	return totp.Validate(code, secret.Secret), nil
}
