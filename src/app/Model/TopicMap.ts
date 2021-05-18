export interface Topic {
  slug: string;
  name: string;
  questions: number[];
}

export interface Tags {
  companies: any[];
  topics: Topic[];
}
