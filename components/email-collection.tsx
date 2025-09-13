import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Gift, Plane, Bell } from "lucide-react"

export function EmailCollection() {
  return (
    <section className="bg-brand-gradient rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 font-sans">Stay in the loop, bestie</h2>
            <p className="text-xl text-white/90 font-light">
              Get exclusive travel deals, insider tips, and destination inspo delivered straight to your inbox
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-white" />
                <h3 className="font-semibold text-white mb-1">Exclusive deals</h3>
                <p className="text-sm text-white/80 font-light">Up to 70% off for subscribers</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Plane className="w-8 h-8 mx-auto mb-2 text-white" />
                <h3 className="font-semibold text-white mb-1">Travel hacks</h3>
                <p className="text-sm text-white/80 font-light">Expert tips & hidden gems</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-white" />
                <h3 className="font-semibold text-white mb-1">Early access</h3>
                <p className="text-sm text-white/80 font-light">First to know about new destinations</p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-full"
              />
              <Button className="bg-white text-brand-purple hover:bg-brand-pink hover:text-brand-deep-purple whitespace-nowrap rounded-full px-6 font-semibold">
                Subscribe now
              </Button>
            </div>
            <p className="text-sm text-white/80 text-center mt-4 font-light">
              Join 500K+ travelers • Unsubscribe anytime • No spam, ever
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
