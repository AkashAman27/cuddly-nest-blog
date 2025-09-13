import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Camera, Heart } from "lucide-react"

interface OverviewIntroProps {
  title?: string
  description?: string
  destination?: string
  badge?: string
  highlights?: Array<{
    icon?: string
    title?: string
    value?: string
    description?: string
  }>
  sections?: Array<{
    title?: string
    content?: string
  }>
}

export function OverviewIntro({ 
  title = "Why this destination hits different",
  description = "Every destination has its magic - from that first moment you arrive to your last sunset, every experience here feels like it's straight out of a dream. And honestly? The hype is real.",
  destination = "this destination",
  badge,
  highlights,
  sections
}: OverviewIntroProps) {
  const defaultHighlights = [
    {
      icon: Clock,
      title: "Perfect Duration",
      value: "5-7 days",
      description: "Just right to fall in love",
    },
    {
      icon: DollarSign,
      title: "Budget Range",
      value: "€100-300",
      description: "Per day, your way",
    },
    {
      icon: Camera,
      title: "Must-See Spots",
      value: "15+ places",
      description: "Instagram-worthy moments",
    },
    {
      icon: Heart,
      title: "Vibe Check",
      value: "Pure magic",
      description: "You'll never want to leave",
    },
  ]

  const displayHighlights = highlights || defaultHighlights

  const defaultSections = [
    {
      title: "Culture that actually slaps",
      content: "From world-class museums to street art scenes, this destination serves culture on every corner. It's giving main character energy, and you're here for it."
    },
    {
      title: "Experiences that change your life", 
      content: "From hidden local gems to iconic landmarks, every moment here is designed to create lasting memories. One visit and you'll understand the hype."
    }
  ]

  const displaySections = sections || defaultSections
  const displayBadge = badge || `📍 Your ${destination} starter pack`

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-brand-lavender text-brand-deep-purple border-0">{displayBadge}</Badge>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">{title}</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light">
          {description}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {displayHighlights.map((highlight, index) => {
          const IconComponent = highlight.icon || Clock
          return (
            <Card
              key={index}
              className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-brand-gradient-light"
            >
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-purple rounded-full mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 capitalize">{highlight.title}</h3>
                <div className="text-2xl font-bold text-brand-purple mb-1">{highlight.value}</div>
                <p className="text-sm text-gray-600">{highlight.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-brand-gradient rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-6 text-center">Here's the tea on {destination}</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {displaySections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-3 text-lg">{section.title}</h4>
              <p className="text-white/90 font-light">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
