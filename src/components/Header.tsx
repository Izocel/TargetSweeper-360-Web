import React, { useState } from "react";
import iconBase from "../assets/icon-base.svg";
import { Github, X } from "lucide-react";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center bg-white border border-military-200 rounded-lg shadow-sm w-12 h-12 mr-1">
                <img
                  src={iconBase}
                  alt="TargetSweeper 360 Logo"
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  TargetSweeper-360
                </h1>
                <p className="text-sm text-gray-600">Viewer</p>
              </div>
            </div>

            {/* Navigation - Hidden on mobile, shown on desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="https://github.com/Izocel/TargetSweeper-360"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-military-600 transition-colors"
              >
                <Github className="w-4 h-4 mr-2" />
                CLI Tool
              </a>
              <button
                className="flex items-center bg-military-600 hover:bg-military-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-military-500 focus:ring-opacity-50 shadow-md hover:shadow-lg text-base"
                onClick={() => {
                  if (
                    (window as any).pwaManager &&
                    typeof (window as any).pwaManager.installPWA === "function"
                  ) {
                    (window as any).pwaManager.installPWA();
                  }
                }}
              >
                📱 Install App
              </button>
            </nav>

            {/* Mobile menu button - Shown on mobile, hidden on desktop */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 relative z-50"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              title="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <nav className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex flex-col h-full justify-between p-6 pt-20">
              <div className="space-y-6">
                <a
                  href="https://github.com/Izocel/TargetSweeper-360"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-military-600 transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Github className="w-5 h-5 mr-3" />
                  CLI Tool
                </a>
                <button
                  className="w-full flex items-center justify-center bg-military-600 hover:bg-military-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-military-500 focus:ring-opacity-50 shadow-md hover:shadow-lg text-lg mt-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (
                      (window as any).pwaManager &&
                      typeof (window as any).pwaManager.installPWA ===
                        "function"
                    ) {
                      (window as any).pwaManager.installPWA();
                    }
                  }}
                >
                  📱 Install App
                </button>
              </div>
              {/* Install App button moved above, only appears in menu */}
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default Header;
