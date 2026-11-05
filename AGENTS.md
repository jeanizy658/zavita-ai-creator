<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Media workflow
- Keep device capture isolated in use-camera and stop all tracks and revoke recording URLs on exit, because route navigation must not leave the camera running.
- Store the selected project ID per signed-in account and hydrate timeline rows/assets from Cloud, because in-memory clips and blob URLs are not persistent records.
- Add real asset batches atomically with per-track append positions; use returned database clip IDs, because existing clips must remain intact and retry must not duplicate partial batches.
- Keep media duration/track rules in media-workflow with focused tests, because all recording and import entry points must agree.

## Image generation
- Preserve the configured image model and documented Gemini image request format; route streaming image calls through the authenticated image HTTP handler because RPC cannot carry SSE.
- Save generated PNGs with the generation job ID as the asset ID and deterministic owner-only path through an authenticated server function, because retries must not create duplicate assets.
- Keep provider generation separate from storage retries, because a failed save must never trigger another billed generation.

## Video generation
- Keep video requests in server-write-only video_jobs and serialize provider creation through the durable gateway lock, because clients must not forge provider completion or create concurrent billed work.
- Save completed MP4s with job-keyed assets and deterministic private paths; retry storage separately from generation, because provider downloads expire and resubmission can bill twice.
- Read actual video duration and dimensions before timeline insertion; never substitute requested duration for measured media metadata.
- Process at most one queued video per managed cron or authenticated poll with a database worker lease; check persistent service pauses at both entry points to prevent parallel work and denied-call storms.
