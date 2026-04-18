# Chrome Web Store listing copy

Paste these into the Chrome Web Store Developer Dashboard when creating the listing.

## Extension details

- **Name:** No More Slop
- **Category:** Productivity
- **Language:** English (United States)

## Short description (max 132 chars)

```
Hard-block YouTube Shorts, Reels, TikTok, Snapchat Spotlight, X feed, and Reddit feed during focus sessions.
```

Length: 108 chars — well under the 132 limit.

## Full description

```
Stop the scroll. Finish the thing.

No More Slop is a focus tool that hard-blocks short-form and algorithmic-feed content so you can get back to what you actually opened your browser to do.

═══ What it blocks ═══

• YouTube Shorts, Playables, and channel Shorts tabs
• Instagram Reels
• TikTok (entire site)
• Snapchat Spotlight, Discover, Stories
• X (Twitter) home, notifications, bookmarks, explore, profile rabbit-holes
• Reddit home, r/popular, r/all
• Short-video carousels in Google Search results

What stays accessible: YouTube videos, Instagram posts and stories, X DMs and individual tweets, specific subreddits and posts, Snapchat chat and lenses. The feed is gone; the site still works.

═══ How to use it ═══

1. Click the extension icon (or press Alt+Shift+S)
2. Type what you're here to do — "finish chem lab report", "ship the PR", "study for finals"
3. Hit Start focus session
4. Toggle individual platforms if you need to

Or just click "Just block slop" if you have no specific task.

═══ Features ═══

• STRICT MODE — locks platform toggles during a session and requires typing "end" to confirm ending it. No "I'll just disable it real quick" bypasses.

• BREAK MODE — need a breather? Pick 5/10/15/30 minutes, everything's accessible for that window, then blocks snap back automatically.

• IN-PAGE TOASTS — clean pill notification slides down from the top of any page when you try to slip into a feed. No OS-level popup spam.

• DARK MODE — toggle in the popup header.

• SESSION SUMMARY — when you end a session, see your duration and how many distractions the extension caught.

• BLOCK COUNTER — live count of blocks per session.

• KEYBOARD SHORTCUT — Alt+Shift+S opens the popup instantly.

═══ Privacy ═══

No More Slop collects zero data. Nothing is sent to any server. Your settings are stored locally in your browser. Open source under MIT — read the code at github.com/bwaeden/no-more-slop.

═══ Why it exists ═══

You open the browser to write an email, get pulled into Shorts, and 40 minutes later you've forgotten what you came for. No More Slop turns that failure mode off. It doesn't shame you, it doesn't nag — it just removes the slop so the browser remembers its job.
```

## Privacy policy URL

Host `store/privacy-policy.md` as a public gist or page (see `SUBMISSION.md`). Paste the public URL in the dashboard's Privacy → "A link to your privacy policy" field.

## Permissions justification

The store will ask you to justify each sensitive permission. Copy these when prompted:

### `<all_urls>` host permission
> Required to inject the in-page toast notification overlay into destination pages after a cross-site redirect. For example, when the user attempts to visit TikTok during a focus session, the extension bounces them back to their previous page (which could be any site). The extension injects a small shadow-DOM toast on that destination page so the user knows the block fired. No page content is read or transmitted.

### `scripting` permission
> Used together with the host permission above to run the self-contained toast-injection function on the destination page after the redirect completes. The injected code only creates a shadow-DOM element to display the notification and removes itself after five seconds. It does not read or modify page content.

### `storage` permission
> Persists the user's focus session state, platform toggle preferences, break timer, and theme choice across browser sessions. Local-only; never synced.

### `tabs` permission
> Required to read the current tab's URL in the service worker (to determine where to bounce the user back to when a blocked site is navigated to) and to open the welcome page in a new tab on first install.

### `webNavigation` permission
> Listens for `onBeforeNavigate` events to intercept navigations to blocked URLs (YouTube Shorts, TikTok, X feed routes, etc.) before the blocked page loads.

### `alarms` permission
> Schedules a single alarm to fire when the user's break timer ends, so blocks re-enable automatically.

## Single purpose statement

> Block short-form and algorithmic-feed content across YouTube, Instagram, TikTok, Snapchat, X, Reddit, and Google Search during user-initiated focus sessions.
