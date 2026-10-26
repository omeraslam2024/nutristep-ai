import express, { Request, Response } from 'express';
import http from 'http';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with high limit for image payloads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to clean base64 string
function cleanBase64(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Default to image/jpeg if raw base64
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// 1. Module A: Visual Plate Recognition & Calorie Estimation
app.post('/api/analyze-plate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const { image, mealType, notes } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    const { data, mimeType } = cleanBase64(image);

    const promptText = `Analyze this food plate photo thoroughly.
Meal timing context: ${mealType || 'General meal'}
User note/context: ${notes || 'None provided'}

Identify each discrete item or portion on the plate/container.
Estimate realistic portion weights in grams based on visual perspective, plate scale, standard portion sizes, and density.
Calculate Calories, Protein (g), Carbs (g), Fat (g), Fiber (g), and Sodium (mg) for each detected item.
Also compute the meal's aggregate totals, overall confidence score (0.0 to 1.0), confidence per item, suitable dietary tags, and a short 1-2 sentence nutritionist evaluation/tip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data,
                mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are an expert clinical dietitian and computer vision food recognition AI. You analyze food images with high precision, estimating portions, macronutrients, and calories realistically without exaggeration or underestimation. Return strictly valid JSON matching the requested schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meal_name: {
              type: Type.STRING,
              description: 'Clear, concise name of the meal dish',
            },
            confidence_score: {
              type: Type.NUMBER,
              description: 'Overall visual confidence score from 0.0 to 1.0',
            },
            total_calories: {
              type: Type.NUMBER,
              description: 'Total estimated calories in kcal',
            },
            total_macros: {
              type: Type.OBJECT,
              properties: {
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
                fiber_g: { type: Type.NUMBER },
                sodium_mg: { type: Type.NUMBER },
              },
              required: ['protein_g', 'carbs_g', 'fat_g', 'fiber_g'],
            },
            detected_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  estimated_weight_g: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  protein_g: { type: Type.NUMBER },
                  carbs_g: { type: Type.NUMBER },
                  fat_g: { type: Type.NUMBER },
                  fiber_g: { type: Type.NUMBER },
                  sodium_mg: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  visual_clues: {
                    type: Type.STRING,
                    description: 'Brief reason for estimate, e.g. "palm-sized portion ~140g with grilled sear lines"',
                  },
                },
                required: ['item_name', 'estimated_weight_g', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
              },
            },
            dietary_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            nutritionist_tip: {
              type: Type.STRING,
              description: 'Helpful micro or macro advice regarding this plate',
            },
          },
          required: ['meal_name', 'confidence_score', 'total_calories', 'total_macros', 'detected_items', 'dietary_flags'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing plate:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze plate image' });
  }
});

// 2. Natural Language Text & Voice Logging
app.post('/api/parse-meal-text', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const { query, mealType } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Text query is required.' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Parse this food intake log into items with estimated weights, calories, and macronutrients.
Meal context: ${mealType || 'Meal'}
User input: "${query}"`,
      config: {
        systemInstruction:
          'You are an expert nutritionist. Convert user freeform text or voice transcripts into accurate nutritional breakdown and individual items. Return strictly JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meal_name: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            total_calories: { type: Type.NUMBER },
            total_macros: {
              type: Type.OBJECT,
              properties: {
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
                fiber_g: { type: Type.NUMBER },
                sodium_mg: { type: Type.NUMBER },
              },
              required: ['protein_g', 'carbs_g', 'fat_g'],
            },
            detected_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  estimated_weight_g: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  protein_g: { type: Type.NUMBER },
                  carbs_g: { type: Type.NUMBER },
                  fat_g: { type: Type.NUMBER },
                  fiber_g: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  visual_clues: { type: Type.STRING },
                },
                required: ['item_name', 'estimated_weight_g', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
              },
            },
            dietary_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            nutritionist_tip: { type: Type.STRING },
          },
          required: ['meal_name', 'total_calories', 'total_macros', 'detected_items', 'dietary_flags'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error parsing meal text:', error);
    res.status(500).json({ error: error?.message || 'Failed to parse food text' });
  }
});

// 3. Scan Nutrition Facts Label / Packaged Food Label
app.post('/api/scan-nutrition-label', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    const { data, mimeType } = cleanBase64(image);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            {
              text: 'Read this nutrition facts label or product packaging. Extract the product title, serving size, calories per serving, protein, total carbs, fat, fiber, sodium, and ingredients if visible. Return strictly JSON.',
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are an OCR and nutrition facts label reader. Parse exact values printed on the nutrition label or packaging.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            product_name: { type: Type.STRING },
            brand: { type: Type.STRING },
            serving_size: { type: Type.STRING },
            servings_per_container: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            protein_g: { type: Type.NUMBER },
            carbs_g: { type: Type.NUMBER },
            fat_g: { type: Type.NUMBER },
            fiber_g: { type: Type.NUMBER },
            sodium_mg: { type: Type.NUMBER },
            dietary_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            confidence: { type: Type.NUMBER },
          },
          required: ['product_name', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error scanning nutrition label:', error);
    res.status(500).json({ error: error?.message || 'Failed to read nutrition label' });
  }
});

// 4. Barcode lookup with OpenFoodFacts & smart fallback
app.get('/api/barcode-lookup/:barcode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;
    if (!barcode) {
      res.status(400).json({ error: 'Barcode parameter required' });
      return;
    }

    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
    const offRes = await fetch(offUrl, {
      headers: {
        'User-Agent': 'NutriStepAI/1.0 (contact: info@nutristep.app)',
      },
    });

    if (offRes.ok) {
      const data = await offRes.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        res.json({
          found: true,
          barcode,
          product_name: p.product_name || p.generic_name || 'Packaged Food Item',
          brand: p.brands || 'Unknown Brand',
          serving_size: p.serving_size || '100g',
          calories: Math.round(Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_serving'] ?? 0)),
          protein_g: Math.round(Number(nutriments.proteins_100g ?? nutriments.proteins_serving ?? 0) * 10) / 10,
          carbs_g: Math.round(Number(nutriments.carbohydrates_100g ?? nutriments.carbohydrates_serving ?? 0) * 10) / 10,
          fat_g: Math.round(Number(nutriments.fat_100g ?? nutriments.fat_serving ?? 0) * 10) / 10,
          fiber_g: Math.round(Number(nutriments.fiber_100g ?? 0) * 10) / 10,
          sodium_mg: Math.round(Number(nutriments.sodium_100g ?? 0) * 1000),
          image_url: p.image_front_small_url || p.image_url || null,
        });
        return;
      }
    }

    // If not found in OpenFoodFacts, or network issue, respond gracefully
    res.status(404).json({
      found: false,
      message: `Product with barcode ${barcode} not found in database. You can scan the nutrition label or type the item manually.`,
    });
  } catch (error: any) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: error?.message || 'Barcode search failed' });
  }
});

// 5. Module D: Personalized Gemini Health Coach Chat
app.post('/api/coach-chat', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const profileSummary = userContext
      ? `
USER HEALTH & DAILY PROFILE:
- Goal: ${userContext.goal} (Target: ${userContext.calorieTarget} kcal/day)
- BMR: ${userContext.bmr} kcal | TDEE: ${userContext.tdee} kcal
- Current Weight: ${userContext.weightKg} kg (Target: ${userContext.targetWeightKg} kg)
- Today's Food Consumed: ${userContext.caloriesConsumed} kcal
- Today's Steps: ${userContext.steps} / ${userContext.stepGoal} steps
- Today's Active Burn from movement: ${userContext.caloriesBurned} kcal
- Net Remaining Calorie Budget: ${userContext.remainingCalories} kcal
- Macro Status:
  * Protein: ${userContext.proteinConsumed}g / ${userContext.proteinTarget}g (Remaining: ${Math.max(0, userContext.proteinTarget - userContext.proteinConsumed)}g)
  * Carbs: ${userContext.carbsConsumed}g / ${userContext.carbsTarget}g (Remaining: ${Math.max(0, userContext.carbsTarget - userContext.carbsConsumed)}g)
  * Fat: ${userContext.fatConsumed}g / ${userContext.fatTarget}g (Remaining: ${Math.max(0, userContext.fatTarget - userContext.fatConsumed)}g)
- Today's Meals Logged: ${userContext.recentMealsSummary || 'None yet'}
`
      : 'User profile not provided yet.';

    const systemInstruction = `You are "Coach NutriStep", an empathetic, highly knowledgeable sports nutritionist and habit coach powered by Google AI Studio Gemini.
Your mission is to guide the user to their fitness and wellness goals with practical, motivating, science-grounded advice.

Always factor in the user's live daily numbers:
${profileSummary}

Tone & Style:
- Warm, concise, practical, non-judgmental, encouraging.
- If they ask for food/snack ideas, give 2-3 specific realistic options that fit their remaining macro/calorie budget precisely.
- If they ask about steps or activity, celebrate their progress and calculate realistic walking durations (e.g. ~20 min brisk walk = ~2,000 steps = ~80-100 kcal).
- Format output clearly with bullet points, bold key figures, and quick action steps.
- Avoid generic lectures. Keep replies snappy and easy to read on mobile.`;

    // Convert chat history
    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: geminiContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Keep up the great momentum today! How else can I help balance your nutrition?';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in coach chat:', error);
    res.status(500).json({ error: error?.message || 'Coach is temporarily unavailable.' });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriStep AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
