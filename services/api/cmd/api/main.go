package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/filestore"
	"github.com/schoolerp/api/internal/foundation/i18n"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
	"github.com/schoolerp/api/internal/foundation/quota"
	aihandler "github.com/schoolerp/api/internal/handler"
	academic "github.com/schoolerp/api/internal/handler/academics"
	"github.com/schoolerp/api/internal/handler/admission"
	"github.com/schoolerp/api/internal/handler/alumni"
	"github.com/schoolerp/api/internal/handler/attendance"
	authhandler "github.com/schoolerp/api/internal/handler/auth"
	"github.com/schoolerp/api/internal/handler/communication"
	"github.com/schoolerp/api/internal/handler/exams"
	"github.com/schoolerp/api/internal/handler/files"
	"github.com/schoolerp/api/internal/handler/finance"
	"github.com/schoolerp/api/internal/handler/hrms"
	"github.com/schoolerp/api/internal/handler/inventory"
	"github.com/schoolerp/api/internal/handler/library"
	"github.com/schoolerp/api/internal/handler/notices"
	"github.com/schoolerp/api/internal/handler/notification"
	"github.com/schoolerp/api/internal/handler/portfolio"
	roleshandler "github.com/schoolerp/api/internal/handler/roles"
	"github.com/schoolerp/api/internal/handler/safety"
	"github.com/schoolerp/api/internal/handler/sis"
	"github.com/schoolerp/api/internal/handler/tenant"
	"github.com/schoolerp/api/internal/handler/transport"
	"github.com/schoolerp/api/internal/middleware"
	academicservice "github.com/schoolerp/api/internal/service/academics"
	admissionservice "github.com/schoolerp/api/internal/service/admission"
	aiservice "github.com/schoolerp/api/internal/service/ai"
	alumniservice "github.com/schoolerp/api/internal/service/alumni"
	attendservice "github.com/schoolerp/api/internal/service/attendance"
	authservice "github.com/schoolerp/api/internal/service/auth"
	commservice "github.com/schoolerp/api/internal/service/communication"
	examservice "github.com/schoolerp/api/internal/service/exams"
	fileservice "github.com/schoolerp/api/internal/service/files"
	financeservice "github.com/schoolerp/api/internal/service/finance"
	hrmsservice "github.com/schoolerp/api/internal/service/hrms"
	inventoryservice "github.com/schoolerp/api/internal/service/inventory"
	libraryservice "github.com/schoolerp/api/internal/service/library"
	noticeservice "github.com/schoolerp/api/internal/service/notices"
	notificationservice "github.com/schoolerp/api/internal/service/notification"
	portfolioservice "github.com/schoolerp/api/internal/service/portfolio"
	rolesservice "github.com/schoolerp/api/internal/service/roles"
	safetyservice "github.com/schoolerp/api/internal/service/safety"
	sisservice "github.com/schoolerp/api/internal/service/sis"
	tenantservice "github.com/schoolerp/api/internal/service/tenant"
	transportservice "github.com/schoolerp/api/internal/service/transport"
)




func main() {
	// 0. Setup Logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	if os.Getenv("ENV") == "production" {
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}

	// Sentry Initialization
	sentryDSN := os.Getenv("SENTRY_DSN")
	if sentryDSN != "" {
		err := sentry.Init(sentry.ClientOptions{
			Dsn:              sentryDSN,
			Environment:      os.Getenv("ENV"),
			TracesSampleRate: 1.0,
		})
		if err != nil {
			log.Error().Err(err).Msg("Sentry initialization failed")
		} else {
			defer sentry.Flush(2 * time.Second)
			log.Info().Msg("Sentry initialized")
		}
	}

	// 1. Database Connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"
	}
	
	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to parse DB config")
	}
	
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
	}
	defer pool.Close()
	
	// Initialize Querier
	querier := db.New(pool)
	
	// Initialize Foundations
	auditLogger := audit.NewLogger(querier)
	policyEval := policy.NewEvaluator(querier)
	locksSvc := locks.NewService(querier)
	approvalSvc := approvals.NewService(querier)
	quotaSvc := quota.NewService(querier)

	// Initialize i18n
	translator := i18n.GetTranslator()
	if err := translator.LoadFromDir("internal/foundation/i18n"); err != nil {
		log.Warn().Err(err).Msg("Failed to load i18n translations, falling back to keys")
	}

	// Initialize Services
	studentService := sisservice.NewStudentService(querier, auditLogger, quotaSvc)
	attendanceService := attendservice.NewService(querier, auditLogger, policyEval, approvalSvc, locksSvc)
	financeService := financeservice.NewService(querier, auditLogger, policyEval, locksSvc, &financeservice.RazorpayProvider{
		KeyID:     os.Getenv("RAZORPAY_KEY_ID"),
		KeySecret: os.Getenv("RAZORPAY_KEY_SECRET"),
	})
	noticeService := noticeservice.NewService(querier, auditLogger)
	examService := examservice.NewService(querier, auditLogger)
	transportService := transportservice.NewTransportService(querier, auditLogger)
	libraryService := libraryservice.NewLibraryService(querier, auditLogger)
	inventoryService := inventoryservice.NewInventoryService(querier, auditLogger)
	commService := commservice.NewService(querier, auditLogger)
	admissionService := admissionservice.NewAdmissionService(querier, auditLogger, studentService)
	hrmsService := hrmsservice.NewService(querier, auditLogger, approvalSvc)
	safetyService := safetyservice.NewService(querier, auditLogger)
	portfolioService := portfolioservice.NewService(querier)
	alumniService := alumniservice.NewService(querier)
	authService := authservice.NewService(querier)
	rolesService := rolesservice.NewService(querier)
	notificationService := notificationservice.NewService(querier)
	academicService := academicservice.NewService(querier, auditLogger)
	tenantService := tenantservice.NewService(querier, pool)
	
	aiService, err := aiservice.NewService()
	if err != nil {
		log.Warn().Err(err).Msg("AI Service failed to initialize (missing API key?)")
	}
	
	// File Service
	fsDir := os.Getenv("UPLOAD_DIR")
	if fsDir == "" { fsDir = "./uploads" }
	fsURL := os.Getenv("UPLOAD_URL")
	if fsURL == "" { fsURL = "/uploads" }
	
	store, _ := filestore.NewLocalProvider(fsDir, fsURL)
	fileService := fileservice.NewFileService(querier, store)
	
	// Initialize Handlers
	studentHandler := sis.NewHandler(studentService)
	attendanceHandler := attendance.NewHandler(attendanceService)
	financeHandler := finance.NewHandler(financeService)
	noticeHandler := notices.NewHandler(noticeService)
	notificationHandler := notification.NewHandler(notificationService)
	examHandler := exams.NewHandler(examService)
	academicHandler := academic.NewHandler(academicService)
	transportHandler := transport.NewHandler(transportService)
	libraryHandler := library.NewHandler(libraryService)
	inventoryHandler := inventory.NewHandler(inventoryService)
	commHandler := communication.NewHandler(commService)
	admissionHandler := admission.NewHandler(admissionService)
	hrmsHandler := hrms.NewHandler(hrmsService)
	safetyHandler := safety.NewHandler(safetyService)
	portfolioHandler := portfolio.NewHandler(portfolioService)
	alumniHandler := alumni.NewHandler(alumniService)
	authHandler := authhandler.NewHandler(authService)
	rolesHandler := roleshandler.NewHandler(rolesService)
	fileHandler := files.NewHandler(fileService)
	tenantHandler := tenant.NewHandler(tenantService)
	aiHandler := aihandler.NewAIHandler(aiService)



	r := chi.NewRouter()

	// 1. Standard Middlewares
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	
	// Sentry middleware
	if os.Getenv("SENTRY_DSN") != "" {
		sentryHandler := sentryhttp.New(sentryhttp.Options{
			Repanic: true,
		})
		r.Use(sentryHandler.Handle)
	}

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(middleware.CORS)      // Handle cross-origin requests
	r.Use(middleware.RateLimit) // Protect sensitive endpoints
	r.Use(middleware.Metrics)   // Structured logging & metrics


	// 2. Custom Foundation Middlewares
	r.Use(middleware.RequestIDPropagation) // Propagate to response
	r.Use(middleware.TenantResolver)       // Resolve tenant from header/subdomain
	r.Use(middleware.AuthResolver)         // Parse JWT and set user context
	r.Use(middleware.LocaleResolver)       // Detect language from Accept-Language
	r.Use(middleware.IPGuard(authService.IPGuard)) // Enforce IP allowlists

	// 3. Health Endpoint
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Request-ID", middleware.GetReqID(r.Context()))
		w.Write([]byte(`{"status": "ok", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// Metrics endpoint
	r.Handle("/metrics", promhttp.Handler())

	// Static Assets (Uploads)
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" { uploadDir = "./uploads" }
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}
	
	fs := http.FileServer(http.Dir(uploadDir))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fs))


	// 4. API V1 Routes
	r.Route("/v1", func(r chi.Router) {
		// Public Auth Routes
		authHandler.RegisterRoutes(r)
		r.Post("/auth/request-otp", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"msg": "OTP requested"}`))
		})

		fileHandler.RegisterRoutes(r)

		r.Get("/tenants/config", tenantHandler.GetConfig)

		

		// Admin Routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RoleGuard("super_admin", "tenant_admin"))
			studentHandler.RegisterRoutes(r)
			attendanceHandler.RegisterRoutes(r)
			financeHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			notificationHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
			academicHandler.RegisterRoutes(r)
			transportHandler.RegisterRoutes(r)
			libraryHandler.RegisterRoutes(r)
			inventoryHandler.RegisterRoutes(r)
			admissionHandler.RegisterRoutes(r)
			hrmsHandler.RegisterRoutes(r)
			safetyHandler.RegisterRoutes(r)
			commHandler.RegisterRoutes(r)
			portfolioHandler.RegisterRoutes(r)
			alumniHandler.RegisterRoutes(r)
			rolesHandler.RegisterRoutes(r) // Role management endpoints
			
			r.Post("/tenants/config", tenantHandler.UpdateConfig)
			r.Get("/tenants/plugins", tenantHandler.ListPlugins)
			r.Post("/tenants/plugins/{id}", tenantHandler.UpdatePluginConfig)
			r.Post("/tenants/onboard", tenantHandler.OnboardSchool)
			
			// Growth/Other stubs maintained for now
			r.Get("/demo-bookings", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(`[]`)) })
		})


		// Teacher Routes
		r.Route("/teacher", func(r chi.Router) {
			r.Use(middleware.RoleGuard("teacher", "tenant_admin", "super_admin")) // Allow admins to view teacher routes too
			attendanceHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
			academicHandler.RegisterRoutes(r)
		})

		// Parent Routes
		r.Route("/parent", func(r chi.Router) {
			r.Use(middleware.RoleGuard("parent"))
			studentHandler.RegisterParentRoutes(r)
			attendanceHandler.RegisterParentRoutes(r)
			financeHandler.RegisterParentRoutes(r)
			noticeHandler.RegisterParentRoutes(r)
			examHandler.RegisterParentRoutes(r)
			academicHandler.RegisterStudentRoutes(r)
		})

		// AI Routes
		r.Route("/ai", func(r chi.Router) {
			r.Post("/helpdesk", aiHandler.ParentQuery)
			
			r.Group(func(r chi.Router) {
				r.Use(middleware.RoleGuard("teacher", "tenant_admin", "super_admin"))
				r.Post("/lesson-plan", aiHandler.GenerateLessonPlan)
			})
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
		log.Info().Msgf("API Server starting on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed to start")
		}
	}()

	<-stop

	log.Info().Msg("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exiting")
}
