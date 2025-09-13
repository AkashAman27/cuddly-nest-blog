import { GoogleGenerativeAI } from '@google/generative-ai'

interface TranslationRequest {
  text: string | string[]
  targetLanguage: string
  sourceLanguage?: string
}

interface TranslationResponse {
  translatedText: string | string[]
  detectedLanguage?: string
  success: boolean
  error?: string
}

interface PostTranslationData {
  title: string
  excerpt?: string
  content?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  faq_items?: Array<{
    question: string
    answer: string
  }>
  itinerary_days?: Array<{
    day: number
    title: string
    description: string
    activities?: string[]
  }>
  sections?: Array<{
    id: string
    data: any
  }>
}

interface TranslatedPostData {
  translated_title: string
  translated_excerpt?: string
  translated_content?: string
  translated_seo_title?: string
  translated_seo_description?: string
  translated_seo_keywords?: string
  translated_faq_items?: Array<{
    question: string
    answer: string
  }>
  translated_itinerary_days?: Array<{
    day: number
    title: string
    description: string
    activities?: string[]
  }>
  translated_sections?: Array<{
    id: string
    data: any
  }>
}

export class DirectGeminiTranslationService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey?: string) {
    const googleApiKey = apiKey || process.env.GOOGLE_API_KEY || ''
    
    if (!googleApiKey) {
      throw new Error('Google API key is required. Please set GOOGLE_API_KEY environment variable.')
    }
    
    console.log('Initializing Direct Google Gemini:', {
      apiKeyPresent: !!googleApiKey,
      apiKeyLength: googleApiKey.length
    })
    
    try {
      this.genAI = new GoogleGenerativeAI(googleApiKey)
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent translations
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      })
      console.log('✅ Direct Google Gemini initialized successfully')
    } catch (initError) {
      console.error('❌ Failed to initialize Direct Google Gemini:', initError)
      throw new Error(`Direct Google Gemini initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`)
    }
  }

  /**
   * Translate text using direct Google Gemini API
   */
  async translateText({ text, targetLanguage, sourceLanguage = 'en' }: TranslationRequest): Promise<TranslationResponse> {
    try {
      console.log('Making Direct Google Gemini translation call:', {
        textCount: Array.isArray(text) ? text.length : 1,
        targetLanguage,
        sourceLanguage
      })

      const isArray = Array.isArray(text)
      const textsToTranslate = isArray ? text : [text]

      // Create a structured prompt for batch translation
      const prompt = this.createTranslationPrompt(textsToTranslate, sourceLanguage, targetLanguage)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const translatedContent = response.text()

      // Parse the response to extract individual translations
      const translations = this.parseTranslationResponse(translatedContent, textsToTranslate.length)
      
      console.log('Direct Google Gemini translation completed:', { 
        translationsCount: translations.length,
        success: true
      })

      return {
        translatedText: isArray ? translations : translations[0],
        success: true
      }
    } catch (error) {
      console.error('Direct Google Gemini translation error:', error)
      
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: error instanceof Error ? error.message : 'Direct Google Gemini translation error'
      }
    }
  }

  /**
   * Create an optimized translation prompt
   */
  private createTranslationPrompt(texts: string[], sourceLanguage: string, targetLanguage: string): string {
    const languageNames = {
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
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish'
    }

    const sourceLangName = languageNames[sourceLanguage as keyof typeof languageNames] || sourceLanguage
    const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage

    const prompt = `You are a professional translator specializing in travel and tourism content. 
    
Task: Translate the following ${sourceLangName} texts to ${targetLangName}.

Instructions:
- Maintain the original meaning and tone
- Keep travel terminology accurate and culturally appropriate
- Preserve any HTML tags or formatting if present
- Return only the translations, one per line, in the same order
- Do not add explanations or numbering

Context: These texts are from a travel blog website covering destinations, hotels, restaurants, and travel guides.

Texts to translate:
${texts.map((text, index) => `${index + 1}. ${text}`).join('\n')}

Translations:`

    return prompt
  }

  /**
   * Parse translation response and extract individual translations
   */
  private parseTranslationResponse(response: string, expectedCount: number): string[] {
    // Split response by lines and clean up
    let translations = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbering if present (1. 2. etc.)
        return line.replace(/^\d+\.\s*/, '').trim()
      })
      .filter(line => line.length > 0)

    // If we don't have the expected number of translations, try alternative parsing
    if (translations.length !== expectedCount) {
      // Try splitting by double newlines or other delimiters
      const altTranslations = response
        .split(/\n\n+/)
        .map(block => block.trim())
        .filter(block => block.length > 0)
        .map(block => block.replace(/^\d+\.\s*/, '').trim())

      if (altTranslations.length === expectedCount) {
        translations = altTranslations
      } else if (expectedCount === 1) {
        // For single translation, return the cleaned response
        translations = [response.replace(/^\d+\.\s*/, '').trim()]
      }
    }

    // Ensure we have the expected number of translations
    while (translations.length < expectedCount) {
      translations.push(translations[0] || '')
    }

    return translations.slice(0, expectedCount)
  }

  /**
   * Batch translate with chunking for large content
   */
  async batchTranslate(texts: string[], targetLanguage: string, sourceLanguage = 'en', chunkSize = 20): Promise<string[]> {
    const results: string[] = []
    
    // Process in chunks to avoid API limits
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize)
      
      try {
        const chunkResult = await this.translateText({
          text: chunk,
          targetLanguage,
          sourceLanguage
        })
        
        if (chunkResult.success && Array.isArray(chunkResult.translatedText)) {
          results.push(...chunkResult.translatedText)
        } else {
          results.push(...chunk)
        }
        
        // Add delay between chunks to respect rate limits
        if (i + chunkSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Chunk translation error (${i}-${i + chunkSize}):`, error)
        results.push(...chunk)
      }
    }
    
    return results
  }

  /**
   * Generate a slug from original slug and language code
   */
  generateSlug(originalSlug: string, languageCode: string): string {
    return `${originalSlug}/${languageCode}`
  }

  /**
   * Translate blog post content including sections and SEO data
   */
  async translatePost(postData: PostTranslationData, targetLanguage: string): Promise<TranslatedPostData> {
    try {
      console.log(`Starting post translation to ${targetLanguage}`)

      // Create structured translation object
      const fieldsToTranslate: Record<string, string> = {}
      
      if (postData.title) fieldsToTranslate.title = postData.title
      if (postData.excerpt) fieldsToTranslate.excerpt = postData.excerpt
      if (postData.content) fieldsToTranslate.content = postData.content
      if (postData.seo_title) fieldsToTranslate.seo_title = postData.seo_title
      if (postData.seo_description) fieldsToTranslate.seo_description = postData.seo_description
      if (postData.seo_keywords) fieldsToTranslate.seo_keywords = postData.seo_keywords

      // Handle FAQ items
      if (postData.faq_items && postData.faq_items.length > 0) {
        postData.faq_items.forEach((faq, index) => {
          fieldsToTranslate[`faq_${index}_question`] = faq.question
          fieldsToTranslate[`faq_${index}_answer`] = faq.answer
        })
      }

      // Handle itinerary days
      if (postData.itinerary_days && postData.itinerary_days.length > 0) {
        postData.itinerary_days.forEach((day, index) => {
          fieldsToTranslate[`itinerary_${index}_title`] = day.title
          fieldsToTranslate[`itinerary_${index}_description`] = day.description
          if (day.activities) {
            day.activities.forEach((activity, actIndex) => {
              fieldsToTranslate[`itinerary_${index}_activity_${actIndex}`] = activity
            })
          }
        })
      }

      const textsToTranslate = Object.values(fieldsToTranslate)
      const keys = Object.keys(fieldsToTranslate)

      console.log(`Translating ${textsToTranslate.length} text fields`)

      // Translate all texts
      const translationResult = await this.translateText({
        text: textsToTranslate,
        targetLanguage,
        sourceLanguage: 'en'
      })

      if (!translationResult.success) {
        throw new Error(`Translation failed: ${translationResult.error}`)
      }

      const translations = Array.isArray(translationResult.translatedText) 
        ? translationResult.translatedText 
        : [translationResult.translatedText]

      // Map translations back to structure
      const translatedFields: Record<string, string> = {}
      keys.forEach((key, index) => {
        translatedFields[key] = translations[index] || fieldsToTranslate[key]
      })

      // Reconstruct translated post data
      const translatedData: TranslatedPostData = {
        translated_title: translatedFields.title || postData.title || '',
        translated_excerpt: translatedFields.excerpt || postData.excerpt,
        translated_content: translatedFields.content || postData.content,
        translated_seo_title: translatedFields.seo_title || postData.seo_title,
        translated_seo_description: translatedFields.seo_description || postData.seo_description,
        translated_seo_keywords: translatedFields.seo_keywords || postData.seo_keywords,
      }

      // Reconstruct FAQ items
      if (postData.faq_items) {
        translatedData.translated_faq_items = postData.faq_items.map((faq, index) => ({
          question: translatedFields[`faq_${index}_question`] || faq.question,
          answer: translatedFields[`faq_${index}_answer`] || faq.answer
        }))
      }

      // Reconstruct itinerary days
      if (postData.itinerary_days) {
        translatedData.translated_itinerary_days = postData.itinerary_days.map((day, index) => ({
          day: day.day,
          title: translatedFields[`itinerary_${index}_title`] || day.title,
          description: translatedFields[`itinerary_${index}_description`] || day.description,
          activities: day.activities?.map((activity, actIndex) => 
            translatedFields[`itinerary_${index}_activity_${actIndex}`] || activity
          )
        }))
      }

      console.log(`Post translation completed successfully for ${targetLanguage}`)
      return translatedData
    } catch (error) {
      console.error('Post translation error:', error)
      throw new Error(`Failed to translate post to ${targetLanguage}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get list of supported languages
   */
  static getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸' },
      { code: 'es', name: 'Spanish', native_name: 'Español', flag_emoji: '🇪🇸' },
      { code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷' },
      { code: 'de', name: 'German', native_name: 'Deutsch', flag_emoji: '🇩🇪' },
      { code: 'it', name: 'Italian', native_name: 'Italiano', flag_emoji: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', native_name: 'Português', flag_emoji: '🇵🇹' },
      { code: 'ru', name: 'Russian', native_name: 'Русский', flag_emoji: '🇷🇺' },
      { code: 'ja', name: 'Japanese', native_name: '日本語', flag_emoji: '🇯🇵' },
      { code: 'ko', name: 'Korean', native_name: '한국어', flag_emoji: '🇰🇷' },
      { code: 'zh', name: 'Chinese (Simplified)', native_name: '中文', flag_emoji: '🇨🇳' },
      { code: 'zh-TW', name: 'Chinese (Traditional)', native_name: '繁體中文', flag_emoji: '🇹🇼' },
      { code: 'ar', name: 'Arabic', native_name: 'العربية', flag_emoji: '🇸🇦' },
      { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', flag_emoji: '🇮🇳' },
      { code: 'th', name: 'Thai', native_name: 'ไทย', flag_emoji: '🇹🇭' },
      { code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt', flag_emoji: '🇻🇳' },
      { code: 'tr', name: 'Turkish', native_name: 'Türkçe', flag_emoji: '🇹🇷' },
      { code: 'pl', name: 'Polish', native_name: 'Polski', flag_emoji: '🇵🇱' },
      { code: 'nl', name: 'Dutch', native_name: 'Nederlands', flag_emoji: '🇳🇱' },
      { code: 'sv', name: 'Swedish', native_name: 'Svenska', flag_emoji: '🇸🇪' },
      { code: 'da', name: 'Danish', native_name: 'Dansk', flag_emoji: '🇩🇰' },
      { code: 'no', name: 'Norwegian', native_name: 'Norsk', flag_emoji: '🇳🇴' },
      { code: 'fi', name: 'Finnish', native_name: 'Suomi', flag_emoji: '🇫🇮' },
    ]
  }

  /**
   * Test translation service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing Direct Google Gemini connection...')
      
      const testResult = await this.translateText({
        text: 'Hello, world! This is a travel blog about amazing destinations.',
        targetLanguage: 'es',
        sourceLanguage: 'en'
      })

      if (testResult.success) {
        return {
          success: true,
          message: `Direct Google Gemini is working! Test translation: "${testResult.translatedText}"`
        }
      } else {
        return {
          success: false,
          message: 'Direct Google Gemini test failed: No translation returned'
        }
      }
    } catch (error) {
      console.error('Direct Google Gemini connection test error:', error)
      return {
        success: false,
        message: `Direct Google Gemini service connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

export default DirectGeminiTranslationService