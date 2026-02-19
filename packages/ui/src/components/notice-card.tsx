import * as React from "react"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Calendar, User, Eye, Paperclip, ExternalLink } from "lucide-react"

interface Attachment {
  id?: string
  name: string
  url: string
}

interface NoticeCardProps {
  title: string
  body: string
  author: string
  date: string
  isRead?: boolean
  onAcknowledge?: () => void
  ackCount?: number
  showAckStatus?: boolean
  attachments?: Attachment[]
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
  attachments = [],
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

        {attachments && attachments.length > 0 && (
          <div className="mt-2 space-y-2 mb-4">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <a 
                  key={file.id || idx} 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

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
