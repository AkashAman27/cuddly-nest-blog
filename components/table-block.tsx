import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

export function TableBlock() {
  const comparisonData = [
    {
      feature: "Free Cancellation",
      basic: true,
      premium: true,
      luxury: true,
    },
    {
      feature: "24/7 Support",
      basic: false,
      premium: true,
      luxury: true,
    },
    {
      feature: "Travel Insurance",
      basic: false,
      premium: true,
      luxury: true,
    },
    {
      feature: "Priority Booking",
      basic: false,
      premium: false,
      luxury: true,
    },
    {
      feature: "Personal Concierge",
      basic: false,
      premium: false,
      luxury: true,
    },
    {
      feature: "Exclusive Experiences",
      basic: false,
      premium: false,
      luxury: true,
    },
  ]

  return (
    <section className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Travel Packages</h2>
        <p className="text-gray-600">Choose the perfect package that suits your travel style and budget</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
              <th className="text-center py-4 px-6">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    Basic
                  </Badge>
                  <div className="text-2xl font-bold text-gray-900">$299</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
              </th>
              <th className="text-center py-4 px-6">
                <div className="text-center">
                  <Badge className="mb-2 bg-orange-600">Premium</Badge>
                  <div className="text-2xl font-bold text-gray-900">$599</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
              </th>
              <th className="text-center py-4 px-6">
                <div className="text-center">
                  <Badge className="mb-2 bg-purple-600">Luxury</Badge>
                  <div className="text-2xl font-bold text-gray-900">$1,299</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                <td className="py-4 px-6 text-center">
                  {row.basic ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400 mx-auto" />
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  {row.premium ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400 mx-auto" />
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  {row.luxury ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">All packages include accommodation, breakfast, and guided tours</p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Included
          </Badge>
          <Badge variant="outline" className="text-gray-400 border-gray-400">
            <X className="w-3 h-3 mr-1" />
            Not Included
          </Badge>
        </div>
      </div>
    </section>
  )
}
