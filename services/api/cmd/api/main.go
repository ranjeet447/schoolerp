// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
	"github.com/schoolerp/api/internal/foundation/quota"
	"github.com/schoolerp/api/internal/handler/attendance"
	"github.com/schoolerp/api/internal/handler/exams"
	"github.com/schoolerp/api/internal/handler/finance"
	"github.com/schoolerp/api/internal/handler/notices"
	"github.com/schoolerp/api/internal/handler/sis"
	"github.com/schoolerp/api/internal/handler/transport"
	"github.com/schoolerp/api/internal/middleware"
	attendservice "github.com/schoolerp/api/internal/service/attendance"
	examservice "github.com/schoolerp/api/internal/service/exams"
	financeservice "github.com/schoolerp/api/internal/service/finance"
	noticeservice "github.com/schoolerp/api/internal/service/notices"
	sisservice "github.com/schoolerp/api/internal/service/sis"
	transportservice "github.com/schoolerp/api/internal/service/transport"
)

func main() {
	// 0. Database Connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"
	}
	
	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse DB config: %v", err)
	}
	
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()
	
	// Initialize Querier
	querier := db.New(pool)
	
	// Initialize Foundations
	auditLogger := audit.NewLogger(querier)
	policyEval := policy.NewEvaluator(querier)
	_ = locks.NewService(querier)
	approvalSvc := approvals.NewService(querier)
	quotaSvc := quota.NewService(querier)

	// Initialize Services
	studentService := sisservice.NewStudentService(querier, auditLogger, quotaSvc)
	attendanceService := attendservice.NewService(querier, auditLogger, policyEval, approvalSvc)
	financeService := financeservice.NewService(querier, auditLogger)
	noticeService := noticeservice.NewService(querier, auditLogger)
	examService := examservice.NewService(querier, auditLogger)
	transportService := transportservice.NewTransportService(querier, auditLogger)
	
	// Initialize Handlers
	studentHandler := sis.NewHandler(studentService)
	attendanceHandler := attendance.NewHandler(attendanceService)
	financeHandler := finance.NewHandler(financeService)
	noticeHandler := notices.NewHandler(noticeService)
	examHandler := exams.NewHandler(examService)
	transportHandler := transport.NewHandler(transportService)

	r := chi.NewRouter()

	// 1. Standard Middlewares
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(middleware.CORS)      // Handle cross-origin requests
	r.Use(middleware.RateLimit) // Protect sensitive endpoints

	// 2. Custom Foundation Middlewares
	r.Use(middleware.RequestIDPropagation) // Propagate to response
	r.Use(middleware.TenantResolver)       // Resolve tenant from header/subdomain
	r.Use(middleware.AuthResolver)         // Parse JWT and set user context
	r.Use(middleware.LocaleResolver)       // Detect language from Accept-Language

	// 3. Health Endpoint
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Request-ID", middleware.GetReqID(r.Context()))
		w.Write([]byte(`{"status": "ok", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// 4. API V1 Routes
	r.Route("/v1", func(r chi.Router) {
		// Public Auth (Keep stubs)
		r.Post("/auth/request-otp", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"msg": "OTP requested"}`))
		})
		
		// Admin Routes
		r.Route("/admin", func(r chi.Router) {
			studentHandler.RegisterRoutes(r)
			attendanceHandler.RegisterRoutes(r)
			financeHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
			transportHandler.RegisterRoutes(r)
			
			// Growth/Other stubs maintained for now
			r.Get("/demo-bookings", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(`[]`)) })
		})

		// Teacher Routes
		r.Route("/teacher", func(r chi.Router) {
			attendanceHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
		})

		// Parent Routes
		r.Route("/parent", func(r chi.Router) {
			studentHandler.RegisterParentRoutes(r)
			attendanceHandler.RegisterParentRoutes(r)
			financeHandler.RegisterParentRoutes(r)
			noticeHandler.RegisterParentRoutes(r)
			examHandler.RegisterParentRoutes(r)
		})
	})

	// 5. Server Setup
	server := &http.Server{
		Addr:         ":8080",
		Handler:      r,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("API Server starting on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	<-stop

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
