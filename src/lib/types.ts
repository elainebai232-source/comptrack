export type Field = "Quant" | "ML" | "Math" | "Finance" | "CS" | "All";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Competition {
  id: string;
  name: string;
  field: Exclude<Field, "All">;
  deadline: string;
  prize: string;
  difficulty: Difficulty;
  tags: string[];
  internationalOK: boolean;
  url?: string;
}

export const FIELDS: Field[] = ["All", "Quant", "ML", "Math", "Finance", "CS"];
