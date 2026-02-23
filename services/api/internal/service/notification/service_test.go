package notification

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/security"
)

type mockNotificationQuerier struct {
	db.Querier
	gatewayConfig db.NotificationGatewayConfig
}

func (m *mockNotificationQuerier) CreateNotificationGatewayConfig(ctx context.Context, arg db.CreateNotificationGatewayConfigParams) (db.NotificationGatewayConfig, error) {
	m.gatewayConfig = db.NotificationGatewayConfig{
		TenantID:  arg.TenantID,
		Provider:  arg.Provider,
		ApiKey:    arg.ApiKey,
		ApiSecret: arg.ApiSecret,
		SenderID:  arg.SenderID,
		IsActive:  arg.IsActive,
		Settings:  arg.Settings,
	}
	return m.gatewayConfig, nil
}

func (m *mockNotificationQuerier) GetTenantActiveNotificationGateway(ctx context.Context, tenantID pgtype.UUID) (db.NotificationGatewayConfig, error) {
	return m.gatewayConfig, nil
}

func (m *mockNotificationQuerier) ListNotificationGatewayConfigs(ctx context.Context, tenantID pgtype.UUID) ([]db.NotificationGatewayConfig, error) {
	return []db.NotificationGatewayConfig{m.gatewayConfig}, nil
}

func TestGatewayConfigEncryptionAndMasking(t *testing.T) {
	key := []byte("01234567890123456789012345678901") // 32 bytes
	crypto, _ := security.NewCrypto(key)
	mock := &mockNotificationQuerier{}
	svc := NewService(mock, crypto)
	
	tenantID := "fcc75681-6967-4638-867c-9ef1c990fc7e"
	apiKey := "test_api_key_long_enough_to_mask"
	apiSecret := "test_api_secret"
	
	// Create
	_, err := svc.CreateOrUpdateGatewayConfig(context.Background(), tenantID, "provider_a", apiKey, apiSecret, "SENDER", true, nil)
	if err != nil {
		t.Fatalf("CreateOrUpdateGatewayConfig failed: %v", err)
	}
	
	// Mock stores it encrypted
	if mock.gatewayConfig.ApiKey.String == apiKey {
		t.Errorf("ApiKey should be stored encrypted, but was plaintext")
	}
	if mock.gatewayConfig.ApiSecret.String == apiSecret {
		t.Errorf("ApiSecret should be stored encrypted, but was plaintext")
	}
	
	// List (Masked)
	configs, err := svc.ListGatewayConfigs(context.Background(), tenantID)
	if err != nil {
		t.Fatalf("ListGatewayConfigs failed: %v", err)
	}
	
	if len(configs) != 1 {
		t.Fatalf("Expected 1 config, got %d", len(configs))
	}
	
	if configs[0].ApiKey.String == apiKey || configs[0].ApiKey.String == mock.gatewayConfig.ApiKey.String {
		t.Errorf("ApiKey should be masked in read response, but was %s", configs[0].ApiKey.String)
	}
	
	// Partial Update
	_, err = svc.CreateOrUpdateGatewayConfig(context.Background(), tenantID, "provider_a", "", "", "SENDER", true, nil)
	if err != nil {
		t.Fatalf("Partial update failed: %v", err)
	}
	
	// Should keep existing encrypted secrets
	if mock.gatewayConfig.ApiKey.String == "" {
		t.Errorf("Partial update reset ApiKey")
	}
}
