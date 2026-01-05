// Shared label maps for yacht and household positions, and regions
// Used by StepNavigator and PreferencesSummaryCard

export const yachtPositionLabels: Record<string, string> = {
  captain: "Captain",
  first_officer: "First Officer",
  second_officer: "Second Officer",
  bosun: "Bosun",
  lead_deckhand: "Lead Deckhand",
  deckhand: "Deckhand",
  chief_engineer: "Chief Engineer",
  second_engineer: "2nd Engineer",
  third_engineer: "3rd Engineer",
  eto: "ETO",
  chief_stewardess: "Chief Stewardess",
  second_stewardess: "2nd Stewardess",
  third_stewardess: "3rd Stewardess",
  stewardess: "Stewardess",
  purser: "Purser",
  head_chef: "Head Chef",
  sous_chef: "Sous Chef",
  chef: "Chef",
};

export const householdPositionLabels: Record<string, string> = {
  estate_manager: "Estate Manager",
  house_manager: "House Manager",
  butler: "Butler",
  head_housekeeper: "Head Housekeeper",
  housekeeper: "Housekeeper",
  personal_assistant: "Personal Assistant",
  nanny: "Nanny",
  governess: "Governess",
  private_chef: "Private Chef",
  chauffeur: "Chauffeur",
  security: "Security / Close Protection",
  gardener: "Gardener / Groundskeeper",
  maintenance: "Maintenance / Handyman",
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
