export interface User {
  owner: string;
  id: string;
  name: string;
  repository_public: number;
  repository_private: number;
  repositories?: string[];
}
