import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, ArrowRight, Clock, DollarSign } from "lucide-react"

export function FlightCTA() {
  return (
    <section className="bg-brand-gradient rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-white">
        <h2 className="text-4xl font-bold mb-4 font-sans">Find flights that actually fit your vibe</h2>
        <p className="text-xl mb-8 text-white/90 font-light">
          Compare prices from hundreds of airlines and book your next adventure in just 2 clicks
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">Best prices guaranteed</h3>
              <p className="text-sm text-white/80 font-light">We find deals others miss</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">24/7 support</h3>
              <p className="text-sm text-white/80 font-light">We've got your back always</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Plane className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">Instant booking</h3>
              <p className="text-sm text-white/80 font-light">Confirmed in seconds</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-white text-brand-purple hover:bg-brand-pink hover:text-brand-deep-purple rounded-full px-8 py-4 font-semibold"
          >
            Search flights now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}
