package sessionstore

import (
	"bufio"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	sessionKeyPrefix   = "session"
	sessionIndexPrefix = "session_index"
	indexRetentionTTL  = 90 * 24 * time.Hour
	defaultDialTimeout = 2 * time.Second
	defaultIOTimeout   = 3 * time.Second
)

var ErrUnavailable = errors.New("session cache unavailable")

type SessionRef struct {
	UserID    string
	TokenHash string
}

type Store struct {
	address     string
	username    string
	password    string
	database    int
	useTLS      bool
	tlsServer   string
	dialTimeout time.Duration
	ioTimeout   time.Duration
}

type ConnectionInfo struct {
	Address       string
	Host          string
	Port          string
	Database      int
	TLS           bool
	HasUsername   bool
	HasPassword   bool
	DialTimeoutMS int64
	IOTimeoutMS   int64
}

func NewFromURL(redisURL string) (*Store, error) {
	redisURL = strings.TrimSpace(redisURL)
	if redisURL == "" {
		return nil, nil
	}

	parsed, err := url.Parse(redisURL)
	if err != nil {
		return nil, err
	}
	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	if scheme != "redis" && scheme != "rediss" {
		return nil, fmt.Errorf("unsupported redis url scheme: %s", parsed.Scheme)
	}

	host := strings.TrimSpace(parsed.Host)
	if host == "" {
		return nil, errors.New("redis host is required")
	}
	if !strings.Contains(host, ":") {
		host = host + ":6379"
	}

	db := 0
	path := strings.TrimSpace(strings.TrimPrefix(parsed.Path, "/"))
	if path != "" {
		if parsedDB, parseErr := strconv.Atoi(path); parseErr == nil && parsedDB >= 0 {
			db = parsedDB
		} else {
			return nil, fmt.Errorf("invalid redis database index: %s", path)
		}
	}

	var user, pass string
	if parsed.User != nil {
		user = strings.TrimSpace(parsed.User.Username())
		pass, _ = parsed.User.Password()
		pass = strings.TrimSpace(pass)
	}

	serverName := strings.TrimSpace(parsed.Hostname())

	return &Store{
		address:     host,
		username:    user,
		password:    pass,
		database:    db,
		useTLS:      scheme == "rediss",
		tlsServer:   serverName,
		dialTimeout: defaultDialTimeout,
		ioTimeout:   defaultIOTimeout,
	}, nil
}

func (s *Store) Close() error {
	return nil
}

func (s *Store) ConnectionInfo() ConnectionInfo {
	if s == nil {
		return ConnectionInfo{}
	}

	host := s.address
	port := ""
	if parsedHost, parsedPort, err := net.SplitHostPort(s.address); err == nil {
		host = parsedHost
		port = parsedPort
	}

	return ConnectionInfo{
		Address:       s.address,
		Host:          host,
		Port:          port,
		Database:      s.database,
		TLS:           s.useTLS,
		HasUsername:   strings.TrimSpace(s.username) != "",
		HasPassword:   strings.TrimSpace(s.password) != "",
		DialTimeoutMS: s.dialTimeout.Milliseconds(),
		IOTimeoutMS:   s.ioTimeout.Milliseconds(),
	}
}

func (s *Store) Enabled() bool {
	return s != nil && strings.TrimSpace(s.address) != ""
}

func (s *Store) Ping(ctx context.Context) error {
	if !s.Enabled() {
		return ErrUnavailable
	}
	_, err := s.do(ctx, "PING")
	return err
}

func (s *Store) SetSession(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error {
	if !s.Enabled() {
		return ErrUnavailable
	}
	userID = strings.TrimSpace(userID)
	tokenHash = strings.TrimSpace(tokenHash)
	if userID == "" || tokenHash == "" {
		return errors.New("session key parts are required")
	}

	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		ttl = time.Second
	}
	ttlSeconds := int64(ttl / time.Second)
	if ttl%time.Second != 0 {
		ttlSeconds++
	}
	if ttlSeconds <= 0 {
		ttlSeconds = 1
	}

	indexKey := userIndexKey(userID)
	key := sessionKey(userID, tokenHash)

	if _, err := s.do(ctx, "SET", key, "1", "EX", strconv.FormatInt(ttlSeconds, 10)); err != nil {
		return err
	}
	if _, err := s.do(ctx, "SADD", indexKey, tokenHash); err != nil {
		return err
	}
	_, err := s.do(ctx, "EXPIRE", indexKey, strconv.FormatInt(int64(indexRetentionTTL/time.Second), 10))
	return err
}

func (s *Store) SessionExists(ctx context.Context, userID string, tokenHash string) (bool, error) {
	if !s.Enabled() {
		return false, ErrUnavailable
	}
	userID = strings.TrimSpace(userID)
	tokenHash = strings.TrimSpace(tokenHash)
	if userID == "" || tokenHash == "" {
		return false, nil
	}

	value, err := s.do(ctx, "GET", sessionKey(userID, tokenHash))
	if err != nil {
		if errors.Is(err, errRedisNil) {
			return false, nil
		}
		return false, err
	}
	if value.kind == respBulk && !value.isNil {
		return true, nil
	}
	return false, nil
}

func (s *Store) DeleteSession(ctx context.Context, userID string, tokenHash string) error {
	if !s.Enabled() {
		return ErrUnavailable
	}
	userID = strings.TrimSpace(userID)
	tokenHash = strings.TrimSpace(tokenHash)
	if userID == "" || tokenHash == "" {
		return nil
	}

	_, err := s.do(ctx, "DEL", sessionKey(userID, tokenHash))
	if err != nil {
		return err
	}
	_, err = s.do(ctx, "SREM", userIndexKey(userID), tokenHash)
	return err
}

func (s *Store) DeleteSessionRefs(ctx context.Context, refs []SessionRef) error {
	if !s.Enabled() {
		return ErrUnavailable
	}
	if len(refs) == 0 {
		return nil
	}

	sessionKeys := make([]string, 0, len(refs))
	indexMembers := map[string][]string{}
	seen := map[string]struct{}{}
	for _, ref := range refs {
		userID := strings.TrimSpace(ref.UserID)
		tokenHash := strings.TrimSpace(ref.TokenHash)
		if userID == "" || tokenHash == "" {
			continue
		}
		key := sessionKey(userID, tokenHash)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		sessionKeys = append(sessionKeys, key)
		indexKey := userIndexKey(userID)
		indexMembers[indexKey] = append(indexMembers[indexKey], tokenHash)
	}

	if len(sessionKeys) > 0 {
		args := make([]string, 0, 1+len(sessionKeys))
		args = append(args, "DEL")
		args = append(args, sessionKeys...)
		if _, err := s.do(ctx, args...); err != nil {
			return err
		}
	}

	for indexKey, members := range indexMembers {
		args := make([]string, 0, 2+len(members))
		args = append(args, "SREM", indexKey)
		args = append(args, members...)
		if _, err := s.do(ctx, args...); err != nil {
			return err
		}
	}

	return nil
}

func (s *Store) DeleteUserSessions(ctx context.Context, userID string) error {
	if !s.Enabled() {
		return ErrUnavailable
	}
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return nil
	}

	indexKey := userIndexKey(userID)
	value, err := s.do(ctx, "SMEMBERS", indexKey)
	if err != nil && !errors.Is(err, errRedisNil) {
		return err
	}

	sessionKeys := make([]string, 0)
	if value.kind == respArray {
		for _, item := range value.array {
			member := strings.TrimSpace(item.text)
			if member == "" {
				continue
			}
			sessionKeys = append(sessionKeys, sessionKey(userID, member))
		}
	}

	if len(sessionKeys) > 0 {
		args := make([]string, 0, 1+len(sessionKeys))
		args = append(args, "DEL")
		args = append(args, sessionKeys...)
		if _, err := s.do(ctx, args...); err != nil {
			return err
		}
	}

	_, err = s.do(ctx, "DEL", indexKey)
	return err
}

func sessionKey(userID string, tokenHash string) string {
	return fmt.Sprintf("%s:%s:%s", sessionKeyPrefix, userID, tokenHash)
}

func userIndexKey(userID string) string {
	return fmt.Sprintf("%s:%s", sessionIndexPrefix, userID)
}

var errRedisNil = errors.New("redis nil")

const (
	respSimple = '+'
	respError  = '-'
	respInt    = ':'
	respBulk   = '$'
	respArray  = '*'
)

type respValue struct {
	kind  byte
	text  string
	num   int64
	array []respValue
	isNil bool
}

func (s *Store) do(ctx context.Context, args ...string) (respValue, error) {
	if !s.Enabled() {
		return respValue{}, ErrUnavailable
	}
	conn, rw, err := s.openConn(ctx)
	if err != nil {
		return respValue{}, err
	}
	defer conn.Close()

	if err := writeCommand(rw.Writer, args...); err != nil {
		return respValue{}, err
	}
	if err := rw.Flush(); err != nil {
		return respValue{}, err
	}
	return readResponse(rw.Reader)
}

func (s *Store) openConn(ctx context.Context) (net.Conn, *bufio.ReadWriter, error) {
	dialer := &net.Dialer{Timeout: s.dialTimeout}
	baseConn, err := dialer.DialContext(ctx, "tcp", s.address)
	if err != nil {
		return nil, nil, fmt.Errorf("redis dial %s failed: %w", s.address, err)
	}

	conn := baseConn
	if s.useTLS {
		tlsConn := tls.Client(baseConn, &tls.Config{ServerName: s.tlsServer, MinVersion: tls.VersionTLS12})
		if err := tlsConn.Handshake(); err != nil {
			baseConn.Close()
			return nil, nil, fmt.Errorf("redis tls handshake failed: %w", err)
		}
		conn = tlsConn
	}

	deadline := time.Now().Add(s.ioTimeout)
	if dl, ok := ctx.Deadline(); ok && dl.Before(deadline) {
		deadline = dl
	}
	_ = conn.SetDeadline(deadline)

	rw := bufio.NewReadWriter(bufio.NewReader(conn), bufio.NewWriter(conn))

	if s.password != "" || s.username != "" {
		authArgs := []string{"AUTH"}
		if s.username != "" {
			authArgs = append(authArgs, s.username, s.password)
		} else {
			authArgs = append(authArgs, s.password)
		}
		if err := writeCommand(rw.Writer, authArgs...); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis auth write failed: %w", err)
		}
		if err := rw.Flush(); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis auth flush failed: %w", err)
		}
		if _, err := readResponse(rw.Reader); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis auth failed: %w", err)
		}
	}

	if s.database > 0 {
		if err := writeCommand(rw.Writer, "SELECT", strconv.Itoa(s.database)); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis select write failed: %w", err)
		}
		if err := rw.Flush(); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis select flush failed: %w", err)
		}
		if _, err := readResponse(rw.Reader); err != nil {
			conn.Close()
			return nil, nil, fmt.Errorf("redis select db=%d failed: %w", s.database, err)
		}
	}

	return conn, rw, nil
}

func writeCommand(w *bufio.Writer, args ...string) error {
	if _, err := fmt.Fprintf(w, "*%d\r\n", len(args)); err != nil {
		return err
	}
	for _, arg := range args {
		if _, err := fmt.Fprintf(w, "$%d\r\n%s\r\n", len(arg), arg); err != nil {
			return err
		}
	}
	return nil
}

func readResponse(r *bufio.Reader) (respValue, error) {
	prefix, err := r.ReadByte()
	if err != nil {
		return respValue{}, err
	}

	switch prefix {
	case respSimple:
		line, err := readLine(r)
		if err != nil {
			return respValue{}, err
		}
		return respValue{kind: respSimple, text: line}, nil
	case respError:
		line, err := readLine(r)
		if err != nil {
			return respValue{}, err
		}
		return respValue{}, errors.New(line)
	case respInt:
		line, err := readLine(r)
		if err != nil {
			return respValue{}, err
		}
		n, parseErr := strconv.ParseInt(line, 10, 64)
		if parseErr != nil {
			return respValue{}, parseErr
		}
		return respValue{kind: respInt, num: n}, nil
	case respBulk:
		line, err := readLine(r)
		if err != nil {
			return respValue{}, err
		}
		size, parseErr := strconv.Atoi(line)
		if parseErr != nil {
			return respValue{}, parseErr
		}
		if size == -1 {
			return respValue{kind: respBulk, isNil: true}, errRedisNil
		}
		buf := make([]byte, size+2)
		if _, err := io.ReadFull(r, buf); err != nil {
			return respValue{}, err
		}
		return respValue{kind: respBulk, text: string(buf[:size])}, nil
	case respArray:
		line, err := readLine(r)
		if err != nil {
			return respValue{}, err
		}
		size, parseErr := strconv.Atoi(line)
		if parseErr != nil {
			return respValue{}, parseErr
		}
		if size == -1 {
			return respValue{kind: respArray, isNil: true}, errRedisNil
		}
		out := respValue{kind: respArray, array: make([]respValue, 0, size)}
		for i := 0; i < size; i++ {
			item, err := readResponse(r)
			if err != nil && !errors.Is(err, errRedisNil) {
				return respValue{}, err
			}
			out.array = append(out.array, item)
		}
		return out, nil
	default:
		return respValue{}, fmt.Errorf("unknown redis response prefix: %q", prefix)
	}
}

func readLine(r *bufio.Reader) (string, error) {
	line, err := r.ReadString('\n')
	if err != nil {
		return "", err
	}
	return strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r"), nil
}
