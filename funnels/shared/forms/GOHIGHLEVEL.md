# Connecting the form to GoHighLevel

The form works right now in **preview mode** — it checks the answers and shows a
thank-you message, but nothing leaves the page. Here's how to make leads land in
your CRM. It takes about ten minutes and there's no code to write.

---

## Step 1 — Make a webhook in GoHighLevel

1. In GoHighLevel, open **Automation → Workflows → + Create Workflow → Start from Scratch**.
2. Click **Add New Trigger** and choose **Inbound Webhook**.
3. GoHighLevel shows you a **webhook URL**. Copy it. It looks like:
   `https://services.leadconnectorhq.com/hooks/XXXXXXXX/webhook-trigger/YYYYYYYY`
4. Leave the workflow open — you'll come back to it in step 3.

## Step 2 — Paste the URL into the form

1. Open `shared/forms/form-config.js` in any text editor (TextEdit, Notepad, VS Code).
2. Find the line near the top that says `endpoint: "",`
3. Paste your URL between the quotes:

   ```js
   endpoint: "https://services.leadconnectorhq.com/hooks/XXXXXXXX/webhook-trigger/YYYYYYYY",
   ```

4. Save the file. That's it — all three funnels are now connected at once.

## Step 3 — Tell GoHighLevel what to do with a lead

Back in your workflow, add the actions you want. The usual set is:

- **Create/Update Contact** — map the incoming fields (see the table below)
- **Add to Pipeline** — drop them into your opportunities board
- **Send Internal Notification** — text or email yourself
- **Send SMS/Email** — an instant reply to the lead

Then hit **Publish**. A workflow left in draft will not fire.

---

## What the form sends

| Field name | What it is |
|---|---|
| `full_name` | Their name |
| `phone` | Phone number |
| `email` | Email address |
| `property_address` | The property they're asking about |
| `timeline` | `asap`, `30-days`, `90-days` or `exploring` |
| `consent` | `yes` — their permission to contact them |
| `funnel` | Which page it came from — `foreclosure-help`, `seller-data-capture` or `tiktok-marketing` |
| `page_url` | The full web address of the page |
| `submitted_at` | Date and time |
| `referrer` | The site they came from, if any |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ad_id` | Ad tracking, picked up automatically from the link |

**Tip:** `funnel` is the useful one. Filter or tag on it in GoHighLevel and you'll
know at a glance which funnel is actually producing leads.

**Tip 2:** send traffic using links like
`...tiktok-marketing/index.html?utm_source=tiktok&utm_campaign=jan-reels`
and that tracking rides along into the contact record by itself.

---

## Step 4 — Test it before you spend money on ads

1. Open one of the funnel pages and fill the form in with your own details.
2. In GoHighLevel, open the workflow and look at the **Execution Logs** tab.
3. You should see your test run within a few seconds.

If nothing shows up, work through this list:

- Is the workflow **published**, not a draft?
- Did the whole URL get pasted, with no stray spaces, inside the quotes?
- Is there still a comma after the closing quote in `form-config.js`?
- Try the first time on a real web address rather than a file opened from your
  desktop — some browsers block sending from `file://` pages.

---

## Sending people to a thank-you page instead

If you'd rather send people somewhere else after they submit — a booking
calendar, say — put that address in `form-config.js`:

```js
redirectTo: "https://your-domain.com/thank-you",
```

Leave it empty and they'll see the thank-you message on the same page.

---

## If you'd rather use a GoHighLevel form instead

You can swap in a GoHighLevel form or survey embed. In any funnel page, find the
`<form class="rpv-form" ...>` block and replace the whole thing with the
`<iframe>` code GoHighLevel gives you.

You'll lose the custom styling — the embed carries its own look — but everything
else on the page keeps working. The design on these pages is built to be the
star, so the custom form is usually worth keeping.
