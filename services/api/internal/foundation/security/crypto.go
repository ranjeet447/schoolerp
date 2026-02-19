package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
)

// Crypto provides AES-GCM encryption/decryption.
type Crypto struct {
	key []byte
}

// NewCrypto creates a new Crypto instance with a 32-byte key.
func NewCrypto(key []byte) (*Crypto, error) {
	if len(key) != 32 {
		return nil, errors.New("key must be 32 bytes for AES-256")
	}
	return &Crypto{key: key}, nil
}

// Encrypt encrypts plain text using AES-GCM.
func (c *Crypto) Encrypt(plainText []byte) ([]byte, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	// Output is nonce + cipherText
	return gcm.Seal(nonce, nonce, plainText, nil), nil
}

// Decrypt decrypts cipher text using AES-GCM.
func (c *Crypto) Decrypt(cipherText []byte) ([]byte, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(cipherText) < nonceSize {
		return nil, errors.New("cipher text too short")
	}

	nonce := cipherText[:nonceSize]
	actualCipherText := cipherText[nonceSize:]

	return gcm.Open(nil, nonce, actualCipherText, nil)
}

// GenerateRandomKey generates a random 32-byte key.
func GenerateRandomKey() ([]byte, error) {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, err
	}
	return key, nil
}
