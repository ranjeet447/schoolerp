package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Provider string

const (
	ProviderOpenAI    Provider = "openai"
	ProviderAnthropic Provider = "anthropic"
	ProviderGemini    Provider = "gemini"
)

type Client struct {
	provider Provider
	apiKey   string
	baseURL  string
	http     *http.Client
}

func NewClient(provider Provider, apiKey string) *Client {
	baseURL := ""
	if provider == ProviderOpenAI {
		baseURL = "https://api.openai.com/v1"
	} else if provider == ProviderAnthropic {
		baseURL = "https://api.anthropic.com/v1"
	} else if provider == ProviderGemini {
		baseURL = "https://generativelanguage.googleapis.com/v1beta"
	}

	return &Client{
		provider: provider,
		apiKey:   apiKey,
		baseURL:  baseURL,
		http: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
}

type ChatResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

type anthropicMessageRequest struct {
	Model       string `json:"model"`
	Messages    []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	MaxTokens   int     `json:"max_tokens"`
	Temperature float64 `json:"temperature,omitempty"`
}

type anthropicMessageResponse struct {
	ID      string `json:"id"`
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

type geminiGenerateRequest struct {
	Contents []struct {
		Role  string `json:"role,omitempty"`
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
	GenerationConfig struct {
		Temperature     float64 `json:"temperature,omitempty"`
		MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
	} `json:"generationConfig,omitempty"`
}

type geminiGenerateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (c *Client) Chat(ctx context.Context, req ChatRequest) (string, error) {
	switch c.provider {
	case ProviderOpenAI:
		return c.chatOpenAI(ctx, req)
	case ProviderAnthropic:
		return c.chatAnthropic(ctx, req)
	case ProviderGemini:
		return c.chatGemini(ctx, req)
	default:
		return "", fmt.Errorf("unsupported provider: %s", c.provider)
	}
}

func (c *Client) chatOpenAI(ctx context.Context, req ChatRequest) (string, error) {
	if req.Model == "" {
		req.Model = "gpt-4o-mini"
	}

	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) > 0 {
		return chatResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("no choices returned from openai")
}

func (c *Client) chatAnthropic(ctx context.Context, req ChatRequest) (string, error) {
	if req.Model == "" {
		req.Model = "claude-3-5-haiku-latest"
	}
	if req.MaxTokens <= 0 {
		req.MaxTokens = 1024
	}

	apiReq := anthropicMessageRequest{
		Model:       req.Model,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
		Messages:    make([]struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}, 0, len(req.Messages)),
	}

	for _, m := range req.Messages {
		role := m.Role
		content := m.Content
		if role == "system" {
			role = "user"
			content = "[System Instructions]\n" + m.Content
		}

		apiReq.Messages = append(apiReq.Messages, struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}{
			Role:    role,
			Content: content,
		})
	}

	body, err := json.Marshal(apiReq)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", c.apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("anthropic error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var chatResp anthropicMessageResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	for _, part := range chatResp.Content {
		if part.Type == "text" && part.Text != "" {
			return part.Text, nil
		}
	}

	return "", fmt.Errorf("no text content returned from anthropic")
}

func (c *Client) chatGemini(ctx context.Context, req ChatRequest) (string, error) {
	model := strings.TrimSpace(req.Model)
	if model == "" {
		model = "gemini-1.5-flash"
	}
	if req.MaxTokens <= 0 {
		req.MaxTokens = 1024
	}

	promptParts := make([]string, 0, len(req.Messages))
	for _, msg := range req.Messages {
		content := strings.TrimSpace(msg.Content)
		if content == "" {
			continue
		}
		role := strings.TrimSpace(msg.Role)
		if role == "" {
			role = "user"
		}
		promptParts = append(promptParts, fmt.Sprintf("[%s]\n%s", role, content))
	}
	if len(promptParts) == 0 {
		return "", fmt.Errorf("no messages provided")
	}

	apiReq := geminiGenerateRequest{}
	apiReq.Contents = []struct {
		Role  string `json:"role,omitempty"`
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	}{
		{
			Role: "user",
			Parts: []struct {
				Text string `json:"text"`
			}{
				{Text: strings.Join(promptParts, "\n\n")},
			},
		},
	}
	apiReq.GenerationConfig.Temperature = req.Temperature
	apiReq.GenerationConfig.MaxOutputTokens = req.MaxTokens

	body, err := json.Marshal(apiReq)
	if err != nil {
		return "", err
	}

	endpoint := fmt.Sprintf("%s/models/%s:generateContent?key=%s", c.baseURL, url.PathEscape(model), url.QueryEscape(c.apiKey))
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var chatResp geminiGenerateResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Candidates) == 0 {
		return "", fmt.Errorf("no candidates returned from gemini")
	}

	parts := chatResp.Candidates[0].Content.Parts
	for _, part := range parts {
		if strings.TrimSpace(part.Text) != "" {
			return part.Text, nil
		}
	}

	return "", fmt.Errorf("no text content returned from gemini")
}
