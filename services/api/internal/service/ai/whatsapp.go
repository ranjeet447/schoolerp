package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/ai"
)

type WhatsAppService struct {
	aiSvc *Service
	q     db.Querier
}

func NewWhatsAppService(aiSvc *Service, q db.Querier) *WhatsAppService {
	return &WhatsAppService{aiSvc: aiSvc, q: q}
}

func (s *WhatsAppService) HandleIncomingMessage(ctx context.Context, tenantID, fromNumber, text string) (string, error) {
	tID := toPgUUID(tenantID)

	// 1. Get or Create Session
	session, err := s.q.GetAIChatSession(ctx, db.GetAIChatSessionParams{
		TenantID:   tID,
		ExternalID: fromNumber,
	})

	var messages []ai.Message
	if err == nil {
		if err := json.Unmarshal(session.Messages, &messages); err != nil {
			messages = []ai.Message{}
		}
	}

	// 2. Append User Message
	messages = append(messages, ai.Message{Role: "user", Content: text})

	// 3. Detect Language (if first message or session language unknown)
	lang := "en"
	if len(messages) <= 2 {
		if dLang, err := s.aiSvc.DetectLanguage(ctx, text); err == nil {
			lang = dLang
		}
	} else {
		// Try to get from metadata
		var meta map[string]interface{}
		json.Unmarshal(session.Metadata, &meta)
		if l, ok := meta["language"].(string); ok {
			lang = l
		}
	}

	// 4. Call AI Service with History and Language instructions
	systemPrompt := "You are a professional school helpdesk agent. Always be polite and helpful. "
	if lang != "en" {
		systemPrompt += fmt.Sprintf("Please respond in the language code: %s.", lang)
	}

	// Ensure system prompt is at the start
	if len(messages) > 0 && messages[0].Role != "system" {
		messages = append([]ai.Message{{Role: "system", Content: systemPrompt}}, messages...)
	}

	response, err := s.aiSvc.ChatWithHistory(ctx, tenantID, messages)
	if err != nil {
		return "", fmt.Errorf("failed to get AI response: %w", err)
	}

	// 5. Append AI Response
	messages = append(messages, ai.Message{Role: "assistant", Content: response})

	// 6. Save Session
	msgJSON, _ := json.Marshal(messages)
	expiresAt := time.Now().Add(24 * time.Hour)
	metaJSON, _ := json.Marshal(map[string]interface{}{"language": lang})

	_, err = s.q.UpsertAIChatSession(ctx, db.UpsertAIChatSessionParams{
		TenantID:   tID,
		ExternalID: fromNumber,
		Messages:   msgJSON,
		Metadata:   metaJSON,
		ExpiresAt:  pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})

	return response, err
}

func toPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}
