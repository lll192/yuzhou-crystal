# Yuzhou Crystal SEO Development Workflow

## Goal
Keep `main` as the production baseline while every SEO phase is reviewed before release.

## Branch policy
- `main`: production-ready code only. Do not develop directly here.
- `seo/phase-*`: one SEO phase at a time.
- One phase should be consolidated into a small number of meaningful commits rather than one commit per tiny edit.

## Review loop
1. Start from the latest `main`.
2. Create or update one `seo/phase-*` branch.
3. Make one coherent SEO change set.
4. Run the local/hosted preview against that branch or its built artifact.
5. Check desktop and mobile appearance, navigation, forms, product loading, canonical URLs, robots and sitemap.
6. User approves the visual/functional result.
7. Merge the phase into `main` only after approval.
8. Tag the released phase when useful so it can be restored quickly.

## Preview without Vercel
This application is an Express + Docker service. Vercel is not required. The existing deployment exposes port 3000 through the production infrastructure. A preview can be run as a separate Docker Compose project/container on the same server, using a different host port and a separate working tree/checkout. If DNS is available, `preview.crystalwto.com` can point to the preview route; otherwise a server port protected by access controls can be used temporarily.

## Production safety
- Never replace production data volumes with preview volumes.
- Never use production `.env` credentials in an untrusted preview.
- Preview should use a separate data directory and uploads directory.
- Do not merge an SEO phase solely because code checks pass; visual approval is required.

## Rollback
Rollback is performed by reverting the merge or deploying the previous known-good `main` commit/tag. Because production changes are merged only after preview approval, rejecting a phase leaves production unchanged.

## SEO acceptance checklist
- Unique title and meta description.
- One clear H1 matching the page's search intent.
- Canonical URL is correct.
- Internal links use the intended SEO URLs.
- Images have meaningful alt text.
- Product data still loads from the existing API.
- Inquiry/custom-request flows still work.
- Mobile layout remains usable.
- `robots.txt` and `sitemap.xml` contain only intended indexable URLs.
- No accidental `noindex`, broken links, or staging URLs exposed as canonicals.
