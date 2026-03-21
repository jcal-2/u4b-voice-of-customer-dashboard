export interface VocSignal {
  signal_id: string;
  golden_record_id: string;
  contact_id: string;
  customer_name: string;
  account_name: string;
  role: string;
  bu_segment: string;
  sales_segment: string;
  role_archetype: string;
  mega_region: string;
  acquisition_type: string;
  product_division: string;
  contract_start: string;
  tenure_years: number | null;
  cdj_stage: string;
  feedback_source: string;
  source_type: string;
  captured_at: string;
  verbatim_text: string;
  sentiment: string;
  sentiment_themes: string[];
  action_tag: string;
  active_u4b_drivers: string[];
  survey_id: string | null;
  survey_scale_type: string | null;
  ces_score: string | null;
  ors_score: string | null;
  csat_score: number | null;
  nps_score: number | null;
  key_drivers_selected: string[];
  conditional_follow_up_response: string | null;
}

export const CDJ_STAGES = [
  "Consideration / Evaluation",
  "Purchase",
  "Onboarding",
  "Adoption / Product Use",
  "Value / Expansion",
  "Expansion / Renewal",
] as const;

export const FEEDBACK_SOURCES = [
  "CES Survey",
  "ORS Survey",
  "CSAT Survey",
  "NPS Survey",
  "CRM Account Notes",
  "CS Channel Conversation",
  "Product Feedback Log",
  "In-App Feedback",
  "Support Ticket",
  "Website Chat Transcript",
] as const;

export const SENTIMENTS = ["Positive", "Negative", "Neutral", "Mixed"] as const;

export const ACTION_TAGS = [
  "Escalation",
  "Churn Risk",
  "Go-to-Gemba",
  "ICP Research",
  "Expansion Opportunity",
  "Product Feature",
  "Financial Analysis",
  "None",
] as const;

export const SOURCE_DISPLAY_MAP: Record<string, string> = {
  "SFDC Account Notes": "CRM Account Notes",
  "Slack Customer Channel": "CS Channel Conversation",
  "Internal Feature Log": "Product Feedback Log",
  "Direct Feedback": "Support Ticket",
};

export const SOURCE_DISPLAY_REVERSE: Record<string, string> = {
  "CRM Account Notes": "SFDC Account Notes",
  "CS Channel Conversation": "Slack Customer Channel",
  "Product Feedback Log": "Internal Feature Log",
  "Support Ticket": "Direct Feedback",
};
