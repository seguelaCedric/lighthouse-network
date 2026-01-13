/**
 * Comprehensive Position Normalization
 * 
 * Normalizes position names to canonical forms, handling:
 * - Underscore vs space formats (chief_stewardess vs "chief stewardess")
 * - Abbreviations (2nd, 3rd, 1st)
 * - Gender variations (stewardess vs steward)
 * - Common variations (chief stew vs chief stewardess)
 * 
 * This ensures consistent matching across the system.
 */

/**
 * Normalize a position string to a canonical form for comparison
 * Returns the normalized position name (with underscores, lowercase)
 */
export function normalizePosition(position: string): string {
  if (!position) return "";

  // First normalize: lowercase, replace underscores with spaces, trim, normalize spaces
  let normalized = position
    .toLowerCase()
    .trim()
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\s+/g, " ") // Normalize multiple spaces to single space
    .replace(/[^a-z0-9\s]/g, ""); // Remove special characters except spaces

  // Comprehensive position mapping
  // Order matters: more specific patterns first
  
  // ============================================================================
  // DECK POSITIONS
  // ============================================================================
  
  // Captain variations
  if (/^(yacht|superyacht|relief)?\s*captain$/.test(normalized) || normalized === "master") {
    return "captain";
  }
  
  // Chief/First Officer variations
  if (/^(chief|first|1st)\s*(officer|mate)$/.test(normalized) || normalized === "mate") {
    return "first_officer";
  }
  
  // Second Officer variations
  if (/^second\s*(officer|mate)$/.test(normalized) || /^2nd\s*(officer|mate)$/.test(normalized)) {
    return "second_officer";
  }
  
  // Third Officer variations
  if (/^third\s*(officer|mate)$/.test(normalized) || /^3rd\s*(officer|mate)$/.test(normalized)) {
    return "third_officer";
  }
  
  // Bosun variations
  if (/^(bosun|bosun|boatswain)$/.test(normalized) || normalized.includes("bosun")) {
    return "bosun";
  }
  
  // Lead/Senior Deckhand
  if (/^(lead|senior)\s*deckhand$/.test(normalized)) {
    return "lead_deckhand";
  }
  
  // Junior Deckhand
  if (/^junior\s*deckhand$/.test(normalized)) {
    return "deckhand"; // Map to generic deckhand
  }
  
  // Deckhand
  if (/^deck(hand)?$/.test(normalized) || normalized.includes("deckhand")) {
    return "deckhand";
  }
  
  // ============================================================================
  // ENGINEERING POSITIONS
  // ============================================================================
  
  // Chief Engineer variations
  if (/^(chief|head)\s*eng(ineer)?$/.test(normalized)) {
    return "chief_engineer";
  }
  
  // Second Engineer variations
  if (/^second\s*eng(ineer)?$/.test(normalized) || /^2nd\s*eng(ineer)?$/.test(normalized)) {
    return "second_engineer";
  }
  
  // Third Engineer variations
  if (/^third\s*eng(ineer)?$/.test(normalized) || /^3rd\s*eng(ineer)?$/.test(normalized)) {
    return "third_engineer";
  }
  
  // ETO variations
  if (/^(eto|electro\s*technical\s*officer|electrical\s*engineer|electronics\s*engineer|av\/?it)$/.test(normalized)) {
    return "eto";
  }
  
  // Generic Engineer
  if (/^engineer$/.test(normalized)) {
    return "chief_engineer"; // Default to chief
  }
  
  // ============================================================================
  // INTERIOR POSITIONS
  // ============================================================================
  
  // Chief Stewardess variations (most specific first)
  if (/^(chief|head)\s*stew(?:ardess)?$/.test(normalized) || 
      normalized.includes("chief stew") || 
      normalized.includes("head stew") ||
      normalized.includes("head of interior") ||
      normalized.includes("interior manager")) {
    return "chief_stewardess";
  }
  
  // Chief Steward (male)
  if (/^chief\s*steward$/.test(normalized)) {
    return "chief_stewardess"; // Map to same canonical form
  }
  
  // Purser variations
  if (/^purser$/.test(normalized) || normalized.includes("purser")) {
    return "purser";
  }
  
  // Second Stewardess variations
  if (/^second\s*stew(?:ardess)?$/.test(normalized) || /^2nd\s*stew(?:ardess)?$/.test(normalized)) {
    return "second_stewardess";
  }
  
  // Third Stewardess variations
  if (/^third\s*stew(?:ardess)?$/.test(normalized) || /^3rd\s*stew(?:ardess)?$/.test(normalized)) {
    return "third_stewardess";
  }
  
  // Junior/Sole Stewardess
  if (/^(junior|sole)\s*stew(?:ardess)?$/.test(normalized)) {
    return "stewardess"; // Map to generic stewardess
  }
  
  // Generic Stewardess/Steward
  if (/^stew(?:ardess)?$/.test(normalized) || normalized === "steward") {
    return "stewardess";
  }
  
  // ============================================================================
  // GALLEY POSITIONS
  // ============================================================================
  
  // Head Chef variations
  if (/^(head|executive)\s*chef$/.test(normalized) || normalized.includes("chef de cuisine")) {
    return "head_chef";
  }
  
  // Sous Chef variations
  if (/^sous\s*chef$/.test(normalized) || /^second\s*chef$/.test(normalized) || /^2nd\s*chef$/.test(normalized)) {
    return "sous_chef";
  }
  
  // Private Chef
  if (/^private\s*chef$/.test(normalized)) {
    return "private_chef";
  }
  
  // Sole Chef
  if (/^sole\s*chef$/.test(normalized)) {
    return "chef"; // Map to generic chef
  }
  
  // Generic Chef
  if (/^chef$/.test(normalized) || normalized.includes("yacht chef")) {
    return "chef";
  }
  
  // Cook
  if (/^cook$/.test(normalized)) {
    return "cook";
  }
  
  // ============================================================================
  // HOUSEHOLD POSITIONS
  // ============================================================================
  
  // Estate Manager variations
  if (/^estate\s*manager$/.test(normalized)) {
    return "estate_manager";
  }
  
  // House Manager variations
  if (/^(house|villa|property|household|residence|chalet|lodge)\s*manager$/.test(normalized)) {
    return "house_manager";
  }
  
  // Butler variations
  if (/^(head\s*)?butler$/.test(normalized) || normalized.includes("butler")) {
    return "butler";
  }
  
  // Head Housekeeper
  if (/^(head|executive)\s*housekeeper$/.test(normalized)) {
    return "head_housekeeper";
  }
  
  // Housekeeper variations
  if (/^housekeeper$/.test(normalized) || normalized.includes("housekeeper") || normalized === "housemaid" || normalized === "maid") {
    return "housekeeper";
  }
  
  // Personal Assistant variations
  if (/^(personal\s*assistant|pa|executive\s*(pa|assistant)|ea)$/.test(normalized)) {
    return "personal_assistant";
  }
  
  // Nanny variations
  if (/^(head|senior|junior|live\s*in|live\s*out|traveling)?\s*nanny$/.test(normalized)) {
    return "nanny";
  }
  
  // Governess
  if (/^governess$/.test(normalized)) {
    return "governess";
  }
  
  // Chauffeur/Driver variations
  if (/^(chauffeur|driver|personal\s*driver)$/.test(normalized)) {
    return "chauffeur";
  }
  
  // Security variations
  if (/^(security|security\s*officer|security\s*guard|security\s*manager|head\s*of\s*security|cpo|close\s*protection|bodyguard|personal\s*protection)$/.test(normalized)) {
    return "security";
  }
  
  // Gardener variations
  if (/^(head\s*)?gardener$/.test(normalized) || normalized.includes("groundskeeper") || normalized.includes("estate worker")) {
    return "gardener";
  }
  
  // Maintenance/Handyman
  if (/^(maintenance|handyman|maintenance\s*manager|estate\s*technician)$/.test(normalized)) {
    return "maintenance";
  }
  
  // Laundress
  if (/^laundress$/.test(normalized)) {
    return "laundress";
  }
  
  // ============================================================================
  // OTHER POSITIONS
  // ============================================================================
  
  // Tutor
  if (/^(private\s*)?tutor$/.test(normalized)) {
    return "tutor";
  }
  
  // Massage Therapist
  if (/^(massage\s*therapist|masseuse|spa\s*therapist)$/.test(normalized)) {
    return "massage_therapist";
  }
  
  // Personal Trainer
  if (/^(personal\s*trainer|fitness\s*instructor)$/.test(normalized)) {
    return "personal_trainer";
  }
  
  // Yoga Instructor
  if (/^yoga\s*instructor$/.test(normalized)) {
    return "yoga_instructor";
  }
  
  // Dive Instructor
  if (/^(dive\s*instructor|divemaster|dive\s*master)$/.test(normalized)) {
    return "dive_instructor";
  }
  
  // Water Sports Instructor
  if (/^water\s*sports\s*instructor$/.test(normalized) || normalized.includes("watersports") || normalized.includes("jet ski")) {
    return "water_sports_instructor";
  }
  
  // ============================================================================
  // FALLBACK: Return normalized with underscores
  // ============================================================================
  
  // If no match found, convert spaces to underscores and return
  return normalized.replace(/\s+/g, "_");
}
