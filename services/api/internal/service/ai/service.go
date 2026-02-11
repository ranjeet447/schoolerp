package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/schoolerp/api/internal/foundation/ai"
)

type Service struct {
	client *ai.Client
}

func NewService() (*Service, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	return &Service{
		client: ai.NewClient(ai.ProviderOpenAI, apiKey),
	}, nil
}

// GenerateLessonPlan creates a grounded lesson plan based on subject and topic
func (s *Service) GenerateLessonPlan(ctx context.Context, subject, topic, grade string) (string, error) {
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

	return resp, nil
}

// AnswerParentQuery handles general school queries grounded in provided context
func (s *Service) AnswerParentQuery(ctx context.Context, query, contextInfo string) (string, error) {
	prompt := fmt.Sprintf(`You are a school admin helpdesk assistant. 
Use the following context to answer the parent's query. If the answer is not in the context, politely say you don't know and suggest contacting the school office.

Context:
%s

Parent Query: %s

Answer concisely and professionally.`, contextInfo, query)

	resp, err := s.client.Chat(ctx, ai.ChatRequest{
		Messages: []ai.Message{
			{Role: "system", Content: "You are a professional school helpdesk agent. Always be polite and helpful."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.3,
	})

	return resp, err
}
