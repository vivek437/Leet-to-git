export interface Info {
  user_name: string;
  num_solved: number;
  num_total: number;
  ac_easy: number;
  ac_medium: number;
  ac_hard: number;
  stat_status_pairs: StatStatusPair[];
  frequency_high: number;
  frequency_mid: number;
  category_slug: string;
}

export interface StatStatusPair {
  stat: Stat;
  status?: string;
  difficulty: Difficulty;
  paid_only: boolean;
  is_favor: boolean;
  frequency: number;
  progress: number;
}

export interface Stat {
  question_id: number;
  question__article__live?: boolean;
  question__article__slug?: string;
  question__article__has_video_solution?: boolean;
  question__title: string;
  question__title_slug: string;
  question__hide: boolean;
  total_acs: number;
  total_submitted: number;
  frontend_question_id: number;
  is_new_question: boolean;
}

export interface Difficulty {
  level: number;
}
