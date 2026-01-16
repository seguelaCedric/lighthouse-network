/**
 * Decoration images organized by category, position, and role.
 * Use these to programmatically populate page sections.
 *
 * Structure:
 * - category: 'yacht' | 'household'
 * - position: 'heroes' | 'cards' | 'backgrounds' | 'videos'
 * - role: 'generic' | specific role like 'chef', 'butler', 'crew', etc.
 *
 * Generic images can be used on any page within that category.
 * Role-specific images should only be used on matching role pages.
 */

export type ImageCategory = 'yacht' | 'household';
export type ImagePosition = 'heroes' | 'cards' | 'backgrounds' | 'videos';

// Yacht roles
export type YachtRole = 'generic' | 'captain' | 'chef' | 'stewardess' | 'engineer' | 'deckhand' | 'crew';

// Household roles
export type HouseholdRole = 'generic' | 'butler' | 'chef' | 'housekeeper' | 'nanny' | 'estate-manager' | 'chauffeur';

export type ImageRole = YachtRole | HouseholdRole;

interface RoleImages {
  [role: string]: string[];
}

interface PositionImages {
  heroes: RoleImages;
  cards: RoleImages;
  backgrounds: RoleImages;
  videos: RoleImages;
}

interface DecorationImages {
  yacht: PositionImages;
  household: PositionImages;
}

export const decorationImages: DecorationImages = {
  yacht: {
    heroes: {
      generic: [
        '/images/decorations/heroes/yacht/generic/yacht-aerial.jpg',
        '/images/decorations/heroes/yacht/generic/yacht-deck.jpg',
        '/images/decorations/heroes/yacht/generic/charter-air-yacht.jpeg',
      ],
    },
    cards: {
      generic: [
        '/images/decorations/cards/yacht/generic/caribbean-yacht-charter.jpg',
        '/images/decorations/cards/yacht/generic/superyacht-experience.webp',
      ],
      crew: [
        '/images/decorations/cards/yacht/crew/yacht-crew.webp',
      ],
    },
    backgrounds: {
      generic: [
        '/images/decorations/backgrounds/yacht/yacht-aerial.jpg',
        '/images/decorations/backgrounds/yacht/yacht-deck.jpg',
      ],
    },
    videos: {
      generic: [
        '/images/decorations/videos/yacht/yacht-video.mp4',
      ],
    },
  },
  household: {
    heroes: {
      generic: [
        '/images/decorations/heroes/household/generic/house-manager.jpg',
        '/images/decorations/heroes/household/generic/luxury-mansion-marbella.jpeg',
        '/images/decorations/heroes/household/generic/private-jet-couple.jpg',
        '/images/decorations/heroes/household/generic/modern-mansion.jpg',
        '/images/decorations/heroes/household/generic/family-estate.jpg',
      ],
    },
    cards: {
      generic: [
        '/images/decorations/cards/household/generic/luxury-interior.jpeg',
      ],
      chef: [
        '/images/decorations/cards/household/chef/personal-chef.webp',
      ],
      butler: [
        '/images/decorations/cards/household/butler/butler-service.jpeg',
      ],
      housekeeper: [
        '/images/decorations/cards/household/housekeeper/maid-hotel-room.jpg',
      ],
      'estate-manager': [
        '/images/decorations/cards/household/estate-manager/business-meeting-cafe.jpg',
      ],
    },
    backgrounds: {
      generic: [
        '/images/decorations/backgrounds/household/luxury-pool-villa.jpg',
        '/images/decorations/backgrounds/household/estate-aerial.jpeg',
        '/images/decorations/backgrounds/household/modern-mansion.jpg',
      ],
    },
    videos: {
      generic: [],
    },
  },
};

/**
 * Get images for a specific category, position, and role.
 * If no role-specific images exist, falls back to generic.
 */
export function getImages(
  category: ImageCategory,
  position: ImagePosition,
  role: ImageRole = 'generic'
): string[] {
  const positionImages = decorationImages[category][position];
  const roleImages = positionImages[role] || [];
  const genericImages = positionImages['generic'] || [];

  // Return role-specific if available, otherwise generic
  return roleImages.length > 0 ? roleImages : genericImages;
}

/**
 * Get all images for a role, combining role-specific AND generic images.
 * Useful when you want variety but still role-appropriate.
 */
export function getAllImagesForRole(
  category: ImageCategory,
  position: ImagePosition,
  role: ImageRole
): string[] {
  const positionImages = decorationImages[category][position];
  const roleImages = positionImages[role] || [];
  const genericImages = positionImages['generic'] || [];

  return [...roleImages, ...genericImages];
}

/**
 * Get a random image for a specific category, position, and role.
 * Falls back to generic if no role-specific images exist.
 */
export function getRandomImage(
  category: ImageCategory,
  position: ImagePosition,
  role: ImageRole = 'generic'
): string | null {
  const images = getImages(category, position, role);
  if (images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * Get an image by index (wraps around if index exceeds array length).
 * Falls back to generic if no role-specific images exist.
 */
export function getImageByIndex(
  category: ImageCategory,
  position: ImagePosition,
  index: number,
  role: ImageRole = 'generic'
): string | null {
  const images = getImages(category, position, role);
  if (images.length === 0) return null;
  return images[index % images.length];
}

/**
 * Check if role-specific images exist for a given combination.
 */
export function hasRoleSpecificImages(
  category: ImageCategory,
  position: ImagePosition,
  role: ImageRole
): boolean {
  const positionImages = decorationImages[category][position];
  const roleImages = positionImages[role];
  return roleImages !== undefined && roleImages.length > 0;
}
