import type { CalculatorResult } from "./calculator";

export interface AIRecommendation {
  title: string;
  description: string;
  category: "transport" | "energy" | "food" | "lifestyle";
  difficulty: "easy" | "medium" | "hard";
  estimatedSaving: number;
}

export interface AIInsightResult {
  summary: string;
  impactLevel: "low" | "moderate" | "high";
  recommendations: AIRecommendation[];
}

const FALLBACK_RECOMMENDATIONS: Record<string, AIRecommendation[]> = {
  transport: [
    {
      title: "Take public transport twice a week",
      description:
        "Replace 2 car days with bus or train. Saves fuel and reduces emissions significantly.",
      category: "transport",
      difficulty: "easy",
      estimatedSaving: 30,
    },
    {
      title: "Try cycling for short trips",
      description:
        "For trips under 5km, cycling produces zero emissions and improves health.",
      category: "transport",
      difficulty: "medium",
      estimatedSaving: 45,
    },
    {
      title: "Carpool to work",
      description:
        "Share rides with colleagues to split emissions. Even 2 days a week makes a difference.",
      category: "transport",
      difficulty: "easy",
      estimatedSaving: 40,
    },
    {
      title: "Reduce flights by one per year",
      description:
        "A single short flight can equal months of driving. Consider video calls or local travel.",
      category: "transport",
      difficulty: "hard",
      estimatedSaving: 90,
    },
  ],
  energy: [
    {
      title: "Switch to LED bulbs",
      description:
        "LEDs use 75% less energy and last 25x longer than incandescent bulbs.",
      category: "energy",
      difficulty: "easy",
      estimatedSaving: 15,
    },
    {
      title: "Raise AC temp by 2°C",
      description:
        "Each degree higher saves about 6% on cooling costs and emissions.",
      category: "energy",
      difficulty: "easy",
      estimatedSaving: 20,
    },
    {
      title: "Unplug devices when not in use",
      description: "Phantom load can account for 10% of your electricity bill.",
      category: "energy",
      difficulty: "easy",
      estimatedSaving: 10,
    },
    {
      title: "Switch to renewable energy",
      description:
        "If available in your area, green energy plans can cut your energy emissions by 80%.",
      category: "energy",
      difficulty: "medium",
      estimatedSaving: 120,
    },
  ],
  food: [
    {
      title: "Have one meat-free day per week",
      description:
        "Skipping meat for just one day saves as much CO2 as driving 30km less.",
      category: "food",
      difficulty: "easy",
      estimatedSaving: 18,
    },
    {
      title: "Buy local seasonal produce",
      description:
        "Local food travels less, reducing transport emissions significantly.",
      category: "food",
      difficulty: "easy",
      estimatedSaving: 12,
    },
    {
      title: "Reduce food waste by 50%",
      description:
        "Plan meals, store food properly, and compost scraps to cut waste emissions.",
      category: "food",
      difficulty: "medium",
      estimatedSaving: 20,
    },
    {
      title: "Switch to a plant-based diet",
      description:
        "A fully plant-based diet can reduce food emissions by up to 70%.",
      category: "food",
      difficulty: "hard",
      estimatedSaving: 120,
    },
  ],
  lifestyle: [
    {
      title: "Consolidate online orders",
      description:
        "Combine purchases to reduce delivery trips. Fewer packages = fewer emissions.",
      category: "lifestyle",
      difficulty: "easy",
      estimatedSaving: 16,
    },
    {
      title: "Choose slower shipping",
      description:
        "Standard shipping is more efficient than express as it allows route optimization.",
      category: "lifestyle",
      difficulty: "easy",
      estimatedSaving: 8,
    },
    {
      title: "Buy second-hand when possible",
      description:
        "Used items have near-zero production emissions and save money too.",
      category: "lifestyle",
      difficulty: "easy",
      estimatedSaving: 24,
    },
    {
      title: "Recycle electronics properly",
      description:
        "E-waste recycling recovers valuable materials and prevents toxic pollution.",
      category: "lifestyle",
      difficulty: "medium",
      estimatedSaving: 10,
    },
  ],
};

function getHighestCategory(result: CalculatorResult): string {
  const cats = [
    { name: "transport", value: result.transportCO2 },
    { name: "energy", value: result.energyCO2 },
    { name: "food", value: result.foodCO2 },
    { name: "lifestyle", value: result.lifestyleCO2 },
  ];
  cats.sort((a, b) => b.value - a.value);
  return cats[0].name;
}

/**
 * Calls the OpenAI API to generate personalized carbon reduction insights.
 * Falls back to local recommendations if the API key is missing or fails.
 *
 * @param {CalculatorResult} result - The user's calculated footprint.
 * @param {Object} [userProfile] - Optional user data for personalization.
 * @returns {Promise<AIInsightResult>} The AI-generated or fallback insights.
 */
export async function generateAIInsights(
  result: CalculatorResult,
  userProfile?: { fullName?: string; city?: string; householdSize?: number }
): Promise<AIInsightResult> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const highestCategory = getHighestCategory(result);

  if (!openaiKey) {
    return generateFallbackInsights(result, highestCategory);
  }

  try {
    const prompt = `You are a friendly carbon footprint advisor. A user calculated their carbon footprint:

Total: ${result.totalCO2} kg CO2e/month
Breakdown:
- Transport: ${result.transportCO2} kg (${result.breakdown.find(b => b.category === "Transport")?.percentage || 0}%)
- Energy: ${result.energyCO2} kg (${result.breakdown.find(b => b.category === "Energy")?.percentage || 0}%)
- Food: ${result.foodCO2} kg (${result.breakdown.find(b => b.category === "Food")?.percentage || 0}%)
- Lifestyle: ${result.lifestyleCO2} kg (${result.breakdown.find(b => b.category === "Lifestyle")?.percentage || 0}%)

Highest category: ${highestCategory}
User: ${userProfile?.fullName || "Anonymous"} from ${userProfile?.city || "Unknown"}, household of ${userProfile?.householdSize || 1}.

Provide a friendly, motivating response with 4 specific recommendations.
Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence friendly explanation of their footprint and highest impact area, written in a warm encouraging tone",
  "impactLevel": "${result.impactLevel}",
  "recommendations": [
    {
      "title": "Short action title (3-5 words)",
      "description": "1-2 sentence explanation of the action and its impact, friendly tone",
      "category": "transport|energy|food|lifestyle",
      "difficulty": "easy|medium|hard",
      "estimatedSaving": number (realistic kg CO2e/month saved)
    }
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a carbon footprint advisor. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) throw new Error("AI API error");

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIInsightResult;
      if (parsed.recommendations && parsed.summary) {
        return parsed;
      }
    }
    throw new Error("Invalid AI response format");
  } catch {
    return generateFallbackInsights(result, highestCategory);
  }
}

/**
 * Generates local, hardcoded insights based on the highest impact category.
 * Used as a fallback when the AI service is unavailable.
 *
 * @param {CalculatorResult} result - The user's calculated footprint.
 * @param {string} highestCategory - The category with the most emissions.
 * @returns {AIInsightResult} Fallback insights and recommendations.
 */
function generateFallbackInsights(
  result: CalculatorResult,
  highestCategory: string
): AIInsightResult {
  const categoryLabels: Record<string, string> = {
    transport: "transportation",
    energy: "home energy",
    food: "food choices",
    lifestyle: "shopping and consumption",
  };

  const summaries: Record<string, string> = {
    low: `Great news! Your carbon footprint of ${result.totalCO2} kg CO2e/month is below average. Your ${categoryLabels[highestCategory]} is your biggest opportunity for further reduction. Small tweaks can keep you in this excellent range.`,
    moderate: `Your carbon footprint of ${result.totalCO2} kg CO2e/month is around average. Your ${categoryLabels[highestCategory]} has the most room for improvement. The good news: moderate changes can make a meaningful difference.`,
    high: `Your carbon footprint of ${result.totalCO2} kg CO2e/month is above average, with ${categoryLabels[highestCategory]} being your largest source. Don't worry — even small changes in your highest-impact area can significantly reduce your footprint over time.`,
  };

  const recs =
    FALLBACK_RECOMMENDATIONS[highestCategory] || FALLBACK_RECOMMENDATIONS.food;

  // Add one from second highest category
  const cats = [
    { name: "transport", value: result.transportCO2 },
    { name: "energy", value: result.energyCO2 },
    { name: "food", value: result.foodCO2 },
    { name: "lifestyle", value: result.lifestyleCO2 },
  ];
  cats.sort((a, b) => b.value - a.value);
  const secondCat = cats[1]?.name;

  const allRecs = [
    ...recs.slice(0, 3),
    ...(secondCat
      ? FALLBACK_RECOMMENDATIONS[secondCat]?.slice(0, 1) || []
      : []),
  ];

  return {
    summary: summaries[result.impactLevel],
    impactLevel: result.impactLevel,
    recommendations: allRecs,
  };
}

/**
 * Retrieves a list of generic recommendations for a specific category.
 *
 * @param {string} category - The target category (e.g., 'food', 'transport').
 * @returns {AIRecommendation[]} List of fallback recommendations.
 */
export function getRecommendationsByCategory(
  category: string
): AIRecommendation[] {
  return FALLBACK_RECOMMENDATIONS[category] || [];
}
