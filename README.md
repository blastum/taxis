# Taxis - Tax Scenario Calculator

A simplified tax scenario calculator that helps you compare different tax situations side by side. Named after the biological concept of "taxis" - the primitive reflex to move toward or away from environmental stimuli.

## Features

- **Multiple Scenarios**: Create, duplicate, rename, and delete tax scenarios
- **Side-by-side Comparison**: View scenarios in vertical cards displayed horizontally
- **Comprehensive Tax Calculations**: 
  - Standard deductions based on filing status
  - Senior citizen additional deductions (65+)
  - Ordinary income tax calculations
  - Long-term capital gains tax
  - Effective tax rate calculations
- **Local Storage**: Your scenarios are saved locally in your browser
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: Pure client-side application

## Tax Inputs Supported

- **Filing Status**: Single, Married Filing Jointly, Married Filing Separately
- **Ordinary Income**: Wages, salary, business income
- **Ordinary Earnings**: Interest, short-term capital gains
- **Long-term Capital Gains**: Investments held > 1 year
- **Capital Losses**: Investment losses (can offset gains)
- **Number of People 65+**: For additional senior deductions

## Getting Started

### Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the TypeScript: `npm run build`
4. Start local server: `npm run serve`
5. Open http://localhost:8000

### Development with Auto-rebuild

```bash
npm run dev
```

This will start TypeScript compilation in watch mode and serve the files locally.

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your app will be available at `https://yourusername.github.io/Taxis`

### Manual Deployment

1. Run `npm run build` to compile TypeScript
2. Upload all files (including the `dist/` folder) to any static web server

## Project Structure

```
├── src/
│   ├── types.ts           # TypeScript interfaces
│   ├── taxCalculator.ts   # Tax calculation engine (UI-independent)
│   ├── scenarioManager.ts # Scenario management and local storage
│   ├── ui.ts             # UI components and event handling
│   └── main.ts           # Application entry point
├── dist/                 # Compiled JavaScript (generated)
├── styles.css           # Application styles
├── index.html          # Main HTML file
└── package.json       # Project configuration
```

## Tax Calculation Details

The calculator uses 2024 tax year constants including:
- Standard deductions for all filing statuses
- Progressive tax brackets for ordinary income
- Long-term capital gains tax brackets
- Additional deductions for seniors (65+)

**Note**: This is a simplified calculator for educational and planning purposes. Consult a tax professional for actual tax preparation.

## Browser Compatibility

- Modern browsers with ES2020 support
- Local storage required for data persistence
- No external dependencies

## License

MIT License - feel free to use and modify for your needs.
