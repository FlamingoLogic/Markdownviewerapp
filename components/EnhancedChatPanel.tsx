'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Settings,
  FileText,
  RefreshCw,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface EnhancedChatPanelProps {
  currentFile?: { name: string; path: string; content?: string }
  className?: string
  onConfigureAPI?: () => void
}

export function EnhancedChatPanel({
  currentFile,
  className = '',
  onConfigureAPI
}: EnhancedChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiConfigured, setApiConfigured] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if LLM API is configured
  useEffect(() => {
    checkApiConfiguration()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkApiConfiguration = async () => {
    try {
      const response = await fetch('/api/chat/config')
      const data = await response.json()
      setApiConfigured(data.configured)
    } catch (error) {
      console.error('Failed to check API configuration:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          currentFile: currentFile ? {
            name: currentFile.name,
            path: currentFile.path,
            content: currentFile.content
          } : null,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg =>
        msg.isLoading ? {
          ...msg,
          content: data.response,
          isLoading: false
        } : msg
      ))

    } catch (error) {
      console.error('Chat error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')

      // Remove loading message on error
      setMessages(prev => prev.filter(msg => !msg.isLoading))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  // Render API configuration needed state
  if (!apiConfigured) {
    return (
      <div className={cn('h-full flex flex-col bg-slate-925', className)}>
        <div className="flex-shrink-0 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Chat
            </h3>
            {onConfigureAPI && (
              <button
                onClick={onConfigureAPI}
                className="btn-ghost text-xs"
              >
                Configure
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-slate-500 max-w-sm">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">AI Chat Unavailable</h4>
            <p className="text-sm mb-4">
              Configure an LLM API key in the admin panel to enable AI-powered chat that can answer questions about your documentation.
            </p>

            {onConfigureAPI && (
              <button
                onClick={onConfigureAPI}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Settings className="w-4 h-4" />
                Configure AI
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col bg-slate-925', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-400" />
            AI Chat
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="btn-ghost p-1"
              title="Clear chat"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {onConfigureAPI && (
              <button
                onClick={onConfigureAPI}
                className="btn-ghost p-1"
                title="Configure API"
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Current file indicator */}
        {currentFile && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-3 h-3" />
            <span>Context: {currentFile.name}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Ask me anything about your documentation!
            </p>
            <p className="text-xs mt-1">
              I can help explain content, find information, or answer questions.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 max-w-full',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={cn(
                'rounded-lg px-3 py-2 max-w-[80%] break-words',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-100'
              )}
            >
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              )}

              <div className={cn(
                'text-xs mt-1 opacity-70',
                message.role === 'user' ? 'text-primary-100' : 'text-slate-400'
              )}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-900/20 border-t border-red-800/30">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your documentation..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary p-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-slate-500">
            Press Enter to send, Shift+Enter for new line
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Zap className="w-3 h-3" />
            <span>AI Powered</span>
          </div>
        </div>
      </div>
    </div>
  )
}
