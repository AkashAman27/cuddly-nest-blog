import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, ArrowRight, Zap, Globe, Heart } from "lucide-react"
import Link from "next/link"

export function AIItineraryCTA() {
  const features = [
    {
      icon: Zap,
      title: "Lightning fast",
      description: "Your perfect itinerary in under 30 seconds",
    },
    {
      icon: Globe,
      title: "Knows everywhere",
      description: "200+ countries, endless possibilities",
    },
    {
      icon: Users,
      title: "Gets your vibe",
      description: "Solo, couple, squad - we got you",
    },
    {
      icon: Heart,
      title: "Actually personal",
      description: "Not generic - made just for you",
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl">
      <div className="bg-brand-gradient p-8 md:p-12 text-white">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <Badge className="mb-6 bg-brand-pink text-brand-deep-purple border-0 text-sm font-medium">
            🚀 Powered by smart AI that actually gets it
          </Badge>

          <h2 className="text-5xl md:text-6xl font-bold mb-6 font-sans">
            Meet your AI
            <span className="block">travel bestie</span>
          </h2>

          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 font-light">
            Tell us what you're into, and watch our AI craft the perfect trip. No more endless research, no more FOMO -
            just pure travel magic tailored to you.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              ✈️ Flights that fit
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🏨 Hotels you'll love
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🎯 Spots worth your time
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🍽️ Food that hits different
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              💰 Budget that makes sense
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/10 backdrop-blur-sm"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-pink rounded-full mb-4">
                    <IconComponent className="w-6 h-6 text-brand-deep-purple" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 capitalize">{feature.title}</h3>
                  <p className="text-sm text-white/80 font-light">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="https://cuddlynest.com" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-white text-brand-purple hover:bg-brand-pink hover:text-brand-deep-purple text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              Start planning your adventure
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-white/80 mt-4 font-light">
            🎁 Completely free • No strings attached • Unlimited dreaming
          </p>
        </div>

      </div>
    </section>
  )
}
