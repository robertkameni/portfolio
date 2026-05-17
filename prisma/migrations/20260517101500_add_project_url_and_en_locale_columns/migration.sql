-- Optional EN locale fields and live project URL (idempotent for DBs already synced via db push)
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contentMarkdownEn" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "projectUrl" TEXT;
