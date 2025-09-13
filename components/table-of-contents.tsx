import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, BookOpen } from "lucide-react"

export function TableOfContents() {
  const sections = [
    { title: "Overview & Introduction", anchor: "#overview", time: "2 min read" },
    { title: "Best Time to Visit", anchor: "#best-time", time: "3 min read" },
    { title: "Top Things to Do", anchor: "#things-to-do", time: "8 min read" },
    { title: "Where to Stay", anchor: "#hotels", time: "5 min read" },
    { title: "Getting Around", anchor: "#transportation", time: "4 min read" },
    { title: "Local Food & Dining", anchor: "#dining", time: "6 min read" },
    { title: "Budget Planning", anchor: "#budget", time: "4 min read" },
    { title: "Safety & Tips", anchor: "#safety", time: "3 min read" },
    { title: "Sample Itineraries", anchor: "#itineraries", time: "7 min read" },
    { title: "Frequently Asked Questions", anchor: "#faq", time: "5 min read" },
  ]

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-brand-lavender rounded-lg">
          <BookOpen className="w-5 h-5 text-brand-purple" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-sans">Table of contents</h2>
          <p className="text-gray-600 font-light">Jump to any section • Total read time: 47 minutes</p>
        </div>
      </div>

      <Card className="border-l-4 border-l-brand-purple border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <Button
                key={index}
                variant="ghost"
                className="justify-between h-auto p-4 text-left hover:bg-brand-lavender hover:text-brand-deep-purple rounded-xl font-medium"
                asChild
              >
                <a href={section.anchor}>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">{section.title}</div>
                    <div className="text-sm text-gray-500 font-light">{section.time}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-purple" />
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 font-light">
          💡 Tip: Bookmark this page and use the table of contents to navigate easily
        </p>
      </div>
    </section>
  )
}
