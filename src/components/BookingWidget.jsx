import { useState, useMemo, useEffect } from "react";
import BookingModalV2 from "./BookingModalV2";
import { getClientTheme } from "../services/themeService";

export default function BookingWidget({ domain = "krachtkamer-gym", clientEmail }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(null);
  const [loadingTheme, setLoadingTheme] = useState(true);

  // Fetch theme on mount
  useEffect(() => {
    if (clientEmail) {
      getClientTheme(clientEmail)
        .then((fetchedTheme) => {
          setTheme(fetchedTheme);
          setLoadingTheme(false);
        })
        .catch((err) => {
          console.error("Failed to load theme:", err);
          setLoadingTheme(false);
        });
    } else {
      setLoadingTheme(false);
    }
  }, [clientEmail]);

  const colors = useMemo(() => ({
    primary: theme?.colors?.primary || "#667eea",
    accent: "#ffffff", // Always white for text on colored backgrounds
  }), [theme]);

  return (
    <>
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 999 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            minWidth: "fit-content",
            padding: "16px 24px",
            borderRadius: "50px",
            background: colors.primary,
            color: colors.accent,
            border: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
          }}
          aria-label="Open booking"
          title="Boek een afspraak"
        >
          <span style={{ fontSize: "20px" }}>📅</span>
          <span>Reserveren</span>
        </button>
      </div>

      <BookingModalV2 isOpen={open} onClose={() => setOpen(false)} domain={domain} clientEmail={clientEmail} theme={theme} />
    </>
  );
}


