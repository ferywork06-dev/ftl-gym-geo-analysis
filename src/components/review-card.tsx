import Link from "next/link";
import { Flag, MessageCircle, ExternalLink } from "lucide-react";
import { Stars, SentimentPill, Tag, formatRelative } from "./ui";
import { SuggestedReply } from "./suggested-reply";
import type { ReviewWithBranch } from "@/lib/types";

export function ReviewCard({ review, showBranch = true }: { review: ReviewWithBranch; showBranch?: boolean }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink text-sm">{review.author_name}</span>
            <Stars rating={review.rating} />
            <SentimentPill sentiment={review.sentiment} />
            {review.flagged && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-negative/30 text-negative bg-negative/5">
                <Flag className="w-3 h-3" /> Flagged
              </span>
            )}
          </div>
          {showBranch && (
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
              <Link href={`/branches/${review.branch_id}`} className="hover:text-ink hover:underline">
                {review.branch_name}
              </Link>
              {review.branch_code && <Tag>{review.branch_code}</Tag>}
            </div>
          )}
        </div>
        <div className="text-right text-xs text-ink-muted shrink-0 space-y-1">
          <div>{review.relative_time ?? formatRelative(review.review_time)}</div>
          {review.google_place_id && (
            <a
              href={`https://search.google.com/local/reviews?placeid=${review.google_place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-ink transition-colors"
            >
              View on Google <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {review.review_text && (
        <p className="text-sm text-ink mt-3 leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
      )}

      {review.is_responded && review.response_text && (
        <div className="mt-3 pl-3 border-l-2 border-border text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 font-medium text-ink mb-1">
            <MessageCircle className="w-3 h-3" />
            Response from owner
          </div>
          {review.response_text}
        </div>
      )}

      {!review.is_responded && review.rating <= 2 && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-negative">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-negative" />
          Needs response
        </div>
      )}

      {!review.is_responded && review.analysis?.suggested_reply && (
        <SuggestedReply
          reply={review.analysis.suggested_reply}
          themes={review.analysis.themes}
        />
      )}
    </article>
  );
}
