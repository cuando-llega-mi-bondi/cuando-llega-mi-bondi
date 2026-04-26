"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    getLineas, getIntersecciones, getParadas, getArribos,
    getFavoritos, saveFavorito, removeFavorito, isFavorito,
    getCalles, updateFavorito,
    getHistorial, pushHistorial, removeHistorialEntry, clearHistorial,
    findLineasEnInterseccion, post
} from "@/lib/cuandoLlega";
import { type Linea, type Interseccion, type Parada, type Arribo, type Favorito, type HistorialEntry } from "@/lib/cuandoLlega.types";
import { cleanLabel } from "@/lib/utils";
import { getCache, setCache } from "@/lib/localCache";
import { supabase } from "@/lib/supabaseClient";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FavoritesList } from "@/components/FavoritesList";
import { HistorialList } from "@/components/HistorialList";
import { SearchFlow } from "@/components/SearchFlow";
import { FavoriteNameModal } from "@/components/FavoriteNameModal";
import useSWR from "swr";
import { swrFetcher } from "@/lib/cuandoLlega";

const EMPTY_LINEAS: Linea[] = [];
const EMPTY_CALLES: { Codigo: string; Descripcion: string }[] = [];
const EMPTY_INTER: Interseccion[] = [];
const EMPTY_PARADAS: Parada[] = [];
const EMPTY_ARRIBOS: Arribo[] = [];

export function HomeClient({ children }: { children?: ReactNode }) {
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

    // Sugerencias de otras lineas
    const [otrasLineas, setOtrasLineas] = useState<Linea[]>([]);
    const [loadingOtras, setLoadingOtras] = useState(false);

    // Live sharing — buses sharing real-time location for the selected line
    const [liveSharings, setLiveSharings] = useState<{ lat: number; lng: number; ramal: string | null }[]>([]);

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
            onSuccess: (data) => setCache(LINEAS_ACTION, data.lineas ?? []),
            onError: (err) => setError(err?.message ?? "Error al cargar las líneas."),
        }
    );
    const lineas: Linea[] = dataLineas?.lineas ?? EMPTY_LINEAS;

    // 2. Calles (depends on codLinea) — with 24h localStorage cache as fallback
    const CALLES_ACTION = "RecuperarCallesPrincipalPorLinea";
    const callesParams = codLinea ? { codLinea } : undefined;
    const { data: dataCalles, isLoading: loadingCalles } = useSWR<any>(
        codLinea ? [CALLES_ACTION, { codLinea }] : null,
        swrFetcher,
        {
            fallbackData: callesParams ? (getCache(CALLES_ACTION, callesParams) ?? undefined) : undefined,
            onSuccess: (data) => callesParams && setCache(CALLES_ACTION, data.calles ?? [], callesParams),
        }
    );
    const callesRaw: { Codigo: string; Descripcion: string }[] = dataCalles?.calles ?? EMPTY_CALLES;

    // 3. Intersecciones (depends on codLinea & codCalle)
    const { data: dataInter, isLoading: loadingInter } = useSWR<any>(
        codLinea && codCalle ? ["RecuperarInterseccionPorLineaYCalle", { codLinea, codCalle }] : null,
        swrFetcher
    );
    const intersecciones: Interseccion[] = dataInter?.calles ?? EMPTY_INTER;

    // 4. Paradas (depends on codLinea, codCalle, codInterseccion)
    const { data: dataParadas, isLoading: loadingParadas } = useSWR<any>(
        codLinea && codCalle && codInterseccion
            ? ["RecuperarParadasConBanderaPorLineaCalleEInterseccion", { codLinea, codCalle, codInterseccion }]
            : null,
        swrFetcher
    );
    const paradas: Parada[] = dataParadas?.paradas ?? EMPTY_PARADAS;

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
    const arribos: Arribo[] = dataArribos?.arribos ?? EMPTY_ARRIBOS;

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

    // Fetch otras línas effect
    useEffect(() => {
        if (!isConsulting || !codLinea || !codCalle || !codInterseccion || lineas.length === 0) {
            setOtrasLineas(prev => prev.length === 0 ? prev : []);
            return;
        }

        const currentCalleLabel = calles.find(c => c.value === codCalle)?.label;
        const currentInterLabel = interOptions.find(i => i.value === codInterseccion)?.label;

        if (!currentCalleLabel || !currentInterLabel) return;

        let active = true;
        setLoadingOtras(true);
        findLineasEnInterseccion(currentCalleLabel, currentInterLabel, codLinea, lineas)
            .then(res => {
                if (active) {
                    setOtrasLineas(res);
                    setLoadingOtras(false);
                }
            })
            .catch(() => {
                if (active) setLoadingOtras(false);
            });

        return () => { active = false; };
    }, [isConsulting, codLinea, codCalle, codInterseccion, lineas, calles, interOptions]);

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

    // Supabase live subscription for bus_locations when a line is selected
    useEffect(() => {
        if (!codLinea) {
            setLiveSharings([]);
            return;
        }

        function fetchLive() {
            supabase
                .from("bus_locations")
                .select("lat, lng, ramal")
                .eq("linea", codLinea)
                .gte("updated_at", new Date(Date.now() - 180000).toISOString())
                .then(({ data }) => {
                    setLiveSharings((data || []).map((r: { lat: number; lng: number; ramal: string | null }) => ({
                        lat: r.lat, lng: r.lng, ramal: r.ramal ?? null,
                    })));
                });
        }

        fetchLive();

        const channel = supabase
            .channel(`bus-home-${codLinea}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "bus_locations",
                filter: `linea=eq.${codLinea}`,
            }, () => { fetchLive(); })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [codLinea]);

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

    const handleSelectOtraLinea = useCallback(async (linea: Linea) => {
        const currentCalleLabel = calles.find(c => c.value === codCalle)?.label;
        const currentInterLabel = interOptions.find(i => i.value === codInterseccion)?.label;
        if (!currentCalleLabel || !currentInterLabel) return;

        setIsConsulting(false);
        setCodLinea(linea.CodigoLineaParada);
        setCodCalle("");
        setCodInterseccion("");
        setParadaId("");
        setSelectedRamal("TODOS");

        try {
            // Re-fetch or cache for the new line to find its matching codes
            let nuevasCalles = getCache<any>("RecuperarCallesPrincipalPorLinea", { codLinea: linea.CodigoLineaParada });
            if (!nuevasCalles) {
                const res = await post("RecuperarCallesPrincipalPorLinea", { codLinea: linea.CodigoLineaParada });
                nuevasCalles = res?.calles ?? [];
            }
            
            const matchCalle = nuevasCalles.find((c: any) => c.Descripcion && c.Descripcion.includes(currentCalleLabel) || currentCalleLabel.includes(c.Descripcion));
            if (!matchCalle) return;
            setCodCalle(matchCalle.Codigo);

            let nuevasInter = getCache<any>("RecuperarInterseccionPorLineaYCalle", { codLinea: linea.CodigoLineaParada, codCalle: matchCalle.Codigo });
            if (!nuevasInter) {
                const res = await post("RecuperarInterseccionPorLineaYCalle", { codLinea: linea.CodigoLineaParada, codCalle: matchCalle.Codigo });
                nuevasInter = res?.calles ?? [];
            }

            const matchInter = nuevasInter.find((i: any) => i.Descripcion && (i.Descripcion.includes(currentInterLabel) || currentInterLabel.includes(i.Descripcion)));
            if (!matchInter) return;
            setCodInterseccion(matchInter.Codigo);

            const resParadas = await post("RecuperarParadasConBanderaPorLineaCalleEInterseccion", {
                codLinea: linea.CodigoLineaParada,
                codCalle: matchCalle.Codigo,
                codInterseccion: matchInter.Codigo
            });
            const nParadas = resParadas?.paradas ?? [];
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
        setHistorial(getHistorial());
    }, []);

    const handleClearHistorial = useCallback(() => {
        clearHistorial();
        setHistorial([]);
    }, []);


    return (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
            <Header tab={tab} setTab={setTab} favCount={favoritos.length} />

            <main style={{
                flex: 1,
                paddingTop: 20,
                paddingRight: "calc(20px + env(safe-area-inset-right, 0px))",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
                paddingLeft: "calc(20px + env(safe-area-inset-left, 0px))",
                maxWidth: 520,
                margin: "0 auto",
                width: "100%",
            }}>
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
                        calleLabel={calles.find(c => c.value === codCalle)?.label}
                        interseccionLabel={interOptions.find(i => i.value === codInterseccion)?.label}
                        otrasLineas={otrasLineas}
                        loadingOtras={loadingOtras}
                        onSelectOtraLinea={handleSelectOtraLinea}
                        liveSharings={liveSharings}
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
