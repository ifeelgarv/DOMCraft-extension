# Natural Language Web Modifier

A Chrome extension that allows you to modify websites using natural language commands.

## Features

- Change background colors with simple language commands
- Increase or decrease font sizes
- Hide or show images
- Apply dark mode or high contrast mode for better readability
- Reset page to original state
- Simple, intuitive user interface

## Installation

### From Source Code
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension is now installed and ready to use

## Usage

1. Click on the Web Modifier extension icon in your browser toolbar
2. Type a natural language command in the text area
3. Click "Apply Changes" to execute the command
4. Use the "Reset Page" button to revert all changes

### Example Commands

- "Change background to light blue"
- "Increase font size"
- "Decrease font size"
- "Set font size to 18px"
- "Hide all images"
- "Show images"
- "Enable dark mode"
- "Enable high contrast mode"
- "Reset page"

## Troubleshooting

If your commands aren't working:

1. Make sure you're using appropriate commands (see examples above)
2. Some websites may have restrictions that prevent modifications
3. Try refreshing the page and applying the command again
4. If using complex selectors, try simpler ones first

## Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.css` - Styling for the popup
- `popup.js` - Main extension logic
- `assets/` - Extension icons and logo

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.