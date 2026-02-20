package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
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
	"github.com/schoolerp/api/internal/foundation/outbox"
	"github.com/schoolerp/api/internal/foundation/policy"
	"github.com/schoolerp/api/internal/foundation/quota"
	aihandler "github.com/schoolerp/api/internal/handler"
	academic "github.com/schoolerp/api/internal/handler/academics"
	"github.com/schoolerp/api/internal/handler/admission"
	"github.com/schoolerp/api/internal/handler/alumni"
	"github.com/schoolerp/api/internal/handler/attendance"
	authhandler "github.com/schoolerp/api/internal/handler/auth"
	"github.com/schoolerp/api/internal/handler/automation"
	"github.com/schoolerp/api/internal/handler/biometric"
	"github.com/schoolerp/api/internal/handler/communication"
	dashhandler "github.com/schoolerp/api/internal/handler/dashboard"
	"github.com/schoolerp/api/internal/handler/exams"
	"github.com/schoolerp/api/internal/handler/files"
	"github.com/schoolerp/api/internal/handler/finance"
	"github.com/schoolerp/api/internal/handler/hrms"
	"github.com/schoolerp/api/internal/handler/inventory"
	"github.com/schoolerp/api/internal/handler/library"
	"github.com/schoolerp/api/internal/handler/marketing"
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
	automationservice "github.com/schoolerp/api/internal/service/automation"
	bioservice "github.com/schoolerp/api/internal/service/biometric"
	commservice "github.com/schoolerp/api/internal/service/communication"
	dashservice "github.com/schoolerp/api/internal/service/dashboard"
	examservice "github.com/schoolerp/api/internal/service/exams"
	fileservice "github.com/schoolerp/api/internal/service/files"
	financeservice "github.com/schoolerp/api/internal/service/finance"
	hrmsservice "github.com/schoolerp/api/internal/service/hrms"
	inventoryservice "github.com/schoolerp/api/internal/service/inventory"
	libraryservice "github.com/schoolerp/api/internal/service/library"
	marketingservice "github.com/schoolerp/api/internal/service/marketing"
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
	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		dbURL = "postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"
	}

	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to parse DB config")
	}
	log.Info().
		Str("db_host", poolConfig.ConnConfig.Host).
		Uint16("db_port", poolConfig.ConnConfig.Port).
		Str("db_name", poolConfig.ConnConfig.Database).
		Str("db_user", poolConfig.ConnConfig.User).
		Msg("Database target configured")

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
	}
	defer pool.Close()

	// Best-effort security event persistence (rate-limit blocks, IP allowlist blocks, auth anomalies, etc.).
	middleware.SetSecurityEventRecorder(middleware.NewDBSecurityEventRecorder(pool))

	// Initialize Querier
	querier := db.New(pool)
	middleware.SetTenantLookup(querier)

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

	// Initialize Outbox Processor
	webhookSvc := automationservice.NewWebhookService()
	autoEngine := automationservice.NewEngine(querier, webhookSvc)
	outboxProc := outbox.NewProcessor(querier, autoEngine)
	go outboxProc.Start(context.Background())

	// Initialize Scheduler
	autoScheduler := automationservice.NewScheduler(querier, autoEngine)
	go autoScheduler.Start(context.Background())

	// Initialize Services
	studentService := sisservice.NewStudentService(querier, auditLogger, quotaSvc)
	student360Service := sisservice.NewStudent360Service(pool, auditLogger)
	dashboardService := dashservice.NewDashboardService(pool, auditLogger)
	biometricService := bioservice.NewBiometricService(pool, auditLogger)
	customFieldService := sisservice.NewCustomFieldService(pool, auditLogger)
	attendanceService := attendservice.NewService(querier, auditLogger, policyEval, approvalSvc, locksSvc)
	staffAttendService := attendservice.NewStaffAttendanceService(pool, auditLogger)
	financeService := financeservice.NewService(querier, pool, auditLogger, policyEval, locksSvc, &financeservice.RazorpayProvider{
		KeyID:     os.Getenv("RAZORPAY_KEY_ID"),
		KeySecret: os.Getenv("RAZORPAY_KEY_SECRET"),
	})
	noticeService := noticeservice.NewService(querier, auditLogger)
	examService := examservice.NewService(querier, auditLogger)
	transportService := transportservice.NewTransportService(querier, pool, auditLogger)
	libraryService := libraryservice.NewLibraryService(querier, pool, auditLogger)
	inventoryService := inventoryservice.NewInventoryService(querier, pool, auditLogger)
	commService := commservice.NewService(querier, auditLogger)
	admissionService := admissionservice.NewAdmissionService(querier, auditLogger, studentService)
	hrmsService := hrmsservice.NewService(querier, pool, auditLogger, approvalSvc, quotaSvc)
	safetyService := safetyservice.NewService(querier, auditLogger)
	portfolioService := portfolioservice.NewService(querier)
	alumniService := alumniservice.NewService(querier)
	authService := authservice.NewService(querier)
	rolesService := rolesservice.NewService(querier)
	notificationService := notificationservice.NewService(querier)
	academicService := academicservice.NewService(querier, auditLogger)
	tenantService := tenantservice.NewService(querier, pool)
	marketingService := marketingservice.NewService(pool)
	automationService := automationservice.NewAutomationService(querier)

	calendarService := academicservice.NewCalendarService(pool, auditLogger)
	resourceService := academicservice.NewResourceService(pool, auditLogger)
	idCardService := sisservice.NewIDCardService(pool, auditLogger)
	hostelService := sisservice.NewHostelService(pool, auditLogger)
	scheduleService := academicservice.NewScheduleService(pool, auditLogger)
	promotionService := sisservice.NewPromotionService(querier, auditLogger)

	aiService, err := aiservice.NewService(querier)
	if err != nil {
		log.Warn().Err(err).Msg("AI Service failed to initialize (missing API key?)")
	}

	// File Service
	fsDir := os.Getenv("UPLOAD_DIR")
	if fsDir == "" {
		fsDir = "./uploads"
	}
	fsURL := os.Getenv("UPLOAD_URL")
	if fsURL == "" {
		fsURL = "/uploads"
	}

	store, _ := filestore.NewLocalProvider(fsDir, fsURL)
	fileService := fileservice.NewFileService(querier, store, quotaSvc)

	// Initialize Handlers
	studentHandler := sis.NewHandler(studentService)
	customFieldHandler := sis.NewCustomFieldHandler(customFieldService)
	attendanceHandler := attendance.NewHandler(attendanceService)
	staffAttendHandler := attendance.NewStaffHandler(staffAttendService)
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
	aiHandler := aihandler.NewAIHandler(aiService, querier)
	marketingHandler := marketing.NewHandler(marketingService)
	automationHandler := automation.NewAutomationHandler(automationService)

	calendarHandler := academic.NewCalendarHandler(calendarService)
	resourceHandler := academic.NewResourceHandler(resourceService)
	idCardHandler := sis.NewIDCardHandler(idCardService)
	student360Handler := sis.NewStudent360Handler(student360Service)
	dashboardHandler := dashhandler.NewHandler(dashboardService)
	biometricHandler := biometric.NewHandler(biometricService)
	hostelHandler := sis.NewHostelHandler(hostelService)
	scheduleHandler := academic.NewScheduleHandler(scheduleService)
	promotionHandler := sis.NewPromotionHandler(promotionService)

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
	r.Use(middleware.RequestIDPropagation)         // Propagate to response
	r.Use(middleware.TenantResolver)               // Resolve tenant from header/subdomain
	r.Use(middleware.AuthResolver)                 // Parse JWT and set user context
	r.Use(middleware.LocaleResolver)               // Detect language from Accept-Language
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
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
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
		marketingHandler.RegisterPublicRoutes(r)
		admissionHandler.RegisterPublicRoutes(r)

		r.Get("/tenants/config", tenantHandler.GetConfig)

		// Admin Routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RoleGuard("super_admin", "tenant_admin"))
			studentHandler.RegisterRoutes(r)
			student360Handler.RegisterRoutes(r)
			dashboardHandler.RegisterRoutes(r)
			biometricHandler.RegisterRoutes(r)
			customFieldHandler.RegisterRoutes(r)
			attendanceHandler.RegisterRoutes(r)
			staffAttendHandler.RegisterRoutes(r)
			financeHandler.RegisterRoutes(r)
			noticeHandler.RegisterRoutes(r)
			notificationHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
			academicHandler.RegisterRoutes(r)
			transportHandler.RegisterRoutes(r)
			libraryHandler.RegisterRoutes(r)
			inventoryHandler.RegisterRoutes(r)
			admissionHandler.RegisterAdminRoutes(r)
			calendarHandler.RegisterRoutes(r)
			resourceHandler.RegisterRoutes(r)
			idCardHandler.RegisterRoutes(r)
			hostelHandler.RegisterRoutes(r)
			scheduleHandler.RegisterRoutes(r)
			promotionHandler.RegisterRoutes(r)
			hrmsHandler.RegisterRoutes(r)
			safetyHandler.RegisterRoutes(r)
			commHandler.RegisterRoutes(r)
			portfolioHandler.RegisterRoutes(r)
			alumniHandler.RegisterRoutes(r)
			rolesHandler.RegisterRoutes(r) // Role management endpoints
			marketingHandler.RegisterAdminRoutes(r)
			automationHandler.RegisterRoutes(r)
			aiHandler.RegisterRoutes(r)

			r.Post("/tenants/config", tenantHandler.UpdateConfig)
			r.Get("/tenants/plugins", tenantHandler.ListPlugins)
			r.Post("/tenants/plugins/{id}", tenantHandler.UpdatePluginConfig)
			r.Post("/tenants/onboard", tenantHandler.OnboardSchool)

			// Platform routes for SaaS admin
			r.Route("/platform", func(r chi.Router) {
				r.Use(middleware.RoleGuard("super_admin"))
				tenantHandler.RegisterPlatformRoutes(r)
			})
		})

		// Teacher Routes
		r.Route("/teacher", func(r chi.Router) {
			r.Use(middleware.RoleGuard("teacher", "tenant_admin", "super_admin")) // Allow admins to view teacher routes too
			attendanceHandler.RegisterRoutes(r)
			staffAttendHandler.RegisterRoutes(r) // Expose period-attendance
			noticeHandler.RegisterRoutes(r)
			examHandler.RegisterRoutes(r)
			academicHandler.RegisterRoutes(r)
			scheduleHandler.RegisterRoutes(r)
			calendarHandler.RegisterRoutes(r)
			resourceHandler.RegisterRoutes(r)
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

		// Accountant Routes
		r.Route("/accountant", func(r chi.Router) {
			r.Use(middleware.RoleGuard("accountant", "tenant_admin", "super_admin"))
			financeHandler.RegisterRoutes(r)
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
