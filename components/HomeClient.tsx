"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    getLineas, getIntersecciones, getParadas, getArribos,
    getFavoritos, saveFavorito, removeFavorito, isFavorito,
    getCalles, updateFavorito,
    getHistorial, pushHistorial, removeHistorialEntry, clearHistorial,
} from "@/lib/cuandoLlega";
import { type Linea, type Interseccion, type Parada, type Arribo, type Favorito, type HistorialEntry } from "@/lib/cuandoLlega.types";
import { cleanLabel } from "@/lib/utils";
import { getCache, setCache } from "@/lib/localCache";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FavoritesList } from "@/components/FavoritesList";
import { HistorialList } from "@/components/HistorialList";
import { SearchFlow } from "@/components/SearchFlow";
import { FavoriteNameModal } from "@/components/FavoriteNameModal";
import useSWR from "swr";
import { swrFetcher } from "@/lib/cuandoLlega";

export function HomeClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");

    // selected
    const [codLinea, setCodLinea] = useState("");
    const [codCalle, setCodCalle] = useState("");
    const [codInterseccion, setCodInterseccion] = useState("");
    const [paradaId, setParadaId] = useState("");
    const [selectedRamal, setSelectedRamal] = useState("TODOS");

    // data (Favoritos & Historial handled manually as they are in localStorage)
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [historial, setHistorial] = useState<HistorialEntry[]>([]);

    // naming modal state
    const [pendingFav, setPendingFav] = useState<Favorito | null>(null);
    const [isNamingOpen, setIsNamingOpen] = useState(false);
    const [editingFav, setEditingFav] = useState<Favorito | null>(null);

    // auto-refresh management
    const [isConsulting, setIsConsulting] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // --- Hydrate from URL on first render ---
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;

        const urlLinea = searchParams.get("linea");
        const urlParada = searchParams.get("parada");

        if (urlLinea && urlParada) {
            setCodLinea(urlLinea);
            setParadaId(urlParada);
            setIsConsulting(true);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Sync URL when linea/parada change ---
    const skipUrlSync = useRef(false);
    useEffect(() => {
        // Don't update during the hydration read
        if (!hydrated.current) return;
        if (skipUrlSync.current) {
            skipUrlSync.current = false;
            return;
        }

        const params = new URLSearchParams();
        if (codLinea) params.set("linea", codLinea);
        if (paradaId) params.set("parada", paradaId);

        const newSearch = params.toString();
        const currentSearch = searchParams.toString();

        if (newSearch !== currentSearch) {
            router.replace(pathname + (newSearch ? `?${newSearch}` : ""), { scroll: false });
        }
    }, [codLinea, paradaId]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- SWR Hooks ---

    // 1. Líneas — with 24h localStorage cache as fallback
    const LINEAS_ACTION = "RecuperarLineaPorCuandoLlega";
    const { data: dataLineas, isLoading: loadingLineas, error: errorLineas } = useSWR<any>(
        [LINEAS_ACTION, {}],
        swrFetcher,
        {
            fallbackData: getCache(LINEAS_ACTION) ?? undefined,
            onSuccess: (data) => setCache(LINEAS_ACTION, data),
            onError: (err) => setError(err?.message ?? "Error al cargar las líneas."),
        }
    );
    const lineas: Linea[] = dataLineas?.lineas ?? [];

    // 2. Calles (depends on codLinea) — with 24h localStorage cache as fallback
    const CALLES_ACTION = "RecuperarCallesPrincipalPorLinea";
    const callesParams = codLinea ? { codLinea } : undefined;
    const { data: dataCalles, isLoading: loadingCalles } = useSWR<any>(
        codLinea ? [CALLES_ACTION, { codLinea }] : null,
        swrFetcher,
        {
            fallbackData: callesParams ? (getCache(CALLES_ACTION, callesParams) ?? undefined) : undefined,
            onSuccess: (data) => callesParams && setCache(CALLES_ACTION, data, callesParams),
        }
    );
    const callesRaw: { Codigo: string; Descripcion: string }[] = dataCalles?.calles ?? [];

    // 3. Intersecciones (depends on codLinea & codCalle)
    const { data: dataInter, isLoading: loadingInter } = useSWR<any>(
        codLinea && codCalle ? ["RecuperarInterseccionPorLineaYCalle", { codLinea, codCalle }] : null,
        swrFetcher
    );
    const intersecciones: Interseccion[] = dataInter?.calles ?? [];

    // 4. Paradas (depends on codLinea, codCalle, codInterseccion)
    const { data: dataParadas, isLoading: loadingParadas } = useSWR<any>(
        codLinea && codCalle && codInterseccion
            ? ["RecuperarParadasConBanderaPorLineaCalleEInterseccion", { codLinea, codCalle, codInterseccion }]
            : null,
        swrFetcher
    );
    const paradas: Parada[] = dataParadas?.paradas ?? [];

    // 5. Arribos (depends on paradaId & codLinea, and isConsulting)
    const { data: dataArribos, isLoading: loadingArribos, mutate: mutateArribos } = useSWR<any>(
        isConsulting && paradaId && codLinea
            ? ["RecuperarProximosArribosW", { identificadorParada: paradaId, codigoLineaParada: codLinea }]
            : null,
        swrFetcher,
        {
            refreshInterval: 30000,
            onSuccess: () => { setLastUpdate(new Date()); setError(""); },
            onError: (err) => setError(err?.message ?? "El servidor de la Municipalidad no responde."),
        }
    );
    const arribos: Arribo[] = dataArribos?.arribos ?? [];

    // Auto-save historial on first successful fetch after consulting
    const savedHistRef = useRef("");
    useEffect(() => {
        if (!isConsulting || !paradaId || !codLinea || arribos.length === 0) return;
        const entryId = `${paradaId}_${codLinea}`;
        if (savedHistRef.current === entryId) return; // already saved this consultation
        savedHistRef.current = entryId;
        const first = arribos[0];
        const calleLabel = calles.find(c => c.value === codCalle)?.label;
        const interseccionLabel = interOptions.find(i => i.value === codInterseccion)?.label;
        pushHistorial({
            id: entryId,
            paradaId,
            codLinea,
            descripcionLinea: first.DescripcionLinea,
            descripcionBandera: first.DescripcionBandera,
            calleLabel,
            interseccionLabel,
            timestamp: Date.now(),
        });
        setHistorial(getHistorial());
    }, [isConsulting, paradaId, codLinea, arribos]);

    // State cleanup
    const [error, setError] = useState("");

    // Initial load for favoritos & historial
    useEffect(() => {
        setFavoritos(getFavoritos());
        setHistorial(getHistorial());
    }, []);

    // --- Handlers for manual selection changes ---
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
        if (isFavorito(id)) {
            removeFavorito(id);
            setFavoritos(getFavoritos());
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
    }, [paradaId]);

    const handleSaveNaming = useCallback((name: string) => {
        if (editingFav) {
            updateFavorito(editingFav.id, name);
            setEditingFav(null);
        } else if (pendingFav) {
            saveFavorito({ ...pendingFav, nombre: name });
            setPendingFav(null);
        }
        setIsNamingOpen(false);
        setFavoritos(getFavoritos());
    }, [pendingFav, editingFav]);

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
        removeFavorito(id);
        setFavoritos(getFavoritos());
    }, []);

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
        setHistorial(getHistorial());
    }, []);

    const handleClearHistorial = useCallback(() => {
        clearHistorial();
        setHistorial([]);
    }, []);

    // --- Memoized derived options ---

    const lineaOptions = useMemo(() =>
        lineas.map(l => ({ value: l.CodigoLineaParada, label: l.Descripcion })),
        [lineas]);

    const calles = useMemo(() =>
        callesRaw.map(c => ({
            value: c.Codigo,
            label: cleanLabel(c.Descripcion),
        })),
        [callesRaw]);

    const interOptions = useMemo(() =>
        intersecciones.map(i => ({
            value: i.Codigo,
            label: cleanLabel(i.Descripcion),
        })),
        [intersecciones]);

    const destinoOptions = useMemo(() => {
        const uniqueIds = Array.from(new Set(paradas.map(p => p.Identificador)));
        return uniqueIds.map(id => {
            const first = paradas.find(p => p.Identificador === id);
            return { value: id, label: first?.AbreviaturaBandera ?? id };
        });
    }, [paradas]);

    const ramalOptions = useMemo(() => {
        const matched = paradas.filter(p => p.Identificador === paradaId);
        return [
            { value: "TODOS", label: "Todos" },
            ...matched.map(r => ({ value: r.AbreviaturaBandera, label: r.AbreviaturaBandera }))
        ];
    }, [paradas, paradaId]);

    const displayArribos = useMemo(() => {
        if (selectedRamal === "TODOS") return arribos;
        return arribos.filter(a => a.DescripcionBandera === selectedRamal);
    }, [arribos, selectedRamal]);

    const selectedParada = useMemo(() =>
        paradas.find(p => p.Identificador === paradaId),
        [paradas, paradaId]);

    return (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
            <Header tab={tab} setTab={setTab} favCount={favoritos.length} />

            <main style={{ flex: 1, padding: "20px", maxWidth: 520, margin: "0 auto", width: "100%" }}>
                {tab === "buscar" ? (
                    <SearchFlow
                        codLinea={codLinea} setCodLinea={handleLineaChange}
                        codCalle={codCalle} setCodCalle={handleCalleChange}
                        codInterseccion={codInterseccion} setCodInterseccion={handleInterseccionChange}
                        paradaId={paradaId} setParadaId={handleParadaChange}
                        selectedRamal={selectedRamal} setSelectedRamal={setSelectedRamal}
                        isConsulting={isConsulting} setIsConsulting={setIsConsulting}
                        lineaOptions={lineaOptions} calles={calles} interOptions={interOptions}
                        destinoOptions={destinoOptions} ramalOptions={ramalOptions}
                        loadingLineas={loadingLineas} loadingCalles={loadingCalles}
                        loadingInter={loadingInter} loadingParadas={loadingParadas}
                        loadingArribos={loadingArribos} error={error} setError={setError}
                        displayArribos={displayArribos} selectedParada={selectedParada}
                        lastUpdate={lastUpdate} handleConsultar={handleConsultar}
                        fetchArribos={handleFetchArribos} handleFavFromArribos={handleFavFromArribos}
                        calleLabel={calles.find(c => c.value === codCalle)?.label}
                        interseccionLabel={interOptions.find(i => i.value === codInterseccion)?.label}
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
            </main>

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
