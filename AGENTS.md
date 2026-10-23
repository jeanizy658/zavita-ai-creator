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
