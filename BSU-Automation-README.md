# BSU Consent Manager Automation Setup

## Installation

1. Install Playwright:
```bash
npm install playwright
```

2. Install browser binaries:
```bash
npx playwright install
```

## Usage

Run the automation script:
```bash
node bsu-consent-automation.js
```

## What the script does:

1. **Closes consent manager**: Looks for the consent banner close button using the aria-label "Close consent manager"
2. **Clicks "Do Not Sell" button**: Searches for the "Do Not Sell or Share My Personal Information" button in the footer
3. **Toggles privacy switch**: Clicks the toggle switch with ID `switch-all-purposes` to opt out

## Script Features:

- **Multiple selector fallbacks**: Tries different CSS selectors to find each element
- **Error handling**: Continues execution even if some elements aren't found
- **Visibility checks**: Ensures elements are visible before clicking
- **Auto-scrolling**: Scrolls to footer to find "Do Not Sell" button if needed
- **Screenshot capture**: Takes a final screenshot showing the results
- **Detailed logging**: Shows which selectors worked and provides a summary

## Customization:

- Set `headless: true` in the script to run without opening browser window
- Adjust `slowMo` value to change delay between actions
- Modify selectors if the website structure changes

## Troubleshooting:

If elements aren't found, the website structure may have changed. Update the selectors in the script based on the current HTML structure.