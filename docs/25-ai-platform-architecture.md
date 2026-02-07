# AI Platform Architecture & Safety Guidelines

## 1. Overview
The AI Suite is a "Guardrailed Intelligence" layer sitting on top of the SchoolERP core. It provides deterministic, grounded assistance to teachers, admins, and parents.

**Core Philosophy:** "Teacher-in-the-loop". No AI action is final without human oversight (except low-risk read-only retrieval).

## 2. Architecture: RAG & Deterministic Tooling

### 2.1 The "Grounded" Pattern
We do NOT use unchecked LLM generation. All AI features follow the RAG (Retrieval-Augmented Generation) or "Tool Use" pattern:
1.  **Context Retrieval**: Fetch student/fee/attendance records from `services/api`.
2.  **Anonymization**: Mask PII (Names -> `Student_A`, Phones -> `***`) before sending to LLM.
3.  **Inference**: LLM generates draft response or classification.
4.  **De-anonymization**: Re-attach PII for the authorized user UI.
5.  **Citations**: Response MUST cite the source Record ID (e.g., "Based on Circular #123").

### 2.2 Tech Stack
-   **Orchestrator**: `services/worker` (Go) handles the prompt assembly and LLM calls.
-   **Model Provider**: Tenant-configurable (OpenAI / Azure OpenAI / Local Ollama for Enterprise).
-   **Vector Store**: `pgvector` (PostgreSQL extension) for policy/circular search.
-   **Cache**: Redis for semantic caching of frequent queries (e.g., "When is the exam?").

## 3. Safety & Compliance

### 3.1 PII Protection
-   **Strict Rule**: No raw student PII (Name, DOB, Phone) is ever sent to the Model Provider.
-   **Mechanism**:
    -   *Input*: `Hello, is Rohan present?` -> *LLM receives*: `Hello, is [Student_ID_123] present?`
    -   *Logic*: System checks db for `Student_ID_123` attendance status.
    -   *Output*: System constructs final message: `Yes, Rohan is present.`

### 3.2 Hallucination Guardrails
-   **Temperature**: `0.0` or `0.1` for all factual queries.
-   **Fallback**: If context is missing, the model is instructed to say "I cannot find that information in the official records."
-   **Audit**: All prompt/response pairs are logged in `ai_audit_logs` (retained for 30 days).

## 4. Operational Controls

### 4.1 Admin Toggles
Every tenant has granular control in `School Settings > AI Features`:
-   [x] Enable Parent Helpdesk
-   [ ] Enable Teacher Assistant (Generative)
-   **Kill Switch**: "Disable ALL AI" button for immediate failsafe.

### 4.2 Rate Limiting
-   **Per Tenant**: Monthly token quota based on Plan.
-   **Per User**: Anti-abuse limits (e.g., max 50 queries/hour).

## 5. Integration Points
-   **API**: `POST /api/v1/ai/query` (Internal Only - Authenticated).
-   **Webhooks**: `services/worker` consumes `chat.message` events for async replies.
