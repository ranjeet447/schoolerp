package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/ai"
)

type BillingService interface {
	HasAddon(ctx context.Context, tenantID string, addonCode string) (bool, error)
	GetWalletBalance(ctx context.Context, tenantID string) (int64, error)
	DebitWallet(ctx context.Context, tenantID string, amount int64, userID *string, debitType string, desc string, ref string, metadata map[string]interface{}) error
	GetEffectiveRate(ctx context.Context, tenantID string, featureCode string) (int64, error)
}

type Service struct {
	q       db.Querier
	client  *ai.Client
	billing BillingService

	// B5: Per-user burst limiter (simple pod-local)
	ratelimiter sync.Map
}

func NewService(q db.Querier, billing BillingService) (*Service, error) {
	providerRaw := strings.ToLower(strings.TrimSpace(os.Getenv("AI_PROVIDER")))
	provider := ai.ProviderOpenAI
	apiKeyEnv := "OPENAI_API_KEY"

	switch providerRaw {
	case "", "openai":
		provider = ai.ProviderOpenAI
		apiKeyEnv = "OPENAI_API_KEY"
	case "anthropic":
		provider = ai.ProviderAnthropic
		apiKeyEnv = "ANTHROPIC_API_KEY"
	case "gemini":
		provider = ai.ProviderGemini
		apiKeyEnv = "GEMINI_API_KEY"
	default:
		return nil, fmt.Errorf("unsupported AI_PROVIDER %q; expected openai, anthropic, or gemini", providerRaw)
	}

	apiKey := strings.TrimSpace(os.Getenv(apiKeyEnv))
	if apiKey == "" {
		return nil, fmt.Errorf("%s not set", apiKeyEnv)
	}

	return &Service{
		q:       q,
		client:  ai.NewClient(provider, apiKey),
		billing: billing,
		ratelimiter: sync.Map{},
	}, nil
}

func (s *Service) logQuery(ctx context.Context, tenantID, userID string, provider, model string, tokens int, cost float64, metadata map[string]interface{}) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	if userID != "" {
		uID.Scan(userID)
	}

	metaJSON, _ := json.Marshal(metadata)

	s.q.CreateAIQueryLog(ctx, db.CreateAIQueryLogParams{
		TenantID:   tID,
		UserID:     uID,
		Provider:   provider,
		Model:      model,
		TokensUsed: pgtype.Int4{Int32: int32(tokens), Valid: tokens > 0},
		Cost:       pgtype.Numeric{Int: big.NewInt(int64(cost * 1000000)), Exp: -6, Valid: true},
		Metadata:   metaJSON,
	})
}

// GenerateLessonPlan creates a grounded lesson plan based on subject and topic
func (s *Service) GenerateLessonPlan(ctx context.Context, tenantID, userID string, subject, topic, grade string) (string, error) {
	if err := s.checkBilling(ctx, tenantID, userID, "ai_suite_v1", "ai_request"); err != nil {
		return "", err
	}

	prompt := fmt.Sprintf(`You are an expert curriculum designer. 
Create a detailed lesson plan for:
Subject: %s
Topic: %s
Grade Level: %s

The lesson plan should include:
1. Learning Objectives
2. Key Concepts
3. Activities (Intro, Main, Closing)
4. Assessment Questions (3-5 MCQs)
5. Homework suggestion

Keep it practical and easy for a teacher to follow.`, subject, topic, grade)

	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages: []ai.Message{
			{Role: "system", Content: "You are a helpful assistant for teachers at a modern school."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.7,
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate lesson plan: %w", err)
	}

	// Async log and debit (best effort)
	go s.logAndDebit(context.Background(), tenantID, userID, "ai_request", "lesson_plan", "", map[string]interface{}{
		"subject": subject,
		"topic":   topic,
	})

	return resp, nil
}

// AnswerParentQuery handles general school queries grounded in provided context with conversation memory
func (s *Service) AnswerParentQuery(ctx context.Context, tenantID, userID string, query, contextInfo, threadID string) (string, error) {
	if err := s.checkBilling(ctx, tenantID, userID, "ai_suite_v1", "ai_request"); err != nil {
		return "", err
	}

	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	var history []ai.Message
	if threadID != "" {
		session, err := s.q.GetAIChatSession(ctx, db.GetAIChatSessionParams{
			TenantID:   tID,
			ExternalID: threadID,
		})
		if err == nil {
			json.Unmarshal(session.Messages, &history)
		}
	}

	// Prepare current prompt
	systemPrompt := "You are a professional school helpdesk agent. Always be polite and helpful. Use the provided context to answer. If unknown, say so and suggest contacting the office."
	if contextInfo != "" {
		systemPrompt += "\n\nContext:\n" + contextInfo
	}

	messages := []ai.Message{
		{Role: "system", Content: systemPrompt},
	}
	
	// Add history (limit to last 10 messages for context window)
	if len(history) > 10 {
		messages = append(messages, history[len(history)-10:]...)
	} else {
		messages = append(messages, history...)
	}
	
	// Add current query
	messages = append(messages, ai.Message{Role: "user", Content: query})

	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages:    messages,
		Temperature: 0.3,
	})

	if err == nil {
		// Update history
		history = append(history, ai.Message{Role: "user", Content: query})
		history = append(history, ai.Message{Role: "assistant", Content: resp})
		
		msgJSON, _ := json.Marshal(history)
		
		if threadID != "" {
			s.q.UpsertAIChatSession(ctx, db.UpsertAIChatSessionParams{
				TenantID:   tID,
				ExternalID: threadID,
				Messages:   msgJSON,
				ExpiresAt:  pgtype.Timestamptz{Time: time.Now().Add(24 * time.Hour), Valid: true},
			})
		}

		go s.logAndDebit(context.Background(), tenantID, userID, "ai_request", "parent_query", "", map[string]interface{}{
			"query":     query,
			"thread_id": threadID,
		})
	}

	return resp, err
}

// GenerateRubric creates evaluation criteria for an exam
func (s *Service) GenerateRubric(ctx context.Context, tenantID, userID string, subject, title, grade string, maxMarks int) (string, error) {
	if err := s.checkBilling(ctx, tenantID, userID, "ai_suite_v1", "ai_request"); err != nil {
		return "", err
	}

	prompt := fmt.Sprintf(`You are an expert academic evaluator. 
Create a detailed grading rubric for:
Subject: %s
Exam/Assignment Title: %s
Grade Level: %s
Total Marks: %d

The rubric should consist of 4-5 evaluation criteria (e.g., Content Accuracy, Presentation, Grammar, Critical Thinking).
For each criterion, provide:
1. Weight/Marks (The total of all weights must equal %d)
2. Descriptions for "Excellent", "Good", "Satisfactory", and "Needs Improvement" levels.

Return the result as a raw JSON array of objects with the following structure:
[
  {
    "criterion": "Criterion Name",
    "weight": 20,
    "descriptors": {
      "excellent": "Description...",
      "good": "Description...",
      "satisfactory": "Description...",
      "needs_improvement": "Description..."
    }
  }
]
Do not include any other text, only the JSON.`, subject, title, grade, maxMarks, maxMarks)

	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages: []ai.Message{
			{Role: "system", Content: "You are a precise academic assistant. You only output valid JSON arrays."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.5,
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate rubric: %w", err)
	}

	go s.logAndDebit(context.Background(), tenantID, userID, "ai_request", "rubric", "", map[string]interface{}{
		"subject": subject,
		"title":   title,
	})

	// Clean up potential markdown formatting
	resp = strings.TrimPrefix(resp, "```json")
	resp = strings.TrimPrefix(resp, "```")
	resp = strings.TrimSuffix(resp, "```")
	resp = strings.TrimSpace(resp)

	return resp, nil
}
func (s *Service) ChatWithHistory(ctx context.Context, tenantID, userID string, messages []ai.Message) (string, error) {
	if err := s.checkBilling(ctx, tenantID, userID, "ai_suite_v1", "ai_request"); err != nil {
		return "", err
	}

	// Add system prompt if missing
	if len(messages) == 1 {
		messages = append([]ai.Message{{Role: "system", Content: "You are a professional school helpdesk agent. Always be polite and helpful."}}, messages...)
	}

	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages:    messages,
		Temperature: 0.5,
	})

	if err == nil {
		// Log usage (anonymous user for WhatsApp for now)
		go s.logAndDebit(context.Background(), tenantID, "whatsapp", "ai_request", "whatsapp_chat", "", map[string]interface{}{})
	}

	return resp, err
}

func (s *Service) DetectLanguage(ctx context.Context, text string) (string, error) {
	prompt := fmt.Sprintf("Detect the language of the following text and return ONLY the ISO 639-1 code (e.g., 'en', 'hi', 'es').\n\nText: %s", text)
	
	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages: []ai.Message{
			{Role: "system", Content: "You are a language detection utility. Only output the 2-letter language code."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0,
	})
	if err != nil {
		return "en", err
	}

	lang := strings.ToLower(strings.TrimSpace(resp))
	if len(lang) > 2 {
		lang = lang[:2] // Safeguard
	}
	return lang, nil
}

// --- Billing Helpers ---

func (s *Service) checkBilling(ctx context.Context, tenantID, userID, addonCode, featureCode string) error {
	// B5: Per-user burst limiter (Initial RC Hardening) 
	// Limit is 10 requests per minute per user (or per-tenant if userID is empty)
	now := time.Now()
	limitKey := fmt.Sprintf("burst:%s:%s", tenantID, userID)
	if userID == "" {
		limitKey = fmt.Sprintf("burst:%s:global", tenantID)
	}
	
	val, ok := s.ratelimiter.Load(limitKey)
	var timestamps []int64
	if ok {
		timestamps = val.([]int64)
	}
	
	// Keep only timestamps within the last 60 seconds
	filtered := make([]int64, 0, 10)
	for _, t := range timestamps {
		if now.Unix()-t < 60 {
			filtered = append(filtered, t)
		}
	}
	
	if len(filtered) >= 10 {
		return fmt.Errorf("AI_RATE_LIMIT_EXCEEDED: too many requests per minute (max 10)")
	}
	
	// Record new timestamp and update
	filtered = append(filtered, now.Unix())
	s.ratelimiter.Store(limitKey, filtered)

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	// 1. Quota Check (Monthly AI Ask)
	// We check for 'ai_ask_monthly' key
	limit, _ := s.q.GetEffectiveTenantLimit(ctx, db.GetEffectiveTenantLimitParams{
		TenantID: tUUID,
		QuotaKey: "ai_ask_monthly",
	})
	
	if limit > 0 {
		now := time.Now()
		startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

		count, err := s.q.CountQueriesInPeriod(ctx, db.CountQueriesInPeriodParams{
			TenantID:  tUUID,
			CreatedAt: pgtype.Timestamptz{Time: startOfMonth, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: endOfMonth, Valid: true},
		})
		if err == nil && count >= limit {
			return fmt.Errorf("MONTHLY_AI_QUOTA_EXCEEDED")
		}
	}

	if s.billing == nil {
		return nil // Billing not enforced, Proceed if quota allows
	}

	// 2. Check Addon
	hasAddon, err := s.billing.HasAddon(ctx, tenantID, addonCode)
	if err != nil {
		return err
	}
	if !hasAddon {
		return fmt.Errorf("ADDON_REQUIRED: %s", addonCode)
	}

	// 3. Check Credits (Preview)
	balance, err := s.billing.GetWalletBalance(ctx, tenantID)
	if err != nil {
		return err
	}

	rate, err := s.billing.GetEffectiveRate(ctx, tenantID, featureCode)
	if err != nil {
		return err
	}

	if balance < int64(rate) {
		return fmt.Errorf("INSUFFICIENT_CREDITS")
	}

	return nil
}

func (s *Service) logAndDebit(ctx context.Context, tenantID, userID, featureCode, typeLabel, ref string, metadata map[string]interface{}) {
	// Log query first (original behavior)
	s.logQuery(ctx, tenantID, userID, string(s.client.GetProvider()), "default", 0, 0, metadata)

	if s.billing == nil {
		return
	}

	// Calculate and Debit
	rate, err := s.billing.GetEffectiveRate(ctx, tenantID, featureCode)
	if err != nil {
		log.Error().Err(err).Str("tenant_id", tenantID).Str("feature", featureCode).Msg("Failed to get rate for debit")
		return
	}

	desc := fmt.Sprintf("AI Usage: %s", typeLabel)
	var uid *string
	if userID != "" && userID != "whatsapp" {
		uid = &userID
	}

	// Ensure we have a reference_id
	if ref == "" {
		if reqID, ok := metadata["request_id"].(string); ok && reqID != "" {
			ref = reqID
		} else if msgID, ok := metadata["message_id"].(string); ok && msgID != "" {
			ref = msgID
		} else {
			// Fallback: search for something unique in metadata or construct one
			ref = fmt.Sprintf("ai-%s-%d", tenantID, time.Now().UnixNano())
		}
	}

	err = s.billing.DebitWallet(ctx, tenantID, int64(rate), uid, "usage", desc, ref, metadata)
	if err != nil {
		log.Error().Err(err).Str("tenant_id", tenantID).Msg("Failed to debit wallet for AI usage")
	}
}
