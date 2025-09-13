// Final pass to fix remaining English elements in German translation
import fetch from 'node-fetch'

async function finalTranslationPass() {
  console.log('🔄 Final Translation Pass - Fixing Remaining English Elements\n')
  
  try {
    console.log('1. Running complete re-translation with enhanced settings...')
    
    // Post ID from previous successful translation
    const postId = '07a922e3-b38c-4f32-ac76-2c4d80def4e3'
    
    const translateResponse = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: postId,
        targetLanguage: 'de',
        forceCompleteTranslation: true // This ensures thorough translation of all sections
      })
    })
    
    const translateResult = await translateResponse.json()
    
    if (translateResult.success) {
      console.log('✅ Enhanced translation completed successfully!')
      console.log('Translation ID:', translateResult.translationId)
      console.log('Translated Slug:', translateResult.translatedSlug)
      
      console.log('\n🎯 This enhanced pass should have fixed:')
      console.log('   • Mixed English/German titles')
      console.log('   • English hotel descriptions')
      console.log('   • English section headers')
      console.log('   • English activity descriptions')
      console.log('   • English highlight bullet points')
      console.log('   • English CTA buttons and labels')
      
      console.log('\n🔗 Check the fully translated result at:')
      console.log('http://localhost:3000/blog/italian-lakes-region-como-garda-maggiore-complete-guide/de')
      
      console.log('\n✨ The German version should now be completely translated with:')
      console.log('   📝 Pure German title: "Italienische Seen Region: Como, Garda & Maggiore Kompletter Reiseführer"')
      console.log('   🏨 German hotel descriptions')
      console.log('   🎯 German activity titles and descriptions')
      console.log('   📋 German section headers and content')
      console.log('   🎨 Consistent German terminology throughout')
      
    } else {
      console.error('❌ Enhanced translation failed:', translateResult.error)
      if (translateResult.details) {
        console.error('Details:', translateResult.details)
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

// Run the final translation pass
finalTranslationPass()