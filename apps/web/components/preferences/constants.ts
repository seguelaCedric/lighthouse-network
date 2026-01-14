// Shared label maps for yacht and household positions, and regions
// Used by StepNavigator and PreferencesSummaryCard

// Yacht position labels aligned with Vincere functional expertises
export const yachtPositionLabels: Record<string, string> = {
  // Deck
  captain: "Captain",
  chief_officer: "Chief Officer",
  first_officer: "First Officer", // legacy alias
  second_officer: "Second Officer",
  third_officer: "Third Officer",
  oow: "OOW",
  bosun: "Bosun",
  lead_deckhand: "Lead Deckhand",
  experienced_deckhand: "Experienced Deckhand",
  deckhand: "Deckhand", // legacy alias
  junior_deckhand: "Junior Deckhand",
  carpenter: "Carpenter",
  // Water Sports
  dive_instructor: "Dive Instructor",
  dive_master: "Dive Master",
  pwc_instructor: "PWC Instructor",
  // Engineering
  chief_engineer: "Chief Engineer",
  second_engineer: "Second Engineer",
  third_engineer: "Third Engineer",
  junior_engineer: "Junior Engineer",
  eto: "ETO",
  av_it_engineer: "AV/IT Engineer",
  // Interior
  purser: "Purser",
  interior_manager: "Interior Manager",
  chief_stewardess: "Chief Stew",
  head_of_service: "Head of Service",
  head_of_house: "Head of House",
  second_stewardess: "Second Stew",
  third_stewardess: "Third Stew", // legacy alias
  sole_stewardess: "Sole Stew",
  experienced_stewardess: "Experienced Stew",
  stewardess: "Stew", // legacy alias
  junior_stewardess: "Junior Stew",
  laundry_stewardess: "Laundry Stew",
  cook_stew: "Cook/Stew",
  // Wellness & Beauty
  masseuse: "Masseuse",
  beautician: "Beautician",
  hairdresser: "Hairdresser",
  spa_manager: "SPA Manager",
  yoga_instructor: "Yoga Instructor",
  personal_trainer: "Personal Trainer",
  // Medical
  nurse: "Nurse",
  paramedic: "Paramedic",
  // Childcare
  nanny: "Nanny",
  governess: "Governess",
  // Galley
  head_chef: "Head Chef",
  second_chef: "Second Chef",
  sous_chef: "Sous Chef",
  sole_chef: "Sole Chef",
  crew_chef: "Crew Chef",
  chef: "Chef", // legacy alias
  galley_hand: "Galley Hand",
  // Security
  security: "Security",
  // Couples
  couple: "Couple",
};

// Household position labels aligned with Vincere functional expertises
export const householdPositionLabels: Record<string, string> = {
  // Management
  estate_manager: "Estate Manager",
  house_manager: "House Manager",
  personal_assistant: "Personal Assistant",
  // Service Staff
  butler: "Butler",
  head_housekeeper: "Head Housekeeper", // legacy alias
  housekeeper: "Housekeeper",
  // Childcare
  nanny: "Nanny",
  governess: "Governess",
  // Culinary
  head_chef: "Head Chef",
  second_chef: "Second Chef",
  sous_chef: "Sous Chef",
  sole_chef: "Sole Chef",
  crew_chef: "Crew Chef",
  private_chef: "Private Chef", // legacy alias
  // Outdoor & Maintenance
  chauffeur: "Chauffeur",
  gardener: "Gardener",
  handyman: "Handyman",
  maintenance: "Maintenance / Handyman", // legacy alias
  // Security
  security: "Security",
  // Couples
  couple: "Couple",
  // Legacy aliases
  laundress: "Laundress",
};

export const regionLabels: Record<string, string> = {
  mediterranean: "Mediterranean",
  caribbean: "Caribbean",
  bahamas: "Bahamas",
  florida: "Florida",
  new_england: "New England",
  alaska: "Alaska",
  south_pacific: "South Pacific",
  australia: "Australia / NZ",
  middle_east: "Middle East",
  asia: "Asia",
  worldwide: "Worldwide",
};
