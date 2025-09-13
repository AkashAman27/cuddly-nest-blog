'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Heart } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import Link from "next/link"

interface HotelCarouselProps {
  title?: string
  description?: string
  destination?: string
  hotels?: Array<{
    name: string
    image: string
    rating: number
    reviews: number
    category?: string
    location?: string
    amenities?: string[]
    description?: string
    originalPrice?: number
    pricePerNight: number
  }>
}

export function HotelCarousel({ 
  title = "Where to Stay",
  description = "Find the perfect accommodation for your trip",
  destination = "the area",
  hotels: providedHotels
}: HotelCarouselProps) {
  
  // Debug: Log what data we're receiving
  console.log('HotelCarousel received data:', {
    title,
    description,
    destination,
    providedHotels: providedHotels?.length || 0,
    firstHotel: providedHotels?.[0]
  })
  
  // Generate hotels based on destination
  const getHotelsForDestination = (dest: string) => {
    if (dest.toLowerCase().includes('rotterdam')) {
      return [
        {
          id: 1,
          name: "Mainport Design Hotel",
          description: "Luxury waterfront hotel with spa and river views, perfect for nightlife enthusiasts",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 1240,
          price: "From €180",
          amenities: ["Spa", "River views", "24h service"],
          location: "Waterfront District"
        },
        {
          id: 2,
          name: "Hotel New York",
          description: "Historic landmark in former Holland America Line building",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 890,
          price: "From €145",
          amenities: ["Historic", "Restaurant", "Harbor location"],
          location: "Kop van Zuid"
        },
        {
          id: 3,
          name: "nhow Rotterdam",
          description: "Design hotel with modern art, close to nightlife districts",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 1650,
          price: "From €120",
          amenities: ["Modern design", "Central", "Fitness"],
          location: "City Center"
        },
        {
          id: 4,
          name: "Hilton Rotterdam",
          description: "Premium hotel with rooftop bar overlooking the skyline",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 2100,
          price: "From €165",
          amenities: ["Rooftop bar", "City views", "Business center"],
          location: "Weena District"
        },
        {
          id: 5,
          name: "Student Hotel Rotterdam",
          description: "Trendy budget-friendly option with social spaces",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 750,
          price: "From €85",
          amenities: ["Social spaces", "Budget", "Modern"],
          location: "Blijdorp"
        },
        {
          id: 6,
          name: "Rotterdam Marriott",
          description: "Upscale hotel in heart of the city, walking distance to nightlife",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1890,
          price: "From €155",
          amenities: ["Central", "Executive lounge", "Fitness"],
          location: "City Center"
        }
      ]
    } else if (dest.toLowerCase().includes('paris')) {
      return [
        {
          id: 1,
          name: "Hotel Plaza Athénée",
          description: "Luxury palace hotel on the prestigious Avenue Montaigne",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 2340,
          price: "From €650",
          amenities: ["Palace", "Michelin dining", "Spa"],
          location: "8th Arrondissement"
        },
        {
          id: 2,
          name: "Hotel des Grands Boulevards",
          description: "Boutique hotel in the vibrant Grands Boulevards district",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 890,
          price: "From €180",
          amenities: ["Boutique", "Restaurant", "Central"],
          location: "2nd Arrondissement"
        },
        {
          id: 3,
          name: "Hotel Malte Opera",
          description: "Charming hotel near Opera and department stores",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 1200,
          price: "From €150",
          amenities: ["Opera district", "Shopping", "Classic"],
          location: "2nd Arrondissement"
        },
        {
          id: 4,
          name: "Hotel des Batignolles",
          description: "Modern eco-friendly hotel in trendy Batignolles",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 980,
          price: "From €120",
          amenities: ["Eco-friendly", "Trendy area", "Modern"],
          location: "17th Arrondissement"
        },
        {
          id: 5,
          name: "Hotel Jeanne d'Arc",
          description: "Budget-friendly hotel in historic Marais district",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.2,
          reviews: 650,
          price: "From €95",
          amenities: ["Historic Marais", "Budget", "Authentic"],
          location: "4th Arrondissement"
        },
        {
          id: 6,
          name: "Hotel National Des Arts et Métiers",
          description: "Stylish hotel celebrating French craftsmanship",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 1450,
          price: "From €190",
          amenities: ["Design hotel", "Arts district", "Stylish"],
          location: "3rd Arrondissement"
        }
      ]
    } else if (dest.toLowerCase().includes('italian') && dest.toLowerCase().includes('lakes')) {
      return [
        {
          id: 1,
          name: "Villa d'Este, Lake Como",
          description: "Legendary luxury villa hotel with Renaissance gardens and lake views",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 1890,
          price: "From €800",
          amenities: ["Private beach", "Spa", "Gardens"],
          location: "Cernobbio, Lake Como"
        },
        {
          id: 2,
          name: "Grand Hotel Tremezzo",
          description: "Art Nouveau palace hotel with floating pool and lake panoramas",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 1450,
          price: "From €650",
          amenities: ["Floating pool", "Michelin dining", "Spa"],
          location: "Tremezzo, Lake Como"
        },
        {
          id: 3,
          name: "Villa San Martino",
          description: "Boutique lakeside retreat with panoramic terraces",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 980,
          price: "From €350",
          amenities: ["Lake views", "Boutique", "Terraces"],
          location: "Griante, Lake Como"
        },
        {
          id: 4,
          name: "Lefay Resort & Spa Lago di Garda",
          description: "Eco-luxury resort overlooking Lake Garda with world-class spa",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 1650,
          price: "From €480",
          amenities: ["Eco-luxury", "Spa resort", "Lake views"],
          location: "Gargnano, Lake Garda"
        },
        {
          id: 5,
          name: "Hotel Villa & Palazzo Aminta",
          description: "Historic villa hotel on Lake Maggiore with gardens",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1200,
          price: "From €280",
          amenities: ["Historic villa", "Gardens", "Lake access"],
          location: "Stresa, Lake Maggiore"
        },
        {
          id: 6,
          name: "Hotel Belvedere Bellagio",
          description: "Family-run hotel in the pearl of Lake Como",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 850,
          price: "From €220",
          amenities: ["Family-run", "Central Bellagio", "Lake views"],
          location: "Bellagio, Lake Como"
        },
        {
          id: 7,
          name: "Hotel Villa Serbelloni",
          description: "Grand Belle Époque hotel overlooking Lake Como with luxury spa",
          image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          rating: 4.8,
          reviews: 1340,
          price: "From €550",
          amenities: ["Belle Époque elegance", "Luxury spa", "Como views"],
          location: "Bellagio, Lake Como"
        },
        {
          id: 8,
          name: "Palazzo Feltrinelli",
          description: "Exclusive lakefront retreat on Lake Garda with private beach",
          image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2980&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHhwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          rating: 4.9,
          reviews: 890,
          price: "From €750",
          amenities: ["Private beach", "Exclusive retreat", "Garda lakefront"],
          location: "Gargnano, Lake Garda"
        }
      ]
    } else if (dest.toLowerCase().includes('rome')) {
      return [
        {
          id: 1,
          name: "Hotel de Russie",
          description: "Luxury hotel near Spanish Steps with secret garden",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 2340,
          price: "From €550",
          amenities: ["Secret garden", "Luxury spa", "Central"],
          location: "Via del Babuino"
        },
        {
          id: 2,
          name: "The First Roma Dolce",
          description: "Contemporary luxury near Termini with rooftop terrace",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1890,
          price: "From €280",
          amenities: ["Rooftop terrace", "Modern", "Central station"],
          location: "Termini Area"
        },
        {
          id: 3,
          name: "Hotel Artemide",
          description: "4-star elegance near Trevi Fountain and opera house",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 1650,
          price: "From €180",
          amenities: ["Near Trevi", "Opera house", "Business center"],
          location: "Via Nazionale"
        },
        {
          id: 4,
          name: "Generator Rome",
          description: "Stylish hostel and hotel in trendy Monti district",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.3,
          reviews: 2890,
          price: "From €85",
          amenities: ["Trendy Monti", "Social spaces", "Budget-friendly"],
          location: "Monti District"
        },
        {
          id: 5,
          name: "Casa Montani",
          description: "Boutique B&B near Pantheon with personalized service",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 750,
          price: "From €150",
          amenities: ["Near Pantheon", "Boutique", "Personal service"],
          location: "Historic Center"
        },
        {
          id: 6,
          name: "The First Roma Arte",
          description: "Art-themed hotel with contemporary Roman design",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 1320,
          price: "From €220",
          amenities: ["Art-themed", "Modern design", "Cultural area"],
          location: "Prati District"
        }
      ]
    } else if (dest.toLowerCase().includes('venice')) {
      return [
        {
          id: 1,
          name: "The Gritti Palace",
          description: "Legendary palace hotel on the Grand Canal",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 1890,
          price: "From €900",
          amenities: ["Grand Canal", "Palace luxury", "Historic"],
          location: "Grand Canal"
        },
        {
          id: 2,
          name: "Hotel Danieli",
          description: "Gothic palace hotel near St. Mark's Square",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 2340,
          price: "From €650",
          amenities: ["Near St. Mark's", "Gothic palace", "Luxury"],
          location: "San Marco"
        },
        {
          id: 3,
          name: "Pensione Guerrato",
          description: "Historic guesthouse near Rialto Bridge",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 890,
          price: "From €120",
          amenities: ["Near Rialto", "Historic", "Budget-friendly"],
          location: "San Polo"
        },
        {
          id: 4,
          name: "Ca' Sagredo Hotel",
          description: "15th-century palace with Grand Canal views",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 1450,
          price: "From €480",
          amenities: ["15th-century", "Canal views", "Palace"],
          location: "Cannaregio"
        },
        {
          id: 5,
          name: "Generator Venice",
          description: "Modern hostel on Giudecca Island with Venice views",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.2,
          reviews: 1650,
          price: "From €65",
          amenities: ["Island location", "Venice views", "Modern"],
          location: "Giudecca"
        },
        {
          id: 6,
          name: "Palazzo Stern",
          description: "Boutique palace hotel with canal-side dining",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 980,
          price: "From €350",
          amenities: ["Canal-side", "Boutique palace", "Dining"],
          location: "Dorsoduro"
        }
      ]
    } else if (dest.toLowerCase().includes('florence')) {
      return [
        {
          id: 1,
          name: "Four Seasons Hotel Firenze",
          description: "Renaissance palace with the largest private garden in Florence",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 1650,
          price: "From €700",
          amenities: ["Private garden", "Renaissance palace", "Luxury"],
          location: "Borgo Pinti"
        },
        {
          id: 2,
          name: "Hotel Davanzati",
          description: "Boutique hotel in historic palazzo near Ponte Vecchio",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1230,
          price: "From €180",
          amenities: ["Near Ponte Vecchio", "Historic palazzo", "Boutique"],
          location: "Historic Center"
        },
        {
          id: 3,
          name: "Plus Florence",
          description: "Modern hostel with rooftop terrace and social spaces",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.3,
          reviews: 2150,
          price: "From €45",
          amenities: ["Rooftop terrace", "Social spaces", "Modern"],
          location: "Santa Maria Novella"
        },
        {
          id: 4,
          name: "Villa Cora",
          description: "Historic villa hotel with panoramic city views",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 890,
          price: "From €420",
          amenities: ["City views", "Historic villa", "Gardens"],
          location: "Oltrarno"
        },
        {
          id: 5,
          name: "Hotel Pendini",
          description: "Family-run hotel in Piazza della Repubblica",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 1450,
          price: "From €140",
          amenities: ["Central square", "Family-run", "Traditional"],
          location: "Piazza della Repubblica"
        },
        {
          id: 6,
          name: "Portrait Firenze",
          description: "Luxury suites overlooking the Arno River",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 750,
          price: "From €550",
          amenities: ["Arno views", "Luxury suites", "Central"],
          location: "Via de' Tornabuoni"
        }
      ]
    } else if (dest.toLowerCase().includes('naples') || dest.toLowerCase().includes('amalfi')) {
      return [
        {
          id: 1,
          name: "Belmond Hotel Caruso",
          description: "Clifftop palazzo in Ravello with infinity pool",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 1450,
          price: "From €800",
          amenities: ["Infinity pool", "Clifftop views", "Palazzo"],
          location: "Ravello"
        },
        {
          id: 2,
          name: "Hotel Santa Caterina",
          description: "Family-owned luxury hotel in Amalfi with private beach",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 1890,
          price: "From €650",
          amenities: ["Private beach", "Family-owned", "Luxury"],
          location: "Amalfi"
        },
        {
          id: 3,
          name: "Le Sirenuse",
          description: "Iconic hotel in Positano with panoramic coastal views",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          reviews: 2340,
          price: "From €900",
          amenities: ["Positano views", "Iconic", "Michelin dining"],
          location: "Positano"
        },
        {
          id: 4,
          name: "Grand Hotel Excelsior Vittoria",
          description: "Historic clifftop hotel in Sorrento with gardens",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1650,
          price: "From €350",
          amenities: ["Clifftop", "Historic", "Gardens"],
          location: "Sorrento"
        },
        {
          id: 5,
          name: "Grand Hotel Vesuvio",
          description: "Luxury hotel on Naples waterfront with bay views",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 1230,
          price: "From €280",
          amenities: ["Bay views", "Waterfront", "Historic luxury"],
          location: "Naples"
        },
        {
          id: 6,
          name: "Hotel Poseidon",
          description: "Boutique hotel in Positano with terraced gardens",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 890,
          price: "From €420",
          amenities: ["Terraced gardens", "Boutique", "Sea views"],
          location: "Positano"
        }
      ]
    } else {
      // Generic hotels for other destinations
      return [
        {
          id: 1,
          name: "Grand Heritage Hotel",
          description: "Luxury accommodation in the heart of the city",
          image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
          reviews: 1240,
          price: "From €180",
          amenities: ["Luxury", "Central", "Full service"],
          location: "City Center"
        },
        {
          id: 2,
          name: "Design Boutique Hotel",
          description: "Modern hotel with contemporary design and amenities",
          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.4,
          reviews: 890,
          price: "From €120",
          amenities: ["Modern", "Design", "Boutique"],
          location: "Arts District"
        },
        {
          id: 3,
          name: "Budget Comfort Inn",
          description: "Comfortable and affordable stay with great amenities",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.2,
          reviews: 650,
          price: "From €85",
          amenities: ["Budget-friendly", "Comfortable", "Clean"],
          location: "Residential Area"
        },
        {
          id: 4,
          name: "Luxury Resort & Spa",
          description: "Premium resort with world-class amenities and service",
          image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
          reviews: 2100,
          price: "From €250",
          amenities: ["Spa", "Pool", "Fine dining"],
          location: "Resort Area"
        },
        {
          id: 5,
          name: "Business Executive Hotel",
          description: "Professional accommodation for business travelers",
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
          reviews: 980,
          price: "From €140",
          amenities: ["Business center", "Meeting rooms", "Airport shuttle"],
          location: "Business District"
        },
        {
          id: 6,
          name: "Historic Boutique Inn",
          description: "Charming historic property with modern comforts",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
          reviews: 1320,
          price: "From €160",
          amenities: ["Historic charm", "Boutique style", "Central location"],
          location: "Historic Quarter"
        }
      ]
    }
  }

  // Use provided hotels data if available, otherwise fallback to generated data
  const hotels = providedHotels && providedHotels.length > 0 
    ? providedHotels.map(hotel => {
        console.log('Processing hotel from admin:', hotel)
        return {
          id: Math.random(), // Add ID for React keys
          name: hotel.name,
          description: hotel.description || "Beautiful accommodation",
          image: hotel.image,
          rating: hotel.rating,
          reviews: hotel.reviews || 1000,
          price: hotel.pricePerNight ? `From €${hotel.pricePerNight}` : 'From €200',
          amenities: hotel.amenities || [],
          location: hotel.location || "City Center"
        }
      })
    : getHotelsForDestination(destination)

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8 overflow-hidden relative">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">{title}</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light">
          {description}
        </p>
      </div>

      <Carousel 
        className="w-full"
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: true,
          }),
        ]}
      >
        <CarouselContent className="-ml-2 md:-ml-4 pr-16">
          {hotels.map((hotel) => (
            <CarouselItem key={hotel.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-[80%] md:basis-[45%] lg:basis-[38%] xl:basis-[32%]">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow rounded-2xl h-full bg-gradient-to-br from-white to-gray-50">
                <div className="relative">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">{hotel.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-medium">{hotel.location}</span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm">
                    <Heart className="w-4 h-4 text-gray-600" />
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 font-light line-clamp-2">{hotel.description}</p>

                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    <span className="font-semibold">★ {hotel.rating}</span>
                    {hotel.reviews && (
                      <span className="font-light">({hotel.reviews.toLocaleString()} reviews)</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(hotel.amenities || []).slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-brand-lavender text-brand-deep-purple border-brand-purple/20">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-brand-purple">{hotel.price || 'From €200'}</span>
                      <span className="text-sm text-gray-600 font-light">/night</span>
                    </div>
                    <Link href="https://cuddlynest.com" target="_blank" rel="noopener noreferrer">
                      <Button className="bg-brand-purple hover:bg-brand-deep-purple text-white rounded-full font-semibold px-6">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-white/90 hover:bg-white shadow-lg border-gray-200" />
        <CarouselNext className="right-4 bg-white/90 hover:bg-white shadow-lg border-gray-200" />
      </Carousel>
      
      {/* Subtle gradient fade on right to indicate more content */}
      <div className="absolute right-8 top-16 bottom-16 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 hidden md:block opacity-60" />
      
      {/* Scroll indicator */}
      <div className="flex justify-center items-center mt-4 gap-2 text-sm text-gray-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-brand-purple"></div>
          <div className="w-2 h-2 rounded-full bg-gray-200"></div>
          <div className="w-2 h-2 rounded-full bg-gray-200"></div>
          <div className="w-2 h-2 rounded-full bg-gray-200"></div>
        </div>
        <span className="ml-2 hidden sm:inline">Swipe or use arrows to explore more</span>
        <span className="ml-2 sm:hidden">Swipe to explore more</span>
      </div>
    </section>
  )
}
