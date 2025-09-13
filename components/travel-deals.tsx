import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Percent, Tag, Zap } from "lucide-react"

export function TravelDeals() {
  const deals = [
    {
      id: 1,
      title: "Early bird special",
      description: "Book 60 days in advance and save big",
      discount: "30%",
      validUntil: "Limited time",
      category: "Hotels",
      icon: Clock,
      color: "bg-brand-green",
    },
    {
      id: 2,
      title: "Flash sale",
      description: "24-hour flash sale on selected attractions",
      discount: "50%",
      validUntil: "24 hours",
      category: "Attractions",
      icon: Zap,
      color: "bg-brand-deep-purple",
    },
    {
      id: 3,
      title: "Group discount",
      description: "Special rates for groups of 4 or more",
      discount: "25%",
      validUntil: "Ongoing",
      category: "Tours",
      icon: Percent,
      color: "bg-brand-purple",
    },
    {
      id: 4,
      title: "Student special",
      description: "Exclusive discounts for students with valid ID",
      discount: "20%",
      validUntil: "Year round",
      category: "All services",
      icon: Tag,
      color: "bg-brand-green",
    },
  ]

  return (
    <section className="bg-brand-gradient rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-white">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 font-sans">🔥 Exclusive travel deals</h2>
          <p className="text-xl text-white/90 font-light">
            Limited-time offers to make your Paris trip more affordable
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal) => {
            const IconComponent = deal.icon
            return (
              <Card
                key={deal.id}
                className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${deal.color} rounded-full mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  <Badge className="mb-3 bg-brand-pink text-brand-deep-purple border-0 font-medium">
                    {deal.category}
                  </Badge>

                  <h3 className="text-xl font-bold text-white mb-2 font-sans capitalize">{deal.title}</h3>
                  <p className="text-white/80 text-sm mb-4 font-light">{deal.description}</p>

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-white">{deal.discount}</div>
                    <div className="text-sm text-white/70 font-light">OFF</div>
                  </div>

                  <div className="text-xs text-white/70 mb-4 font-light">Valid: {deal.validUntil}</div>

                  <Button className="w-full bg-white text-brand-purple hover:bg-brand-pink hover:text-brand-deep-purple rounded-full font-semibold">
                    Claim deal
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-white/80 text-sm font-light">
            💡 Deals update daily • Sign up for notifications to never miss out
          </p>
        </div>
      </div>
    </section>
  )
}
