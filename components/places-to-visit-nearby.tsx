import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Car, Train, Clock } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function PlacesToVisitNearby() {
  const nearbyPlaces = [
    {
      id: 1,
      name: "Versailles",
      description: "Opulent palace and gardens of French royalty",
      image: "/placeholder.svg?height=200&width=300",
      distance: "20 km",
      travelTime: "45 min",
      transport: "Train",
      highlights: ["Palace of Versailles", "Hall of Mirrors", "Marie Antoinette's Estate"],
      category: "Historical",
    },
    {
      id: 2,
      name: "Fontainebleau",
      description: "Medieval castle and UNESCO World Heritage site",
      image: "/placeholder.svg?height=200&width=300",
      distance: "55 km",
      travelTime: "1h 15min",
      transport: "Car",
      highlights: ["Château de Fontainebleau", "Forest walks", "Napoleon's apartments"],
      category: "Castle",
    },
    {
      id: 3,
      name: "Giverny",
      description: "Monet's house and famous water lily gardens",
      image: "/placeholder.svg?height=200&width=300",
      distance: "75 km",
      travelTime: "1h 30min",
      transport: "Car",
      highlights: ["Monet's Garden", "Water lily pond", "Artist's studio"],
      category: "Art & Nature",
    },
    {
      id: 4,
      name: "Chantilly",
      description: "Elegant château with horse racing heritage",
      image: "/placeholder.svg?height=200&width=300",
      distance: "50 km",
      travelTime: "1h",
      transport: "Train",
      highlights: ["Château de Chantilly", "Horse Museum", "Great Stables"],
      category: "Castle",
    },
    {
      id: 5,
      name: "Reims",
      description: "Champagne capital with stunning Gothic cathedral",
      image: "/placeholder.svg?height=200&width=300",
      distance: "145 km",
      travelTime: "1h 30min",
      transport: "Train",
      highlights: ["Notre-Dame de Reims", "Champagne cellars", "Cathedral tours"],
      category: "Historical",
    },
    {
      id: 6,
      name: "Auvers-sur-Oise",
      description: "Van Gogh's final home with artistic heritage",
      image: "/placeholder.svg?height=200&width=300",
      distance: "30 km",
      travelTime: "45 min",
      transport: "Train",
      highlights: ["Van Gogh House", "Church painting location", "Artist trails"],
      category: "Art & Nature",
    },
  ]

  const getTransportIcon = (transport: string) => {
    return transport === "Train" ? Train : Car
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Historical: "bg-brand-deep-purple text-white",
      Castle: "bg-brand-purple text-white",
      "Art & Nature": "bg-brand-green text-white",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">Places to visit nearby</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
          Extend your Paris adventure with these incredible destinations just a short journey away
        </p>
      </div>

      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {nearbyPlaces.map((place) => {
            const TransportIcon = getTransportIcon(place.transport)
            return (
              <CarouselItem key={place.id} className="pl-2 md:pl-4 sm:basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow rounded-2xl h-full">
                  <div className="relative">
                    <img
                      src={place.image || "/placeholder.svg"}
                      alt={place.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className={`absolute top-4 left-4 ${getCategoryColor(place.category)} border-0`}>
                      {place.category}
                    </Badge>
                  </div>

                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">{place.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 font-light">{place.description}</p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-light">{place.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-light">{place.travelTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TransportIcon className="w-4 h-4" />
                        <span className="font-light">{place.transport}</span>
                      </div>
                    </div>

                    <div className="mb-4 flex-grow">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Must-see:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {place.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-brand-purple rounded-full"></div>
                            <span className="font-light">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button className="w-full bg-brand-purple hover:bg-brand-deep-purple text-white rounded-full font-semibold mt-auto">
                      Plan day trip
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          size="lg"
          className="border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white rounded-full px-8 font-semibold bg-transparent"
        >
          Explore more destinations
        </Button>
      </div>
    </section>
  )
}
