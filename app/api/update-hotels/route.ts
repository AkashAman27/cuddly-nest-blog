import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const sectionId = "6cffbf3c-44ff-4f04-8b46-96bacf940e8f" // Rotterdam nightlife hotels section

    const completeHotelsData = {
      title: "Where to Stay for Nightlife",
      description: "Stay close to the action with these recommendations, from budget party hostels to luxury hotels near the best venues.",
      hotels: [
        {
          name: "citizenM Rotterdam",
          image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
          rating: 4.5,
          reviews: 2840,
          category: "Design Hotel",
          location: "City Center",
          amenities: ["24/7 Bar", "Modern Design", "Tech Features", "Gym"],
          description: "Tech-savvy hotel with 24/7 bar and modern rooms, perfect for night owls",
          originalPrice: 150,
          pricePerNight: 120
        },
        {
          name: "Hotel V Nesplein",
          image: "https://images.unsplash.com/photo-1555554877-f8b4d2d3e8d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
          rating: 4.3,
          reviews: 1650,
          category: "Boutique Hotel",
          location: "Witte de With",
          amenities: ["Rooftop Bar", "Restaurant", "Bike Rental", "Concierge"],
          description: "Stylish hotel in the cultural district with excellent rooftop bar",
          originalPrice: 120,
          pricePerNight: 95
        },
        {
          name: "Mainport Design Hotel",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
          rating: 4.6,
          reviews: 3200,
          category: "Luxury Hotel",
          location: "Waterfront",
          amenities: ["Spa", "River Views", "Fine Dining", "Bar"],
          description: "Waterfront luxury with stunning river views and upscale dining",
          originalPrice: 200,
          pricePerNight: 165
        },
        {
          name: "The James Rotterdam",
          image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
          rating: 4.4,
          reviews: 1890,
          category: "Boutique Hotel",
          location: "Cool District",
          amenities: ["Cocktail Bar", "Workspace", "Fitness", "Terrace"],
          description: "Hip boutique hotel in trendy neighborhood with craft cocktails",
          originalPrice: 140,
          pricePerNight: 115
        },
        {
          name: "Rotterdam Marriott Hotel",
          image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
          rating: 4.2,
          reviews: 4500,
          category: "Business Hotel",
          location: "City Center",
          amenities: ["Executive Lounge", "Business Center", "Restaurant", "Bar"],
          description: "Central business hotel with executive amenities and easy nightlife access",
          originalPrice: 180,
          pricePerNight: 145
        }
      ]
    }

    // Update the section
    const { error } = await supabase
      .from('modern_post_sections')
      .update({
        data: completeHotelsData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Hotels data updated successfully',
      hotelsCount: completeHotelsData.hotels.length
    })

  } catch (error) {
    console.error('Update hotels error:', error)
    return NextResponse.json({ 
      error: 'Failed to update hotels data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}