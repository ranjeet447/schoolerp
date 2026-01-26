import * as React from "react"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Calendar, User, Eye } from "lucide-react"

interface NoticeCardProps {
  title: string
  body: string
  author: string
  date: string
  isRead?: boolean
  onAcknowledge?: () => void
  ackCount?: number
  showAckStatus?: boolean
}

export function NoticeCard({
  title,
  body,
  author,
  date,
  isRead = false,
  onAcknowledge,
  ackCount,
  showAckStatus = false,
}: NoticeCardProps) {
  return (
    <div className={cn(
      "relative border rounded-xl p-5 shadow-sm transition-all hover:shadow-md bg-white",
      !isRead && "border-blue-200 bg-blue-50/10"
    )}>
      {!isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
      )}

      <div className="flex flex-col h-full">
        <div className="space-y-1 mb-3">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{title}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {author}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
          {body}
        </div>

        <div className="pt-4 border-t flex justify-between items-center">
          {showAckStatus ? (
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Eye className="w-3 h-3" />
              {ackCount || 0} acknowledgments
            </div>
          ) : (
            <div />
          )}

          {!isRead && onAcknowledge && (
            <button 
              onClick={onAcknowledge}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Acknowledge
            </button>
          )}

          {isRead && !showAckStatus && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Acknowledged
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
