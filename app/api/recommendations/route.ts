import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RecommendationRequest {
  userPreferences?: string[]
  location?: { lat: number; lng: number }
  favoritePlaces?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4' for better results
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that recommends smoking places. 
          Provide 3-5 specific recommendations with brief descriptions. 
          Consider user preferences, location, and past favorites. 
          Format as JSON array with: name, description, whyRecommended fields.`,
        },
        {
          role: 'user',
          content: `Based on this context, recommend smoking places: ${context}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(content)
    
    // Handle different response formats
    const recommendations = parsed.recommendations || parsed.recommendation || parsed || []

    return NextResponse.json({ recommendations: Array.isArray(recommendations) ? recommendations : [] })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error.message },
      { status: 500 }
    )
  }
}

