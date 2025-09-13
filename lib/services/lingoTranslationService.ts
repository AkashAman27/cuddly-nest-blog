import { LingoDotDevEngine } from 'lingo.dev/sdk'

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

export class LingoTranslationService {
  private engine: LingoDotDevEngine

  constructor(apiKey?: string) {
    // Use Google API key directly with lingo.dev compiler
    const googleApiKey = apiKey || process.env.GOOGLE_API_KEY || ''
    
    if (!googleApiKey) {
      throw new Error('Google API key is required. Please set GOOGLE_API_KEY environment variable.')
    }
    
    // Initialize lingo.dev engine with Google Gemini model
    console.log('Initializing lingo.dev with Google Gemini:', {
      apiKeyPresent: !!googleApiKey,
      apiKeyLength: googleApiKey.length
    })
    
    try {
      // Configure to use Google Gemini directly with your API key
      this.engine = new LingoDotDevEngine({
        // Use Google's Gemini model directly
        models: {
          "*:*": "google:gemini-2.0-flash" // Use Google Gemini 2.0 Flash as per Lingo.dev docs
        },
        // Set Google API key
        apiKeys: {
          google: googleApiKey
        },
        batchSize: 10,
        idealBatchItemSize: 200,
      })
      console.log('✅ Lingo.dev with Google Gemini initialized successfully')
    } catch (initError) {
      console.error('❌ Failed to initialize lingo.dev engine with Google Gemini:', initError)
      console.error('Initialization error details:', {
        message: initError instanceof Error ? initError.message : 'Unknown',
        stack: initError instanceof Error ? initError.stack : 'No stack'
      })
      throw new Error(`Lingo.dev Google Gemini initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`)
    }
  }

  /**
   * Translate text using lingo.dev AI translation
   */
  async translateText({ text, targetLanguage, sourceLanguage = 'en' }: TranslationRequest): Promise<TranslationResponse> {
    try {
      console.log('Making Lingo.dev translation call:', {
        textCount: Array.isArray(text) ? text.length : 1,
        targetLanguage,
        sourceLanguage
      })

      const isArray = Array.isArray(text)
      const textsToTranslate = isArray ? text : [text]

      // Create an object to translate with lingo.dev
      const translationObject: Record<string, string> = {}
      textsToTranslate.forEach((textItem, index) => {
        translationObject[`text_${index}`] = textItem
      })

      // Use lingo.dev engine to translate the object
      const translatedObject = await this.engine.localizeObject(
        translationObject,
        {
          sourceLocale: sourceLanguage,
          targetLocale: targetLanguage,
          fast: false, // Use high quality translation for blog content
          hints: {
            context: ['travel', 'blog', 'tourism', 'destinations', 'hospitality'],
            audience: ['travelers', 'tourists', 'travel enthusiasts'],
            tone: ['friendly', 'engaging', 'informative'],
            style: ['conversational', 'descriptive', 'helpful']
          }
        },
        // Progress callback
        (progress: number) => {
          if (progress % 20 === 0) {
            console.log(`Translation progress: ${progress}%`)
          }
        }
      )

      // Extract translated texts in the same order
      const translations = textsToTranslate.map((_, index) => 
        translatedObject[`text_${index}`] || textsToTranslate[index]
      )
      
      console.log('Lingo.dev translation completed:', { 
        translationsCount: translations.length,
        success: true
      })

      return {
        translatedText: isArray ? translations : translations[0],
        success: true
      }
    } catch (error) {
      console.error('Lingo.dev translation error:', error)
      
      // Fallback: return original text if translation fails completely
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: error instanceof Error ? error.message : 'Lingo.dev translation error'
      }
    }
  }

  /**
   * Batch translate with chunking for large content
   */
  async batchTranslate(texts: string[], targetLanguage: string, sourceLanguage = 'en', chunkSize = 50): Promise<string[]> {
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
          // Add original texts if translation fails
          results.push(...chunk)
        }
        
        // Add delay between chunks to respect rate limits
        if (i + chunkSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Chunk translation error (${i}-${i + chunkSize}):`, error)
        results.push(...chunk) // Add original texts
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
   * Translate blog post content including sections and SEO data using lingo.dev engine
   */
  async translatePost(postData: PostTranslationData, targetLanguage: string): Promise<TranslatedPostData> {
    try {
      console.log(`Starting post translation to ${targetLanguage}`)

      // Create a structured object for translation with contextual keys
      const translationObject: Record<string, any> = {
        // Basic content
        title: postData.title || '',
        excerpt: postData.excerpt || '',
        content: postData.content || '',
        
        // SEO content  
        seo_title: postData.seo_title || '',
        seo_description: postData.seo_description || '',
        seo_keywords: postData.seo_keywords || '',

        // FAQ items (structured)
        faq_items: postData.faq_items || [],
        
        // Itinerary days (structured)
        itinerary_days: postData.itinerary_days || [],
      }

      // Remove empty fields to avoid unnecessary translation
      Object.keys(translationObject).forEach(key => {
        if (!translationObject[key] || 
            (Array.isArray(translationObject[key]) && translationObject[key].length === 0) ||
            (typeof translationObject[key] === 'string' && translationObject[key].trim() === '')) {
          delete translationObject[key]
        }
      })

      console.log(`Translating structured post data with ${Object.keys(translationObject).length} fields`)

      // Use lingo.dev engine to translate the entire object at once
      console.log('About to call lingo.dev localizeObject with:', {
        fieldsToTranslate: Object.keys(translationObject),
        targetLanguage,
        sampleContent: translationObject.title?.substring(0, 50) + '...'
      })
      
      let translatedObject
      try {
        translatedObject = await this.engine.localizeObject(
          translationObject,
          {
            sourceLocale: 'en',
            targetLocale: targetLanguage,
            fast: false, // High quality for blog content
            // Simplified configuration - remove complex reference and hints that might cause issues
          }
        )
        console.log('Lingo.dev localizeObject completed successfully')
      } catch (lingoError) {
        console.error('Lingo.dev localizeObject error:', lingoError)
        console.error('Error details:', {
          message: lingoError instanceof Error ? lingoError.message : 'Unknown',
          stack: lingoError instanceof Error ? lingoError.stack : 'No stack',
          translationObject: Object.keys(translationObject)
        })
        throw new Error(`Lingo.dev localizeObject failed: ${lingoError instanceof Error ? lingoError.message : 'Unknown error'}`)
      }

      // Map the translated object back to the expected structure
      const translatedData: TranslatedPostData = {
        translated_title: translatedObject.title || postData.title || '',
        translated_excerpt: translatedObject.excerpt || postData.excerpt,
        translated_content: translatedObject.content || postData.content,
        translated_seo_title: translatedObject.seo_title || postData.seo_title,
        translated_seo_description: translatedObject.seo_description || postData.seo_description,
        translated_seo_keywords: translatedObject.seo_keywords || postData.seo_keywords,
        translated_faq_items: translatedObject.faq_items || postData.faq_items,
        translated_itinerary_days: translatedObject.itinerary_days || postData.itinerary_days,
      }

      console.log(`Post translation completed successfully for ${targetLanguage}`)
      return translatedData
    } catch (error) {
      console.error('Post translation error:', error)
      throw new Error(`Failed to translate post to ${targetLanguage}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get list of supported languages (expanded for lingo.dev)
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
      { code: 'cs', name: 'Czech', native_name: 'Čeština', flag_emoji: '🇨🇿' },
      { code: 'sk', name: 'Slovak', native_name: 'Slovenčina', flag_emoji: '🇸🇰' },
      { code: 'hu', name: 'Hungarian', native_name: 'Magyar', flag_emoji: '🇭🇺' },
      { code: 'ro', name: 'Romanian', native_name: 'Română', flag_emoji: '🇷🇴' },
      { code: 'bg', name: 'Bulgarian', native_name: 'Български', flag_emoji: '🇧🇬' },
      { code: 'hr', name: 'Croatian', native_name: 'Hrvatski', flag_emoji: '🇭🇷' },
      { code: 'sl', name: 'Slovenian', native_name: 'Slovenščina', flag_emoji: '🇸🇮' },
      { code: 'et', name: 'Estonian', native_name: 'Eesti', flag_emoji: '🇪🇪' },
      { code: 'lv', name: 'Latvian', native_name: 'Latviešu', flag_emoji: '🇱🇻' },
      { code: 'lt', name: 'Lithuanian', native_name: 'Lietuvių', flag_emoji: '🇱🇹' },
    ]
  }

  /**
   * Test translation service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing Lingo.dev with Google Gemini connection...')
      
      // Check if Google API key is available
      const testApiKey = process.env.GOOGLE_API_KEY
      if (!testApiKey) {
        return {
          success: false,
          message: 'No Google API key found. Please set GOOGLE_API_KEY environment variable.'
        }
      }
      
      console.log('Testing Google Gemini via lingo.dev...')
      console.log('API key details:', {
        hasKey: !!testApiKey,
        keyLength: testApiKey ? testApiKey.length : 0,
        keyPrefix: testApiKey ? testApiKey.substring(0, 10) + '...' : 'none'
      })
      
      // Test with a simple object translation
      const testObject = {
        greeting: 'Hello, world!',
        description: 'This is a travel blog about amazing destinations.'
      }

      const translatedResult = await this.engine.localizeObject(
        testObject,
        {
          sourceLocale: 'en',
          targetLocale: 'es',
          fast: true, // Use fast mode for testing
        }
      )

      if (translatedResult && translatedResult.greeting) {
        return {
          success: true,
          message: `Google Gemini via lingo.dev is working! Test translation: "${translatedResult.greeting}" - "${translatedResult.description}"`
        }
      } else {
        return {
          success: false,
          message: 'Google Gemini via lingo.dev test failed: No translation returned'
        }
      }
    } catch (error) {
      console.error('Lingo.dev connection test error:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      return {
        success: false,
        message: `Lingo.dev service connection failed: ${error instanceof Error ? error.message : 'Unknown error'} | Full error: ${JSON.stringify(error)}`
      }
    }
  }
}

export default LingoTranslationService