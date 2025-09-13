import { Card, CardContent } from "@/components/ui/card"
import { Shield, Award, Clock, Globe, Heart, Headphones } from "lucide-react"

export function BrandUSPBlocks() {
  const usps = [
    {
      icon: Shield,
      title: "100% Secure Booking",
      description: "Your payments and personal data are protected with bank-level security",
      color: "text-green-600",
    },
    {
      icon: Award,
      title: "Award-Winning Service",
      description: "Recognized as the world's leading travel platform for 3 consecutive years",
      color: "text-yellow-600",
    },
    {
      icon: Clock,
      title: "24/7 Customer Support",
      description: "Round-the-clock assistance from our expert travel consultants",
      color: "text-blue-600",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Access to over 2 million hotels and attractions in 200+ countries",
      color: "text-purple-600",
    },
    {
      icon: Heart,
      title: "Loved by Millions",
      description: "Over 50 million happy travelers have trusted us with their journeys",
      color: "text-red-600",
    },
    {
      icon: Headphones,
      title: "Expert Local Guides",
      description: "Connect with certified local experts for authentic experiences",
      color: "text-orange-600",
    },
  ]

  return (
    <section className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TravelExpert?</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          We're committed to making your travel dreams come true with unmatched service and reliability
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usps.map((usp, index) => {
          const IconComponent = usp.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gray-50 ${usp.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{usp.title}</h3>
                    <p className="text-gray-600">{usp.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
