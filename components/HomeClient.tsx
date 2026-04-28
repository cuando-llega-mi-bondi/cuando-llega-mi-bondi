"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { post } from "@/lib/api/client";
import {
    useArribos,
    useCalles,
    useFavoritos,
    useHistorial,
    useIntersecciones,
    useLineas,
    useLiveBuses,
    useOtrasLineas,
    useParadas,
    useUrlSync,
} from "@/lib/hooks";
import { getCache } from "@/lib/storage/localCache";
import type { Arribo, Favorito, HistorialEntry, Linea } from "@/lib/types";
import { cleanLabel } from "@/lib/utils";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FavoritesList } from "@/components/FavoritesList";
import { HistorialList } from "@/components/HistorialList";
import { SearchFlow } from "@/components/SearchFlow";
import { FavoriteNameModal } from "@/components/FavoriteNameModal";
import { PageShell } from "@/components/layout";

type RawCalleMatch = { Codigo: string; Descripcion: string };
type RawInterMatch = { Codigo: string; Descripcion: string };
type RawParadaMatch = { Identificador: string };

export function HomeClient({ children }: { children?: ReactNode }) {
    const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");

    const [codLinea, setCodLinea] = useState("");
    const [codCalle, setCodCalle] = useState("");
    const [codInterseccion, setCodInterseccion] = useState("");
    const [paradaId, setParadaId] = useState("");
    const [selectedRamal, setSelectedRamal] = useState("TODOS");

    const [isConsulting, setIsConsulting] = useState(false);
    const [error, setError] = useState("");
    const [pendingFav, setPendingFav] = useState<Favorito | null>(null);
    const [isNamingOpen, setIsNamingOpen] = useState(false);
    const [editingFav, setEditingFav] = useState<Favorito | null>(null);

    useUrlSync({
        codLinea,
        paradaId,
        setCodLinea,
        setParadaId,
        onHydratedSelection: () => setIsConsulting(true),
    });

    const { lineas, loadingLineas } = useLineas({
        onError: (message) => setError(message),
    });
    const { callesRaw, loadingCalles } = useCalles(codLinea);
    const { intersecciones, loadingInter } = useIntersecciones(codLinea, codCalle);
    const { paradas, loadingParadas } = useParadas(
        codLinea,
        codCalle,
        codInterseccion,
    );
    const { arribos, loadingArribos, mutateArribos, lastUpdate } = useArribos({
        isConsulting,
        paradaId,
        codLinea,
        onSuccess: () => setError(""),
        onError: (message) => setError(message),
    });
    const {
        favoritos,
        addFavorito,
        removeFavorito: removeFavoritoEntry,
        renameFavorito,
        isFavorito: isFavoritoEntry,
    } = useFavoritos();
    const {
        historial,
        pushHistorialEntry,
        removeHistorialEntry,
        clearHistorialEntries,
    } = useHistorial();
    const { liveSharings } = useLiveBuses(codLinea);

    const lineaOptions = useMemo(
        () => lineas.map((l) => ({ value: l.CodigoLineaParada, label: l.Descripcion })),
        [lineas],
    );

    const calles = useMemo(
        () =>
            callesRaw.map((c) => ({
                value: c.Codigo,
                label: cleanLabel(c.Descripcion),
            })),
        [callesRaw],
    );

    const interOptions = useMemo(
        () =>
            intersecciones.map((i) => ({
                value: i.Codigo,
                label: cleanLabel(i.Descripcion),
            })),
        [intersecciones],
    );

    const destinoOptions = useMemo(() => {
        const uniqueIds = Array.from(new Set(paradas.map((p) => p.Identificador)));
        return uniqueIds.map(id => {
            const first = paradas.find((p) => p.Identificador === id);
            return { value: id, label: first?.AbreviaturaBandera ?? id };
        });
    }, [paradas]);

    const ramalOptions = useMemo(() => {
        const matched = paradas.filter((p) => p.Identificador === paradaId);
        return [
            { value: "TODOS", label: "Todos" },
            ...matched.map((r) => ({
                value: r.AbreviaturaBandera,
                label: r.AbreviaturaBandera,
            })),
        ];
    }, [paradas, paradaId]);

    const displayArribos = useMemo(() => {
        if (selectedRamal === "TODOS") return arribos;
        return arribos.filter(a => a.DescripcionBandera === selectedRamal);
    }, [arribos, selectedRamal]);

    const selectedParada = useMemo(() =>
        paradas.find((p) => p.Identificador === paradaId),
        [paradas, paradaId],
    );

    const calleLabel = calles.find((c) => c.value === codCalle)?.label;
    const interseccionLabel = interOptions.find(
        (i) => i.value === codInterseccion,
    )?.label;

    const { otrasLineas, loadingOtras } = useOtrasLineas({
        isConsulting,
        codLinea,
        codCalle,
        codInterseccion,
        lineas,
        calleLabel,
        interseccionLabel,
    });

    // Auto-save historial on first successful fetch after consulting
    const savedHistRef = useRef("");
    useEffect(() => {
        if (!isConsulting || !paradaId || !codLinea || arribos.length === 0) return;
        const entryId = `${paradaId}_${codLinea}`;
        if (savedHistRef.current === entryId) return; // already saved this consultation
        savedHistRef.current = entryId;
        const first = arribos[0];
        pushHistorialEntry({
            id: entryId,
            paradaId,
            codLinea,
            descripcionLinea: first.DescripcionLinea,
            descripcionBandera: first.DescripcionBandera,
            calleLabel,
            interseccionLabel,
            timestamp: Date.now(),
        });
    }, [
        arribos,
        calleLabel,
        codLinea,
        interseccionLabel,
        isConsulting,
        paradaId,
        pushHistorialEntry,
    ]);

    const handleLineaChange = useCallback((val: string) => {
        setCodLinea(val);
        setCodCalle("");
        setCodInterseccion("");
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, []);

    const handleCalleChange = useCallback((val: string) => {
        setCodCalle(val);
        setCodInterseccion("");
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, []);

    const handleInterseccionChange = useCallback((val: string) => {
        setCodInterseccion(val);
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, []);

    const handleParadaChange = useCallback((val: string) => {
        setParadaId(val);
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, []);

    const handleConsultar = useCallback(() => {
        if (!paradaId) return;
        setIsConsulting(true);
    }, [paradaId]);

    const handleFavFromArribos = useCallback((arribo: Arribo) => {
        const id = `${paradaId}_${arribo.CodigoLineaParada}`;
        if (isFavoritoEntry(id)) {
            removeFavoritoEntry(id);
        } else {
            setPendingFav({
                id,
                nombre: `${arribo.DescripcionLinea} — ${arribo.DescripcionCartelBandera}`,
                identificadorParada: paradaId,
                codigoLineaParada: arribo.CodigoLineaParada,
                descripcionLinea: arribo.DescripcionLinea,
                descripcionBandera: arribo.DescripcionCartelBandera,
            });
            setIsNamingOpen(true);
        }
    }, [isFavoritoEntry, paradaId, removeFavoritoEntry]);

    const handleSaveNaming = useCallback((name: string) => {
        if (editingFav) {
            renameFavorito(editingFav.id, name);
            setEditingFav(null);
        } else if (pendingFav) {
            addFavorito({ ...pendingFav, nombre: name });
            setPendingFav(null);
        }
        setIsNamingOpen(false);
    }, [addFavorito, editingFav, pendingFav, renameFavorito]);

    const handleEditFavName = useCallback((fav: Favorito) => {
        setEditingFav(fav);
        setIsNamingOpen(true);
    }, []);

    const fetchFavArribos = useCallback(async (fav: Favorito) => {
        setTab("buscar");
        setParadaId(fav.identificadorParada);
        setCodLinea(fav.id.split("_")[1]);
        setSelectedRamal("TODOS");
        setIsConsulting(true);
    }, []);

    const handleFetchArribos = useCallback(() => {
        mutateArribos();
    }, [mutateArribos]);

    const removeFav = useCallback((id: string) => {
        removeFavoritoEntry(id);
    }, [removeFavoritoEntry]);

    const handleSelectOtraLinea = useCallback(async (linea: Linea) => {
        const currentCalleLabel = calles.find((c) => c.value === codCalle)?.label;
        const currentInterLabel = interOptions.find(
            (i) => i.value === codInterseccion,
        )?.label;
        if (!currentCalleLabel || !currentInterLabel) return;

        setIsConsulting(false);
        setCodLinea(linea.CodigoLineaParada);
        setCodCalle("");
        setCodInterseccion("");
        setParadaId("");
        setSelectedRamal("TODOS");

        try {
            // Re-fetch or cache for the new line to find its matching codes
            let nuevasCalles = getCache<RawCalleMatch[]>(
                "RecuperarCallesPrincipalPorLinea",
                {
                codLinea: linea.CodigoLineaParada,
                },
            );
            if (!nuevasCalles) {
                const res = await post("RecuperarCallesPrincipalPorLinea", { codLinea: linea.CodigoLineaParada });
                nuevasCalles = res?.calles ?? [];
            }
            const callesDisponibles = nuevasCalles ?? [];

            const matchCalle = callesDisponibles.find(
                (c: RawCalleMatch) =>
                    c.Descripcion &&
                    (c.Descripcion.includes(currentCalleLabel) ||
                        currentCalleLabel.includes(c.Descripcion)),
            );
            if (!matchCalle) return;
            setCodCalle(matchCalle.Codigo);

            let nuevasInter = getCache<RawInterMatch[]>(
                "RecuperarInterseccionPorLineaYCalle",
                {
                codLinea: linea.CodigoLineaParada,
                codCalle: matchCalle.Codigo,
                },
            );
            if (!nuevasInter) {
                const res = await post("RecuperarInterseccionPorLineaYCalle", { codLinea: linea.CodigoLineaParada, codCalle: matchCalle.Codigo });
                nuevasInter = res?.calles ?? [];
            }
            const interDisponibles = nuevasInter ?? [];

            const matchInter = interDisponibles.find(
                (i: RawInterMatch) =>
                    i.Descripcion &&
                    (i.Descripcion.includes(currentInterLabel) ||
                        currentInterLabel.includes(i.Descripcion)),
            );
            if (!matchInter) return;
            setCodInterseccion(matchInter.Codigo);

            const resParadas = await post("RecuperarParadasConBanderaPorLineaCalleEInterseccion", {
                codLinea: linea.CodigoLineaParada,
                codCalle: matchCalle.Codigo,
                codInterseccion: matchInter.Codigo
            });
            const nParadas: RawParadaMatch[] = resParadas?.paradas ?? [];
            if (nParadas.length > 0) {
                setParadaId(nParadas[0].Identificador);
                setIsConsulting(true);
            }
        } catch (err) {
            console.error(err);
        }
    }, [codCalle, codInterseccion, calles, interOptions]);

    const fetchHistEntry = useCallback((entry: HistorialEntry) => {
        setTab("buscar");
        setParadaId(entry.paradaId);
        setCodLinea(entry.codLinea);
        setSelectedRamal("TODOS");
        savedHistRef.current = ""; // allow re-saving if consulted again
        setIsConsulting(true);
    }, []);

    const removeHistEntry = useCallback((id: string) => {
        removeHistorialEntry(id);
    }, [removeHistorialEntry]);

    const handleClearHistorial = useCallback(() => {
        clearHistorialEntries();
    }, [clearHistorialEntries]);


    return (
        <div className="flex min-h-dvh flex-col">
            <Header tab={tab} setTab={setTab} favCount={favoritos.length} />

            <PageShell>
                {children}
                {tab === "buscar" ? (
                    <SearchFlow
                        codLinea={codLinea} setCodLinea={handleLineaChange}
                        codCalle={codCalle} setCodCalle={handleCalleChange}
                        codInterseccion={codInterseccion} setCodInterseccion={handleInterseccionChange}
                        paradaId={paradaId} setParadaId={handleParadaChange}
                        selectedRamal={selectedRamal} setSelectedRamal={setSelectedRamal}
                        isConsulting={isConsulting}
                        lineaOptions={lineaOptions} calles={calles} interOptions={interOptions}
                        destinoOptions={destinoOptions} ramalOptions={ramalOptions}
                        loadingLineas={loadingLineas} loadingCalles={loadingCalles}
                        loadingInter={loadingInter} loadingParadas={loadingParadas}
                        loadingArribos={loadingArribos} error={error} setError={setError}
                        displayArribos={displayArribos} selectedParada={selectedParada}
                        lastUpdate={lastUpdate} handleConsultar={handleConsultar}
                        fetchArribos={handleFetchArribos} handleFavFromArribos={handleFavFromArribos}
                        calleLabel={calleLabel}
                        interseccionLabel={interseccionLabel}
                        otrasLineas={otrasLineas}
                        loadingOtras={loadingOtras}
                        onSelectOtraLinea={handleSelectOtraLinea}
                        liveSharings={liveSharings}
                        telegramUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "cuandollegamdp_bot"}
                    />
                ) : (
                    <>
                        <FavoritesList
                            favoritos={favoritos}
                            onView={fetchFavArribos}
                            onRemove={removeFav}
                            onRename={handleEditFavName}
                        />
                        <HistorialList
                            historial={historial}
                            onView={fetchHistEntry}
                            onRemove={removeHistEntry}
                            onClear={handleClearHistorial}
                        />
                    </>
                )}
            </PageShell>

            <FavoriteNameModal
                isOpen={isNamingOpen}
                onClose={() => {
                    setIsNamingOpen(false);
                    setPendingFav(null);
                    setEditingFav(null);
                }}
                onSave={handleSaveNaming}
                initialName={editingFav?.nombre ?? pendingFav?.nombre ?? ""}
                title={editingFav ? "Renombrar parada" : "Guardar parada"}
            />

            <Footer />
        </div>
    );
}
