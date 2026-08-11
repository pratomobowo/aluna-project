import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AssessmentOfferDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ponytail: only offer once per browser session; revisit later with frequency capping
    if (sessionStorage.getItem("aluna-offer-seen")) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("aluna-offer-seen", "1");
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  function goToAssessment() {
    setOpen(false);
    navigate("/assessment");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm gap-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-7" aria-hidden />
        </div>

        <div className="flex flex-col gap-1.5">
          <DialogTitle className="font-serif text-2xl leading-snug">
            Mulai Perjalananmu
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sebelum masuk, yuk kenali kondisimu lewat{" "}
            <span className="font-medium text-foreground">assessment gratis</span>.
            Hasilnya jadi peta pemulihan personal yang akan menemanimu.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button onClick={goToAssessment} className="h-11 w-full gap-2">
            <ArrowRight className="size-4" aria-hidden />
            Ikuti Assessment Gratis
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 w-full">
            Nanti saja, langsung masuk
          </Button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Leaf className="size-3.5" aria-hidden />
          100% gratis · privasi terjaga
        </p>
      </DialogContent>
    </Dialog>
  );
}
