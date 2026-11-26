# The Mammon Video Machine

Type a topic. Pick a style. Press one button. Get a finished vertical episode
of **The Price of Profit**, ready to post.

Nothing in here needs you to write code. Everything you have to do yourself is
written out click by click below.

---

## Read this first: what it costs

At today's prices, one full 8-scene episode works out at about **$9.57**.

Your safety limit is set to **$8.00**, so the machine will stop and ask you
before every single episode. That is not a bug, it is the limit doing its job,
but it means the "press one button and walk away" bit will not happen until you
change one of two numbers.

**Pick one:**

| What you change | Where | New cost | Runs on its own? |
| --- | --- | --- | --- |
| Raise the limit to 10 | `COST_CAP_USD=10` in your `.env` | $9.57 | Yes |
| Switch the voices to text-to-speech | `VOICE_MODE=tts` in your `.env` | $8.29 | No, still just over |
| Both of the above | both lines | $8.29 | Yes |

I would raise the limit to 10 and leave everything else alone. That matches the
$6–$10 an episode you asked for, and it keeps the voice changer, which is the
better-sounding option.

The two big costs are the animation (about $6.40) and the lip sync (about
$2.56). There is no way to keep both of those and come in under $8 today.

The exact numbers are always on screen before anything is spent.

---

## Getting it running the first time

### 1. Install the two things it needs

**Node.js** — go to <https://nodejs.org>, download the big green "LTS" button,
open the file, and click Next until it finishes.

**ffmpeg** — this is what glues the video together.

- **Mac:** open the Terminal app and paste this, then press Enter:
  ```
  brew install ffmpeg
  ```
  If it says `brew: command not found`, first paste the install line from
  <https://brew.sh>, let it finish, then run the line above.
- **Windows:** open PowerShell and paste:
  ```
  winget install ffmpeg
  ```

### 2. Start the machine

Open Terminal, go to this folder, and run these two lines one at a time:

```
npm install
npm run dev
```

Then open <http://localhost:3000> in your browser.

You should see a black and gold page with a gold tag saying
**TEST MODE — NO MONEY SPENT**.

### 3. Try it for free, right now

Type `Hawks Nest tunnel` into the box and press **Make Episode**.

In test mode it runs the whole machine end to end — all eight steps — and gives
you a real MP4 you can play and download. The scenes are grey placeholder cards
instead of animation, because nothing was sent to any paid service. It costs
nothing. Do this first, so you know the machine works before you spend a penny.

**To stop the machine:** click the Terminal window and press `Ctrl` and `C`
together.

---

## Your keys

### Setting up the file

1. In this folder there is a file called `.env.example`.
2. Make a copy of it. Name the copy exactly `.env` — a dot, then the word env,
   and nothing else.
3. Open `.env` in TextEdit or Notepad.
4. Paste each key after its `=` sign. No spaces, no quote marks.
5. Save the file, then stop the machine and start it again.

Never email this file, never put it on the internet.

### 1. Anthropic — writes the script

1. Go to <https://console.anthropic.com> and sign in.
2. Left sidebar → **API Keys** → **Create Key**.
3. Copy it and paste it after `ANTHROPIC_API_KEY=`.

### 2. fal.ai — draws the scenes

This is the **same key your PennyPixel app already uses**. If you can find it
there, reuse it.

1. Otherwise go to <https://fal.ai/dashboard/keys>.
2. **Add key**, copy it, paste it after `FAL_KEY=`.

### 3. ElevenLabs — the voices

1. Go to <https://elevenlabs.io> and sign in.
2. Click your picture, bottom left → **API Keys** → **Create API Key**.
3. Paste it after `ELEVENLABS_API_KEY=`.

### 4. Google Cloud, the fiddly one — the animation

Google shut down the easy way into Veo on 22 October 2026, so this one takes
about ten minutes. It only has to be done once.

1. Go to <https://console.cloud.google.com> and sign in.
2. Top of the page, click the project dropdown → **New Project**. Call it
   `mammon`. Click **Create**.
3. Make sure `mammon` is the project selected at the top of the page.
4. Copy the **Project ID** shown on the dashboard — it usually looks like
   `mammon-481203`, not just `mammon`. Paste it after `GOOGLE_CLOUD_PROJECT=`.
5. **Turn on billing.** Left menu → **Billing** → **Link a billing account**.
   Add a card. Veo will not run without this.
6. **Turn on Vertex AI.** In the search bar at the top type `Vertex AI API`,
   click the result, then click **Enable**.
7. **Make the key file.** Search bar → `Service accounts` → **Create service
   account**. Name it `mammon-veo`. Click **Create and continue**.
8. For the role, choose **Vertex AI User**. Click **Continue**, then **Done**.
9. In the list, click `mammon-veo` → the **Keys** tab → **Add key** →
   **Create new key** → choose **JSON** → **Create**. A file downloads.
10. Move that file somewhere sensible and permanent, like a folder called
    `keys` in your Documents.
11. Get its full path and paste it after `GOOGLE_APPLICATION_CREDENTIALS=`.
    - **Mac:** right-click the file, hold the `Option` key, click
      **Copy "name" as Pathname**.
    - **Windows:** hold `Shift`, right-click the file, **Copy as path**, and
      delete the quote marks it adds.

### 5. Sync Labs — the lip sync

Leave `LIPSYNC_PROVIDER=fal` as it is. That runs Sync's lipsync-2 model through
fal.ai using the key you already have, and it is the only version that works
from your own computer. You can leave `SYNC_LABS_API_KEY` empty.

(The reason: Sync Labs can only fetch video from a public web address. While
this app is on your laptop, your clips do not have one. Once it is online you
can switch over.)

---

## Pick the two voices

Mammon and JT each need one fixed voice, used in every episode forever.

1. Go to <https://elevenlabs.io/app/voice-library>.
2. Find a voice for **Mammon**: an older American man, warm, slow, unhurried.
   Think a kindly grandfather. Click **Add to my voices**.
3. Find a voice for **JT**: a flat, dry, modern American man. Add it too.
4. Go to **My Voices**, click a voice, and copy its **Voice ID** — a long
   string of letters and numbers.
5. Open `characters.json` in this folder.
6. Paste Mammon's ID between the quote marks on the `"voiceId"` line in the
   `mammon` block, and JT's on the `"voiceId"` line in the `jt` block.
7. Save the file.

---

## Your reference pictures

These are what stop Mammon's face changing between scenes. The machine works
without them, but the characters will drift.

1. Get 2–3 pictures of Mammon and 2–3 of JT. Head and shoulders, clear face,
   consistent look.
2. Put them somewhere with a public web address — the simplest is to drop them
   in a public Dropbox or Google Drive folder and copy the share link, or use
   <https://imgur.com>.
3. Open `characters.json`.
4. Put the links inside the square brackets on the `"referenceImages"` line,
   each in quote marks, separated by commas:

   ```
   "referenceImages": ["https://i.imgur.com/aaa.jpg", "https://i.imgur.com/bbb.jpg"]
   ```

5. Save the file.

---

## Going live

Once every key is in:

1. Open `.env`.
2. Change `MOCK_MODE=true` to `MOCK_MODE=false`.
3. Save, stop the machine, start it again.

The gold **TEST MODE** tag disappears. From now on it spends real money.

Make your first real episode about something short and simple. A real run takes
roughly five to twelve minutes, most of it waiting on the animation.

---

## The cha-ching

Optional. Without it everything still works.

1. Go to <https://freesound.org> and search "cash register".
2. Download one as an MP3.
3. Rename it to exactly `cha-ching.mp3`.
4. Drop it into the `assets` folder in here.

It will play on the punchline scenes by itself.

---

## When something goes wrong

The screen tells you which step stopped and why, and nothing more is spent
after it stops. There is also a **What happened, step by step** link at the
bottom you can open and read.

| What it says | What to do |
| --- | --- |
| `No ANTHROPIC_API_KEY found` (or any other key) | That key is missing from `.env`. Add it, save, stop and start the machine again. |
| `the model name may have been retired` | Google has pulled that version of Veo. Open `src/lib/config.ts`, find the line starting `model: 'veo-` and put the current name there. Current names: <https://cloud.google.com/vertex-ai/generative-ai/docs/models> |
| `Google Cloud would not let us in` | Usually billing is off, Vertex AI is not enabled, or the path to the JSON file is wrong. Redo steps 5, 6 and 11 above. |
| `Veo refused scene 4` | Veo would not animate that line. Press Make Episode again — the script changes each time. |
| `ffmpeg is not installed` | Do the ffmpeg install at the top of this file. |
| `Cannot find a valid font` | Open `.env` and set `CAPTION_FONT_FILE=/System/Library/Fonts/Supplemental/Georgia.ttf` on a Mac. |
| `That episode is not running any more` | You restarted the machine mid-episode. The episode is lost. Start again. |

---

## Where things are

| I want to change... | Open this file |
| --- | --- |
| What Mammon and JT look like, and their voice IDs | `characters.json` |
| How the show is written — the rules, the hook, the ending | `src/lib/prompt.ts` |
| Model names and prices, the number of scenes, the spending limit | `src/lib/config.ts` |
| The styles in the dropdown, or to add a new one | `src/lib/styles.ts` |
| The look of the page | `src/app/globals.css` |

Finished episodes are saved in `public/episodes`. Working files for each
episode go into a hidden `.work` folder, and can be deleted whenever you like.

---

## Adding a new style later

Open `src/lib/styles.ts`. Copy one of the blocks, give it a new `id` and
`label`, and describe the look in the `look` line. Save. It appears in the
dropdown next time you start the machine.

---

## Putting it online later

This is built to deploy to Vercel. Two things to know before you do:

- Finished episodes are written to disk, and Vercel wipes the disk between
  requests. You will need somewhere to keep them — an S3 or Cloudflare R2
  bucket — before episodes survive.
- Episodes take longer than Vercel's default time limit on the cheaper plans.
  You will need a background job runner or a paid plan.

While it is on your own computer, neither of these matters.
