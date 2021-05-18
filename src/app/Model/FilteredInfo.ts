import { Submissions, SubmissionsDump } from './Submissions';
export interface FilteredInfo {
  internalId: number;
  question_id: number;
  question__title: string;
  question__title_slug: string;
  status?: string;
  level: string;
  submissions?: Submissions;
  latestSuccessfulSubmission?: SubmissionsDump;
  tags: string[];
}
