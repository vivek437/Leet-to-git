export interface TopicTags {
  name: string;
  slug: string;
  translatedName: string;
  __typename: string;
}

export interface Question {
  topicTags: [TopicTags];
}

export interface QuestionTag {
  question: Question;
}
