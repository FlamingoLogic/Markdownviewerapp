'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Folder, 
  FolderOpen, 
  File, 
  Search, 
  RefreshCw, 
  Clock,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react'
import type { FileTreeItem } from '@/lib/github'
import { formatRelativeTime, getFileIcon, cn, debounce } from '@/lib/utils'
import { storage } from '@/lib/utils'

interface FileExplorerProps {
  files: FileTreeItem[]
  loading?: boolean
  onFileSelect: (file: FileTreeItem) => void
  onRefresh?: () => void
  selectedFile?: string
  lastSync?: string
  className?: string
}

interface ExpandedState {
  [path: string]: boolean
}

const STORAGE_KEY = 'fileexplorer-expanded'
const RECENT_FILES_KEY = 'fileexplorer-recent'

export function FileExplorer({
  files,
  loading = false,
  onFileSelect,
  onRefresh,
  selectedFile,
  lastSync,
  className = ''
}: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [recentFiles, setRecentFiles] = useState<string[]>([])

  // Load expanded state and recent files on mount
  useEffect(() => {
    const savedExpanded = storage.get<ExpandedState>(STORAGE_KEY, {})
    const savedRecent = storage.get<string[]>(RECENT_FILES_KEY, [])
    
    setExpanded(savedExpanded)
    setRecentFiles(savedRecent)
  }, [])

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  )

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files

    const filterTree = (items: FileTreeItem[]): FileTreeItem[] => {
      return items.reduce((acc, item) => {
        if (item.type === 'file') {
          if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            acc.push(item)
          }
        } else if (item.type === 'folder' && item.children) {
          const filteredChildren = filterTree(item.children)
          if (filteredChildren.length > 0) {
            acc.push({
              ...item,
              children: filteredChildren
            })
          }
        }
        return acc
      }, [] as FileTreeItem[])
    }

    return filterTree(files)
  }, [files, searchQuery])

  // Handle folder expand/collapse
  const toggleExpanded = (path: string) => {
    const newExpanded = {
      ...expanded,
      [path]: !expanded[path]
    }
    setExpanded(newExpanded)
    storage.set(STORAGE_KEY, newExpanded)
  }

  // Handle file selection
  const handleFileSelect = (file: FileTreeItem) => {
    if (file.type === 'file') {
      // Add to recent files
      const newRecent = [file.path, ...recentFiles.filter(p => p !== file.path)].slice(0, 10)
      setRecentFiles(newRecent)
      storage.set(RECENT_FILES_KEY, newRecent)
      
      onFileSelect(file)
    } else {
      toggleExpanded(file.path)
    }
  }

  // Render file tree recursively
  const renderFileTree = (items: FileTreeItem[], depth = 0) => {
    return items.map((item) => (
      <FileTreeItem
        key={item.path}
        item={item}
        depth={depth}
        isExpanded={expanded[item.path]}
        isSelected={selectedFile === item.path}
        onClick={() => handleFileSelect(item)}
        onToggleExpand={() => toggleExpanded(item.path)}
      />
    ))
  }

  return (
    <div className={cn('h-full flex flex-col bg-slate-925', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">Files</h2>
          <div className="flex items-center gap-2">
            {lastSync && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(lastSync)}</span>
              </div>
            )}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn-ghost p-1"
              title="Refresh files"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search files..."
            className="input-primary pl-9 text-sm h-9"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading files...</span>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <File className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No files match your search' : 'No files found'}
            </p>
          </div>
        ) : (
          <div className="file-tree p-2">
            {renderFileTree(filteredFiles)}
          </div>
        )}
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && !searchQuery && (
        <div className="flex-shrink-0 border-t border-slate-800 p-4">
          <h3 className="text-xs font-medium text-slate-400 mb-2">Recent Files</h3>
          <div className="space-y-1">
            {recentFiles.slice(0, 5).map((filePath) => {
              const fileName = filePath.split('/').pop() || filePath
              return (
                <button
                  key={filePath}
                  onClick={() => {
                    const file: FileTreeItem = {
                      name: fileName,
                      path: filePath,
                      type: 'file'
                    }
                    onFileSelect(file)
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded transition-colors truncate"
                  title={filePath}
                >
                  {getFileIcon(fileName)} {fileName}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Individual file tree item component
function FileTreeItem({
  item,
  depth,
  isExpanded,
  isSelected,
  onClick,
  onToggleExpand
}: {
  item: FileTreeItem
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onClick: () => void
  onToggleExpand: () => void
}) {
  const paddingLeft = depth * 16 + 8

  return (
    <div>
      <button
        onClick={onClick}
        className={cn(
          'file-tree-item w-full text-left py-1.5 px-2 text-sm rounded transition-colors',
          isSelected ? 'selected bg-primary-900/30 text-primary-300' : 'text-slate-400 hover:text-slate-300'
        )}
        style={{ paddingLeft }}
      >
        <div className="flex items-center gap-2">
          {item.type === 'folder' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand()
                }}
                className="p-0.5 hover:bg-slate-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
            </>
          ) : (
            <span className="w-4 h-4 text-center">
              {getFileIcon(item.name)}
            </span>
          )}
          <span className="truncate flex-1">{item.name}</span>
          {item.size && (
            <span className="text-xs text-slate-600">
              {Math.round(item.size / 1024)}KB
            </span>
          )}
        </div>
      </button>

      {/* Render children if folder is expanded */}
      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onClick={onClick}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}