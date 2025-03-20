export interface PromptTemplate {
  id: number;
  created_at: string;
  type: "official" | "organization" | "user";
  folder_id: number;
  tags: string[];
  title: string;
  content: string;
  locale: "fr" | "en";
}

export interface PromptTemplatesFolder {
  id: number;
  created_at: string;
  type: string;
  tags: string[];
  path: string;
  prompt_templates?: PromptTemplate[];
}

