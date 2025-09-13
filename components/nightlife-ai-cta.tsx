import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Music, MapPin, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface NightlifeAICTAProps {
  city?: string
  title?: string
  description?: string
}

export function NightlifeAICTA({ 
  city = "Rotterdam",
  title = "Meet Your AI",
  description = "Our AI knows Rotterdam's nightlife inside out. Get personalized recommendations for clubs, bars, and late-night eats based on your vibe and music taste."
}: NightlifeAICTAProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-8 md:p-12 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">
            {title}
          </h2>

          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🎵 Music taste matching
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🍸 Cocktail recommendations
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🌃 Late-night dining
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              🎯 Vibe-based venues
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
            <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mb-4">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Music DNA</h3>
                <p className="text-sm text-white/80 font-light">Matches venues to your exact music taste</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Local Insider</h3>
                <p className="text-sm text-white/80 font-light">Knows every hidden gem and hotspot</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Perfect Timing</h3>
                <p className="text-sm text-white/80 font-light">Optimizes your night from start to finish</p>
              </CardContent>
            </Card>
          </div>

          <Link href="https://cuddlynest.com" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              Plan My Night Out
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          
          <p className="text-sm text-white/80 mt-4 font-light">
            🎁 Free personalized recommendations • No signup required
          </p>
        </div>
      </div>
    </section>
  )
}