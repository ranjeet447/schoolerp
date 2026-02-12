package safety

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
)

var (
	masterKey     []byte
	masterKeyErr  error
	masterKeyOnce sync.Once
)

func getMasterKey() ([]byte, error) {
	masterKeyOnce.Do(func() {
		key := strings.TrimSpace(os.Getenv("DATA_ENCRYPTION_KEY"))
		if key == "" {
			masterKeyErr = fmt.Errorf("DATA_ENCRYPTION_KEY is not configured")
			return
		}

		// Accept raw 32-byte key for local/dev usage.
		if len(key) == 32 {
			masterKey = []byte(key)
			return
		}

		// Accept base64-encoded 32-byte key for secure secret managers.
		decoded, err := base64.StdEncoding.DecodeString(key)
		if err == nil && len(decoded) == 32 {
			masterKey = decoded
			return
		}

		masterKeyErr = fmt.Errorf("DATA_ENCRYPTION_KEY must be 32 raw characters or base64 for 32 bytes")
	})

	return masterKey, masterKeyErr
}

func encrypt(plaintext []byte) (string, error) {
	key, err := getMasterKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decrypt(cryptoText string) ([]byte, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return nil, err
	}

	key, err := getMasterKey()
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}
