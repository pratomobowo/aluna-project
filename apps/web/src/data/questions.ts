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

// Dimension per index 0 = Q1 … 29 = Q30, aligned with QUESTION_DIMENSION
// in packages/shared/src/assessment.ts (authoritative scoring mapping).
export const QUESTIONS: Question[] = [
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa cemas atau khawatir secara berlebihan?", dimension: "anxiety" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu kesulitan menenangkan pikiranmu?", dimension: "anxiety" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa jantung berdebar tanpa alasan yang jelas?", dimension: "anxiety" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa tegang atau gelisah?", dimension: "anxiety" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu khawatir berlebihan tentang hal-hal kecil?", dimension: "anxiety" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sedih atau murung?", dimension: "mood" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu kehilangan minat pada hal yang biasanya kamu nikmati?", dimension: "mood" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa putus asa tentang masa depanmu?", dimension: "mood" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa ingin menangis atau mudah terharu?", dimension: "mood" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa lesu atau tanpa energi?", dimension: "mood" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa kewalahan dengan beban pekerjaan atau tanggung jawabmu?", dimension: "stress" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sulit untuk rileks?", dimension: "stress" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa mudah tersinggung atau marah?", dimension: "stress" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa tidak punya waktu untuk dirimu sendiri?", dimension: "stress" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa banyak tekanan dalam hidupmu?", dimension: "stress" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu dihantui pikiran atau ingatan yang tidak menyenangkan?", dimension: "trauma" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu menghindari situasi yang mengingatkanmu pada pengalaman sulit?", dimension: "trauma" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa waspada berlebihan atau mudah terkejut?", dimension: "trauma" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sulit mempercayai orang lain?", dimension: "trauma" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kilas balik pengalaman sulit mengganggu keseharianmu?", dimension: "trauma" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu kesulitan memulai tidur?", dimension: "sleep" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu terbangun di tengah malam dan sulit tidur kembali?", dimension: "sleep" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu bangun dengan rasa lelah meski sudah tidur?", dimension: "sleep" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa kualitas tidurmu buruk?", dimension: "sleep" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu mengantuk berlebihan di siang hari?", dimension: "sleep" },

  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa kesepian atau terisolasi?", dimension: "relationship" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa sulit berkomunikasi dengan orang terdekat?", dimension: "relationship" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa hubungan dengan orang terdekat menegangkan?", dimension: "relationship" },
  { text: "Dalam 2 minggu terakhir, seberapa sering kamu merasa tidak didukung oleh orang-orang di sekitarmu?", dimension: "relationship" },

  { text: "Dalam 2 minggu terakhir, pernahkah kamu berpikir untuk menyakiti dirimu sendiri?", dimension: "safety" },
];
