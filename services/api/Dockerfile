# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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

RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /app/api .

EXPOSE 8080
CMD ["./api"]
