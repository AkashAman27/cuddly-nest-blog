interface MistralTranslationRequest {
  text: string | string[]
  targetLanguage: string
  sourceLanguage?: string
}

interface MistralTranslationResponse {
  translatedText: string | string[]
  success: boolean
  error?: string
}

export class MistralTranslationService {
  private apiKey: string
  private baseUrl = 'https://api.mistral.ai/v1/chat/completions'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MISTRAL_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Mistral API key not provided. Translation features may not work.')
    }
  }

  /**
   * Translate text using Mistral AI
   */
  async translateText({ text, targetLanguage, sourceLanguage = 'en' }: MistralTranslationRequest): Promise<MistralTranslationResponse> {
    if (!this.apiKey) {
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: 'Mistral API key not configured'
      }
    }

    try {
      console.log('Making Mistral AI translation call:', {
        textCount: Array.isArray(text) ? text.length : 1,
        targetLanguage,
        sourceLanguage
      })
      
      const isArray = Array.isArray(text)
      const textsToTranslate = isArray ? text : [text]
      
      // Get the full language name for better translation context
      const targetLangName = this.getLanguageName(targetLanguage)
      const sourceLangName = this.getLanguageName(sourceLanguage)
      
      // Process in batches to handle multiple texts efficiently
      const batchSize = 10 // Process 10 texts at a time
      const translatedResults: string[] = []
      
      for (let i = 0; i < textsToTranslate.length; i += batchSize) {
        const batch = textsToTranslate.slice(i, i + batchSize)
        
        const prompt = this.buildTranslationPrompt(batch, sourceLangName, targetLangName)
        
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.1, // Low temperature for consistent translations
            max_tokens: 4000
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Mistral API error response:', errorText)
          
          if (response.status === 401) {
            throw new Error(`Mistral API authentication failed. Please check your API key. The provided key may be invalid or expired.`)
          } else if (response.status === 403) {
            throw new Error(`Mistral API access denied. Your API key may not have permission for this model.`)
          } else if (response.status === 429) {
            throw new Error(`Mistral API rate limit exceeded. Please try again later.`)
          } else {
            throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorText}`)
          }
        }

        const data = await response.json()
        console.log('Mistral API response received for batch', i / batchSize + 1)
        
        if (data.error) {
          throw new Error(data.error.message || 'Mistral API error')
        }

        // Parse the response to extract translations
        const batchTranslations = this.parseTranslationResponse(data.choices[0].message.content, batch.length)
        translatedResults.push(...batchTranslations)
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < textsToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      return {
        translatedText: isArray ? translatedResults : translatedResults[0],
        success: true
      }
    } catch (error) {
      console.error('Mistral translation error:', error)
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Mistral translation error'
      }
    }
  }

  /**
   * Build a translation prompt for Mistral AI
   */
  private buildTranslationPrompt(texts: string[], sourceLanguage: string, targetLanguage: string): string {
    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n')
    
    return `You are a professional translator. Please translate the following text(s) from ${sourceLanguage} to ${targetLanguage}. 

Important instructions:
- Maintain the original meaning and context
- Preserve any formatting or special characters
- Use natural, fluent language in the target language
- For travel content, use appropriate cultural context
- Return ONLY the translated text(s) in the same order, numbered as shown below
- Do not include explanations or additional text

Text(s) to translate:
${textList}

Translations:`
  }

  /**
   * Parse the Mistral AI response to extract translations
   */
  private parseTranslationResponse(response: string, expectedCount: number): string[] {
    const lines = response.trim().split('\n')
    const translations: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Look for numbered translations (1., 2., etc.)
      const match = trimmedLine.match(/^\d+\.\s*(.+)$/)
      if (match && match[1]) {
        translations.push(match[1].trim())
      } else if (trimmedLine && !trimmedLine.match(/^\d+\.$/) && translations.length < expectedCount) {
        // If no number prefix but we still need translations, use the line
        translations.push(trimmedLine)
      }
    }
    
    // If we didn't get the expected number of translations, pad with original text
    while (translations.length < expectedCount) {
      translations.push(`[Translation missing ${translations.length + 1}]`)
    }
    
    return translations.slice(0, expectedCount)
  }

  /**
   * Get full language name from language code
   */
  private getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish'
    }
    
    return languages[code] || code
  }

  /**
   * Test the Mistral API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.translateText({
        text: 'Hello, world!',
        targetLanguage: 'es'
      })
      
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate a slug from original slug and language code
   */
  generateSlug(originalSlug: string, languageCode: string): string {
    return `${originalSlug}/${languageCode}`
  }
}

export default MistralTranslationService