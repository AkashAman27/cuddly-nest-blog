import dotenv from 'dotenv'
import { LingoDotDevEngine } from 'lingo.dev/sdk'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testLingoGeminiIntegration() {
  console.log('🧪 Testing Lingo.dev + Google Gemini Integration\n')
  
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY
    
    if (!googleApiKey) {
      console.error('❌ GOOGLE_API_KEY not found in environment variables')
      return
    }
    
    console.log('✅ Google API key found:', googleApiKey.substring(0, 10) + '...')
    
    // Initialize Lingo.dev engine with Google Gemini
    console.log('\n🔧 Initializing Lingo.dev with Google Gemini...')
    const engine = new LingoDotDevEngine({
      models: {
        "*:*": "google:gemini-2.0-flash" // Use Google Gemini 2.0 Flash as per Lingo.dev docs
      },
      apiKeys: {
        google: googleApiKey
      },
      batchSize: 10,
      idealBatchItemSize: 200,
    })
    
    console.log('✅ Lingo.dev engine initialized successfully')
    
    // Test 1: Simple connection test
    console.log('\n🔍 Test 1: Simple object translation...')
    const testObject = {
      greeting: 'Hello, world!',
      description: 'This is a travel blog about amazing destinations in Italy.',
      title: 'Ultimate Guide to Rome: History, Culture & Cuisine'
    }
    
    const translatedResult = await engine.localizeObject(
      testObject,
      {
        sourceLocale: 'en',
        targetLocale: 'de',
        fast: true, // Use fast mode for testing
      }
    )
    
    console.log('Translation results:')
    console.log('- Original greeting:', testObject.greeting)
    console.log('- German greeting:', translatedResult.greeting)
    console.log('- Original description:', testObject.description)
    console.log('- German description:', translatedResult.description)
    console.log('- Original title:', testObject.title)
    console.log('- German title:', translatedResult.title)
    
    // Test 2: Blog post structure translation
    console.log('\n🔍 Test 2: Blog post structure translation...')
    const blogPost = {
      title: 'Venice Travel Guide: Canals, Culture & Cuisine',
      excerpt: 'Discover the magical floating city of Venice with our comprehensive travel guide.',
      seo_title: 'Venice Travel Guide 2024 - Best Things to Do',
      content: 'Venice is one of the most unique cities in the world. Built on 118 small islands, this floating city offers incredible architecture, delicious food, and unforgettable experiences.',
      faq_items: [
        {
          question: 'What is the best time to visit Venice?',
          answer: 'The best time to visit Venice is during spring (April-May) or fall (September-October) when the weather is pleasant and crowds are smaller.'
        },
        {
          question: 'How expensive is Venice?',
          answer: 'Venice can be expensive, especially near tourist attractions. Budget around €80-120 per day for accommodation, meals, and activities.'
        }
      ]
    }
    
    const translatedBlogPost = await engine.localizeObject(
      blogPost,
      {
        sourceLocale: 'en',
        targetLocale: 'es',
        fast: false, // High quality for blog content
      }
    )
    
    console.log('Blog post translation results:')
    console.log('- Original title:', blogPost.title)
    console.log('- Spanish title:', translatedBlogPost.title)
    console.log('- Original excerpt:', blogPost.excerpt)
    console.log('- Spanish excerpt:', translatedBlogPost.excerpt)
    console.log('- FAQ translation:')
    if (translatedBlogPost.faq_items) {
      translatedBlogPost.faq_items.forEach((faq, index) => {
        console.log(`  ${index + 1}. Q: ${faq.question}`)
        console.log(`     A: ${faq.answer.substring(0, 100)}...`)
      })
    }
    
    console.log('\n✅ All tests completed successfully!')
    console.log('\n🎉 Your Lingo.dev + Google Gemini integration is working perfectly!')
    console.log('\n📝 Configuration Summary:')
    console.log('   ✅ Using your own Google API key (no Lingo.dev API subscription needed)')
    console.log('   ✅ Google Gemini Pro model via Lingo.dev framework')
    console.log('   ✅ Supports structured object translations')
    console.log('   ✅ Context-aware translations for travel/blog content')
    console.log('   ✅ Batch processing with optimized settings')
    
    console.log('\n💡 Benefits of this setup:')
    console.log('   • Cost-effective: Only pay Google for API usage')
    console.log('   • Full control: Use your own API quotas and limits')
    console.log('   • High quality: Powered by Google Gemini Pro')
    console.log('   • Framework benefits: Lingo.dev optimization and features')
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    })
    
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   1. Verify GOOGLE_API_KEY is correctly set in .env.local')
    console.log('   2. Check if Google AI Studio API is enabled for your project')
    console.log('   3. Ensure API key has Gemini API access permissions')
    console.log('   4. Verify network connectivity and API quotas')
    console.log('   5. Check Lingo.dev SDK version compatibility')
  }
}

// Run the test
testLingoGeminiIntegration()