<p align="center">
   <img src="public/icon-base.svg" alt="TargetSweeper 360 Logo" width="120" />
</p>

# TargetSweeper 360 Web

<p align="center">
   <a href="https://github.com/your-username/TargetSweeper-360-Web/actions/workflows/deploy.yml">
      <img src="https://github.com/your-username/TargetSweeper-360-Web/actions/workflows/deploy.yml/badge.svg" alt="Deploy Status" />
   </a>
   <a href="https://github.com/your-username/TargetSweeper-360-Web/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
   </a>
</p>

---

**TargetSweeper 360 Web** is an enterprise-ready web platform for visualizing and interacting with KML geospatial data on Google Maps. Built with React, Vite, and Tailwind CSS, it delivers robust performance, scalability, and a seamless user experience for business, research, and operational needs.

---

## Table of Contents

- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Deployment & CI/CD](#deployment--cicd)
- [Usage](#usage)
- [Technology Stack](#technology-stack)
- [License](#license)
- [Contact & Support](#contact--support)

## Key Features

- **KML Visualization:** Upload and display KML files on a fully interactive Google Map.
- **Enterprise-Grade Reliability:** Robust error handling, user feedback, and fallback mechanisms ensure consistent operation.
- **Responsive Design:** Optimized for all devices, from desktop to mobile.
- **Secure API Key Management:** Google Maps API keys are managed securely via GitHub Actions secrets.
- **Automated CI/CD:** Continuous integration and deployment to GitHub Pages for rapid, reliable updates.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm (v7 or later)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/TargetSweeper-360-Web.git
   cd TargetSweeper-360-Web
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your API key:**
   Create a `.env` file in the project root:
   ```env
   VITE_GOOGLE_MAPS_JS_API_KEY=your-google-maps-api-key
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Access the application:**
   Open [http://localhost:4173](http://localhost:4173) in your browser.

### Production Build

To generate a production build:

```bash
npm run build
```

The optimized output will be in the `dist/` directory.

## Deployment & CI/CD

This project uses GitHub Actions for automated testing, build, and deployment:

- **Automatic Deployment:** Every push to the `main` (or `master`) branch triggers a build and deploys the latest version to GitHub Pages.
- **Secret Management:** The Google Maps API key is securely injected from the `GOOGLE_API_KEY` repository secret.
- **Production Branch:** The production site is published to the `gh-pages` branch.

### Setting up the Google Maps API Key Secret

1. Go to your repository on GitHub.
2. Navigate to **Settings > Secrets and variables > Actions**.
3. Add a new secret named `GOOGLE_API_KEY` containing your Google Maps JavaScript API key.

## Usage

- **KML Upload:** Upload a KML file to instantly visualize its geospatial data on the map.
- **Map Interaction:** Pan, zoom, and interact with the map using standard Google Maps controls.
- **Error Handling:** If you encounter issues, the application provides detailed debug information and actionable solutions.

## Technology Stack

- [React](https://react.dev/) — Modern UI library for building interactive interfaces
- [Vite](https://vitejs.dev/) — Lightning-fast build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework for rapid UI development
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview) — Industry-standard mapping platform

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact & Support

For business inquiries, feature requests, or technical support, please open an issue on GitHub or contact the maintainers at [your-email@example.com](mailto:your-email@example.com).

<p align="center">
   <em>💖 Developed and maintained by the TargetSweeper 360 Web team.</em>
</p>
