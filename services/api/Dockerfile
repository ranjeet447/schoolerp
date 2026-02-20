# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum from the root for workspace support if needed, 
# but here we build the specific service.
COPY services/api/go.mod services/api/go.sum ./
RUN go mod download

COPY services/api/ .
# Also need the internal db generated code if not included
# COPY services/shared/ ... (if any)

RUN go run ./cmd/openapi-bundle
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /app/api .

EXPOSE 8080
CMD ["./api"]
