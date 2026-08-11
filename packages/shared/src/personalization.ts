import type { Dimension } from "./assessment";

export interface Goal { id: string; label: string }
export interface RoadmapStep {
  order: number; title: string; description: string;
}
export interface DailyTask { id: string; title: string; points: number }

export interface Personalization {
  goal: Goal;
  roadmap: RoadmapStep[];
  dailyTaskPool: DailyTask[];
  tag: string;
  therapistKeywords: string[];
  pointsPerRoadmapStep: number;
}

export const GOAL_LABEL: Record<Dimension, string> = {
  anxiety: "Lebih Tenang & Seimbang",
  mood: "Bangkit & Berdaya",
  stress: "Mengelola Beban Kerja",
  trauma: "Pulih Bertahap",
  sleep: "Tidur Lebih Nyenyak",
  relationship: "Relasi Lebih Sehat",
  self_esteem: "Percaya Diri Lagi"
};

export const DAILY_TASKS: Record<Dimension, DailyTask[]> = {
  anxiety: [
    { id: "t1", title: "Latihan napas 5 menit", points: 10 },
    { id: "t2", title: "Journaling kecemasan", points: 10 },
    { id: "t3", title: "Berjalan 15 menit di luar", points: 5 }
  ],
  mood: [
    { id: "m1", title: "Tulis 3 hal yang kamu syukuri", points: 10 },
    { id: "m2", title: "Berjemur pagi 10 menit", points: 5 },
    { id: "m3", title: "Journaling mood", points: 10 }
  ],
  stress: [
    { id: "s1", title: "Jadwalkan waktu istirahat", points: 5 },
    { id: "s2", title: "Journaling beban kerja", points: 10 }
  ],
  trauma: [],
  sleep: [ { id: "sl1", title: "Kurangi layar 30 menit sebelum tidur", points: 5 } ],
  relationship: [],
  self_esteem: []
};

export function personalizationFor(primary: Dimension): Personalization {
  return {
    goal: { id: primary, label: GOAL_LABEL[primary] },
    roadmap: [
      { order: 1, title: "Pahami kondisimu", description: "Hasil assessment kamu sudah siap" },
      { order: 2, title: "Konseling pertamamu", description: "Kenal therapist yang paling cocok" },
      { order: 3, title: "Ritme harian baru", description: "Kerjakan langkah harian dan pantau progres" }
    ],
    dailyTaskPool: DAILY_TASKS[primary],
    tag: primary === "anxiety" ? "#Overthinking" : "#ButuhDukungan",
    therapistKeywords: [GOAL_LABEL[primary]],
    pointsPerRoadmapStep: 20
  };
}
