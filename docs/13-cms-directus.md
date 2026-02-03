# 13 - CMS with Directus

## Overview
Directus is used for content management that doesn't belong in the ERP database, such as the marketing site, help docs, and legal content.

## Content Model

### 1. `pages`
Standalone pages with dynamic layouts.
- `slug` (String, Unique): e.g., "features", "pricing".
- `title`, `seo_title`, `seo_description`.
- `locale`: e.g., "en-IN", "hi-IN".
- `blocks` (Many-to-Many): Relates to Hero, Features, FAQ blocks.

### 2. `posts` (Blog / News)
- `slug`, `title`, `excerpt`, `content` (Markdown).
- `cover_image`, `author`, `locale`, `published_at`.

### 3. `testimonials` & `clients`
- `testimonials`: `name`, `role`, `school_name`, `quote`, `rating`.
- `clients`: `school_name`, `logo`, `city`, `website_url`.

### 4. `faqs`
- `question`, `answer`, `locale`.

## Localization Strategy
Use Directus **Translations** extension to manage multi-language versions of each collection record within the same entry.

## Deployment & Integration
- **Container**: Runs in `docker-compose` with the `cms` profile.
- **Preview Mode**: Configured with a Preview URL pointing to `http://localhost:3001/api/preview`.
- **Fallback**: If CMS is down, the Next.js marketing site should show cached pages or a "Under Maintenance" state.
