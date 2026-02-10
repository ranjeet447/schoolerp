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

package finance

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type PaymentProvider interface {
	CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error)
	VerifyWebhookSignature(body []byte, signature string, secret string) bool
}

// RazorpayProvider is a stub implementation for Release 1
type RazorpayProvider struct {
	KeyID     string
	KeySecret string
}

func (r *RazorpayProvider) CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error) {
	// Stub: In real app, call https://api.razorpay.com/v1/orders
	log.Printf("[Razorpay] Mock Creating Order for %d %s", amount, currency)
	return fmt.Sprintf("order_%s", receiptID), nil
}

func (r *RazorpayProvider) VerifyWebhookSignature(body []byte, signature string, secret string) bool {
	// Simple HMAC-SHA256 verification
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	return expected == signature
}

func (s *Service) CreateOnlineOrder(ctx context.Context, tenantID, studentID string, amount int64) (db.PaymentOrder, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	// 1. Create Internal Order
	order, err := s.q.CreatePaymentOrder(ctx, db.CreatePaymentOrderParams{
		TenantID:  tUUID,
		StudentID: sUUID,
		Amount:    amount,
		Mode:      "online",
	})
	if err != nil {
		return db.PaymentOrder{}, err
	}

	// 2. Register with Razorpay (Stubbed)
	// externalRef, err := s.payment.CreateOrder(ctx, amount, "INR", order.ID.String())
	// ... update order with externalRef

	return order, nil
}

func (s *Service) ProcessPaymentWebhook(ctx context.Context, tenantID string, body []byte, signature string) error {
	// 1. Verify Signature (Stubbed logic)
	// 2. Parse Event
	var event struct {
		Event string `json:"event"`
		Payload struct {
			Order struct {
				Entity struct {
					ID string `json:"id"`
					Receipt string `json:"receipt"`
					Status string `json:"status"`
				} `json:"entity"`
			} `json:"order"`
		} `json:"payload"`
	}
	json.Unmarshal(body, &event)

	if event.Event == "order.paid" {
		// 3. Update Order Status
		// 4. Issue Receipt automatically
		log.Printf("[Webhook] Payment success for order: %s", event.Payload.Order.Entity.ID)

		// 5. Outbox Event
		tUUID := pgtype.UUID{}
		tUUID.Scan(tenantID)
		payload, _ := json.Marshal(event.Payload)
		_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tUUID,
			EventType: "fee.paid",
			Payload:   payload,
		})
	}

	return nil
}
