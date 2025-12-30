# Privacy Policy for URL Blocker

**Last updated:** December 30, 2025

## Overview

URL Blocker is committed to protecting your privacy. This privacy policy explains how our browser extension handles your data.

## Data Collection

**We do not collect any data.**

URL Blocker does not collect, store, transmit, or share any personal information or browsing data with the developer or any third parties.

## Data Storage

The extension stores the following data **locally on your device** using the browser's built-in storage API:

- **Blocking patterns**: The regex patterns you create to block URLs

This data is:
- Stored locally in your browser
- Synced across your devices if you're signed into your browser (via browser sync)
- Never transmitted to external servers
- Never accessible to the extension developer

## Data Usage

- **URL checking**: The extension reads URLs you navigate to solely to check if they match your blocking patterns. These URLs are not stored, logged, or transmitted anywhere.
- **Pattern matching**: Your blocking patterns are used only to determine whether to block a page.

## Permissions

The extension requires certain permissions to function:

| Permission | Purpose |
|------------|---------|
| `storage` | Store your blocking patterns locally |
| `webNavigation` | Detect when you navigate to a page |
| `tabs` | Redirect blocked pages to show a notification |
| `<all_urls>` | Check URLs on any website against your patterns |

These permissions are used exclusively for the blocking functionality and not for data collection.

## Third-Party Services

URL Blocker does not use any third-party services, analytics, or tracking tools.

## Data Sharing

We do not share any data with third parties because we do not collect any data.

## Data Security

Since all data is stored locally in your browser using the browser's secure storage API, your data is protected by the browser's built-in security measures.

## Your Rights

You have full control over your data:
- **View**: See all stored patterns in the extension popup
- **Delete**: Remove any pattern at any time
- **Export**: Access your patterns via browser sync storage
- **Clear all**: Uninstalling the extension removes all stored data

## Children's Privacy

URL Blocker does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository.

## Consent

By using URL Blocker, you consent to this privacy policy.
