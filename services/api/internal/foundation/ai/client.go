package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Provider string

const (
	ProviderOpenAI    Provider = "openai"
	ProviderAnthropic Provider = "anthropic"
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

func (c *Client) Chat(ctx context.Context, req ChatRequest) (string, error) {
	if c.provider == ProviderOpenAI {
		return c.chatOpenAI(ctx, req)
	}
	return "", fmt.Errorf("provider %s not implemented", c.provider)
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
