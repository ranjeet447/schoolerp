package main

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	yaml "go.yaml.in/yaml/v2"
)

func main() {
	var (
		basePath  string
		pathsDir  string
		orderPath string
		outPath   string
	)
	flag.StringVar(&basePath, "base", "./apidocs/openapi.base.yaml", "base OpenAPI YAML file (without paths key)")
	flag.StringVar(&pathsDir, "paths-dir", "./apidocs/paths", "directory containing modular path YAML files")
	flag.StringVar(&orderPath, "order", "./apidocs/paths.order", "optional file listing path files in desired order")
	flag.StringVar(&outPath, "out", "./apidocs/openapi.yaml", "output bundled OpenAPI YAML file")
	flag.Parse()

	if err := bundle(basePath, pathsDir, orderPath, outPath); err != nil {
		fmt.Fprintf(os.Stderr, "openapi-bundle: %v\n", err)
		os.Exit(1)
	}
}

func bundle(basePath, pathsDir, orderPath, outPath string) error {
	baseBytes, err := os.ReadFile(basePath)
	if err != nil {
		return fmt.Errorf("read base file: %w", err)
	}
	baseBytes = bytes.TrimSpace(baseBytes)
	if len(baseBytes) == 0 {
		return errors.New("base file is empty")
	}

	var baseDoc map[string]interface{}
	if err := yaml.Unmarshal(baseBytes, &baseDoc); err != nil {
		return fmt.Errorf("invalid base YAML: %w", err)
	}
	if _, exists := baseDoc["paths"]; exists {
		return errors.New("base file must not contain a top-level paths key")
	}

	entries, err := os.ReadDir(pathsDir)
	if err != nil {
		return fmt.Errorf("read paths directory: %w", err)
	}

	pathFiles := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(name, ".yaml") || strings.HasSuffix(name, ".yml") {
			pathFiles = append(pathFiles, name)
		}
	}
	if len(pathFiles) == 0 {
		return errors.New("no YAML path files found")
	}
	sort.Strings(pathFiles)

	orderedFiles, err := applyPathOrder(pathFiles, orderPath)
	if err != nil {
		return err
	}

	seenPaths := make(map[string]string, 256)
	var pathsBuilder strings.Builder
	pathsBuilder.WriteString("paths:\n")

	for _, fileName := range orderedFiles {
		fullPath := filepath.Join(pathsDir, fileName)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return fmt.Errorf("read path file %s: %w", fileName, err)
		}
		content = bytes.TrimSpace(content)
		if len(content) == 0 {
			continue
		}

		var pathDoc map[string]interface{}
		if err := yaml.Unmarshal(content, &pathDoc); err != nil {
			return fmt.Errorf("invalid YAML in %s: %w", fileName, err)
		}
		if len(pathDoc) == 0 {
			continue
		}
		for k := range pathDoc {
			if !strings.HasPrefix(k, "/") {
				return fmt.Errorf("%s contains non-path top-level key %q", fileName, k)
			}
			if prev, exists := seenPaths[k]; exists {
				return fmt.Errorf("duplicate path %q found in both %s and %s", k, prev, fileName)
			}
			seenPaths[k] = fileName
		}

		pathsBuilder.WriteString("  # from paths/")
		pathsBuilder.WriteString(fileName)
		pathsBuilder.WriteString("\n")
		for _, line := range strings.Split(string(content), "\n") {
			pathsBuilder.WriteString("  ")
			pathsBuilder.WriteString(line)
			pathsBuilder.WriteString("\n")
		}
		pathsBuilder.WriteString("\n")
	}

	var out strings.Builder
	out.Write(baseBytes)
	out.WriteString("\n\n")
	out.WriteString(pathsBuilder.String())

	bundled := out.String()
	var validate map[string]interface{}
	if err := yaml.Unmarshal([]byte(bundled), &validate); err != nil {
		return fmt.Errorf("generated bundle is invalid YAML: %w", err)
	}
	if _, ok := validate["openapi"]; !ok {
		return errors.New("generated bundle is missing openapi version key")
	}

	if err := os.WriteFile(outPath, []byte(bundled), 0o644); err != nil {
		return fmt.Errorf("write output file: %w", err)
	}
	return nil
}

func applyPathOrder(pathFiles []string, orderPath string) ([]string, error) {
	remaining := make(map[string]struct{}, len(pathFiles))
	for _, file := range pathFiles {
		remaining[file] = struct{}{}
	}

	ordered := make([]string, 0, len(pathFiles))
	orderBytes, err := os.ReadFile(orderPath)
	if err != nil {
		if os.IsNotExist(err) {
			return pathFiles, nil
		}
		return nil, fmt.Errorf("read path order file: %w", err)
	}

	for i, line := range strings.Split(string(orderBytes), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if _, ok := remaining[line]; !ok {
			return nil, fmt.Errorf("order file %s references unknown file %q at line %d", orderPath, line, i+1)
		}
		ordered = append(ordered, line)
		delete(remaining, line)
	}

	if len(remaining) > 0 {
		extra := make([]string, 0, len(remaining))
		for name := range remaining {
			extra = append(extra, name)
		}
		sort.Strings(extra)
		ordered = append(ordered, extra...)
	}
	return ordered, nil
}
