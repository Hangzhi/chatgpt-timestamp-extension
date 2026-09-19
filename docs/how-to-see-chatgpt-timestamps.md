# How to see the date and time of a ChatGPT message

ChatGPT Timestamp adds visible date and time labels to messages on the ChatGPT website. Install the free extension, refresh a conversation, and the existing message timestamps appear above your prompts. You can also include reply timestamps and choose a 12-hour or 24-hour display.

[Add ChatGPT Timestamp to Chrome](https://chromewebstore.google.com/detail/chatgpt-timestamp/kdjfhglijhebcchcfkknicfaedhhfpmo?utm_source=github&utm_medium=guide&utm_campaign=organic) · [Get the Firefox add-on](https://addons.mozilla.org/firefox/addon/chatgpt-timestamp/)

## Set up message timestamps

1. Install the extension for your browser using one of the links above.
2. Open [ChatGPT](https://chatgpt.com/) and select a conversation. If it was already open, refresh the page.
3. Wait a few seconds for the page and message data to load.
4. Look above one of your messages for its date and time.

The default view shows timestamps on your own messages. To include ChatGPT's replies, open the extension popup while the conversation tab is active and turn off **Timestamp user posts only**.

![ChatGPT messages with their date and local time displayed above the text](../assets/screenshot.png)

*This screenshot illustrates the optional view with timestamps on both sides of the conversation.*

## Read the date and time

A timestamp such as `Sep 19 2026 - 09:41:08` means September 19, 2026, at 9:41:08 in the local time zone configured on your device. The date, year, and seconds remain visible in both display formats.

| Setting | Example for 2:32:05 in the afternoon |
| --- | --- |
| 24-hour | `Sep 18 2026 - 14:32:05` |
| 12-hour | `Sep 18 2026 - 2:32:05 PM` |

These examples illustrate formatting. The actual date comes from the message data supplied by ChatGPT.

## Frequently asked questions

### Can I see timestamps on old ChatGPT conversations?

Yes, when ChatGPT provides creation-time metadata for those messages. Open an existing conversation after installing the extension. It displays available timestamps from before installation as well as those for new messages. It cannot reconstruct a missing timestamp.

### Is a message timestamp the same as the conversation date?

No. Each displayed timestamp belongs to a message. A conversation may span several days, so individual messages can have different dates. The extension adds labels inside the conversation; it does not add a date-search tool or sidebar calendar.

### Why do only my messages show timestamps?

User-only display is enabled by default to keep the conversation uncluttered. Open the extension popup and turn off **Timestamp user posts only** to include replies when timestamp data is available.

### How do I switch between 12-hour and 24-hour time?

Keep a ChatGPT tab active, open the extension popup, and use the **12-hr format / 24-hr format** toggle. The extension saves this preference locally for the ChatGPT site. Clearing that site's local storage resets the saved preference.

### Which time zone does the extension use?

Your device's local time zone. The extension converts ChatGPT's message creation time to a local date and time. It does not currently provide a separate time-zone selector. If the hour looks wrong, check your device's date, time, and time-zone settings, then reload the conversation.

### Does this tell ChatGPT what time it is?

No. These are visual labels in your browser. The extension does not append time information to your prompts, give the model time awareness, or calculate when a usage limit resets.

### Is it free, and does it need another account?

The extension is free and open source. It does not require a separate extension account. Use ChatGPT as you normally would.

### Does it work in the native ChatGPT phone app?

This project is a browser extension for the ChatGPT website. It does not modify the native ChatGPT mobile or desktop apps.

### Does it send my conversations to another service?

No. The extension reads timestamp metadata already available in the page, adds labels locally, and saves display preferences in local browser storage. It includes no analytics and makes no external network requests. You can inspect [the timestamp code](../src/content.js), [popup settings code](../src/popup.js), and [declared permissions](../src/manifest.json).

## If timestamps are missing

1. Confirm that the extension is enabled and allowed to run on ChatGPT.
2. Refresh the conversation and allow a few seconds for message data to load.
3. Check one of your own messages first; replies are hidden by the default user-only setting.
4. Make sure the browser has installed the latest extension update.
5. If the problem continues, check [existing issues](https://github.com/Hangzhi/chatgpt-timestamp-extension/issues). Changes to ChatGPT's page structure may require an extension update.

When reporting a bug, include the browser version, extension version, and a short description of what is missing. Avoid posting private conversation text or unredacted screenshots.

[Back to the project and installation links](../README.md)

Maintained by the ChatGPT Timestamp project. Updated September 19, 2026.
