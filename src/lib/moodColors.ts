// Mood-based color utilities for calendar day cells and analysis cards

export interface MoodBorderColors {
  borderHsl: string;
  borderClass: string;
}

export const getMoodBorderColor = (mood: string): MoodBorderColors => {
  const moodLower = mood.toLowerCase();
  
  // Calm/Relaxed/Peaceful → Teal/Mint green
  if (moodLower.includes('calm') || moodLower.includes('relaxed') || moodLower.includes('peaceful')) {
    return { 
      borderHsl: '172 66% 50%', // teal-400
      borderClass: 'border-teal-400'
    };
  }
  
  // Happy/Playful/Excited → Warm amber/yellow
  if (moodLower.includes('happy') || moodLower.includes('playful') || moodLower.includes('excited')) {
    return { 
      borderHsl: '38 92% 50%', // amber-500
      borderClass: 'border-amber-500'
    };
  }
  
  // Moody/Anxious/Sad → Purple
  if (moodLower.includes('moody') || moodLower.includes('anxious') || moodLower.includes('sad')) {
    return { 
      borderHsl: '271 76% 53%', // purple-500
      borderClass: 'border-purple-500'
    };
  }
  
  // Tired/Sleepy → Soft blue
  if (moodLower.includes('tired') || moodLower.includes('sleepy') || moodLower.includes('drowsy')) {
    return { 
      borderHsl: '217 91% 60%', // blue-500
      borderClass: 'border-blue-500'
    };
  }
  
  // Curious/Alert → Emerald green
  if (moodLower.includes('curious') || moodLower.includes('alert') || moodLower.includes('attentive')) {
    return { 
      borderHsl: '160 84% 39%', // emerald-500
      borderClass: 'border-emerald-500'
    };
  }
  
  // Default → warm orange
  return { 
    borderHsl: '24 95% 53%', // orange-500
    borderClass: 'border-orange-500'
  };
};

// Predefined decoration border color options for override
export type DecorationBorderColor = 'none' | 'orange' | 'white' | 'black' | 'pink' | 'gold' | 'silver';

export const decorationBorderColorConfigs: Record<DecorationBorderColor, { 
  name: string; 
  hsl: string;
  preview: string;
}> = {
  none: { name: 'Default', hsl: '', preview: '🎭' },
  orange: { name: 'Orange', hsl: '24 95% 53%', preview: '🧡' },
  white: { name: 'White', hsl: '0 0% 100%', preview: '🤍' },
  black: { name: 'Black', hsl: '0 0% 0%', preview: '🖤' },
  pink: { name: 'Pink', hsl: '330 81% 60%', preview: '💗' },
  gold: { name: 'Gold', hsl: '45 93% 47%', preview: '💛' },
  silver: { name: 'Silver', hsl: '210 11% 71%', preview: '🩶' },
};
