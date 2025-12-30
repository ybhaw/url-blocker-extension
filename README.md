# URL Blocker

A simple, free Chrome extension that blocks websites matching custom regex patterns. Built to help you stay focused and productive.

**No ads. No limits. No tracking. No premium tiers. Just a tool that works.**

This extension is and will always be completely free. It was created to help people take control of their browsing habits and be more productive.

## Features

- **Custom Regex Patterns**: Block URLs using powerful regular expression matching
- **Real-time Blocking**: Instantly blocks matching URLs before they load
- **Sync Across Devices**: Patterns sync via Chrome's built-in storage (when signed in)
- **Simple Management**: Easy-to-use popup for adding and removing patterns
- **Informative Block Page**: Shows which URL was blocked and why
- **Unlimited Patterns**: Add as many blocking rules as you need
- **100% Free**: No ads, no premium features, no data collection

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The URL Blocker icon will appear in your toolbar

## Usage

### Adding a Pattern
1. Click the URL Blocker icon in your toolbar
2. Enter a regex pattern in the input field
3. Click "Add" or press Enter

### Pattern Examples

| Pattern | What it blocks |
|---------|----------------|
| `facebook\.com` | All Facebook URLs |
| `youtube\.com/shorts` | YouTube Shorts only |
| `reddit\.com` | All Reddit URLs |
| `.*\.(poker\|casino)\..*` | Gambling-related domains |
| `twitter\.com\|x\.com` | Twitter/X on both domains |
| `.*news.*` | Any URL containing "news" |

### Removing a Pattern
Click the "Delete" button next to any pattern in the list.

## Permissions Explained

| Permission | Why it's needed |
|------------|-----------------|
| `storage` | Save your blocking patterns |
| `webNavigation` | Detect page navigations to check against patterns |
| `tabs` | Redirect blocked pages to the block notification |
| `<all_urls>` | Check URLs on any website you visit |

## Privacy

This extension:
- Does **not** collect any personal data
- Does **not** send data to external servers
- Stores patterns locally in Chrome's sync storage
- Only accesses URLs to check against your patterns

See [PRIVACY.md](PRIVACY.md) for our full privacy policy.

## Development

### Project Structure
```
url-blocker-extension/
├── manifest.json      # Extension configuration
├── popup.html/js/css  # Toolbar popup UI
├── background.js      # Core blocking logic (service worker)
├── blocked.html/js/css # Block notification page
└── icons/             # Extension icons
```

### Building from Source
No build step required. The extension runs directly from source files.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please [open an issue](../../issues) on GitHub.
