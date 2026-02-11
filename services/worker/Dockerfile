# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY services/worker/go.mod services/worker/go.sum ./
RUN go mod download

COPY services/worker/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o worker ./cmd/worker/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /app/worker .

# Health check port if implemented
EXPOSE 8081 

CMD ["./worker"]
