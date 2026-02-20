package automation

import (
	"encoding/json"
	"testing"
)

func TestEvaluateRuleCondition_EmptyMatches(t *testing.T) {
	ok, err := evaluateRuleCondition(json.RawMessage(`{}`), json.RawMessage(`{"severity":"high"}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected empty condition to match")
	}
}

func TestEvaluateRuleCondition_ShorthandMap(t *testing.T) {
	ok, err := evaluateRuleCondition(
		json.RawMessage(`{"severity":"high","category":"discipline"}`),
		json.RawMessage(`{"severity":"high","category":"discipline"}`),
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected shorthand map condition to match payload")
	}
}

func TestEvaluateRuleCondition_Operators(t *testing.T) {
	cond := json.RawMessage(`{
		"all": [
			{"field":"severity","op":"eq","value":"high"},
			{"field":"score","op":"gte","value":80},
			{"any":[
				{"field":"tags","op":"contains","value":"urgent"},
				{"field":"category","op":"eq","value":"discipline"}
			]}
		]
	}`)
	payload := json.RawMessage(`{"severity":"high","score":91,"tags":["urgent","school"],"category":"general"}`)

	ok, err := evaluateRuleCondition(cond, payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected operators condition to match payload")
	}
}

func TestEvaluateRuleCondition_Not(t *testing.T) {
	cond := json.RawMessage(`{"not":{"field":"severity","op":"eq","value":"low"}}`)
	payload := json.RawMessage(`{"severity":"high"}`)

	ok, err := evaluateRuleCondition(cond, payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected not condition to match payload")
	}
}
