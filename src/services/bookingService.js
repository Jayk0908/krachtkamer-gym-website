// src/services/bookingService.js
// Public booking API service used by the website-facing booking modal

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

async function httpGet(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function httpPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `POST ${path} failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// Cache utility for booking config
const CONFIG_CACHE_KEY = 'booking_config_cache';
const CONFIG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedConfig(identifier) {
  try {
    const cached = localStorage.getItem(`${CONFIG_CACHE_KEY}_${identifier}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > CONFIG_CACHE_TTL) {
      localStorage.removeItem(`${CONFIG_CACHE_KEY}_${identifier}`);
      return null;
    }
    
    console.log("📦 Using cached booking config (age:", Math.round(age / 1000), "seconds)");
    return data;
  } catch (e) {
    console.warn("⚠️ Failed to read cache:", e);
    return null;
  }
}

function setCachedConfig(identifier, config) {
  try {
    const cache = {
      data: config,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CONFIG_CACHE_KEY}_${identifier}`, JSON.stringify(cache));
    console.log("💾 Cached booking config");
  } catch (e) {
    console.warn("⚠️ Failed to cache config (localStorage full?):", e);
  }
}

// Fetch public booking configuration for a given website domain or client identifier
export async function getPublicBookingConfig({ domain, clientEmail } = {}) {
  // Create cache key from identifier
  const identifier = clientEmail || domain || 'default';
  
  // Check cache first
  const cached = getCachedConfig(identifier);
  if (cached) {
    return cached;
  }
  
  try {
    // Prefer clientEmail over domain for more reliable identification
    const params = clientEmail ? { clientEmail } : (domain ? { domain } : {});
    console.log("🔌 Calling API:", `${API_BASE}/public/bookings/config`, params);
    const resp = await httpGet(`/public/bookings/config`, params);
    console.log("✅ API response:", resp);
    const config = resp?.config || null;
    
    // Cache the result
    if (config) {
      setCachedConfig(identifier, config);
    }
    
    return config;
  } catch (e) {
    console.error("❌ API call failed, using fallback:", e);
    // Fallback default so the modal remains usable in development
    return {
      enabled: true,
      businessType: "gym",
      slotDuration: 60,
      bufferTime: 0,
      allowSameDayBooking: true,
      capacityType: "per_resource",
      resources: [
        { id: "trainer-1", name: "Trainer A" },
        { id: "trainer-2", name: "Trainer B" },
      ],
      operatingHours: {
        monday: { open: "09:00", close: "17:00", closed: false },
        tuesday: { open: "09:00", close: "17:00", closed: false },
        wednesday: { open: "09:00", close: "17:00", closed: false },
        thursday: { open: "09:00", close: "17:00", closed: false },
        friday: { open: "09:00", close: "17:00", closed: false },
        saturday: { open: "10:00", close: "16:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: true },
      },
    };
  }
}

// Availability cache utility
const AVAILABILITY_CACHE_KEY = 'booking_availability_cache';
const AVAILABILITY_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCachedAvailability(cacheKey) {
  try {
    const cached = localStorage.getItem(`${AVAILABILITY_CACHE_KEY}_${cacheKey}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > AVAILABILITY_CACHE_TTL) {
      localStorage.removeItem(`${AVAILABILITY_CACHE_KEY}_${cacheKey}`);
      return null;
    }
    
    console.log("📦 Using cached availability (age:", Math.round(age / 1000), "seconds)");
    return data;
  } catch (e) {
    console.warn("⚠️ Failed to read availability cache:", e);
    return null;
  }
}

function setCachedAvailability(cacheKey, slots) {
  try {
    const cache = {
      data: slots,
      timestamp: Date.now()
    };
    localStorage.setItem(`${AVAILABILITY_CACHE_KEY}_${cacheKey}`, JSON.stringify(cache));
  } catch (e) {
    console.warn("⚠️ Failed to cache availability (localStorage full?):", e);
  }
}

// Clear availability cache (call when booking is created/updated/cancelled)
export function clearAvailabilityCache(domain, clientEmail, dateISO) {
  try {
    const identifier = clientEmail || domain || 'default';
    const date = dateISO ? dateISO.split('T')[0] : null;
    
    if (date) {
      // Clear specific date
      localStorage.removeItem(`${AVAILABILITY_CACHE_KEY}_${identifier}_${date}_`);
      // Clear all resources for this date
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${AVAILABILITY_CACHE_KEY}_${identifier}_${date}_`)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear all for this client
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${AVAILABILITY_CACHE_KEY}_${identifier}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log("🗑️ Cleared availability cache");
  } catch (e) {
    console.warn("⚠️ Failed to clear cache:", e);
  }
}

// Get available slots (planned endpoint). Fallback generates slots from operating hours
export async function getPublicAvailability({ dateISO, resourceId, config, domain, clientEmail }) {
  // Create cache key
  const identifier = clientEmail || domain || 'default';
  const resource = resourceId || '';
  const cacheKey = `${identifier}_${dateISO}_${resource}`;
  
  // Check cache first
  const cached = getCachedAvailability(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    console.log("🔌 Calling availability API:", { date: dateISO, resourceId, clientEmail });
    const resp = await httpGet(`/public/bookings/availability`, {
      date: dateISO,
      resourceId,
      domain,
      clientEmail,
    });
    console.log("✅ Availability API response:", resp);
    if (Array.isArray(resp?.slots)) {
      // Cache the result
      setCachedAvailability(cacheKey, resp.slots);
      return resp.slots;
    }
  } catch (e) {
    console.log("⚠️ Availability API failed, using fallback:", e.message);
    // Fallback to client-side generation below
  }

  // Fallback: generate slots from operating hours and slotDuration
  if (!config) return [];
  const weekday = new Date(dateISO).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const dayCfg = config.operatingHours?.[weekday];
  if (!dayCfg || dayCfg.closed) return [];

  const [openH, openM] = dayCfg.open.split(":").map(Number);
  const [closeH, closeM] = dayCfg.close.split(":").map(Number);
  const slot = config.slotDuration || 60;
  const slots = [];
  let cur = new Date(dateISO);
  cur.setHours(openH, openM, 0, 0);
  const end = new Date(dateISO);
  end.setHours(closeH, closeM, 0, 0);
  while (cur < end) {
    const hh = String(cur.getHours()).padStart(2, "0");
    const mm = String(cur.getMinutes()).padStart(2, "0");
    slots.push({ start_time: `${hh}:${mm}` });
    cur = new Date(cur.getTime() + slot * 60000);
  }
  return slots;
}

// Create a public booking (planned endpoint). Returns API response
export async function createPublicBooking(payload) {
  return httpPost(`/public/bookings`, payload);
}

export default {
  getPublicBookingConfig,
  getPublicAvailability,
  createPublicBooking,
};


