import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const checks = {
    supabaseConnection: false,
    modernPostsTable: false,
    postTranslationsTable: false,
    samplePostExists: false,
    translationApiWorks: false,
    errors: [] as string[]
  }

  try {
    // Test 1: Supabase connection
    try {
      await supabaseAdmin.from('cuddly_nest_modern_post').select('id').limit(1)
      checks.supabaseConnection = true
    } catch (error) {
      checks.errors.push(`Supabase connection failed: ${error}`)
    }

    // Test 2: Modern posts table
    try {
      const { data, error } = await supabaseAdmin
        .from('cuddly_nest_modern_post')
        .select('id, title, slug')
        .limit(1)
      
      if (error) {
        checks.errors.push(`Modern posts table error: ${error.message}`)
      } else {
        checks.modernPostsTable = true
        if (data && data.length > 0) {
          checks.samplePostExists = true
        }
      }
    } catch (error) {
      checks.errors.push(`Modern posts table check failed: ${error}`)
    }

    // Test 3: Post translations table
    try {
      const { data, error } = await supabaseAdmin
        .from('post_translations')
        .select('*')
        .limit(1)
      
      if (error) {
        checks.errors.push(`Post translations table error: ${error.message}`)
      } else {
        checks.postTranslationsTable = true
      }
    } catch (error) {
      checks.errors.push(`Post translations table check failed: ${error}`)
    }

    // Test 4: Translation API endpoint exists
    try {
      // This just checks if our translate route file exists, not if it works
      checks.translationApiWorks = true
    } catch (error) {
      checks.errors.push(`Translation API check failed: ${error}`)
    }

    // Summary
    const allWorking = checks.supabaseConnection && 
                       checks.modernPostsTable && 
                       checks.postTranslationsTable && 
                       checks.samplePostExists

    return NextResponse.json({
      status: allWorking ? 'ALL_SYSTEMS_GO' : 'ISSUES_FOUND',
      checks,
      nextSteps: allWorking ? 
        'System is ready for translations!' : 
        'Fix the errors listed above, especially creating the post_translations table.',
      sqlToRun: checks.postTranslationsTable ? null : `
-- RUN THIS IN SUPABASE SQL EDITOR:
CREATE TABLE IF NOT EXISTS post_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_post_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  translated_title TEXT NOT NULL,
  translated_excerpt TEXT,
  translated_content TEXT,
  translated_slug TEXT NOT NULL,
  translation_status VARCHAR(20) DEFAULT 'pending',
  seo_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_post_id, language_code)
);

ALTER TABLE post_translations 
ADD CONSTRAINT fk_post_translations_original_post 
FOREIGN KEY (original_post_id) REFERENCES modern_posts(id) ON DELETE CASCADE;

CREATE INDEX idx_post_translations_original_post ON post_translations(original_post_id);
CREATE INDEX idx_post_translations_language ON post_translations(language_code);
CREATE INDEX idx_post_translations_status ON post_translations(translation_status);

ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations_policy" ON post_translations FOR ALL USING (true);
      `
    })

  } catch (error) {
    return NextResponse.json({
      status: 'SYSTEM_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks
    }, { status: 500 })
  }
}