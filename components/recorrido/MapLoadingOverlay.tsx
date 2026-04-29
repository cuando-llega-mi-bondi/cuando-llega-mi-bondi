import { Spinner } from "@/components/ui";

export function MapLoadingOverlay() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background">
            <Spinner className="h-10 w-10 border-[3px]" />
            <div className="font-sans text-sm tracking-[-0.01em] text-muted-foreground">
                Cargando recorrido…
            </div>
        </div>
    );
}
