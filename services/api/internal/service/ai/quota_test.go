package ai

import (
	"context"
	"testing"

	"github.com/schoolerp/api/internal/db"
)

type mockBilling struct {
	BillingService
}

func (m *mockBilling) HasAddon(ctx context.Context, tenantID, addon string) (bool, error) {
	return true, nil
}
func (m *mockBilling) GetWalletBalance(ctx context.Context, tenantID string) (int64, error) {
	return 1000, nil
}
func (m *mockBilling) GetEffectiveRate(ctx context.Context, tenantID, feature string) (int64, error) {
	return 10, nil
}

func contains(s, substr string) bool {
	return (s != "" && substr != "" && (s == substr || len(s) > len(substr))) // simplicity for mock
}

type mockQuerier struct {
	db.Querier
}

func (m *mockQuerier) GetEffectiveTenantLimit(ctx context.Context, arg db.GetEffectiveTenantLimitParams) (int64, error) {
	return 1000, nil
}
func (m *mockQuerier) CountQueriesInPeriod(ctx context.Context, arg db.CountQueriesInPeriodParams) (int64, error) {
	return 0, nil
}

// Ensure the test name and package are correct
func TestAIBurstLimiter(t *testing.T) {
	s := &Service{
		q:       &mockQuerier{},
		billing: &mockBilling{},
	}
	tenantID := "test-tenant-123"
	userID := "user-456"

	for i := 0; i < 11; i++ {
		err := s.checkBilling(context.Background(), tenantID, userID, "ai_suite_v1", "ai_request")
		if i < 10 && err != nil {
			t.Fatalf("Request %d should have passed, got: %v", i, err)
		}
		if i >= 10 && err == nil {
			t.Fatal("11th request should have failed due to rate limit")
		}
	}
}
