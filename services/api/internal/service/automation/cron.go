package automation

import (
	"strconv"
	"strings"
	"time"
)

var cronMonthNames = map[string]int{
	"jan": 1,
	"feb": 2,
	"mar": 3,
	"apr": 4,
	"may": 5,
	"jun": 6,
	"jul": 7,
	"aug": 8,
	"sep": 9,
	"oct": 10,
	"nov": 11,
	"dec": 12,
}

var cronWeekdayNames = map[string]int{
	"sun": 0,
	"mon": 1,
	"tue": 2,
	"wed": 3,
	"thu": 4,
	"fri": 5,
	"sat": 6,
}

func isValidCronExpression(expr string) bool {
	return parseCronExpression(expr) != nil
}

func shouldRunNow(expr string, now time.Time) bool {
	parsed := parseCronExpression(expr)
	if parsed == nil {
		return false
	}
	return parsed.matches(now)
}

type cronExpression struct {
	minute cronFieldMatcher
	hour   cronFieldMatcher
	dom    cronFieldMatcher
	month  cronFieldMatcher
	dow    cronFieldMatcher
}

func parseCronExpression(expr string) *cronExpression {
	parts := strings.Fields(strings.TrimSpace(expr))
	if len(parts) != 5 {
		return nil
	}

	minute, ok := parseCronField(parts[0], 0, 59, nil)
	if !ok {
		return nil
	}
	hour, ok := parseCronField(parts[1], 0, 23, nil)
	if !ok {
		return nil
	}
	dom, ok := parseCronField(parts[2], 1, 31, nil)
	if !ok {
		return nil
	}
	month, ok := parseCronField(parts[3], 1, 12, cronMonthNames)
	if !ok {
		return nil
	}
	dow, ok := parseCronField(parts[4], 0, 7, cronWeekdayNames)
	if !ok {
		return nil
	}

	return &cronExpression{
		minute: minute,
		hour:   hour,
		dom:    dom,
		month:  month,
		dow:    dow,
	}
}

func (c *cronExpression) matches(now time.Time) bool {
	minute := now.Minute()
	hour := now.Hour()
	dom := now.Day()
	month := int(now.Month())
	dow := int(now.Weekday())

	if !c.minute.matches(minute) || !c.hour.matches(hour) || !c.month.matches(month) {
		return false
	}

	domMatch := c.dom.matches(dom)
	dowMatch := c.dow.matches(dow)
	domAny := c.dom.isWildcard
	dowAny := c.dow.isWildcard

	if domAny && dowAny {
		return true
	}
	if domAny {
		return dowMatch
	}
	if dowAny {
		return domMatch
	}
	return domMatch || dowMatch
}

type cronFieldMatcher struct {
	isWildcard bool
	ranges     []cronRange
}

type cronRange struct {
	start int
	end   int
	step  int
}

func (m cronFieldMatcher) matches(v int) bool {
	if m.isWildcard {
		return true
	}
	for _, r := range m.ranges {
		if v < r.start || v > r.end {
			continue
		}
		if (v-r.start)%r.step == 0 {
			return true
		}
	}
	return false
}

func parseCronField(field string, minVal, maxVal int, names map[string]int) (cronFieldMatcher, bool) {
	field = strings.ToLower(strings.TrimSpace(field))
	if field == "" {
		return cronFieldMatcher{}, false
	}
	if field == "*" {
		return cronFieldMatcher{isWildcard: true}, true
	}

	segments := strings.Split(field, ",")
	m := cronFieldMatcher{ranges: make([]cronRange, 0, len(segments))}
	for _, seg := range segments {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			return cronFieldMatcher{}, false
		}
		r, ok := parseCronSegment(seg, minVal, maxVal, names)
		if !ok {
			return cronFieldMatcher{}, false
		}
		m.ranges = append(m.ranges, r)
	}
	return m, true
}

func parseCronSegment(segment string, minVal, maxVal int, names map[string]int) (cronRange, bool) {
	base := segment
	step := 1
	if strings.Contains(segment, "/") {
		parts := strings.SplitN(segment, "/", 2)
		base = strings.TrimSpace(parts[0])
		stepVal, err := strconv.Atoi(strings.TrimSpace(parts[1]))
		if err != nil || stepVal <= 0 {
			return cronRange{}, false
		}
		step = stepVal
	}

	if base == "*" {
		return cronRange{start: minVal, end: maxVal, step: step}, true
	}

	if strings.Contains(base, "-") {
		parts := strings.SplitN(base, "-", 2)
		start, ok := parseCronValue(parts[0], names)
		if !ok {
			return cronRange{}, false
		}
		end, ok := parseCronValue(parts[1], names)
		if !ok {
			return cronRange{}, false
		}
		start = normalizeCronBounds(start, minVal, maxVal)
		end = normalizeCronBounds(end, minVal, maxVal)
		if start < minVal || end > maxVal || start > end {
			return cronRange{}, false
		}
		return cronRange{start: start, end: end, step: step}, true
	}

	start, ok := parseCronValue(base, names)
	if !ok {
		return cronRange{}, false
	}
	start = normalizeCronBounds(start, minVal, maxVal)
	if start < minVal || start > maxVal {
		return cronRange{}, false
	}

	if strings.Contains(segment, "/") {
		return cronRange{start: start, end: maxVal, step: step}, true
	}
	return cronRange{start: start, end: start, step: 1}, true
}

func parseCronValue(raw string, names map[string]int) (int, bool) {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		return 0, false
	}
	if names != nil {
		if n, ok := names[raw]; ok {
			return n, true
		}
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, false
	}
	return n, true
}

func normalizeCronBounds(v, minVal, maxVal int) int {
	// In day-of-week field, 7 is equivalent to 0 (Sunday).
	if minVal == 0 && maxVal == 7 && v == 7 {
		return 0
	}
	return v
}
