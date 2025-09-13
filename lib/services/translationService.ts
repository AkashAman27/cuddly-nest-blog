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

export class TranslationService {
  private apiKey: string
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_TRANSLATE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google Translate API key not provided. Translation features may not work.')
    }
  }

  /**
   * Translate text using Google Translate API
   */
  async translateText({ text, targetLanguage, sourceLanguage = 'en' }: TranslationRequest): Promise<TranslationResponse> {
    if (!this.apiKey) {
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: 'Google Translate API key not configured'
      }
    }

    try {
      console.log('Making Google Translate API call:', {
        textCount: Array.isArray(text) ? text.length : 1,
        targetLanguage,
        sourceLanguage
      })
      const isArray = Array.isArray(text)
      const textsToTranslate = isArray ? text : [text]

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: textsToTranslate,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Translate API error response:', errorText)
        throw new Error(`Translation API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Google Translate API response received:', { 
        translationsCount: data?.data?.translations?.length 
      })
      
      if (data.error) {
        throw new Error(data.error.message || 'Translation API error')
      }

      const translations = data.data.translations.map((t: any) => t.translatedText)
      
      return {
        translatedText: isArray ? translations : translations[0],
        detectedLanguage: data.data.translations[0]?.detectedSourceLanguage,
        success: true
      }
    } catch (error) {
      console.error('Translation error:', error)
      return {
        translatedText: Array.isArray(text) ? text : text,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown translation error'
      }
    }
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
      const translationTasks: Promise<any>[] = []
      const results: any = {}

      // Prepare all texts for translation
      const textsToTranslate: string[] = []
      const textMap: { [key: string]: number } = {}
      let textIndex = 0

      // Basic content
      if (postData.title) {
        textMap['title'] = textIndex++
        textsToTranslate.push(postData.title)
      }
      
      if (postData.excerpt) {
        textMap['excerpt'] = textIndex++
        textsToTranslate.push(postData.excerpt)
      }
      
      if (postData.content) {
        textMap['content'] = textIndex++
        textsToTranslate.push(postData.content)
      }

      // SEO content
      if (postData.seo_title) {
        textMap['seo_title'] = textIndex++
        textsToTranslate.push(postData.seo_title)
      }
      
      if (postData.seo_description) {
        textMap['seo_description'] = textIndex++
        textsToTranslate.push(postData.seo_description)
      }
      
      if (postData.seo_keywords) {
        textMap['seo_keywords'] = textIndex++
        textsToTranslate.push(postData.seo_keywords)
      }

      // FAQ items
      if (postData.faq_items && postData.faq_items.length > 0) {
        postData.faq_items.forEach((faq, idx) => {
          textMap[`faq_${idx}_question`] = textIndex++
          textsToTranslate.push(faq.question)
          textMap[`faq_${idx}_answer`] = textIndex++
          textsToTranslate.push(faq.answer)
        })
      }

      // Itinerary days
      if (postData.itinerary_days && postData.itinerary_days.length > 0) {
        postData.itinerary_days.forEach((day, idx) => {
          textMap[`itinerary_${idx}_title`] = textIndex++
          textsToTranslate.push(day.title)
          textMap[`itinerary_${idx}_description`] = textIndex++
          textsToTranslate.push(day.description)
          
          if (day.activities) {
            day.activities.forEach((activity, actIdx) => {
              textMap[`itinerary_${idx}_activity_${actIdx}`] = textIndex++
              textsToTranslate.push(activity)
            })
          }
        })
      }

      // Translate all texts at once for efficiency
      const translationResult = await this.translateText({
        text: textsToTranslate,
        targetLanguage
      })

      if (!translationResult.success) {
        throw new Error(translationResult.error || 'Translation failed')
      }

      const translations = Array.isArray(translationResult.translatedText) 
        ? translationResult.translatedText 
        : [translationResult.translatedText]

      // Map translations back to fields
      const translatedData: TranslatedPostData = {
        translated_title: postData.title ? translations[textMap['title']] : '',
      }

      if (postData.excerpt && textMap['excerpt'] !== undefined) {
        translatedData.translated_excerpt = translations[textMap['excerpt']]
      }
      
      if (postData.content && textMap['content'] !== undefined) {
        translatedData.translated_content = translations[textMap['content']]
      }
      
      if (postData.seo_title && textMap['seo_title'] !== undefined) {
        translatedData.translated_seo_title = translations[textMap['seo_title']]
      }
      
      if (postData.seo_description && textMap['seo_description'] !== undefined) {
        translatedData.translated_seo_description = translations[textMap['seo_description']]
      }
      
      if (postData.seo_keywords && textMap['seo_keywords'] !== undefined) {
        translatedData.translated_seo_keywords = translations[textMap['seo_keywords']]
      }

      // Reconstruct FAQ items
      if (postData.faq_items && postData.faq_items.length > 0) {
        translatedData.translated_faq_items = postData.faq_items.map((faq, idx) => ({
          question: translations[textMap[`faq_${idx}_question`]],
          answer: translations[textMap[`faq_${idx}_answer`]]
        }))
      }

      // Reconstruct itinerary days
      if (postData.itinerary_days && postData.itinerary_days.length > 0) {
        translatedData.translated_itinerary_days = postData.itinerary_days.map((day, idx) => ({
          day: day.day,
          title: translations[textMap[`itinerary_${idx}_title`]],
          description: translations[textMap[`itinerary_${idx}_description`]],
          activities: day.activities?.map((activity, actIdx) => 
            translations[textMap[`itinerary_${idx}_activity_${actIdx}`]]
          )
        }))
      }

      return translatedData
    } catch (error) {
      console.error('Post translation error:', error)
      throw error
    }
  }

  /**
   * Get list of supported languages
   */
  static getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸' },
      { code: 'de', name: 'German', native_name: 'Deutsch', flag_emoji: '🇩🇪' },
      { code: 'es', name: 'Spanish', native_name: 'Español', flag_emoji: '🇪🇸' },
      // Will add more languages later
      { code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷' },
      { code: 'it', name: 'Italian', native_name: 'Italiano', flag_emoji: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', native_name: 'Português', flag_emoji: '🇵🇹' },
      { code: 'ru', name: 'Russian', native_name: 'Русский', flag_emoji: '🇷🇺' },
      { code: 'ja', name: 'Japanese', native_name: '日本語', flag_emoji: '🇯🇵' },
      { code: 'ko', name: 'Korean', native_name: '한국어', flag_emoji: '🇰🇷' },
      { code: 'zh', name: 'Chinese', native_name: '中文', flag_emoji: '🇨🇳' }
    ]
  }
}

export default TranslationService