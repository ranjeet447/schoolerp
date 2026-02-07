// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/schoolerp/api/internal/db"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserInactive       = errors.New("user account is inactive")
)

type Service struct {
	queries *db.Queries
}

func NewService(queries *db.Queries) *Service {
	return &Service{queries: queries}
}

// LoginResult contains the JWT token and user info after successful auth
type LoginResult struct {
	Token     string    `json:"token"`
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	TenantID  string    `json:"tenant_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

// Login authenticates a user via email/password and returns a JWT
func (s *Service) Login(ctx context.Context, email, password string) (*LoginResult, error) {
	// 1. Find user by email
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive.Bool {
		return nil, ErrUserInactive
	}

	// 2. Verify password from user_identities table
	identity, err := s.queries.GetUserIdentity(ctx, db.GetUserIdentityParams{
		UserID:   user.ID,
		Provider: "password",
	})
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Compare hashed password
	hashedInput := hashPassword(password)
	if identity.Credential.String != hashedInput {
		return nil, ErrInvalidCredentials
	}

	// 3. Get role assignment for this user
	roleAssignment, err := s.queries.GetUserRoleAssignment(ctx, user.ID)
	if err != nil {
		// User has no role assigned - still allow login but with no role
		roleAssignment = db.GetUserRoleAssignmentRow{
			RoleCode: "user",
		}
	}

	// 4. Generate JWT token
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour token validity
	
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-dev-secret"
	}

	claims := jwt.MapClaims{
		"sub":       user.ID.String(),
		"email":     user.Email.String,
		"name":      user.FullName,
		"role":      roleAssignment.RoleCode,
		"tenant_id": roleAssignment.TenantID.String(),
		"iat":       time.Now().Unix(),
		"exp":       expiresAt.Unix(),
		"jti":       uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return nil, err
	}

	// 5. Update last login timestamp
	_ = s.queries.UpdateUserLastLogin(ctx, db.UpdateUserLastLoginParams{
		ID:       identity.ID,
		Provider: "password",
	})

	return &LoginResult{
		Token:     tokenString,
		UserID:    user.ID.String(),
		Email:     user.Email.String,
		FullName:  user.FullName,
		Role:      roleAssignment.RoleCode,
		TenantID:  roleAssignment.TenantID.String(),
		ExpiresAt: expiresAt,
	}, nil
}


// hashPassword creates a SHA256 hash of the password
// In production, use bcrypt or argon2 instead
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// HashPasswordForSeed is exported for use in seed scripts
func HashPasswordForSeed(password string) string {
	return hashPassword(password)
}
