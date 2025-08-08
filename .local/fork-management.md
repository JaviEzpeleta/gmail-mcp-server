# Fork Management Strategy

## The Problem

When you fork a repository to add your own fixes and improvements, you face a fundamental tension: you want to use your enhanced version immediately, but you also want to stay synchronized with upstream improvements. This becomes particularly complex when you have multiple pull requests pending that may or may not be accepted, and if accepted, might be modified by the maintainer.

In this case, we have three significant improvements submitted as PRs to the original gmail-mcp-server repository: a) UTF-8 encoding fix for email subjects with emojis, b) configurable OAuth redirect port, and c) corrected OAuth setup documentation. These fixes are critical for the tool to work properly, but they exist in separate branches waiting for upstream review.

## The Solution: Dual-Branch Strategy

The approach we've adopted maintains two primary branches with distinct purposes. The `main` branch remains a clean mirror of the upstream repository, untouched by our modifications. This ensures we can always pull updates from upstream without conflicts. The `stable` branch, on the other hand, represents our production-ready version that includes `main` plus all our fixes merged together.

This separation is crucial because it preserves our ability to track upstream changes while using a fully functional version. When you run `git pull upstream main` on your clean main branch, it will always fast-forward cleanly. There's no merge conflict resolution, no cherry-picking, no rebase complications - just a clean update.

## Workflow in Practice

When working with this setup, your daily driver is the `stable` branch. This is what gets built, this is what the MCP server runs, this is where all the fixes live. It's your production environment. The individual feature branches (fix-utf8-subject-encoding, feat-configurable-oauth-port, docs-fix-oauth-client-setup) exist solely for the pull request workflow with upstream.

To create or update the stable branch, you start from main and merge in all your fixes:

```bash
git checkout main
git checkout -b stable  # or git checkout stable if it exists
git merge fix-utf8-subject-encoding
git merge feat-configurable-oauth-port
git merge docs-fix-oauth-client-setup
npm run build
```

The beauty of this approach is that each merge is a one-time operation that Git remembers. If you need to update stable later, Git knows which commits have already been merged and won't attempt to reapply them.

## Handling Upstream Updates

When the upstream repository receives updates, the process is straightforward. First, you update your clean main branch:

```bash
git checkout main
git fetch upstream
git pull upstream main
git push fork main  # Keep your fork's main updated
```

Then you have a decision to make about your stable branch, and this depends on what happened upstream. If none of your PRs were merged, you can simply rebase stable onto the new main. If some of your PRs were merged upstream, you'll need to rebuild stable with only the remaining fixes. If upstream modified your PRs before merging, you might need to resolve conflicts or adjust your remaining branches.

The key insight here is that you're not trying to maintain a perfect git history - you're trying to maintain a working tool. The stable branch can be recreated anytime from main plus whatever fixes are still needed. It's disposable and reconstructible, which removes the anxiety about keeping it "clean".

## When PRs Get Merged

As your pull requests get accepted upstream, your workflow naturally simplifies. Let's say the UTF-8 fix gets merged. Now when you pull upstream main, that fix is already there. When you recreate stable, you only need to merge the remaining two branches. Eventually, when all PRs are merged, stable and main converge, and you can delete stable entirely until you need to add new fixes.

This convergence is the goal, but it happens on the maintainer's timeline, not yours. In the meantime, you have a fully functional tool with all your improvements available immediately.

## Alternative Approaches and Why We Didn't Choose Them

You could merge everything directly into main and deal with conflicts during upstream pulls. This works but creates increasingly complex merge conflicts over time, especially if upstream makes changes to the same files you've modified. It also makes it harder to see which changes are yours versus upstream.

You could maintain separate builds for each feature branch and switch between them. This is cleaner from a git perspective but operationally complex - you'd need to remember which branch has which fixes and potentially rebuild when switching contexts.

You could abandon the fork entirely and just maintain local patches. This disconnects you from the GitHub ecosystem - no PRs, no easy sharing, no backup of your work.

## The Philosophy

This approach embraces the reality that open source collaboration is asynchronous and unpredictable. Maintainers might take weeks to review PRs, might request changes, might implement your idea differently, or might reject it entirely. Rather than waiting for perfect upstream alignment, you get the benefits of your improvements immediately while remaining positioned to integrate upstream improvements as they arrive.

The stable branch is not about git purity - it's about having a working tool. It's preferable to have a slightly messy git history with a fully functional tool than a pristine history with broken functionality. The cleanliness lives in main, the functionality lives in stable, and both serve their purposes without compromise.