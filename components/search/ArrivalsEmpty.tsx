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
        <Card className="rounded-xl px-6 py-6 text-center font-sans text-sm text-muted-foreground">
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
                            variant="secondary"
                            className="text-sm"
                        >
                            Reintentar
                        </Button>
                        {selectedRamal !== "TODOS" ? (
                            <Button
                                type="button"
                                onClick={onResetRamal}
                                variant="secondary"
                                className="text-sm text-foreground"
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
