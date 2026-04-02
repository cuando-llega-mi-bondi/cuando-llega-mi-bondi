"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    getLineas, getIntersecciones, getParadas, getArribos,
    getFavoritos, saveFavorito, removeFavorito, isFavorito,
    getCalles,
} from "@/lib/cuandoLlega";
import { type Linea, type Interseccion, type Parada, type Arribo, type Favorito } from "@/lib/cuandoLlega.types";
import { cleanLabel } from "@/lib/utils";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FavoritesList } from "@/components/FavoritesList";
import { SearchFlow } from "@/components/SearchFlow";
import useSWR from "swr";
import { swrFetcher, post } from "@/lib/cuandoLlega";

export default function Home() {
    const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");

    // selected
    const [codLinea, setCodLinea] = useState("");
    const [codCalle, setCodCalle] = useState("");
    const [codInterseccion, setCodInterseccion] = useState("");
    const [paradaId, setParadaId] = useState("");
    const [selectedRamal, setSelectedRamal] = useState("TODOS");

    // data (Favoritos handled manually as they are in localStorage)
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);

    // auto-refresh management
    const [isConsulting, setIsConsulting] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // --- SWR Hooks ---

    // 1. Líneas
    const { data: dataLineas, isLoading: loadingLineas } = useSWR<any>(
        ["RecuperarLineaPorCuandoLlega", {}],
        swrFetcher
    );
    const lineas: Linea[] = dataLineas?.lineas ?? [];

    // 2. Calles (depends on codLinea)
    const { data: dataCalles, isLoading: loadingCalles } = useSWR<any>(
        codLinea ? ["RecuperarCallesPrincipalPorLinea", { codLinea }] : null,
        swrFetcher
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
            onSuccess: () => setLastUpdate(new Date())
        }
    );
    const arribos: Arribo[] = dataArribos?.arribos ?? [];

    // State cleanup
    const [error, setError] = useState("");

    // Initial load for favoritos
    useEffect(() => {
        setFavoritos(getFavoritos());
    }, []);

    // Reset downstream selections when dependency changes
    useEffect(() => {
        setCodCalle("");
        setCodInterseccion("");
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, [codLinea]);

    useEffect(() => {
        setCodInterseccion("");
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, [codCalle]);

    useEffect(() => {
        setParadaId("");
        setIsConsulting(false);
        setSelectedRamal("TODOS");
    }, [codInterseccion]);

    const handleConsultar = useCallback(() => {
        if (!paradaId) return;
        setIsConsulting(true);
    }, [paradaId]);

    const handleFavFromArribos = useCallback((arribo: Arribo) => {
        const id = `${paradaId}_${arribo.CodigoLineaParada}`;
        if (isFavorito(id)) {
            removeFavorito(id);
        } else {
            saveFavorito({
                id,
                nombre: `${arribo.DescripcionLinea} — ${arribo.DescripcionCartelBandera}`,
                identificadorParada: paradaId,
                codigoLineaParada: arribo.CodigoLineaParada,
                descripcionLinea: arribo.DescripcionLinea,
                descripcionBandera: arribo.DescripcionCartelBandera,
            });
        }
        setFavoritos(getFavoritos());
    }, [paradaId]);

    const fetchFavArribos = useCallback(async (fav: Favorito) => {
        setTab("buscar");
        setParadaId(fav.identificadorParada);
        setCodLinea(fav.id.split("_")[1]);
        setIsConsulting(true);
    }, []);

    const removeFav = useCallback((id: string) => {
        removeFavorito(id);
        setFavoritos(getFavoritos());
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
                        codLinea={codLinea} setCodLinea={setCodLinea}
                        codCalle={codCalle} setCodCalle={setCodCalle}
                        codInterseccion={codInterseccion} setCodInterseccion={setCodInterseccion}
                        paradaId={paradaId} setParadaId={setParadaId}
                        selectedRamal={selectedRamal} setSelectedRamal={setSelectedRamal}
                        isConsulting={isConsulting} setIsConsulting={setIsConsulting}
                        lineaOptions={lineaOptions} calles={calles} interOptions={interOptions}
                        destinoOptions={destinoOptions} ramalOptions={ramalOptions}
                        loadingLineas={loadingLineas} loadingCalles={loadingCalles}
                        loadingInter={loadingInter} loadingParadas={loadingParadas}
                        loadingArribos={loadingArribos} error={error} setError={setError}
                        displayArribos={displayArribos} selectedParada={selectedParada}
                        lastUpdate={lastUpdate} handleConsultar={handleConsultar}
                        fetchArribos={() => mutateArribos()} handleFavFromArribos={handleFavFromArribos}
                    />
                ) : (
                    <FavoritesList
                        favoritos={favoritos}
                        onView={fetchFavArribos}
                        onRemove={removeFav}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}