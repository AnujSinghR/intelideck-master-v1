"use client";

import { PPTViewer } from "../../components/file-upload/PPTViewer";
import { PPTReskineExtractor } from "../../components/file-upload/PPTReskineExtractor";
import { PPTUploadProvider } from "../../components/file-upload/PPTUploadContext";
import { PPTUpload } from "../../components/file-upload/PPTUpload";
import { useState, useEffect } from "react";
import { FileText, Eye, Keyboard } from "lucide-react";

export default function PPTXViewerPage() {
  const [activeTab, setActiveTab] = useState<'view' | 'reskine'>('view');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      } else if (e.key === "Escape") {
        setShowShortcuts(false);
      } else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        setActiveTab(prev => prev === 'view' ? 'reskine' : 'view');
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const shortcuts = [
    { key: "Ctrl + E", description: "Toggle between view/reskine" },
    { key: "?", description: "Show/hide shortcuts" },
    { key: "Esc", description: "Close shortcuts" }
  ];

  return (
    <PPTUploadProvider>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-white to-amber-100">
        <div className="container mx-auto py-4 px-2 sm:px-4 lg:px-6">
          {/* Header Section */}
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent sm:text-4xl">
                    PowerPoint Viewer
                  </h1>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                  Advanced PowerPoint viewer with text and image extraction, and template generation.
                </p>
              </div>
              <div className="flex-shrink-0">
                <PPTUpload />
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-orange-50 transition-all duration-300 hover:shadow-orange-100/50">
              {/* Enhanced Toolbar */}
              <div className="border-b border-orange-100 bg-gradient-to-r from-white to-orange-50/30 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-orange-50">
                      <div className="flex items-center">
                        <button
                          onClick={() => setActiveTab('view')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                            activeTab === 'view'
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                              : "text-gray-600 hover:bg-orange-50"
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View PPTX</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('reskine')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                            activeTab === 'reskine'
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                              : "text-gray-600 hover:bg-orange-50"
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Reskine</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowShortcuts(prev => !prev)}
                      className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Keyboard className="h-4 w-4" />
                      <span>Keyboard Shortcuts (?)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Modal */}
              {showShortcuts && (
                <div className="absolute top-24 right-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                    <button
                      onClick={() => setShowShortcuts(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    {shortcuts.map(({ key, description }) => (
                      <div key={key} className="flex justify-between items-center">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{key}</kbd>
                        <span className="text-sm text-gray-600">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="h-[calc(100vh-12rem)]">
                {activeTab === 'view' ? (
                  <div className="h-full">
                    <PPTViewer className="h-full" />
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-4 custom-scrollbar bg-gradient-to-br from-white to-orange-50/20">
                    <PPTReskineExtractor />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PPTUploadProvider>
  );
}
