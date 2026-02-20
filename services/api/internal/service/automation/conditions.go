package automation

import (
	"encoding/json"
	"reflect"
	"strconv"
	"strings"
)

func evaluateRuleCondition(condition json.RawMessage, payload json.RawMessage) (bool, error) {
	if len(strings.TrimSpace(string(condition))) == 0 || strings.TrimSpace(string(condition)) == "{}" {
		return true, nil
	}

	var cond any
	if err := json.Unmarshal(condition, &cond); err != nil {
		return false, err
	}

	var data any = map[string]any{}
	if len(strings.TrimSpace(string(payload))) > 0 {
		if err := json.Unmarshal(payload, &data); err != nil {
			return false, err
		}
	}

	return evaluateConditionNode(cond, data), nil
}

func evaluateConditionNode(node any, payload any) bool {
	switch c := node.(type) {
	case map[string]any:
		if allNode, ok := c["all"]; ok {
			all, ok := allNode.([]any)
			if !ok {
				return false
			}
			for _, child := range all {
				if !evaluateConditionNode(child, payload) {
					return false
				}
			}
			return true
		}

		if anyNode, ok := c["any"]; ok {
			anyItems, ok := anyNode.([]any)
			if !ok {
				return false
			}
			for _, child := range anyItems {
				if evaluateConditionNode(child, payload) {
					return true
				}
			}
			return false
		}

		if notNode, ok := c["not"]; ok {
			return !evaluateConditionNode(notNode, payload)
		}

		fieldName, hasField := c["field"].(string)
		if hasField {
			op := "eq"
			if opRaw, ok := c["op"].(string); ok && strings.TrimSpace(opRaw) != "" {
				op = strings.ToLower(strings.TrimSpace(opRaw))
			}
			expected := c["value"]
			actual, exists := getPayloadValue(payload, fieldName)
			return compareConditionValues(actual, expected, op, exists)
		}

		// Shorthand map match: {"severity":"high","category":"discipline"}.
		for key, expected := range c {
			actual, exists := getPayloadValue(payload, key)
			if !compareConditionValues(actual, expected, "eq", exists) {
				return false
			}
		}
		return true
	case []any:
		// Treat arrays as implicit ALL.
		for _, child := range c {
			if !evaluateConditionNode(child, payload) {
				return false
			}
		}
		return true
	default:
		// Unknown condition shape is non-matching.
		return false
	}
}

func compareConditionValues(actual, expected any, op string, exists bool) bool {
	switch strings.ToLower(strings.TrimSpace(op)) {
	case "exists":
		return exists
	case "not_exists":
		return !exists
	case "eq", "=":
		return exists && valuesEqual(actual, expected)
	case "neq", "!=", "<>":
		return !exists || !valuesEqual(actual, expected)
	case "gt":
		return compareNumber(actual, expected, func(a, b float64) bool { return a > b })
	case "gte", ">=":
		return compareNumber(actual, expected, func(a, b float64) bool { return a >= b })
	case "lt":
		return compareNumber(actual, expected, func(a, b float64) bool { return a < b })
	case "lte", "<=":
		return compareNumber(actual, expected, func(a, b float64) bool { return a <= b })
	case "in":
		candidates, ok := expected.([]any)
		if !ok {
			return false
		}
		for _, candidate := range candidates {
			if valuesEqual(actual, candidate) {
				return true
			}
		}
		return false
	case "contains":
		return containsValue(actual, expected)
	default:
		return false
	}
}

func getPayloadValue(payload any, path string) (any, bool) {
	parts := strings.Split(strings.TrimSpace(path), ".")
	if len(parts) == 0 || strings.TrimSpace(path) == "" {
		return payload, true
	}

	current := payload
	for _, part := range parts {
		switch typed := current.(type) {
		case map[string]any:
			val, ok := typed[part]
			if !ok {
				return nil, false
			}
			current = val
		case []any:
			index, err := strconv.Atoi(part)
			if err != nil || index < 0 || index >= len(typed) {
				return nil, false
			}
			current = typed[index]
		default:
			return nil, false
		}
	}
	return current, true
}

func valuesEqual(a, b any) bool {
	if af, ok := toFloat(a); ok {
		if bf, ok := toFloat(b); ok {
			return af == bf
		}
	}

	if as, ok := a.(string); ok {
		if bs, ok := b.(string); ok {
			return as == bs
		}
	}

	return reflect.DeepEqual(a, b)
}

func compareNumber(a, b any, cmp func(a, b float64) bool) bool {
	af, okA := toFloat(a)
	bf, okB := toFloat(b)
	if !okA || !okB {
		return false
	}
	return cmp(af, bf)
}

func toFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case float32:
		return float64(n), true
	case int:
		return float64(n), true
	case int32:
		return float64(n), true
	case int64:
		return float64(n), true
	case uint:
		return float64(n), true
	case uint32:
		return float64(n), true
	case uint64:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}

func containsValue(container, needle any) bool {
	switch typed := container.(type) {
	case string:
		n, ok := needle.(string)
		return ok && strings.Contains(typed, n)
	case []any:
		for _, v := range typed {
			if valuesEqual(v, needle) {
				return true
			}
		}
		return false
	case map[string]any:
		key, ok := needle.(string)
		if !ok {
			return false
		}
		_, exists := typed[key]
		return exists
	default:
		return false
	}
}
