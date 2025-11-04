import { useEffect, useMemo, useState } from "react";
import {
  getPublicBookingConfig,
  getPublicAvailability,
  createPublicBooking,
} from "../services/bookingService";

export default function BookingModal({ isOpen, onClose, domain = "krachtkamer-gym", clientEmail, theme }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [date, setDate] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [notes, setNotes] = useState("");
  
  const [slotLoading, setSlotLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const isRestaurant = useMemo(() => config?.businessType === "restaurant", [config]);
  const isGym = useMemo(() => config?.businessType === "gym" || config?.businessType === "fitness", [config]);
  const hasResources = useMemo(() => Array.isArray(config?.resources) && config.resources.length > 0, [config]);
  const activeResources = useMemo(() => 
    (config?.resources || []).filter(r => r.active !== false), 
  [config]);
  const customFields = useMemo(() => config?.customFields || [], [config]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      try {
        console.log("🔄 Loading booking config for:", { domain, clientEmail });
        const cfg = await getPublicBookingConfig({ domain, clientEmail });
        console.log("✅ Booking config loaded:", cfg);
        if (!cancelled) {
          setConfig(cfg);
          // Auto-select if only one resource
          if (cfg?.resources?.length === 1) {
            setResourceId(cfg.resources[0].id);
          }
        }
      } catch (e) {
        console.error("❌ Failed to load booking config:", e);
        if (!cancelled) setError("Kon boekingsconfiguratie niet laden: " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, domain, clientEmail]);

  useEffect(() => {
    if (!isOpen || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    
    // Clear slots immediately when date/resource changes
    setSlots([]);
    setSlotLoading(true);
    setError("");
    
    (async () => {
      try {
        console.log("🕐 Loading time slots for:", { date, resourceId, clientEmail });
        const slotsResp = await getPublicAvailability({
          dateISO: date,
          resourceId: resourceId || undefined,
          config,
          domain,
          clientEmail,
        });
        console.log("✅ Time slots loaded:", slotsResp);
        if (!cancelled) {
          console.log("📝 Calling setSlots with:", slotsResp);
          setSlots(() => slotsResp);  // Use functional update to avoid stale closures
        }
      } catch (e) {
        console.error("❌ Failed to load time slots:", e);
        if (!cancelled) {
          setSlots([]);
          setError("Kon beschikbare tijden niet laden.");
        }
      } finally {
        if (!cancelled) setSlotLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, date, resourceId, domain, clientEmail]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDate("");
    setResourceId("");
    setTime("");
    setPartySize(2);
    setCustomFieldValues({});
    setNotes("");
    setSlots([]);
    setError("");
    setSuccessMessage("");
  };

  const minDate = useMemo(() => {
    const today = new Date();
    if (!config?.allowSameDayBooking) {
      today.setDate(today.getDate() + 1);
    }
    return today.toISOString().split('T')[0];
  }, [config]);

  const maxDate = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + (config?.maxAdvanceBookingDays || 30));
    return max.toISOString().split('T')[0];
  }, [config]);

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      if (!name || !date || !time) {
        setError("Naam, datum en tijd zijn verplicht.");
        return;
      }

      // Validate that booking date/time is not in the past
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        setError("Je kunt geen reservering maken in het verleden.");
        return;
      }
      
      // Check if booking time is in the past for today
      if (bookingDate.getTime() === today.getTime()) {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const bookingDateTime = new Date(bookingDate);
        bookingDateTime.setHours(hours, minutes || 0, 0, 0);
        
        if (bookingDateTime < now) {
          setError("Je kunt geen reservering maken in het verleden.");
          return;
        }
      }

      // Validate required custom fields
      for (const field of customFields) {
        if (field.required && !customFieldValues[field.id]) {
          setError(`${field.label} is verplicht.`);
          return;
        }
      }

      const payload = {
        customer_name: name,
        customer_email: email || undefined,
        customer_phone: phone || undefined,
        booking_date: date,
        start_time: time,
        notes: notes || undefined,
        custom_data: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      };

      if (isRestaurant && partySize) {
        payload.party_size = partySize;
      }

      if (hasResources && resourceId) {
        const selected = activeResources.find((r) => r.id === resourceId);
        payload.resource_id = resourceId;
        payload.resource_name = selected?.name;
        // For gym/resource bookings, calculate end_time
        if (config?.slotDuration) {
          const [h, m] = time.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(h, m + config.slotDuration, 0, 0);
          payload.end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        }
      }

      await createPublicBooking({ ...payload, domain, clientEmail });
      const msg = config?.requireApproval 
        ? "Boeking aangevraagd! Je ontvangt een bevestiging zodra deze is goedgekeurd."
        : "Boeking succesvol! Je ontvangt een bevestiging per e-mail.";
      setSuccessMessage(msg);
      setTimeout(() => {
        resetForm();
        handleClose();
      }, 2000);
    } catch (e) {
      setError(e?.message || "Boeking is mislukt. Probeer het opnieuw.");
    }
  };

  const renderCustomField = (field) => {
    const value = customFieldValues[field.id] || "";
    const handleChange = (val) => setCustomFieldValues(prev => ({ ...prev, [field.id]: val }));

    switch (field.type) {
      case "textarea":
        return (
          <label key={field.id} style={{ ...styles.label, gridColumn: "1 / -1" }}>
            {field.label}{field.required && <span style={{ color: "#b91c1c" }}> *</span>}
            <textarea
              style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </label>
        );
      
      case "select":
        return (
          <label key={field.id} style={styles.label}>
            {field.label}{field.required && <span style={{ color: "#b91c1c" }}> *</span>}
            <select
              style={styles.input}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
            >
              <option value="">Kies...</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        );
      
      case "checkbox":
        return (
          <label key={field.id} style={{ ...styles.label, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked)}
              required={field.required}
            />
            <span>{field.label}{field.required && <span style={{ color: "#b91c1c" }}> *</span>}</span>
          </label>
        );
      
      case "number":
        return (
          <label key={field.id} style={styles.label}>
            {field.label}{field.required && <span style={{ color: "#b91c1c" }}> *</span>}
            <input
              style={styles.input}
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </label>
        );
      
      case "phone":
      case "email":
      case "text":
      default:
        return (
          <label key={field.id} style={styles.label}>
            {field.label}{field.required && <span style={{ color: "#b91c1c" }}> *</span>}
            <input
              style={styles.input}
              type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </label>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.header, background: theme?.primary || styles.header.background, color: theme?.accent || styles.header.color }}>
          <h3 style={{ margin: 0 }}>Boek een afspraak</h3>
          <button style={{ ...styles.closeBtn, color: theme?.accent || styles.closeBtn.color }} onClick={handleClose}>×</button>
        </div>

        {loading ? (
          <div style={styles.body}>Bezig met laden…</div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.body}>
            {error && <div style={styles.error}>{error}</div>}
            {successMessage && <div style={styles.success}>{successMessage}</div>}

            {config?.requireApproval && (
              <div style={{ padding: "10px 12px", background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                ℹ️ Je boeking moet worden goedgekeurd voordat deze bevestigd is.
              </div>
            )}

            <div style={styles.grid}>
              <label style={styles.label}>
                Naam <span style={{ color: "#b91c1c" }}>*</span>
                <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jouw naam" required />
              </label>
              <label style={styles.label}>
                E-mail
                <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optioneel" />
              </label>
              <label style={styles.label}>
                Telefoon
                <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optioneel" />
              </label>

              {isRestaurant && (
                <label style={styles.label}>
                  Aantal personen
                  <input style={styles.input} type="number" min="1" max="20" value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value))} />
                </label>
              )}

              {hasResources && (
                <label style={styles.label}>
                  {isRestaurant ? "Tafel" : isGym ? "Trainer/Class" : "Resource"}
                  <select style={styles.input} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                    <option value="">Kies...</option>
                    {activeResources.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}{r.capacity > 1 ? ` (max ${r.capacity})` : ""}</option>
                    ))}
                  </select>
                </label>
              )}

              <label style={styles.label}>
                Datum <span style={{ color: "#b91c1c" }}>*</span>
                <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} min={minDate} max={maxDate} required />
              </label>

              <label style={styles.label}>
                Tijd <span style={{ color: "#b91c1c" }}>*</span>
                <select style={styles.input} value={time} onChange={(e) => setTime(e.target.value)} required disabled={slotLoading || !date || slots.length === 0}>
                  <option value="">
                    {slotLoading 
                      ? "Laden…" 
                      : !date 
                        ? "Selecteer eerst een datum" 
                        : slots.length === 0 
                          ? "Geen tijden beschikbaar (gesloten of volgeboekt)" 
                          : "Kies een tijd"}
                  </option>
                  {(() => {
                    console.log("🎨 Rendering slots in dropdown:", slots);
                    return slots.map((s) => (
                      <option key={s.start_time} value={s.start_time}>{s.start_time}</option>
                    ));
                  })()}
                </select>
              </label>

              {customFields.map((field) => renderCustomField(field))}

              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                Opmerkingen
                <textarea
                  style={{ ...styles.input, minHeight: 60, resize: "vertical" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Speciale verzoeken of opmerkingen..."
                />
              </label>
            </div>

            <div style={styles.footer}>
              <button type="button" style={{ ...styles.secondaryBtn, color: theme?.primary || styles.secondaryBtn.color, borderColor: theme?.primary || styles.secondaryBtn.border }} onClick={handleClose}>Annuleren</button>
              <button type="submit" style={{ ...styles.primaryBtn, background: theme?.primary || styles.primaryBtn.background, color: theme?.accent || styles.primaryBtn.color, borderColor: theme?.accent || styles.primaryBtn.border }}>Bevestigen</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    width: "min(92vw, 720px)",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    border: "4px solid #FFD700",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background: "#56642D",
    color: "#FFD700",
  },
  closeBtn: {
    background: "transparent",
    border: 0,
    color: "#FFD700",
    fontSize: 22,
    cursor: "pointer",
  },
  body: {
    padding: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 600,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 4,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  primaryBtn: {
    background: "#56642D",
    color: "#FFD700",
    border: "2px solid #FFD700",
    padding: "10px 14px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    background: "transparent",
    color: "#56642D",
    border: "1px solid #56642D",
    padding: "10px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  error: {
    background: "#fde8e8",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: 6,
    marginBottom: 12,
  },
  success: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    padding: "10px 12px",
    borderRadius: 6,
    marginBottom: 12,
  },
};


