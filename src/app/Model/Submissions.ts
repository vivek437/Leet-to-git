export interface Submissions {
  submissions_dump: SubmissionsDump[];
  has_next: boolean;
  last_key: string;
}

export interface SubmissionsDump {
  id: number;
  lang: string;
  time: string;
  timestamp: number;
  status_display: string;
  runtime: string;
  url: string;
  is_pending: string;
  title: string;
  memory: string;
  code: string;
  compare_result: string;
  title_slug: string;
}
