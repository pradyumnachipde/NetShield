
import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading data..." }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-400">
      <LoaderCircle className="animate-spin text-cyan-400" size={28} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
