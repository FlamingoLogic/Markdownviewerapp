'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { GripVertical, Settings, LogOut } from 'lucide-react'
import { storage } from '@/lib/utils'
import { type SiteConfig } from '@/lib/supabase'
import Link from 'next/link'

interface ResizableLayoutProps {
  children: React.ReactNode[]
  className?: string
  onLayoutChange?: (layout: number[]) => void
  siteConfig?: SiteConfig | null
}

interface PanelSizes {
  files: number
  viewer: number
  chat: number
}

const DEFAULT_SIZES: PanelSizes = {
  files: 20,  // 20%
  viewer: 50, // 50%
  chat: 30    // 30%
}

const MIN_SIZES: PanelSizes = {
  files: 10,  // 10%
  viewer: 30, // 30%
  chat: 10    // 10%
}

const STORAGE_KEY = 'markdownviewer-panel-sizes'

export function ResizableLayout({ children, className = '', onLayoutChange, siteConfig }: ResizableLayoutProps) {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_SIZES)
  const [isMobile, setIsMobile] = useState(false)
  const panelGroupRef = useRef<any>(null)

  // Load saved panel sizes on mount
  useEffect(() => {
    const savedSizes = storage.get<PanelSizes>(STORAGE_KEY, DEFAULT_SIZES)
    setSizes(savedSizes)
  }, [])

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle layout changes
  const handleLayoutChange = (newSizes: number[]) => {
    if (newSizes.length === 3) {
      const newLayout: PanelSizes = {
        files: newSizes[0],
        viewer: newSizes[1],
        chat: newSizes[2]
      }
      
      setSizes(newLayout)
      storage.set(STORAGE_KEY, newLayout)
      onLayoutChange?.(newSizes)
    }
  }

  // Reset to default layout
  const resetLayout = () => {
    setSizes(DEFAULT_SIZES)
    storage.set(STORAGE_KEY, DEFAULT_SIZES)
    
    // Reset the panel group if possible
    if (panelGroupRef.current) {
      // This is a bit hacky but necessary since react-resizable-panels doesn't have a reset method
      panelGroupRef.current.setLayout([DEFAULT_SIZES.files, DEFAULT_SIZES.viewer, DEFAULT_SIZES.chat])
    }
  }

  // Predefined layout presets
  const applyPreset = (preset: 'reading' | 'chat' | 'browse' | 'hideChat') => {
    let newSizes: PanelSizes

    switch (preset) {
      case 'reading':
        newSizes = { files: 10, viewer: 70, chat: 20 }
        break
      case 'chat':
        newSizes = { files: 10, viewer: 40, chat: 50 }
        break
      case 'browse':
        newSizes = { files: 30, viewer: 50, chat: 20 }
        break
      case 'hideChat':
        newSizes = { files: 20, viewer: 80, chat: 0 }
        break
      default:
        newSizes = DEFAULT_SIZES
    }

    setSizes(newSizes)
    storage.set(STORAGE_KEY, newSizes)
    
    if (panelGroupRef.current) {
      panelGroupRef.current.setLayout([newSizes.files, newSizes.viewer, newSizes.chat])
    }
  }

  // Double-click to reset divider
  const handleDividerDoubleClick = () => {
    resetLayout()
  }

  // Mobile layout - show only one panel at a time
  if (isMobile) {
    return <MobileTabLayout siteConfig={siteConfig}>{children}</MobileTabLayout>
  }

  // Desktop layout - resizable panels
  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Top Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-200">{siteConfig?.title || 'Documentation'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/admin"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.reload()
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Layout controls (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-slate-900 border-b border-slate-800 p-2 flex gap-2 text-xs">
          <button
            onClick={() => applyPreset('reading')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Reading
          </button>
          <button
            onClick={() => applyPreset('chat')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Chat
          </button>
          <button
            onClick={() => applyPreset('browse')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Browse
          </button>
          <button
            onClick={() => applyPreset('hideChat')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Hide Chat
          </button>
          <button
            onClick={resetLayout}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main resizable layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup
          ref={panelGroupRef}
          direction="horizontal"
          onLayout={handleLayoutChange}
          className="h-full"
        >
          {/* Files Panel */}
          <Panel
            defaultSize={sizes.files}
            minSize={MIN_SIZES.files}
            className="panel"
          >
            <div className="panel-content">
              {children[0]}
            </div>
          </Panel>

          {/* First Divider */}
          <PanelResizeHandle className="panel-divider group">
            <div 
              className="flex items-center justify-center h-full"
              onDoubleClick={handleDividerDoubleClick}
            >
              <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-primary-400 transition-colors" />
            </div>
          </PanelResizeHandle>

          {/* Viewer Panel */}
          <Panel
            defaultSize={sizes.viewer}
            minSize={MIN_SIZES.viewer}
            className="panel"
          >
            <div className="panel-content bg-slate-950">
              {children[1]}
            </div>
          </Panel>

          {/* Second Divider */}
          <PanelResizeHandle className="panel-divider group">
            <div 
              className="flex items-center justify-center h-full"
              onDoubleClick={handleDividerDoubleClick}
            >
              <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-primary-400 transition-colors" />
            </div>
          </PanelResizeHandle>

          {/* Chat Panel */}
          <Panel
            defaultSize={sizes.chat}
            minSize={MIN_SIZES.chat}
            className="panel"
          >
            <div className="panel-content">
              {children[2]}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

// Mobile tab layout for responsive design
function MobileTabLayout({ children, siteConfig }: { children: React.ReactNode[], siteConfig?: SiteConfig | null }) {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { name: 'Files', icon: '📁' },
    { name: 'Viewer', icon: '📖' },
    { name: 'Chat', icon: '💬' }
  ]

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      {/* Top Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-slate-200">{siteConfig?.title || 'Documentation'}</h1>
        <div className="flex items-center gap-2">
          <Link 
            href="/admin"
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <Settings className="w-3 h-3" />
            Admin
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.reload()
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="flex">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'text-primary-400 bg-slate-800 border-b-2 border-primary-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {children.map((child, index) => (
          <div
            key={index}
            className={`h-full ${activeTab === index ? 'block' : 'hidden'}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook for using panel layout state
export function usePanelLayout() {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_SIZES)

  useEffect(() => {
    const savedSizes = storage.get<PanelSizes>(STORAGE_KEY, DEFAULT_SIZES)
    setSizes(savedSizes)
  }, [])

  const updateSizes = (newSizes: Partial<PanelSizes>) => {
    const updatedSizes = { ...sizes, ...newSizes }
    setSizes(updatedSizes)
    storage.set(STORAGE_KEY, updatedSizes)
  }

  return {
    sizes,
    updateSizes,
    resetToDefault: () => {
      setSizes(DEFAULT_SIZES)
      storage.set(STORAGE_KEY, DEFAULT_SIZES)
    }
  }
}