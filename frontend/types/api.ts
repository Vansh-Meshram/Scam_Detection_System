export interface PredictRequest {
  text: string;
  url: string;
}

export interface PredictResponse {
  risk_score: number;
  is_scam: boolean;
  explanation: string;
}

export interface FeedbackRequest {
  text: string;
  url: string;
  predicted_score: number;
  user_label: number;
}

export interface FeedbackResponse {
  status: string;
}

export interface HealthResponse {
  status: string;
}

export interface ScanHistoryItem {
  id: string;
  text: string;
  url: string;
  risk_score: number;
  is_scam: boolean;
  timestamp: string;
  user_feedback?: number;
}

export interface AnalyticsData {
  total_scans: number;
  scams_detected: number;
  accuracy_rate: number;
  trend_data: Array<{
    date: string;
    scams: number;
    safe: number;
  }>;
  top_threats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}
