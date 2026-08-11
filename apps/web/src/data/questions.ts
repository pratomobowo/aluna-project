// ponytail: draft questions, pending Ka Lisa clinical review
import type { Dimension } from "@aluna/shared";

export type QuestionDimension = Dimension | "safety";

export interface Question {
  text: string;
  dimension: QuestionDimension;
}

export const DIMENSION_LABEL: Record<QuestionDimension, string> = {
  anxiety: "Kecemasan",
  mood: "Suasana Hati",
  stress: "Stres",
  trauma: "Trauma",
  sleep: "Tidur",
  relationship: "Relasi",
  self_esteem: "Harga Diri",
  safety: "Keselamatan",
};

// Dimension per index 0 = Q1 … 9 = Q10, aligned with QUESTION_DIMENSION
// in packages/shared/src/assessment.ts (authoritative scoring mapping).
export const QUESTIONS: Question[] = [
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa cemas atau khawatir secara berlebihan?", dimension: "anxiety" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa tegang atau gelisah?", dimension: "anxiety" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sedih atau murung?", dimension: "mood" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa putus asa tentang masa depanmu?", dimension: "mood" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa kewalahan dengan beban pekerjaan atau tanggung jawabmu?", dimension: "stress" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sulit untuk rileks?", dimension: "stress" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu dihantui pikiran atau ingatan yang tidak menyenangkan?", dimension: "trauma" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu kesulitan memulai tidur?", dimension: "sleep" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa kesepian atau terisolasi?", dimension: "relationship" },

  { text: "Dalam 2 minggu terakhir, pernahkah kamu berpikir untuk menyakiti dirimu sendiri?", dimension: "safety" },
];
