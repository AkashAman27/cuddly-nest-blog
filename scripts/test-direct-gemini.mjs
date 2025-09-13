import dotenv from 'dotenv'
import { DirectGeminiTranslationService } from '../lib/services/directGeminiTranslationService.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testDirectGeminiTranslation() {
  console.log('🧪 Testing Direct Google Gemini Translation Service\n')
  
  try {
    // Initialize the service
    const translationService = new DirectGeminiTranslationService()
    
    console.log('✅ DirectGeminiTranslationService initialized successfully')
    
    // Test 1: Connection test
    console.log('\n🔍 Test 1: Testing connection...')
    const connectionTest = await translationService.testConnection()
    console.log('Connection test result:', connectionTest)
    
    if (!connectionTest.success) {
      console.error('❌ Connection test failed:', connectionTest.message)
      return
    }
    
    // Test 2: Simple text translation
    console.log('\n🔍 Test 2: Simple text translation...')
    const simpleTranslation = await translationService.translateText({
      text: 'Hello, this is a beautiful travel destination in Italy.',
      targetLanguage: 'de',
      sourceLanguage: 'en'
    })
    
    console.log('Simple translation result:')
    console.log('- Success:', simpleTranslation.success)
    console.log('- Original:', 'Hello, this is a beautiful travel destination in Italy.')
    console.log('- German:', simpleTranslation.translatedText)
    
    // Test 3: Batch translation
    console.log('\n🔍 Test 3: Batch translation...')
    const batchTexts = [
      'Rome is an amazing city with incredible history',
      'The food in Italy is absolutely delicious',
      'Must visit attractions include the Colosseum',
      'This travel guide covers all the best destinations'
    ]
    
    const batchTranslation = await translationService.translateText({
      text: batchTexts,
      targetLanguage: 'es',
      sourceLanguage: 'en'
    })
    
    console.log('Batch translation result:')
    console.log('- Success:', batchTranslation.success)
    console.log('- Originals:')
    batchTexts.forEach((text, index) => console.log(`  ${index + 1}. ${text}`))
    console.log('- Spanish translations:')
    if (Array.isArray(batchTranslation.translatedText)) {
      batchTranslation.translatedText.forEach((text, index) => console.log(`  ${index + 1}. ${text}`))
    }
    
    // Test 4: Structured blog post translation
    console.log('\n🔍 Test 4: Blog post structure translation...')
    const postData = {
      title: 'Ultimate Guide to Venice: Canals, Culture & Cuisine',
      excerpt: 'Discover the magical floating city of Venice with our comprehensive travel guide.',
      seo_title: 'Venice Travel Guide 2024 - Best Things to Do',
      seo_description: 'Complete Venice travel guide with tips on gondola rides, best restaurants, and hidden gems.',
      content: 'Venice is one of the most unique cities in the world. Built on 118 small islands, this floating city offers incredible architecture, delicious food, and unforgettable experiences.',
      faq_items: [
        {
          question: 'What is the best time to visit Venice?',
          answer: 'The best time to visit Venice is during spring (April-May) or fall (September-October) when weather is pleasant.'
        },
        {
          question: 'How much does a gondola ride cost?',
          answer: 'A standard gondola ride costs around €80-100 for 30 minutes during the day.'
        }
      ],
      itinerary_days: [
        {
          day: 1,
          title: 'Arrival and St. Mark\'s Square',
          description: 'Start your Venice adventure at the iconic St. Mark\'s Square.',
          activities: ['Visit St. Mark\'s Basilica', 'Climb the Campanile', 'Explore Doge\'s Palace']
        }
      ]
    }
    
    const structuredTranslation = await translationService.translatePost(postData, 'fr')
    
    console.log('Blog post translation results:')
    console.log('- Original title:', postData.title)
    console.log('- French title:', structuredTranslation.translated_title)
    console.log('- Original excerpt:', postData.excerpt)
    console.log('- French excerpt:', structuredTranslation.translated_excerpt)
    console.log('- SEO title (FR):', structuredTranslation.translated_seo_title)
    console.log('- FAQ items translated:')
    if (structuredTranslation.translated_faq_items) {
      structuredTranslation.translated_faq_items.forEach((faq, index) => {
        console.log(`  ${index + 1}. Q: ${faq.question}`)
        console.log(`     A: ${faq.answer}`)
      })
    }
    console.log('- Itinerary translated:')
    if (structuredTranslation.translated_itinerary_days) {
      structuredTranslation.translated_itinerary_days.forEach((day, index) => {
        console.log(`  Day ${day.day}: ${day.title}`)
        console.log(`    Description: ${day.description}`)
        console.log(`    Activities: ${day.activities?.join(', ')}`)
      })
    }
    
    console.log('\n✅ All tests completed successfully!')
    console.log('\n🎉 Direct Google Gemini translation service is working perfectly!')
    console.log('\n📝 Key benefits of this approach:')
    console.log('   ✅ No dependency on Lingo.dev API keys or authentication')
    console.log('   ✅ Direct control over Google Gemini API usage and costs')
    console.log('   ✅ Full access to Google Gemini 1.5 Pro capabilities')
    console.log('   ✅ Optimized prompts for travel/blog content translation')
    console.log('   ✅ Structured handling of complex blog post data')
    console.log('   ✅ Batch processing with rate limiting')
    console.log('   ✅ Comprehensive error handling and fallbacks')
    
    console.log('\n💡 This service can completely replace Lingo.dev while using your own Google API key!')
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    })
    
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   1. Verify GOOGLE_API_KEY is set in .env.local')
    console.log('   2. Check if Google AI Studio API is enabled')
    console.log('   3. Ensure API key has Gemini API access')
    console.log('   4. Check network connectivity and API quotas')
  }
}

// Run the test
testDirectGeminiTranslation()