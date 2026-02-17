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
	masterKeys     [][]byte
	masterKeyErr   error
	masterKeyOnce  sync.Once
	masterKeyCount int
)

func getMasterKeys() ([][]byte, error) {
	masterKeyOnce.Do(func() {
		rawList := strings.TrimSpace(os.Getenv("DATA_ENCRYPTION_KEYS"))
		keys := make([]string, 0, 3)
		if rawList != "" {
			for _, part := range strings.Split(rawList, ",") {
				trimmed := strings.TrimSpace(part)
				if trimmed != "" {
					keys = append(keys, trimmed)
				}
			}
		} else if legacy := strings.TrimSpace(os.Getenv("DATA_ENCRYPTION_KEY")); legacy != "" {
			keys = append(keys, legacy)
		}

		if len(keys) == 0 {
			masterKeyErr = fmt.Errorf("DATA_ENCRYPTION_KEY(S) is not configured")
			return
		}

		for _, key := range keys {
			// Accept raw 32-byte key for local/dev usage.
			if len(key) == 32 {
				masterKeys = append(masterKeys, []byte(key))
				continue
			}

			// Accept base64-encoded 32-byte key for secure secret managers.
			decoded, err := base64.StdEncoding.DecodeString(key)
			if err == nil && len(decoded) == 32 {
				masterKeys = append(masterKeys, decoded)
				continue
			}

			masterKeyErr = fmt.Errorf("DATA_ENCRYPTION_KEY(S) must be 32 raw characters or base64 for 32 bytes")
			masterKeys = nil
			return
		}

		masterKeyCount = len(masterKeys)
	})

	if masterKeyErr != nil {
		return nil, masterKeyErr
	}
	if masterKeyCount <= 0 || len(masterKeys) == 0 {
		return nil, fmt.Errorf("DATA_ENCRYPTION_KEY(S) is not configured")
	}

	return masterKeys, nil
}

func encrypt(plaintext []byte) (string, error) {
	keys, err := getMasterKeys()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(keys[0])
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

	keys, err := getMasterKeys()
	if err != nil {
		return nil, err
	}

	var lastErr error
	for _, key := range keys {
		block, err := aes.NewCipher(key)
		if err != nil {
			lastErr = err
			continue
		}

		gcm, err := cipher.NewGCM(block)
		if err != nil {
			lastErr = err
			continue
		}

		nonceSize := gcm.NonceSize()
		if len(ciphertext) < nonceSize {
			return nil, fmt.Errorf("ciphertext too short")
		}

		nonce, data := ciphertext[:nonceSize], ciphertext[nonceSize:]
		plaintext, err := gcm.Open(nil, nonce, data, nil)
		if err == nil {
			return plaintext, nil
		}
		lastErr = err
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("decryption failed")
	}
	return nil, lastErr
}
