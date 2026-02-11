package policy

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/schoolerp/api/internal/db"
)

type mockQuerier struct {
	db.Querier
	policy db.Policy
	err    error
}

func (m *mockQuerier) GetPolicy(ctx context.Context, arg db.GetPolicyParams) (db.Policy, error) {
	return m.policy, m.err
}

func TestEvaluator_Evaluate(t *testing.T) {
	tests := []struct {
		name     string
		logic    map[string]any
		role     string
		want     bool
		wantApp  bool
	}{
		{
			name: "Allow by default with no policy logic",
			logic: nil,
			role: "admin",
			want: true,
			wantApp: false,
		},
		{
			name: "Deny specific role",
			logic: map[string]any{"denied_roles": []any{"guest"}},
			role: "guest",
			want: false,
			wantApp: false,
		},
		{
			name: "Allow authorized role",
			logic: map[string]any{"denied_roles": []any{"guest"}},
			role: "admin",
			want: true,
			wantApp: false,
		},
		{
			name: "Require approval",
			logic: map[string]any{"requires_approval": true},
			role: "teacher",
			want: true,
			wantApp: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logicJSON, _ := json.Marshal(tt.logic)
			mock := &mockQuerier{
				policy: db.Policy{
					Logic: logicJSON,
				},
			}
			eval := NewEvaluator(mock)
			
			got, err := eval.Evaluate(context.Background(), Context{
				TenantID: "fcc75681-6967-4638-867c-9ef1c990fc7e",
				Module:   "attendance",
				Action:   "create",
				Role:     tt.role,
			})
			
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			
			if got.Allowed != tt.want {
				t.Errorf("Allowed = %v, want %v", got.Allowed, tt.want)
			}
			
			if got.RequiresApproval != tt.wantApp {
				t.Errorf("RequiresApproval = %v, want %v", got.RequiresApproval, tt.wantApp)
			}
		})
	}
}
