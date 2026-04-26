"use client";

export function Footer() {
    return (
        <footer style={{
            paddingTop: 12,
            paddingRight: "calc(20px + env(safe-area-inset-right, 0px))",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
            paddingLeft: "calc(20px + env(safe-area-inset-left, 0px))",
            borderTop: "1px solid var(--border)",
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)",
            textAlign: "center", letterSpacing: 1,
        }}>
            DATOS: MUNICIPALIDAD DE GENERAL PUEYRREDÓN · MGP
        </footer>
    );
}
