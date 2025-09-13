import { supabase } from '@/lib/supabase'

export interface LogoSettings {
  homepage_logo: {
    url: string
    alt: string
  }
  blog_logo: {
    url: string
    alt: string
  }
}

export async function getLogoSettings(): Promise<LogoSettings> {
  try {
    const { data, error } = await supabase
      .from('homepage_settings')
      .select('key, value')
      .in('key', ['logo_url', 'blog_logo_url'])

    if (error) throw error

    const settings: any = {}
    data?.forEach(item => {
      settings[item.key] = item.value
    })

    return {
      homepage_logo: settings.logo_url || { url: "/cuddlynest-logo.png", alt: "CuddlyNest" },
      blog_logo: settings.blog_logo_url || { url: "/cuddlynest-logo-pink.png", alt: "CuddlyNest" }
    }
  } catch (error) {
    console.error('Error loading logo settings:', error)
    // Return defaults if database fails
    return {
      homepage_logo: { url: "/cuddlynest-logo.png", alt: "CuddlyNest" },
      blog_logo: { url: "/cuddlynest-logo-pink.png", alt: "CuddlyNest" }
    }
  }
}