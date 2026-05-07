export type Sentiment = "positive" | "neutral" | "negative";

export type BranchSummary = {
  id: string;
  branch_name: string;
  branch_code: string | null;
  region: string | null;
  city: string | null;
  google_rating: number | null;
  total_reviews: number;
  google_place_id: string;
  latitude: number;
  longitude: number;
  photo_uri: string | null;
  photo_attribution: string | null;
  photo_synced_at: string | null;
  last_synced_at: string | null;
  stored_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  positive_reviews: number;
  avg_stored_rating: number | null;
};

export type Review = {
  id: string;
  branch_id: string;
  google_review_id: string | null;
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  review_text: string | null;
  language: string | null;
  relative_time: string | null;
  review_time: number | null;
  is_responded: boolean;
  response_text: string | null;
  sentiment: Sentiment | null;
  flagged: boolean;
  notes: string | null;
  first_seen_at: string;
};

export type ReviewWithBranch = Review & {
  branch_name: string;
  branch_code: string | null;
  region: string | null;
  google_place_id: string | null;
  analysis?: ReviewAnalysis | null;
};

export type ReviewAnalysis = {
  review_id: string;
  themes: string[];
  keywords: string[];
  is_complaint: boolean;
  sentiment_score: number | null;
  suggested_reply: string | null;
  reply_language: string | null;
  model: string | null;
  analyzed_at: string;
};

export type ComplaintTheme = {
  theme: string;
  mentions: number;
  branches_affected: number;
  last_seen: number | null;
};

export type ComplaintKeyword = {
  keyword: string;
  mentions: number;
  branches_affected: number;
};

export type BranchComplaintSpike = {
  branch_id: string;
  branch_name: string;
  branch_code: string | null;
  region: string | null;
  recent_7d: number;
  prior_30d: number;
  baseline_weekly: number;
  is_spiking: boolean;
};

export type SyncLog = {
  id: string;
  started_at: string;
  finished_at: string | null;
  branches_processed: number;
  new_reviews_found: number;
  errors: unknown;
  status: "running" | "completed" | "failed";
};
