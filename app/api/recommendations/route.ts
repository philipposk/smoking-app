import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Lazy load Groq to avoid build issues - use dynamic import
async function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null
  
  try {
    // Use dynamic import to avoid bundling during build
    const Groq = (await import('groq-sdk')).default
    return new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  } catch (error) {
    console.error('Failed to load Groq SDK:', error)
    return null
  }
}

interface RecommendationRequest {
  userPreferences?: string[]
  location?: { lat: number; lng: number }
  favoritePlaces?: string[]
  useGroq?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    const useGroq = body.useGroq === true && process.env.GROQ_API_KEY

    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'No AI API key configured (OpenAI or Groq)' },
        { status: 500 }
      )
    }

    // Build context for AI recommendations
    const context = `
      User is looking for smoking places recommendations.
      ${body.userPreferences ? `Preferences: ${body.userPreferences.join(', ')}` : ''}
      ${body.favoritePlaces ? `Previously liked: ${body.favoritePlaces.join(', ')}` : ''}
      ${body.location ? `Current location: ${body.location.lat}, ${body.location.lng}` : ''}
    `

    let completion
    
    if (useGroq) {
      const groqClient = await getGroqClient()
      if (!groqClient) {
        // Fallback to OpenAI if Groq not available
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json(
            { error: 'Groq API key not configured and OpenAI not available' },
            { status: 500 }
          )
        }
      } else {
        // Use Groq AI
        try {
          completion = await groqClient.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that recommends smoking places. 
              Provide 3-5 specific recommendations with brief descriptions. 
              Consider user preferences, location, and past favorites. 
              Return ONLY valid JSON with a "recommendations" array. Each recommendation must have: name, description, whyRecommended fields. Format: {"recommendations": [{"name": "...", "description": "...", "whyRecommended": "..."}]}`,
            },
            {
              role: 'user',
              content: `Based on this context, recommend smoking places: ${context}. Return ONLY valid JSON, no other text.`,
            },
          ],
          temperature: 0.7,
          })
        } catch (groqError: any) {
          console.error('Groq API error, falling back to OpenAI:', groqError.message)
          // Fallback to OpenAI if Groq fails
          if (!process.env.OPENAI_API_KEY) {
            throw new Error(`Groq failed: ${groqError.message}`)
          }
          completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a helpful assistant that recommends smoking places. 
                Provide 3-5 specific recommendations with brief descriptions. 
                Consider user preferences, location, and past favorites. 
                Return a JSON object with a "recommendations" array. Each recommendation should have: name, description, whyRecommended fields.`,
              },
              {
                role: 'user',
                content: `Based on this context, recommend smoking places: ${context}`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          })
        }
      }
    }
    
    if (!completion) {
      // Use OpenAI as default
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'No AI API key configured' },
          { status: 500 }
        )
      }
      // Use OpenAI
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that recommends smoking places. 
            Provide 3-5 specific recommendations with brief descriptions. 
            Consider user preferences, location, and past favorites. 
            Return a JSON object with a "recommendations" array. Each recommendation should have: name, description, whyRecommended fields.`,
          },
          {
            role: 'user',
            content: `Based on this context, recommend smoking places: ${context}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
    }

    const content = completion.choices[0].message.content || '{}'
    
    // Try to extract JSON from response (Groq might return text with JSON)
    let parsed
    try {
      // Try direct parse first
      parsed = JSON.parse(content)
    } catch {
      // Try to extract JSON from text if Groq returns formatted text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }
    
    // Handle different response formats
    const recommendations = parsed.recommendations || parsed.recommendation || (Array.isArray(parsed) ? parsed : [])

    return NextResponse.json({ recommendations: Array.isArray(recommendations) ? recommendations : [] })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error.message },
      { status: 500 }
    )
  }
}

