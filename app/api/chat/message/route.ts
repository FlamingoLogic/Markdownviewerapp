import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { siteConfigOperations } from '@/lib/supabase'
import { SessionService, CookieService, getSecurityHeaders } from '@/lib/auth'
import { GitHubService } from '@/lib/github'
import { logError } from '@/lib/error-tracking'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('site_session')
    const session = CookieService.parseSessionFromCookie(sessionCookie?.value)

    if (!SessionService.isValidSession(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      )
    }

    const { message, currentFile, conversationHistory } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Get site configuration
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig?.llm_api_key || !siteConfig?.llm_provider || !siteConfig?.chat_enabled) {
      return NextResponse.json(
        { error: 'LLM API not configured or chat disabled' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Prepare context from GitHub content
    let contextInfo = ''

    if (currentFile?.content) {
      contextInfo += `\n\nCurrent file: ${currentFile.name} (${currentFile.path})\n${currentFile.content}`
    }

    // Get repository structure for additional context
    if (siteConfig.github_repo) {
      try {
        const githubService = new GitHubService(siteConfig.github_repo, siteConfig.branch)
        const files = await githubService.getMarkdownFiles(siteConfig.folders)

        const fileList = extractFileList(files)
        contextInfo += `\n\nAvailable documentation files:\n${fileList.slice(0, 50).join('\n')}`
      } catch (error) {
        console.warn('Could not fetch repository structure:', error)
      }
    }

    // Build conversation context
    const conversationContext = conversationHistory
      ?.slice(-6) // Last 6 messages for context
      ?.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      ?.join('\n') || ''

    // Create system prompt
    const systemPrompt = `You are a helpful AI assistant for a documentation site. You have access to markdown documentation files and can help users understand, navigate, and find information in their documentation.

Repository: ${siteConfig.github_repo}
Site: ${siteConfig.title}

Guidelines:
- Be helpful and concise
- Reference specific files when relevant
- If you don't have enough context, ask for clarification
- Help users navigate and understand the documentation
- Provide code examples when appropriate
- Keep responses under 500 words for better readability

${contextInfo ? `Context Information:${contextInfo}` : ''}

${conversationContext ? `Recent conversation:\n${conversationContext}` : ''}

Please respond to the user's question:`

    // Call LLM API
    const response = await callLLMAPI(
      siteConfig.llm_provider,
      siteConfig.llm_api_key,
      systemPrompt,
      message
    )

    return NextResponse.json(
      { response },
      { status: 200, headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Chat message error:', error)
    logError(error as Error, {
      additionalData: { context: 'chat-message' }
    })

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Helper function to extract file list from GitHub file tree
function extractFileList(files: any[]): string[] {
  const result: string[] = []

  function traverse(items: any[], prefix = '') {
    for (const item of items) {
      if (item.type === 'file') {
        result.push(`${prefix}${item.name} (${item.path})`)
      } else if (item.type === 'folder' && item.children) {
        result.push(`${prefix}📁 ${item.name}/`)
        traverse(item.children, prefix + '  ')
      }
    }
  }

  traverse(files)
  return result
}

// LLM API caller function
async function callLLMAPI(
  provider: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {

  switch (provider.toLowerCase()) {
    case 'openai':
      return await callOpenAI(apiKey, systemPrompt, userMessage)

    case 'anthropic':
      return await callAnthropic(apiKey, systemPrompt, userMessage)

    case 'groq':
      return await callGroq(apiKey, systemPrompt, userMessage)

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}

// OpenAI API implementation
async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response received'
}

// Anthropic API implementation
async function callAnthropic(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'No response received'
}

// Groq API implementation
async function callGroq(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response received'
}
