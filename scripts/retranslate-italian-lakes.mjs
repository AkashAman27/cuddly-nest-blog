import dotenv from 'dotenv'
import { supabase } from '../lib/supabase.js'
import DirectGeminiTranslationService from '../lib/services/directGeminiTranslationService.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function retranslateItalianLakes() {
  console.log('🔄 Re-translating Italian Lakes Region post to German\n')
  
  try {
    // Find the original post
    console.log('1. Finding original post...')
    const { data: originalPost, error: postError } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        sections:modern_post_sections(*)
      `)
      .eq('slug', 'italian-lakes-region-como-garda-maggiore-complete-guide')
      .single()

    if (postError || !originalPost) {
      console.error('❌ Could not find original post:', postError)
      return
    }

    console.log('✅ Found original post:', {
      id: originalPost.id,
      title: originalPost.title,
      sectionsCount: originalPost.sections?.length || 0
    })

    // Initialize translation service
    console.log('\n2. Initializing Direct Google Gemini translation service...')
    const translationService = new DirectGeminiTranslationService()
    
    // Test connection
    const connectionTest = await translationService.testConnection()
    if (!connectionTest.success) {
      console.error('❌ Translation service connection failed:', connectionTest.message)
      return
    }
    console.log('✅ Translation service ready')

    // Prepare post data for translation
    console.log('\n3. Preparing post data for translation...')
    const postData = {
      title: originalPost.title,
      excerpt: originalPost.excerpt,
      content: originalPost.content,
      seo_title: originalPost.seo_title,
      seo_description: originalPost.seo_description,
      seo_keywords: originalPost.seo_keywords,
      faq_items: originalPost.faq_items,
      itinerary_days: originalPost.itinerary_days,
      sections: originalPost.sections
    }

    console.log('Post data prepared:', {
      title: postData.title,
      hasExcerpt: !!postData.excerpt,
      hasContent: !!postData.content,
      hasSeoTitle: !!postData.seo_title,
      hasSeoDescription: !!postData.seo_description,
      faqCount: postData.faq_items?.length || 0,
      itineraryCount: postData.itinerary_days?.length || 0,
      sectionsCount: postData.sections?.length || 0
    })

    // Perform translation
    console.log('\n4. Translating post to German...')
    const translatedData = await translationService.translatePost(postData, 'de')
    
    console.log('✅ Translation completed:', {
      title: translatedData.translated_title,
      hasExcerpt: !!translatedData.translated_excerpt,
      hasContent: !!translatedData.translated_content,
      hasSeoTitle: !!translatedData.translated_seo_title,
      hasSeoDescription: !!translatedData.translated_seo_description,
      faqCount: translatedData.translated_faq_items?.length || 0,
      itineraryCount: translatedData.translated_itinerary_days?.length || 0
    })

    // Find existing translation
    console.log('\n5. Finding existing German translation...')
    const { data: existingTranslation } = await supabase
      .from('post_translations')
      .select('id')
      .eq('original_post_id', originalPost.id)
      .eq('language_code', 'de')
      .single()

    if (!existingTranslation) {
      console.error('❌ No existing German translation found')
      return
    }

    console.log('✅ Found existing translation ID:', existingTranslation.id)

    // Update the translation record
    console.log('\n6. Updating translation record...')
    const { error: updateError } = await supabase
      .from('post_translations')
      .update({
        translated_title: translatedData.translated_title,
        translated_slug: `italian-lakes-region-como-garda-maggiore-complete-guide/de`,
        translated_excerpt: translatedData.translated_excerpt,
        translated_content: translatedData.translated_content,
        translated_seo_title: translatedData.translated_seo_title,
        translated_seo_description: translatedData.translated_seo_description,
        translated_seo_keywords: translatedData.translated_seo_keywords,
        translated_faq_items: translatedData.translated_faq_items,
        translated_itinerary_days: translatedData.translated_itinerary_days,
        translation_status: 'completed',
        translation_service: 'direct_google_gemini',
        translated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTranslation.id)

    if (updateError) {
      console.error('❌ Failed to update translation record:', updateError)
      return
    }

    console.log('✅ Translation record updated successfully')

    // Translate sections if they exist
    if (originalPost.sections && originalPost.sections.length > 0) {
      console.log(`\n7. Translating ${originalPost.sections.length} sections...`)
      
      for (let i = 0; i < originalPost.sections.length; i++) {
        const section = originalPost.sections[i]
        console.log(`\n   Processing section ${i + 1}/${originalPost.sections.length}: ${section.template_id}`)
        
        // Extract translatable texts from section
        const sectionTexts = extractTranslatableTexts(section.data)
        console.log(`   Found ${sectionTexts.length} translatable texts`)
        
        if (sectionTexts.length > 0) {
          try {
            // Translate section texts
            const sectionTranslation = await translationService.translateText({
              text: sectionTexts,
              targetLanguage: 'de',
              sourceLanguage: 'en'
            })

            if (sectionTranslation.success) {
              const translatedTexts = Array.isArray(sectionTranslation.translatedText) 
                ? sectionTranslation.translatedText 
                : [sectionTranslation.translatedText]
              
              console.log(`   ✅ Section ${i + 1} translated successfully`)
              
              // Replace texts in section data
              const translatedSectionData = replaceSectionTexts(section.data, sectionTexts, translatedTexts)
              
              // Save translated section
              const { error: sectionError } = await supabase
                .from('translated_sections')
                .upsert({
                  translation_id: existingTranslation.id,
                  original_section_id: section.id,
                  translated_data: translatedSectionData,
                  position: section.position,
                  updated_at: new Date().toISOString()
                })

              if (sectionError) {
                console.error(`   ❌ Error saving section ${i + 1}:`, sectionError)
              } else {
                console.log(`   💾 Section ${i + 1} saved successfully`)
              }
            } else {
              console.error(`   ❌ Translation failed for section ${i + 1}:`, sectionTranslation.error)
            }
          } catch (sectionError) {
            console.error(`   ❌ Error processing section ${i + 1}:`, sectionError)
          }
        } else {
          console.log(`   ⚠️ No translatable content in section ${i + 1}`)
        }
        
        // Add small delay between sections
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log('\n🎉 Italian Lakes post re-translation completed successfully!')
    console.log('🔗 Check the result at: http://localhost:3000/blog/italian-lakes-region-como-garda-maggiore-complete-guide/de')
    
    console.log('\n📊 Translation Summary:')
    console.log(`   📝 Title: "${translatedData.translated_title}"`)
    console.log(`   📄 Excerpt: ${translatedData.translated_excerpt ? '✅' : '❌'}`)
    console.log(`   📖 Content: ${translatedData.translated_content ? '✅' : '❌'}`)
    console.log(`   🔍 SEO Title: ${translatedData.translated_seo_title ? '✅' : '❌'}`)
    console.log(`   🔍 SEO Description: ${translatedData.translated_seo_description ? '✅' : '❌'}`)
    console.log(`   ❓ FAQ Items: ${translatedData.translated_faq_items?.length || 0}`)
    console.log(`   🗓️ Itinerary Days: ${translatedData.translated_itinerary_days?.length || 0}`)
    console.log(`   📋 Sections: ${originalPost.sections?.length || 0}`)

  } catch (error) {
    console.error('\n❌ Re-translation failed:', error.message)
    console.error('Error details:', error)
  }
}

// Helper function to extract translatable texts from section data
function extractTranslatableTexts(sectionData) {
  const texts = []
  
  function extractFromObject(obj) {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      
      // Skip URLs, technical data, and very short strings
      if (trimmed.length > 2 && 
          !trimmed.includes('http://') && 
          !trimmed.includes('https://') &&
          !trimmed.startsWith('#') && // Skip CSS colors
          !trimmed.includes('px') && // Skip CSS measurements
          !trimmed.includes('%') && // Skip percentages
          !trimmed.match(/^\d+$/) && // Skip pure numbers
          !trimmed.includes('data:image') && // Skip data URLs
          !trimmed.includes('.jpg') && // Skip image paths
          !trimmed.includes('.png') &&
          !trimmed.includes('.webp')) {
        texts.push(trimmed)
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractFromObject(item))
    } else if (obj && typeof obj === 'object') {
      // Skip certain keys that shouldn't be translated
      const skipKeys = [
        'url', 'image', 'src', 'href', 'id', 'className', 'style', 
        'width', 'height', 'alt', 'type', 'template_id', 'sort_order',
        'is_active', 'created_at', 'updated_at', 'file_url', 'public_url'
      ]
      
      Object.keys(obj).forEach(key => {
        if (!skipKeys.some(skipKey => key.toLowerCase().includes(skipKey.toLowerCase()))) {
          extractFromObject(obj[key])
        }
      })
    }
  }
  
  extractFromObject(sectionData)
  
  // Remove duplicates
  return [...new Set(texts)]
}

// Helper function to replace texts in section data
function replaceSectionTexts(sectionData, originalTexts, translatedTexts) {
  const textMap = new Map()
  
  // Create mapping of original to translated texts
  for (let i = 0; i < Math.min(originalTexts.length, translatedTexts.length); i++) {
    if (originalTexts[i] && translatedTexts[i]) {
      textMap.set(originalTexts[i].trim(), translatedTexts[i])
    }
  }
  
  function replaceInObject(obj) {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      const translation = textMap.get(trimmed)
      return translation || obj
    } else if (Array.isArray(obj)) {
      return obj.map(item => replaceInObject(item))
    } else if (obj && typeof obj === 'object') {
      const result = {}
      Object.keys(obj).forEach(key => {
        result[key] = replaceInObject(obj[key])
      })
      return result
    }
    
    return obj
  }
  
  return replaceInObject(sectionData)
}

// Run the re-translation
retranslateItalianLakes()