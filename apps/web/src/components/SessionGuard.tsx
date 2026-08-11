import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { getSession } from "@/lib/auth";

export default function SessionGuard({ children }: PropsWithChildren) {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </div>
    );
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
