import { useCallback } from 'react';

// Use a Set to keep track of already loaded font families to avoid redundant network requests.
const loadedFonts = new Set<string>();

export const useFontLoader = () => {
  /**
   * Dynamically loads a font family from Google Fonts by creating and appending a <link> tag to the document head.
   * @param fontFamily The name of the font family to load (e.g., 'Roboto', 'Open Sans').
   */
  const loadFont = useCallback((fontFamily: string) => {
    // Don't proceed if the font is already loaded or if no font family is provided.
    if (!fontFamily || loadedFonts.has(fontFamily)) {
      return;
    }

    // Format the font family name for the Google Fonts API URL (e.g., 'Open Sans' -> 'Open+Sans').
    const formattedFontFamily = fontFamily.replace(/ /g, '+');
    
    // Construct the URL to request common weights (400, 700) and their italic styles.
    // `display=swap` ensures text remains visible while the font is loading.
    const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedFontFamily}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    
    document.head.appendChild(link);
    loadedFonts.add(fontFamily);
  }, []);

  return { loadFont };
};
