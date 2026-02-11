package i18n

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type Translator struct {
	messages map[string]map[string]string
	mu       sync.RWMutex
}

var instance *Translator
var once sync.Once

func GetTranslator() *Translator {
	once.Do(func() {
		instance = &Translator{
			messages: make(map[string]map[string]string),
		}
	})
	return instance
}

func (t *Translator) LoadFromDir(dir string) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	locales := []string{"en", "hi"}
	for _, lang := range locales {
		path := filepath.Join(dir, lang+".json")
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var msgs map[string]string
		if err := json.Unmarshal(data, &msgs); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}
		t.messages[lang] = msgs
	}
	return nil
}

func (t *Translator) T(locale, key string, args ...interface{}) string {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Default to 'en' if locale not supported
	msgs, ok := t.messages[locale]
	if !ok {
		msgs = t.messages["en"]
	}

	msg, ok := msgs[key]
	if !ok {
		// Fallback to English key if not found in current locale
		if locale != "en" {
			msg, _ = t.messages["en"][key]
		}
	}

	if msg == "" {
		return key // Return key as fallback
	}

	if len(args) > 0 {
		return fmt.Sprintf(msg, args...)
	}
	return msg
}
