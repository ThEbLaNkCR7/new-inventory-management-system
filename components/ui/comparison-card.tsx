import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus } from "lucide-react"
import { formatNepaliDateForTable } from "@/lib/utils"

interface ComparisonCardProps {
  title: string
  originalData?: any
  proposedData: any
  action: "create" | "update" | "delete"
}

export function ComparisonCard({ title, originalData, proposedData, action }: ComparisonCardProps) {
  const formatValue = (key: string, value: any) => {
    if (key.toLowerCase().includes("price") || key.toLowerCase().includes("cost")) {
      return `Rs ${Number(value).toLocaleString()}`
    }
    if (key.toLowerCase().includes("date")) {
      return new Date(value).toLocaleDateString("en-IN")
    }
    return String(value)
  }

  const formatKey = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  }

  const formatDate = (value: string) => {
    return formatNepaliDateForTable(value)
  }

  if (action === "create") {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-navy">
            <Plus className="mr-2 h-5 w-5" />
            New {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(proposedData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded border border-border bg-muted/50 p-2">
                <span className="font-medium text-muted-foreground">{formatKey(key)}:</span>
                <span className="font-semibold text-navy">{formatValue(key, value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (action === "delete") {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-navy">
            <Minus className="mr-2 h-5 w-5" />
            Delete {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {originalData &&
              Object.entries(originalData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded border border-border bg-muted/50 p-2">
                  <span className="font-medium text-muted-foreground">{formatKey(key)}:</span>
                  <span className="text-navy line-through">{formatValue(key, value)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Update action
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <Badge variant="outline">Update {title}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <Minus className="mr-2 h-4 w-4" />
              Current
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {originalData &&
                Object.entries(originalData).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded border border-border bg-muted/50 p-2"
                  >
                    <span className="text-sm font-medium text-muted-foreground">{formatKey(key)}:</span>
                    <span className="text-sm text-navy">{formatValue(key, value)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <Plus className="mr-2 h-4 w-4" />
              Proposed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(proposedData).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded border border-border bg-muted/50 p-2"
                >
                  <span className="text-sm font-medium text-muted-foreground">{formatKey(key)}:</span>
                  <span className="text-sm font-semibold text-navy">{formatValue(key, value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
