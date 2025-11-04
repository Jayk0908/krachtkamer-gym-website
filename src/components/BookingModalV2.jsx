import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPublicBookingConfig,
  getPublicAvailability,
  createPublicBooking,
} from "../services/bookingService";
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, User, Check } from "lucide-react";

export default function BookingModalV2({ isOpen, onClose, domain = "krachtkamer-gym", clientEmail, theme }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [flowSteps, setFlowSteps] = useState([]);
  const [flowError, setFlowError] = useState("");
  const [activeBranch, setActiveBranch] = useState(null);
  const prevBranchRef = useRef(null);

  // Form data
  const [selectedDate, setSelectedDate] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedReservationOption, setSelectedReservationOption] = useState(null);
  
  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Font detection state
  const [websiteFonts, setWebsiteFonts] = useState(null);

  // Theme colors - use theme object if provided, otherwise defaults
  const primaryColor = theme?.colors?.primary || "#667eea";
  const secondaryColor = theme?.colors?.secondary || "#764ba2";
  const textColor = theme?.colors?.text || "#111827";
  const textSecondaryColor = theme?.colors?.textSecondary || "#6b7280";
  const borderColor = theme?.colors?.border || "#e5e7eb";
  const successColor = theme?.colors?.success || "#10b981";
  const errorColor = theme?.colors?.error || "#ef4444";
  const accentColor = "#ffffff"; // Always white for text on colored backgrounds
  
  const supportedStepTypes = useMemo(
    () =>
      new Set([
        "reservationType",
        "calendar",
        "timeSlot",
        "resource",
        "partySize",
        "personalInfo",
        "customFields",
        "confirmation",
      ]),
    []
  );

  const visibleSteps = useMemo(() => {
    if (!flowSteps.length) return [];

    if (!activeBranch) {
      const startId = config?.flowStartStepId;
      const startStep = flowSteps.find(
        (step) => step.id === startId && !step.branch
      );
      return startStep ? [startStep] : [flowSteps[0]];
    }

    // Filter steps by branch, matching exact branch label or checking if branch label contains the active branch option
    const filtered = flowSteps.filter((step) => {
      if (!step.branch) return false; // Skip root steps when a branch is active
      // Branch labels are like "option:opt1" or "option:opt1,opt2"
      // activeBranch is like "option:opt1"
      return step.branch === activeBranch || step.branch.startsWith(activeBranch + ',') || step.branch.includes(',' + activeBranch);
    });

    console.log('[BookingModal] visibleSteps filter:', {
      activeBranch,
      totalSteps: flowSteps.length,
      filteredCount: filtered.length,
      filtered: filtered.map((s) => ({ id: s.id, type: s.type, branch: s.branch })),
      firstStep: filtered[0] ? { id: filtered[0].id, type: filtered[0].type } : 'none',
    });

    return filtered;
  }, [flowSteps, activeBranch, config?.flowStartStepId]);

  const currentStep = visibleSteps[currentStepIndex] || null;

  // Safety check: if currentStep is null but we have visible steps, reset to first step
  useEffect(() => {
    if (!currentStep && visibleSteps.length > 0 && currentStepIndex >= visibleSteps.length) {
      console.log('[BookingModal] Safety reset: currentStep is null but visibleSteps exist, resetting index');
      setCurrentStepIndex(0);
    }
  }, [currentStep, visibleSteps.length, currentStepIndex]);

  useEffect(() => {
    if (!visibleSteps.length) {
      if (currentStepIndex !== 0) {
        setCurrentStepIndex(0);
      }
      return;
    }

    if (currentStepIndex >= visibleSteps.length) {
      setCurrentStepIndex(visibleSteps.length - 1);
    }
  }, [visibleSteps, currentStepIndex]);

  useEffect(() => {
    if (prevBranchRef.current !== activeBranch) {
      console.log('[BookingModal] Branch changed:', {
        prevBranch: prevBranchRef.current,
        newBranch: activeBranch,
        visibleStepsCount: visibleSteps.length,
        currentIndex: currentStepIndex,
      });
      
      if (!activeBranch) {
        // No branch: show only reservationType (index 0)
        setCurrentStepIndex(0);
      } else {
        // Branch selected: visibleSteps now contains only branch steps (reservationType filtered out)
        // So index 0 is the first step of the branch
        if (visibleSteps.length > 0) {
          console.log('[BookingModal] Resetting to first branch step:', visibleSteps[0]?.type);
          setCurrentStepIndex(0);
        } else {
          console.warn('[BookingModal] Branch selected but no visible steps!');
        }
      }
      prevBranchRef.current = activeBranch;
    }
  }, [activeBranch, visibleSteps]);

  // Detect website fonts on mount
  useEffect(() => {
    const detectFonts = () => {
      try {
        // Get computed styles from various elements on the page
        const body = document.body;
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const h3 = document.querySelector('h3');
        const p = document.querySelector('p');
        const button = document.querySelector('button');
        const span = document.querySelector('span');
        const a = document.querySelector('a');
        
        const fonts = {
          body: window.getComputedStyle(body).fontFamily,
          heading: h1 ? window.getComputedStyle(h1).fontFamily : 
                   h2 ? window.getComputedStyle(h2).fontFamily :
                   h3 ? window.getComputedStyle(h3).fontFamily :
                   window.getComputedStyle(body).fontFamily,
          text: p ? window.getComputedStyle(p).fontFamily : 
                window.getComputedStyle(body).fontFamily,
          button: button ? window.getComputedStyle(button).fontFamily : 
                  window.getComputedStyle(body).fontFamily,
          small: span ? window.getComputedStyle(span).fontFamily :
                 window.getComputedStyle(body).fontFamily,
          link: a ? window.getComputedStyle(a).fontFamily :
                window.getComputedStyle(body).fontFamily,
        };
        
        console.log('🔤 Detected website fonts:', fonts);
        setWebsiteFonts(fonts);
      } catch (error) {
        console.error('Failed to detect fonts:', error);
        // Fallback to default system fonts
        setWebsiteFonts({
          body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          text: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          button: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          small: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          link: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        });
      }
    };
    
    // Detect fonts after a short delay to ensure page is fully rendered
    const timer = setTimeout(detectFonts, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load config
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const cfg = await getPublicBookingConfig({ domain, clientEmail });
        if (!cancelled) setConfig(cfg);
      } catch (e) {
        if (!cancelled) setError("Kon configuratie niet laden: " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, domain, clientEmail]);

  useEffect(() => {
    if (!config) return;

    const rawSteps = Array.isArray(config.flowSteps) ? config.flowSteps : [];

    if (!rawSteps.length) {
      setFlowError("Er is nog geen flow geconfigureerd.");
      setFlowSteps([]);
      return;
    }

    const unsupported = rawSteps.filter((step) => !supportedStepTypes.has(step.type));
    if (unsupported.length) {
      setFlowError(`Flow bevat niet-ondersteunde stappen: ${unsupported.map((s) => s.type).join(", ")}`);
      setFlowSteps([]);
      return;
    }

    const ordered = [...rawSteps]
      .map((step, index) => ({
        ...step,
        branch: step.branch || null,
        order: typeof step.order === "number" ? step.order : index,
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.branch === b.branch) return a.id.localeCompare(b.id);
        if (!a.branch) return -1;
        if (!b.branch) return 1;
        return a.branch.localeCompare(b.branch);
      });

    const startIndex = ordered.findIndex((step) => step.id === config.flowStartStepId && !step.branch);
    const rotated = startIndex > 0
      ? [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)]
      : ordered;

    if (Array.isArray(config.flowWarnings) && config.flowWarnings.length) {
      console.warn("⚠️ Flow warnings:", config.flowWarnings);
    }

    console.log('[BookingModal] All steps received:', rotated.map((s) => ({
      id: s.id,
      type: s.type,
      branch: s.branch,
      order: s.order,
    })));

    setFlowSteps(rotated);
    setFlowError("");
    setCurrentStepIndex(0);
    setSelectedReservationOption(null);
    setActiveBranch(null);
  }, [config, supportedStepTypes]);

  // Pre-fetch availability for upcoming days when date is selected
  useEffect(() => {
    if (!selectedDate || !config || currentStep?.type !== "calendar") return;
    
    const resourceId = selectedResource?.id;
    if (config?.businessType !== "restaurant" && !resourceId) return;
    
    // Pre-fetch next 6 days in background
    const prefetchDates = [];
    for (let i = 1; i <= 6; i++) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + i);
      prefetchDates.push(formatDateForAPI(nextDate));
    }
    
    // Pre-fetch in background (don't await, don't show loading)
    Promise.all(
      prefetchDates.map(dateStr => 
        getPublicAvailability({
          dateISO: dateStr,
          resourceId,
          config,
          domain,
          clientEmail,
        }).catch(err => {
          console.warn(`Failed to pre-fetch ${dateStr}:`, err);
          return null;
        })
      )
    ).then(() => {
      console.log("✅ Pre-fetched availability for next 6 days");
    });
  }, [selectedDate, selectedResource, currentStep, config, domain, clientEmail]);

  // Load time slots when date/resource changes
  useEffect(() => {
    // Only load slots if we're on the timeSlot step AND have a selected date
    if (currentStep?.type !== "timeSlot" || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    
    const resourceId = selectedResource?.id;
    if (config?.businessType !== "restaurant" && !resourceId) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      try {
        const dateStr = formatDateForAPI(selectedDate);
        const slots = await getPublicAvailability({
          dateISO: dateStr,
          resourceId,
          config,
          domain,
          clientEmail,
        });
        if (!cancelled) setAvailableSlots(slots || []);
      } catch (e) {
        console.error("Failed to load slots:", e);
        if (!cancelled) setAvailableSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate, selectedResource, currentStep, config, domain, clientEmail]);

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setSelectedDate(null);
    setPartySize(2);
    setSelectedResource(null);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setError("");
    setSuccessMessage("");
    setSelectedReservationOption(null);
    setActiveBranch(null);
  };

  const handleClose = () => {
    handleReset();
    onClose?.();
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (!selectedDate) {
        throw new Error("Geen datum geselecteerd.");
      }
      
      // Validate that booking date/time is not in the past
      const bookingDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        throw new Error("Je kunt geen reservering maken in het verleden.");
      }
      
      if (selectedTimeSlot) {
        // Check if booking time is in the past for today
        if (bookingDate.getTime() === today.getTime()) {
          const now = new Date();
          const [hours, minutes] = selectedTimeSlot.start_time.split(':').map(Number);
          const bookingDateTime = new Date(bookingDate);
          bookingDateTime.setHours(hours, minutes || 0, 0, 0);
          
          if (bookingDateTime < now) {
            throw new Error("Je kunt geen reservering maken in het verleden.");
          }
        }
      }
      
      if (!selectedTimeSlot) {
        throw new Error("Geen tijdslot geselecteerd.");
      }

      // Build payload based on what steps were actually taken (same logic as summary)
      const stepsTaken = visibleSteps.map(step => step.type);
      const hasReservationType = selectedReservationOption && flowSteps.some(s => s.type === 'reservationType');
      const hasPartySize = stepsTaken.includes('partySize') && partySize && partySize > 0;
      const hasCalendar = stepsTaken.includes('calendar');
      const hasResource = stepsTaken.includes('resource') && selectedResource;
      const hasTimeSlot = stepsTaken.includes('timeSlot');
      const hasPersonalInfo = stepsTaken.includes('personalInfo');

      // Base payload - always required fields
      const payload = {
        customer_name: name,
        booking_date: formatDateForAPI(selectedDate),
        start_time: selectedTimeSlot.start_time,
        domain,
        clientEmail,
      };

      // Include end_time if timeSlot step was taken and has end_time
      if (hasTimeSlot && selectedTimeSlot.end_time) {
        payload.end_time = selectedTimeSlot.end_time;
      }

      // Include email if personalInfo step was taken and email exists
      if (hasPersonalInfo && email) {
        payload.customer_email = email;
      }

      // Include phone if personalInfo step was taken and phone exists
      if (hasPersonalInfo && phone) {
        payload.customer_phone = phone;
      }

      // Include party size if partySize step was taken
      if (hasPartySize) {
        payload.party_size = partySize;
      }

      // Include resource if resource step was taken
      if (hasResource) {
        payload.resource_id = selectedResource.id;
        payload.resource_name = selectedResource.name;
      }

      // Include notes if provided
      if (notes) {
        payload.notes = notes;
      }

      // Build custom_data based on flow steps
      const customData = {};
      
      // Include reservation type if reservationType step was taken
      if (hasReservationType && selectedReservationOption) {
        customData.reservationType = selectedReservationOption;
      }

      // Add custom_data to payload if it has any data
      if (Object.keys(customData).length > 0) {
        payload.custom_data = customData;
      }

      console.log('[BookingModal] Submitting payload:', JSON.stringify(payload, null, 2));

      await createPublicBooking(payload);
      
      const msg = config?.requireApproval 
        ? "Je aanvraag is verstuurd! Je ontvangt een bevestiging zodra deze is goedgekeurd."
        : "Boeking succesvol! Je ontvangt een bevestigingsmail.";
      
      setSuccessMessage(msg);
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (e) {
      setError(e?.message || "Boeking mislukt. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const getResourceLabel = () => {
    const type = config?.businessType;
    if (type === "gym" || type === "fitness") return "Kies de personal trainer waarmee je wilt reserveren";
    if (type === "salon") return "Kies de specialist waarmee je wilt reserveren";
    if (type === "medical") return "Kies de arts/specialist waarmee je wilt reserveren";
    return "Kies een optie";
  };

  const canGoNext = () => {
    if (!currentStep) return false;
    switch (currentStep.type) {
      case "reservationType":
        if (selectedReservationOption) return true;
        return Array.isArray(currentStep.next) && currentStep.next.some((edge) => edge.isFallback);
      case "calendar":
        return selectedDate !== null;
      case "partySize":
        return partySize > 0;
      case "resource":
        return selectedResource !== null;
      case "timeSlot":
        return selectedTimeSlot !== null;
      case "personalInfo":
        return name.trim().length > 0 && email.trim().length > 0 && email.includes('@');
      case "customFields":
        return true;
      case "confirmation":
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    if (currentStep?.type === "reservationType") {
      // If user already selected an option (clicked the button), just advance
      if (selectedReservationOption && activeBranch) {
        // Branch is already set from button click, just move to next step (first branch step)
        setCurrentStepIndex(0); // visibleSteps will be filtered to branch steps, so index 0 is first branch step
        return;
      }
      
      // Otherwise, set branch and let useEffect handle the index
      if (selectedReservationOption) {
        setActiveBranch(`option:${selectedReservationOption}`);
        return; // useEffect will handle setting currentStepIndex to 0
      } else {
        const hasFallback = Array.isArray(currentStep.next) && currentStep.next.some((edge) => edge.isFallback);
        if (hasFallback) {
          setActiveBranch("fallback");
          return; // useEffect will handle setting currentStepIndex to 0
        } else {
          return;
        }
      }
    }

    // For non-reservationType steps, just advance
    setCurrentStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const handleBack = () => {
    // If we're at the first step of a branch (index 0 when branch is active), go back to reservationType
    if (currentStepIndex === 0 && activeBranch) {
      setActiveBranch(null);
      setSelectedReservationOption(null);
      // currentStepIndex will be reset to 0 by useEffect when activeBranch becomes null
      return;
    }

    // If we're at reservationType (index 0, no branch), can't go back further
    if (currentStepIndex === 0) return;

    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Calendar rendering
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!config?.allowSameDayBooking && date.getTime() === today.getTime()) return true;
    if (date < today) return true;
    
    const maxDays = config?.maxAdvanceBookingDays || 30;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);
    
    return date > maxDate;
  };

  const renderStepContent = () => {
    if (flowError) {
      return (
        <div style={styles.noSlots}>
          {flowError}
        </div>
      );
    }

    if (!currentStep) {
      return (
        <div style={styles.noSlots}>
          Er zijn nog geen stappen geconfigureerd voor deze flow.
        </div>
      );
    }

    switch (currentStep.type) {
      case "calendar":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <Calendar size={24} style={{ marginRight: "10px" }} />
              Kies een datum
            </h3>

            <div style={styles.calendarHeader}>
              <button
                style={{
                  ...styles.calendarNavBtn,
                  fontFamily: websiteFonts?.button
                }}
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft size={20} />
              </button>
              <span style={{
                ...styles.calendarMonth,
                fontFamily: websiteFonts?.heading
              }}>
                {currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </span>
              <button
                style={{
                  ...styles.calendarNavBtn,
                  fontFamily: websiteFonts?.button
                }}
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={styles.calendarGrid}>
              {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day) => (
                <div key={day} style={{
                  ...styles.calendarDayName,
                  fontFamily: websiteFonts?.text
                }}>{day}</div>
              ))}

              {getDaysInMonth(currentMonth).map((date, idx) => {
                const disabled = isDateDisabled(date);
                const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={idx}
                    disabled={!date || disabled}
                    onClick={() => date && !disabled && setSelectedDate(date)}
                    style={{
                      ...styles.calendarDay,
                      ...(isSelected && { ...styles.calendarDaySelected, background: primaryColor, borderColor: primaryColor }),
                      ...(disabled && styles.calendarDayDisabled),
                      ...(!date && styles.calendarDayEmpty),
                      fontFamily: websiteFonts?.text
                    }}
                  >
                    {date?.getDate()}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div style={{
                ...styles.selectedInfo,
                fontFamily: websiteFonts?.text
              }}>
                Geselecteerd: <strong>{formatDateDisplay(selectedDate)}</strong>
              </div>
            )}
          </div>
        );

      case "reservationType":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              Kies een optie
            </h3>

            <div style={styles.resourceGrid}>
              {Array.isArray(currentStep?.config?.options) && currentStep.config.options.length > 0 ? (
                currentStep.config.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const optionId = option.id;
                      const branch = `option:${optionId}`;
                      console.log('[BookingModal] Option clicked:', { optionId, branch });
                      setSelectedReservationOption(optionId);
                      setActiveBranch(branch);
                      // useEffect will reset currentStepIndex to 0 when activeBranch changes
                    }}
                    style={{
                      ...styles.resourceCard,
                      ...(selectedReservationOption === option.id && {
                        ...styles.resourceCardSelected,
                        borderColor: primaryColor,
                        background: `${primaryColor}10`,
                      }),
                    }}
                  >
                    <div style={{
                      ...styles.resourceName,
                      fontFamily: websiteFonts?.text,
                    }}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div style={{
                        ...styles.resourceDesc,
                        fontFamily: websiteFonts?.small,
                      }}>
                        {option.description}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div style={styles.noSlots}>
                  Geen opties geconfigureerd voor deze stap.
                </div>
              )}
            </div>
          </div>
        );

      case "partySize":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <Users size={24} style={{ marginRight: "10px" }} />
              Aantal personen
            </h3>

            <div style={styles.partySizeContainer}>
              <button
                style={{
                  ...styles.partySizeBtn,
                  fontFamily: websiteFonts?.button
                }}
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                disabled={partySize <= 1}
              >
                -
              </button>
              <div style={{
                ...styles.partySizeDisplay,
                fontFamily: websiteFonts?.heading
              }}>{partySize}</div>
              <button
                style={{
                  ...styles.partySizeBtn,
                  fontFamily: websiteFonts?.button
                }}
                onClick={() => setPartySize(Math.min(20, partySize + 1))}
                disabled={partySize >= 20}
              >
                +
              </button>
            </div>
          </div>
        );

      case "resource":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <User size={24} style={{ marginRight: "10px" }} />
              {getResourceLabel()}
            </h3>

            <div style={styles.resourceGrid}>
              {config?.resources?.filter((r) => r.active).map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => setSelectedResource(resource)}
                  style={{
                    ...styles.resourceCard,
                    ...(selectedResource?.id === resource.id && {
                      ...styles.resourceCardSelected,
                      borderColor: primaryColor,
                      background: `${primaryColor}10`,
                    }),
                  }}
                >
                  <div style={{
                    ...styles.resourceName,
                    fontFamily: websiteFonts?.text
                  }}>{resource.name}</div>
                  {resource.description && (
                    <div style={{
                      ...styles.resourceDesc,
                      fontFamily: websiteFonts?.small
                    }}>{resource.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case "timeSlot":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <Clock size={24} style={{ marginRight: "10px" }} />
              Kies een tijdstip
            </h3>

            {loadingSlots ? (
              <div style={styles.loadingSlots}>
                <div style={styles.spinner}></div>
                <p style={{ fontFamily: websiteFonts?.text }}>Beschikbare tijden laden...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div style={{
                ...styles.noSlots,
                fontFamily: websiteFonts?.text
              }}>
                Geen tijdslots beschikbaar voor deze datum
              </div>
            ) : (
              <div style={styles.slotsGrid}>
                {availableSlots.map((slot, idx) => {
                  const isSelected = selectedTimeSlot?.start_time === slot.start_time;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedTimeSlot(slot)}
                      style={{
                        ...styles.slotBtn,
                        ...(isSelected && { ...styles.slotBtnSelected, background: primaryColor, color: accentColor, borderColor: primaryColor }),
                        fontFamily: websiteFonts?.button
                      }}
                    >
                      {slot.start_time}
                      {slot.end_time && ` - ${slot.end_time}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "personalInfo":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <User size={24} style={{ marginRight: "10px" }} />
              Jouw gegevens
            </h3>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={{
                  ...styles.label,
                  fontFamily: websiteFonts?.text
                }}>
                  Naam <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  style={{
                    ...styles.input,
                    fontFamily: websiteFonts?.text
                  }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jouw naam"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{
                  ...styles.label,
                  fontFamily: websiteFonts?.text
                }}>
                  E-mailadres <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  style={{
                    ...styles.input,
                    fontFamily: websiteFonts?.text
                  }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{
                  ...styles.label,
                  fontFamily: websiteFonts?.text
                }}>Telefoonnummer</label>
                <input
                  style={{
                    ...styles.input,
                    fontFamily: websiteFonts?.text
                  }}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12345678"
                />
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={{
                  ...styles.label,
                  fontFamily: websiteFonts?.text
                }}>Opmerkingen (optioneel)</label>
                <textarea
                  style={{
                    ...styles.input,
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: websiteFonts?.text
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Speciale wensen of vragen..."
                />
              </div>
            </div>
          </div>
        );

      case "customFields":
        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              Extra informatie
            </h3>
            <div style={styles.noSlots}>
              Extra velden worden binnenkort ondersteund.
            </div>
          </div>
        );

      case "confirmation":
        // Determine which steps were actually taken in this flow
        // visibleSteps contains the steps in the active branch (excluding reservationType which has branch: null)
        const stepsTaken = visibleSteps.map(step => step.type);
        // Check if reservationType exists in full flowSteps (it won't be in visibleSteps when branch is active)
        const hasReservationType = selectedReservationOption && flowSteps.some(s => s.type === 'reservationType');
        const hasPartySize = stepsTaken.includes('partySize') && partySize;
        const hasCalendar = stepsTaken.includes('calendar') && selectedDate;
        const hasResource = stepsTaken.includes('resource') && selectedResource;
        const hasTimeSlot = stepsTaken.includes('timeSlot') && selectedTimeSlot;
        const hasPersonalInfo = stepsTaken.includes('personalInfo');

        // Find the reservation option label
        const reservationOptionLabel = hasReservationType && flowSteps.length > 0 ? (() => {
          const reservationTypeStep = flowSteps.find(s => s.type === 'reservationType');
          const option = reservationTypeStep?.config?.options?.find(opt => opt.id === selectedReservationOption);
          return option?.label || null;
        })() : null;

        return (
          <div style={styles.stepContainer}>
            <h3 style={{
              ...styles.stepTitle,
              fontFamily: websiteFonts?.heading
            }}>
              <Check size={24} style={{ marginRight: '10px' }} />
              Bevestig je afspraak
            </h3>

            <div style={styles.summaryCard}>
              {/* Show reservation option if reservationType step was taken */}
              {hasReservationType && reservationOptionLabel && (
                <div style={styles.summaryRow}>
                  <span style={{
                    ...styles.summaryLabel,
                    fontFamily: websiteFonts?.text
                  }}>Reserveringstype:</span>
                  <span style={{
                    ...styles.summaryValue,
                    fontFamily: websiteFonts?.text
                  }}>{reservationOptionLabel}</span>
                </div>
              )}

              {/* Show party size if partySize step was taken */}
              {hasPartySize && (
                <div style={styles.summaryRow}>
                  <span style={{
                    ...styles.summaryLabel,
                    fontFamily: websiteFonts?.text
                  }}>Aantal personen:</span>
                  <span style={{
                    ...styles.summaryValue,
                    fontFamily: websiteFonts?.text
                  }}>{partySize}</span>
                </div>
              )}

              {/* Show date if calendar step was taken */}
              {hasCalendar && (
                <div style={styles.summaryRow}>
                  <span style={{
                    ...styles.summaryLabel,
                    fontFamily: websiteFonts?.text
                  }}>Datum:</span>
                  <span style={{
                    ...styles.summaryValue,
                    fontFamily: websiteFonts?.text
                  }}>{selectedDate ? formatDateDisplay(selectedDate) : '-'}</span>
                </div>
              )}

              {/* Show resource if resource step was taken */}
              {hasResource && selectedResource && (
                <div style={styles.summaryRow}>
                  <span style={{
                    ...styles.summaryLabel,
                    fontFamily: websiteFonts?.text
                  }}>
                    {config?.businessType === "gym" ? "Trainer:" : "Specialist:"}
                  </span>
                  <span style={{
                    ...styles.summaryValue,
                    fontFamily: websiteFonts?.text
                  }}>{selectedResource.name}</span>
                </div>
              )}

              {/* Show time slot if timeSlot step was taken */}
              {hasTimeSlot && selectedTimeSlot && (
                <div style={styles.summaryRow}>
                  <span style={{
                    ...styles.summaryLabel,
                    fontFamily: websiteFonts?.text
                  }}>Tijdstip:</span>
                  <span style={{
                    ...styles.summaryValue,
                    fontFamily: websiteFonts?.text
                  }}>
                    {selectedTimeSlot.start_time}
                    {selectedTimeSlot.end_time && ` - ${selectedTimeSlot.end_time}`}
                  </span>
                </div>
              )}

              {/* Show personal info section if personalInfo step was taken */}
              {hasPersonalInfo && (
                <>
                  <div style={styles.summaryDivider} />
                  <div style={styles.summaryRow}>
                    <span style={{
                      ...styles.summaryLabel,
                      fontFamily: websiteFonts?.text
                    }}>Naam:</span>
                    <span style={{
                      ...styles.summaryValue,
                      fontFamily: websiteFonts?.text
                    }}>{name || '-'}</span>
                  </div>

                  {email && (
                    <div style={styles.summaryRow}>
                      <span style={{
                        ...styles.summaryLabel,
                        fontFamily: websiteFonts?.text
                      }}>E-mail:</span>
                      <span style={{
                        ...styles.summaryValue,
                        fontFamily: websiteFonts?.text
                      }}>{email}</span>
                    </div>
                  )}

                  {phone && (
                    <div style={styles.summaryRow}>
                      <span style={{
                        ...styles.summaryLabel,
                        fontFamily: websiteFonts?.text
                      }}>Telefoon:</span>
                      <span style={{
                        ...styles.summaryValue,
                        fontFamily: websiteFonts?.text
                      }}>{phone}</span>
                    </div>
                  )}
                </>
              )}

              {/* Show notes if provided */}
              {notes && (
                <>
                  <div style={styles.summaryDivider} />
                  <div style={styles.summaryRow}>
                    <span style={{
                      ...styles.summaryLabel,
                      fontFamily: websiteFonts?.text
                    }}>Opmerkingen:</span>
                    <span style={{
                      ...styles.summaryValue,
                      fontFamily: websiteFonts?.text
                    }}>{notes}</span>
                  </div>
                </>
              )}
            </div>

            {config?.requireApproval && (
              <div style={{
                ...styles.approvalNotice,
                fontFamily: websiteFonts?.small
              }}>
                ℹ️ Je boeking moet worden goedgekeurd voordat deze bevestigd is.
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={styles.noSlots}>
            Staptype "{currentStep.type}" wordt nog niet ondersteund.
          </div>
        );
    }
  };

  const flowReady = visibleSteps.length > 0 && !flowError;
  const isLastStep = flowReady ? currentStepIndex === visibleSteps.length - 1 : true;
  const nextDisabled = !flowReady || !canGoNext();

  if (!isOpen) return null;

  if (loading && !config) {
    return (
      <div style={styles.backdrop}>
        <div style={{...styles.modal, ...styles.loadingModal}}>
          <div style={styles.spinner}></div>
          <p>Bezig met laden...</p>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div style={styles.backdrop}>
        <div style={{
          ...styles.modal, 
          ...styles.successModal,
          fontFamily: websiteFonts?.body
        }}>
          <div style={styles.successIcon}>
            <Check size={64} color={successColor} />
          </div>
          <h2 style={{
            ...styles.successTitle,
            fontFamily: websiteFonts?.heading
          }}>Gelukt!</h2>
          <p style={{
            ...styles.successMessage,
            fontFamily: websiteFonts?.text
          }}>{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.backdrop} onClick={handleClose}>
        <div style={{
          ...styles.modal,
          width: currentStep?.type === 'calendar' ? '500px' : '600px',
          fontFamily: websiteFonts?.body || styles.modal.fontFamily
        }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{...styles.header, background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`}}>
          <div style={styles.headerContent}>
            <h2 style={{
              ...styles.headerTitle, 
              color: accentColor,
              fontFamily: websiteFonts?.heading
            }}>
              Maak een afspraak
            </h2>
            <button style={{...styles.closeBtn, color: accentColor}} onClick={handleClose}>×</button>
          </div>
          
          {/* Progress indicator */}
          <div style={styles.progress}>
            {visibleSteps.map((stepItem, index) => (
              <div
                key={`${stepItem.id}-${stepItem.branch || 'root'}`}
                style={{
                  ...styles.progressStep,
                  background: index <= currentStepIndex ? accentColor : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}
          {renderStepContent()}
        </div>

        {/* Footer with navigation */}
        <div style={styles.footer}>
          {flowReady && (currentStepIndex > 0 || activeBranch) && (
            <button
              style={{
                ...styles.backBtn,
                fontFamily: websiteFonts?.button
              }}
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft size={20} />
              Vorige
            </button>
          )}
          
          <div style={{flex: 1}} />
          
          {!isLastStep ? (
            <button
              style={{
                ...styles.nextBtn, 
                background: primaryColor, 
                color: accentColor,
                fontFamily: websiteFonts?.button
              }}
              onClick={handleNext}
              disabled={nextDisabled}
            >
              Volgende
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              style={{
                ...styles.confirmBtn, 
                background: primaryColor, 
                color: accentColor,
                fontFamily: websiteFonts?.button
              }}
              onClick={handleSubmit}
              disabled={loading || nextDisabled}
            >
              {loading ? "Bezig..." : "Bevestigen"}
              <Check size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    transition: 'width 0.3s ease',
  },
  loadingModal: {
    padding: '40px',
    textAlign: 'center',
    maxWidth: '300px',
  },
  successModal: {
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  header: {
    padding: '24px',
    color: 'white',
    // Gradient will be set inline using theme colors
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 8px',
    opacity: 0.9,
  },
  progress: {
    display: 'flex',
    gap: '8px',
  },
  progressStep: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    transition: 'background 0.3s ease',
  },
  body: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1,
  },
  stepContainer: {
    animation: 'fadeIn 0.3s ease',
  },
  stepTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#111827',
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  calendarNavBtn: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
  calendarMonth: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  },
  calendarDayName: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    padding: '8px 0',
  },
  calendarDay: {
    aspectRatio: '1',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    color: '#111827',
  },
  calendarDaySelected: {
    color: 'white',
    fontWeight: '600',
  },
  calendarDayDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  calendarDayEmpty: {
    border: 'none',
    cursor: 'default',
  },
  selectedInfo: {
    marginTop: '20px',
    padding: '12px',
    background: '#f0fdf4',
    borderRadius: '8px',
    color: '#166534',
    fontSize: '14px',
    textAlign: 'center',
  },
  partySizeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  partySizeBtn: {
    width: '48px',
    height: '48px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '600',
  },
  partySizeDisplay: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#111827',
    minWidth: '80px',
    textAlign: 'center',
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  resourceCard: {
    padding: '20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  resourceCardSelected: {
    background: '#f0fdf4',
  },
  resourceName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  resourceDesc: {
    fontSize: '13px',
    color: '#6b7280',
  },
  loadingSlots: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  },
  noSlots: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
    background: '#f9fafb',
    borderRadius: '12px',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
  },
  slotBtn: {
    padding: '16px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    color: '#111827',
  },
  slotBtnSelected: {
    borderColor: 'transparent',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  summaryCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    gap: '20px',
  },
  summaryLabel: {
    fontSize: '15px',
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '15px',
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '16px 0',
  },
  approvalNotice: {
    marginTop: '20px',
    padding: '12px 16px',
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#92400e',
  },
  footer: {
    padding: '20px 32px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    background: '#fafafa',
  },
  backBtn: {
    padding: '12px 24px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  nextBtn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  confirmBtn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  successIcon: {
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '12px',
  },
  successMessage: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
};

