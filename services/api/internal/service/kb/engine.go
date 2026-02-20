package kb

import (
	"context"
	"fmt"
	"html"
	"math"
	"regexp"
	"sort"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
)

type KBAnswerEngine interface {
	Answer(ctx context.Context, query string, tenantID string, userContext UserContext, filters SearchFilters) (string, []SearchResult, SearchMeta, float64, error)
}

type SearchOnlyAnswerEngine struct {
	q    db.Querier
	pool *pgxpool.Pool

	trgmOnce      sync.Once
	trgmAvailable bool
}

func NewSearchOnlyAnswerEngine(q db.Querier, pool *pgxpool.Pool) *SearchOnlyAnswerEngine {
	return &SearchOnlyAnswerEngine{q: q, pool: pool}
}

func (e *SearchOnlyAnswerEngine) Answer(ctx context.Context, query string, tenantID string, userContext UserContext, filters SearchFilters) (string, []SearchResult, SearchMeta, float64, error) {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return "", nil, SearchMeta{}, 0, err
	}

	q := strings.TrimSpace(query)
	if q == "" {
		return "", nil, SearchMeta{}, 0, fmt.Errorf("query is required")
	}

	topK := filters.TopK
	if topK <= 0 {
		topK = 10
	}
	if topK > 25 {
		topK = 25
	}

	status := strings.TrimSpace(strings.ToLower(filters.Status))
	if status == "" {
		status = "published"
	}

	category := strings.TrimSpace(filters.Category)
	visibilityFilter := strings.TrimSpace(strings.ToLower(filters.Visibility))
	searchTags := normalizeTags(filters.Tags)
	allowedVisibilities := normalizeAllowedVisibilities(filters.AllowedVisibilities)

	useTrgm := e.isTrgmAvailable(ctx)
	results := make([]SearchResult, 0)
	topRawChunk := ""
	topScore := 0.0

	if useTrgm {
		rows, err := e.q.SearchKBChunksWithTrgm(ctx, db.SearchKBChunksWithTrgmParams{
			TenantID: tenantUUID,
			Column2:  q,
			Column3:  category,
			Column4:  searchTags,
			Column5:  visibilityFilter,
			Status:   status,
			Column7:  allowedVisibilities,
			Limit:    topK,
		})
		if err == nil {
			results, topRawChunk, topScore = mapTrgmRows(rows, q)
		} else {
			// Fallback to FTS-only when trigram is unavailable at runtime.
			useTrgm = false
		}
	}

	if !useTrgm {
		rows, err := e.q.SearchKBChunksFTSOnly(ctx, db.SearchKBChunksFTSOnlyParams{
			TenantID: tenantUUID,
			Column2:  q,
			Column3:  category,
			Column4:  searchTags,
			Column5:  visibilityFilter,
			Status:   status,
			Column7:  allowedVisibilities,
			Limit:    topK,
		})
		if err != nil {
			return "", nil, SearchMeta{}, 0, err
		}
		results, topRawChunk, topScore = mapFTSRows(rows, q)
	}

	confidence := clamp01(topScore)
	summary := ""
	if len(results) == 0 || confidence < 0.15 {
		summary = "Not found in KB"
	} else {
		summary = "Summary from Knowledgebase (auto-extracted): " + extractBestSummary(topRawChunk, q)
	}

	meta := SearchMeta{
		UsedTrgm: useTrgm,
		Total:    len(results),
	}

	return summary, results, meta, confidence, nil
}

func (e *SearchOnlyAnswerEngine) isTrgmAvailable(ctx context.Context) bool {
	e.trgmOnce.Do(func() {
		if e.pool == nil {
			e.trgmAvailable = false
			return
		}
		var exists bool
		err := e.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')`).Scan(&exists)
		if err != nil {
			e.trgmAvailable = false
			return
		}
		e.trgmAvailable = exists
	})
	return e.trgmAvailable
}

func mapTrgmRows(rows []db.SearchKBChunksWithTrgmRow, query string) ([]SearchResult, string, float64) {
	results := make([]SearchResult, 0, len(rows))
	bestRaw := ""
	topScore := 0.0
	for i, row := range rows {
		snippet := strings.TrimSpace(row.SnippetHtml)
		if snippet == "" {
			snippet = fallbackSnippet(row.RawChunkContent, query)
		}
		score := row.Score
		if i == 0 {
			bestRaw = row.RawChunkContent
			topScore = score
		}
		results = append(results, SearchResult{
			DocumentID:  row.DocumentID.String(),
			Title:       row.Title,
			Category:    row.Category.String,
			Tags:        row.Tags,
			Visibility:  row.Visibility,
			Status:      row.Status,
			ChunkID:     row.ChunkID.String(),
			ChunkIndex:  row.ChunkIndex,
			SnippetHTML: snippet,
			Score:       score,
			UpdatedAt:   row.UpdatedAt.Time.UTC().Format(timeLayoutRFC3339()),
		})
	}
	return results, bestRaw, topScore
}

func mapFTSRows(rows []db.SearchKBChunksFTSOnlyRow, query string) ([]SearchResult, string, float64) {
	results := make([]SearchResult, 0, len(rows))
	bestRaw := ""
	topScore := 0.0
	for i, row := range rows {
		snippet := strings.TrimSpace(row.SnippetHtml)
		if snippet == "" {
			snippet = fallbackSnippet(row.RawChunkContent, query)
		}
		score := row.Score
		if i == 0 {
			bestRaw = row.RawChunkContent
			topScore = score
		}
		results = append(results, SearchResult{
			DocumentID:  row.DocumentID.String(),
			Title:       row.Title,
			Category:    row.Category.String,
			Tags:        row.Tags,
			Visibility:  row.Visibility,
			Status:      row.Status,
			ChunkID:     row.ChunkID.String(),
			ChunkIndex:  row.ChunkIndex,
			SnippetHTML: snippet,
			Score:       score,
			UpdatedAt:   row.UpdatedAt.Time.UTC().Format(timeLayoutRFC3339()),
		})
	}
	return results, bestRaw, topScore
}

func fallbackSnippet(content string, query string) string {
	text := strings.TrimSpace(content)
	if text == "" {
		return ""
	}
	if len(text) > 420 {
		text = text[:420]
	}
	escaped := html.EscapeString(text)
	keywords := tokenizeQuery(query)
	for _, kw := range keywords {
		pattern := regexp.MustCompile(`(?i)` + regexp.QuoteMeta(kw))
		escaped = pattern.ReplaceAllStringFunc(escaped, func(m string) string {
			return "<mark>" + m + "</mark>"
		})
	}
	return escaped
}

func extractBestSummary(content string, query string) string {
	text := strings.TrimSpace(content)
	if text == "" {
		return "No summary available."
	}

	sentences := splitSentences(text)
	if len(sentences) == 0 {
		if len(text) > 220 {
			return strings.TrimSpace(text[:220]) + "..."
		}
		return text
	}

	keywords := tokenizeQuery(query)
	type candidate struct {
		idx   int
		text  string
		score int
	}
	candidates := make([]candidate, 0, len(sentences))
	for idx, sentence := range sentences {
		clean := strings.TrimSpace(sentence)
		if clean == "" {
			continue
		}
		score := keywordScore(clean, keywords)
		candidates = append(candidates, candidate{idx: idx, text: clean, score: score})
	}
	if len(candidates) == 0 {
		return "No summary available."
	}

	sort.SliceStable(candidates, func(i, j int) bool {
		if candidates[i].score == candidates[j].score {
			return candidates[i].idx < candidates[j].idx
		}
		return candidates[i].score > candidates[j].score
	})

	chosen := candidates[:1]
	if len(candidates) > 1 {
		chosen = append(chosen, candidates[1])
		sort.Slice(chosen, func(i, j int) bool { return chosen[i].idx < chosen[j].idx })
	}

	parts := make([]string, 0, len(chosen))
	for _, c := range chosen {
		parts = append(parts, c.text)
	}
	return strings.Join(parts, " ")
}

func splitSentences(text string) []string {
	re := regexp.MustCompile(`(?m)([^.!?]+[.!?])`)
	matches := re.FindAllString(text, -1)
	if len(matches) == 0 {
		return []string{text}
	}
	return matches
}

func keywordScore(sentence string, keywords []string) int {
	lowerSentence := strings.ToLower(sentence)
	score := 0
	for _, kw := range keywords {
		if strings.Contains(lowerSentence, kw) {
			score++
		}
	}
	return score
}

func tokenizeQuery(q string) []string {
	fields := strings.Fields(strings.ToLower(q))
	set := make(map[string]struct{})
	out := make([]string, 0, len(fields))
	for _, f := range fields {
		term := strings.TrimSpace(regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(f, ""))
		if len(term) < 2 {
			continue
		}
		if _, ok := set[term]; ok {
			continue
		}
		set[term] = struct{}{}
		out = append(out, term)
	}
	return out
}

func normalizeAllowedVisibilities(vis []string) []string {
	if len(vis) == 0 {
		return nil
	}
	out := make([]string, 0, len(vis))
	seen := map[string]struct{}{}
	for _, raw := range vis {
		v := strings.ToLower(strings.TrimSpace(raw))
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func normalizeTags(tags []string) []string {
	if len(tags) == 0 {
		return nil
	}
	out := make([]string, 0, len(tags))
	seen := map[string]struct{}{}
	for _, raw := range tags {
		tag := strings.TrimSpace(raw)
		if tag == "" {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		out = append(out, tag)
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func clamp01(v float64) float64 {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

func parseUUID(id string) (pgtype.UUID, error) {
	var out pgtype.UUID
	if err := out.Scan(strings.TrimSpace(id)); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid uuid: %w", err)
	}
	return out, nil
}

func timeLayoutRFC3339() string {
	return "2006-01-02T15:04:05Z07:00"
}
