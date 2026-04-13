// Pet-related constants for use across the app

/** Maximum character length for pet names */
export const PET_NAME_MAX = 12;

/**
 * Test pet name for UI layout verification (12 Korean characters)
 * Uncomment the test export and comment the production one to test.
 */
// export const TEST_PET_NAME = "ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ"; // 12 chars for testing

/**
 * CSS class for single-line pet name rendering with truncation fallback.
 * Apply this class wherever pet names are displayed to ensure consistent behavior.
 */
export const PET_NAME_DISPLAY_CLASS = "whitespace-nowrap overflow-hidden text-ellipsis";

/**
 * Inline style for pet name with font scaling fallback.
 * Use this style object for areas where font scaling is preferred over truncation.
 */
export const PET_NAME_SCALE_STYLE: React.CSSProperties = {
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};
