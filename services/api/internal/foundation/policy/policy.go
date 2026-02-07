package policy

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Evaluator struct {
	q db.Querier
}

func NewEvaluator(q db.Querier) *Evaluator {
	return &Evaluator{q: q}
}

type Decision struct {
	Allowed          bool
	RequiresApproval bool
	ReasonRequired   bool
	DenialReason     string
	Config           map[string]any
}

type Context struct {
	TenantID string
	Module   string
	Action   string
	Role     string
}

func (e *Evaluator) Evaluate(ctx context.Context, c Context) (Decision, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(c.TenantID)

	policy, err := e.q.GetPolicy(ctx, db.GetPolicyParams{
		TenantID: tUUID,
		Module:   c.Module,
		Action:   c.Action,
	})
	if err != nil {
		// If no policy exists, default behavior (e.g., allow for Release 1)
		return Decision{Allowed: true}, nil
	}

	var logic map[string]any
	if len(policy.Logic) > 0 {
		json.Unmarshal(policy.Logic, &logic)
	}

	// Simple logic parsing for Release 1
	// e.g. {"requires_approval": true, "denied_roles": ["guest"]}
	
	decision := Decision{
		Allowed: true,
		Config:  logic,
	}

	if deniedRoles, ok := logic["denied_roles"].([]any); ok {
		for _, r := range deniedRoles {
			if r == c.Role {
				decision.Allowed = false
				decision.DenialReason = "Role not authorized for this action"
				return decision, nil
			}
		}
	}

	if reqApp, ok := logic["requires_approval"].(bool); ok {
		decision.RequiresApproval = reqApp
	}

	if reqReason, ok := logic["reason_required"].(bool); ok {
		decision.ReasonRequired = reqReason
	}

	return decision, nil
}
