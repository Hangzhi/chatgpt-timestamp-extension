# ChatGPT Timestamp — message dates and times for Chrome and Firefox

**See when you sent that prompt.** ChatGPT Timestamp is a free, open-source browser extension that displays local dates and times alongside your messages in ChatGPT. Choose 12-hour or 24-hour time, and optionally show timestamps on ChatGPT's replies.

[Install ChatGPT Timestamp for Chrome](https://chromewebstore.google.com/detail/chatgpt-timestamp/kdjfhglijhebcchcfkknicfaedhhfpmo?utm_source=github&utm_medium=readme&utm_campaign=organic) · [Install for Firefox](https://addons.mozilla.org/firefox/addon/chatgpt-timestamp/)

## How to see timestamps in ChatGPT

1. Install the extension from the Chrome Web Store or Firefox Add-ons.
2. Open or refresh [chatgpt.com](https://chatgpt.com/) and open a conversation.
3. Allow a few seconds for the date and time to appear above your messages.
4. Open the extension's popup while a ChatGPT tab is active to change the time format or include reply timestamps.

For example, `Sep 19 2026 - 09:41:08` shows the message's date and local time, including seconds. The extension reveals ChatGPT's existing message timestamp; it does not invent a date based on when you installed it.

![ChatGPT conversation showing a date and local time above messages](assets/screenshot.png)

*The screenshot shows reply timestamps enabled. The current default displays timestamps on your messages only.*

## Display options

- **12-hour or 24-hour time:** choose the format you prefer.
- **Your messages or both sides:** keep the default user-only view, or include ChatGPT's replies.
- **Existing and new conversations:** show timestamps wherever ChatGPT makes message creation data available.
- **Local time zone:** dates and times follow your device's local time settings.

![Extension popup with 12/24-hour and user-only timestamp controls](assets/toggles.gif)

## Simple and private

The extension runs in your browser, reads existing message timestamp metadata, and adds date labels to the page. It makes no external network requests, includes no analytics, and does not collect or transmit your conversations. Display preferences are saved in the ChatGPT site's local browser storage.

The source is available in [content.js](src/content.js), [popup.js](src/popup.js), and [manifest.json](src/manifest.json). The popup uses `activeTab` and `scripting` permissions to read and update your display preferences on the active ChatGPT tab.

## Questions and troubleshooting

Read the [guide to ChatGPT message timestamps](docs/how-to-see-chatgpt-timestamps.md) for old conversations, local time zones, optional reply timestamps, and missing dates.

If timestamps do not appear, refresh the conversation and check that the extension can run on ChatGPT. For a persistent problem, [report a bug](https://github.com/Hangzhi/chatgpt-timestamp-extension/issues) with your browser and extension versions. You do not need to include private conversation text.

## Why I built this

I kept losing track of old conversations and couldn't remember when discussions happened. Making message dates visible helps put those conversations back in context—especially when revisiting a project, comparing code revisions, or picking up research after a break.

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the `src/` directory.
5. Open or refresh ChatGPT.

## License and affiliation

Released under the [MIT license](LICENSE). ChatGPT Timestamp is an independent extension and is not affiliated with or endorsed by OpenAI.
