import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import JourneyMap from "@/components/JourneyMap";

export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-8 bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl italic">
            Perjalananmu bersama Aluna
          </CardTitle>
          <CardDescription>
            Ruang aman untuk pulih, selangkah demi selangkah.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Tema Aluna aktif: cream, hijau brand, aksen sun.
          </p>
          <Button>Mulai Perjalanan</Button>
        </CardContent>
      </Card>
      <div className="hidden w-full max-w-xs sm:block">
        <JourneyMap current={3} done={[1, 2]} labels={["Mulai", "Pahami", "Konseling", "Ritme", "Terhubung", "Pulih"]} />
      </div>
    </main>
  );
}
