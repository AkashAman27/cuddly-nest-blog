import { supabase } from './supabase'
import { createStarterPackSection } from './supabase'

// Additional starter pack management functions
export async function getAllStarterPackSections() {
  const { data, error } = await supabase
    .from('starter_pack_sections')
    .select(`
      *,
      starter_pack_highlights(*),
      starter_pack_features(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all starter pack sections:', error)
    return []
  }

  return data || []
}

export async function createSampleStarterPackData(postId: string, destination: string) {
  try {
    const sampleData = {
      post_id: postId,
      badge: `🏰 Your ${destination} starter pack`,
      title: 'Why this destination hits different',
      description: 'Every destination has its magic - from that first moment you arrive to your last sunset, every experience here feels like it\'s straight out of a dream. And honestly? The hype is real.',
      position: 1,
      highlights: [
        {
          icon: 'clock',
          title: 'Perfect Duration',
          value: '5-7 days',
          description: 'Just right to fall in love',
          order_index: 0
        },
        {
          icon: 'dollar',
          title: 'Budget Range',
          value: '€100-300',
          description: 'Per day, your way',
          order_index: 1
        },
        {
          icon: 'camera',
          title: 'Must-See Spots',
          value: '10+',
          description: 'Instagram-worthy moments',
          order_index: 2
        },
        {
          icon: 'heart',
          title: 'Vibe Check',
          value: 'Pure magic',
          description: 'You\'ll never want to leave',
          order_index: 3
        }
      ],
      features: [
        {
          title: 'Culture that actually slaps',
          content: 'From world-class museums to street art scenes, this destination serves culture on every corner. It\'s giving main character energy, and you\'re here for it.',
          order_index: 0
        },
        {
          title: 'Experiences that change your life',
          content: 'From hidden local gems to iconic landmarks, every moment here is designed to create lasting memories. One visit and you\'ll understand the hype.',
          order_index: 1
        }
      ]
    }

    return await createStarterPackSection(
      sampleData.post_id,
      sampleData.badge,
      sampleData.title,
      sampleData.description,
      sampleData.position,
      sampleData.highlights,
      sampleData.features
    )
  } catch (error) {
    console.error('Error creating sample starter pack data:', error)
    return null
  }
}

export async function updateStarterPackSection(data: {
  starterPackId: string
  badge?: string
  title?: string
  description?: string
  position?: number
  highlights?: any[]
  features?: any[]
}) {
  try {
    const { data: result, error } = await supabase
      .rpc('update_starter_pack_section', {
        starter_pack_id_param: data.starterPackId,
        badge_param: data.badge || null,
        title_param: data.title || null,
        description_param: data.description || null,
        position_param: data.position || null,
        highlights_param: data.highlights ? JSON.stringify(data.highlights) : null,
        features_param: data.features ? JSON.stringify(data.features) : null
      })

    if (error) {
      console.error('Error updating starter pack section:', error)
      return null
    }

    return result
  } catch (error) {
    console.error('Exception updating starter pack section:', error)
    return null
  }
}

export async function deleteStarterPackSection(starterPackId: string) {
  try {
    const { error } = await supabase
      .from('starter_pack_sections')
      .delete()
      .eq('id', starterPackId)

    if (error) {
      console.error('Error deleting starter pack section:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception deleting starter pack section:', error)
    return false
  }
}