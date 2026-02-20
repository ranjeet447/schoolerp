package kb

import "time"

type DocumentUpsertRequest struct {
	Title       string   `json:"title"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Visibility  string   `json:"visibility"`
	Status      string   `json:"status"`
	ContentText string   `json:"content_text"`
}

type DocumentPatchRequest struct {
	Title       *string   `json:"title"`
	Category    *string   `json:"category"`
	Tags        *[]string `json:"tags"`
	Visibility  *string   `json:"visibility"`
	Status      *string   `json:"status"`
	ContentText *string   `json:"content_text"`
}

type DocumentListFilters struct {
	Status     string
	Visibility string
	Category   string
	Search     string
	Limit      int32
	Offset     int32
}

type DocumentDTO struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Category    string    `json:"category,omitempty"`
	Tags        []string  `json:"tags"`
	Visibility  string    `json:"visibility"`
	Status      string    `json:"status"`
	ContentText string    `json:"content_text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ChunkDTO struct {
	ID         string `json:"id"`
	ChunkIndex int32  `json:"chunk_index"`
	Content    string `json:"content"`
}

type DocumentWithChunks struct {
	Document DocumentDTO `json:"document"`
	Chunks   []ChunkDTO  `json:"chunks"`
}

type SettingsDTO struct {
	Enabled       bool     `json:"enabled"`
	AllowedRoles  []string `json:"allowed_roles"`
	AllowParents  bool     `json:"allow_parents"`
	AllowStudents bool     `json:"allow_students"`
}

type SettingsPatchRequest struct {
	Enabled       *bool    `json:"enabled"`
	AllowedRoles  []string `json:"allowed_roles"`
	AllowParents  *bool    `json:"allow_parents"`
	AllowStudents *bool    `json:"allow_students"`
}

type UserContext struct {
	UserID string
	Role   string
}

type SearchFilters struct {
	Category            string   `json:"category"`
	Tags                []string `json:"tags"`
	Visibility          string   `json:"visibility"`
	Status              string   `json:"status"`
	TopK                int32    `json:"-"`
	AllowedVisibilities []string `json:"-"`
}

type SearchRequest struct {
	Q       string        `json:"q"`
	TopK    int32         `json:"top_k"`
	Filters SearchFilters `json:"filters"`
}

type SearchResult struct {
	DocumentID  string   `json:"document_id"`
	Title       string   `json:"title"`
	Category    string   `json:"category,omitempty"`
	Tags        []string `json:"tags"`
	Visibility  string   `json:"visibility"`
	Status      string   `json:"status"`
	ChunkID     string   `json:"chunk_id"`
	ChunkIndex  int32    `json:"chunk_index"`
	SnippetHTML string   `json:"snippet_html"`
	Score       float64  `json:"score"`
	UpdatedAt   string   `json:"updated_at"`
}

type SearchMeta struct {
	UsedTrgm  bool  `json:"used_trgm"`
	Total     int   `json:"total"`
	LatencyMs int64 `json:"latency_ms"`
}

type SearchResponse struct {
	AnswerMode string         `json:"answer_mode"`
	ModelUsed  string         `json:"model_used"`
	Confidence float64        `json:"confidence"`
	Summary    string         `json:"summary"`
	Results    []SearchResult `json:"results"`
	Meta       SearchMeta     `json:"meta"`
}

type FacetsResponse struct {
	Categories []string `json:"categories"`
	Tags       []string `json:"tags"`
}
