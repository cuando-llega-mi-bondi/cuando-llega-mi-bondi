import { Button, Card } from "@/components/ui";

interface ArrivalsEmptyProps {
    isConsulting: boolean;
    loadingArribos: boolean;
    selectedRamal: string;
    onRetry: () => void;
    onResetRamal: () => void;
}

export function ArrivalsEmpty({
    isConsulting,
    loadingArribos,
    selectedRamal,
    onRetry,
    onResetRamal,
}: ArrivalsEmptyProps) {
    return (
        <Card className="rounded-[10px] px-6 py-6 text-center font-mono text-[13px] text-text-dim">
            {isConsulting ? (
                <>
                    <div className="mb-3.5 leading-relaxed">
                        Sin información en este momento. Podés reintentar o ver todos los
                        ramales si filtraste uno.
                    </div>
                    <div className="flex flex-col items-stretch gap-2.5">
                        <Button
                            type="button"
                            onClick={onRetry}
                            disabled={loadingArribos}
                            variant="primary"
                            className="border border-accent bg-accent/10 text-sm text-accent"
                        >
                            Reintentar
                        </Button>
                        {selectedRamal !== "TODOS" ? (
                            <Button
                                type="button"
                                onClick={onResetRamal}
                                variant="secondary"
                                className="text-sm text-text"
                            >
                                Ver todos los ramales
                            </Button>
                        ) : null}
                    </div>
                </>
            ) : (
                "Hacé clic en CONSULTAR"
            )}
        </Card>
    );
}
