import Groq from 'groq-sdk';

let groq: Groq | null = null;

const getGroq = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groq = new Groq({ apiKey });
  }
  return groq;
};

const stripMarkdown = (text: string): string => {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
};

interface PredictionResult {
  riskLevel: string;
  threats: string[];
  recommendation: string;
}

interface PredictionData {
  riskLevel: string;
  threats: { name: string; description: string }[];
  recommendations: string[];
}

export const getDisasterPrediction = async (
  lat: number,
  lng: number,
  weather?: { temperature: string; condition: string }
): Promise<PredictionData> => {
  const prompt = `You are a disaster prediction AI assistant. Analyze the following location and weather data to assess natural disaster risks.

Location: Latitude ${lat}, Longitude ${lng}
Date: ${new Date().toLocaleDateString()}
Weather: ${weather?.temperature || 'Unknown'}, ${weather?.condition || 'Unknown conditions'}

Respond ONLY with valid JSON in this exact format:
{
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "threats": [
    { "name": "ThreatName", "description": "Brief description of the threat" }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Include 2-4 threats relevant to this location and 3-5 actionable recommendations.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          riskLevel: parsed.riskLevel || 'Medium',
          threats: Array.isArray(parsed.threats) ? parsed.threats : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        };
      }
    }
    return getFallbackPrediction(lat, lng);
  } catch (error) {
    console.error('Groq API error:', error);
    return getFallbackPrediction(lat, lng);
  }
};

const getFallbackPrediction = (lat: number, lng: number): PredictionData => {
  const month = new Date().getMonth();
  const isSummer = month >= 5 && month <= 8;
  const isWinter = month >= 11 || month <= 2;

  const threats: { name: string; description: string }[] = [
    { name: 'Flooding', description: 'Check local drainage systems and stay informed about water levels' },
    { name: 'Wildfire', description: 'Dry conditions can spark fires - be cautious with open flames' },
    { name: 'Extreme Heat', description: 'Stay hydrated and avoid prolonged sun exposure' },
  ];

  if (isSummer) {
    threats.push({ name: 'Hurricane', description: 'Hurricane season (June-November) - prepare for strong winds and flooding' });
  }

  if (isWinter) {
    threats.push({ name: 'Winter Storm', description: 'Prepare for cold weather emergencies with heating and supplies' });
  }

  if (lat > 35 || lat < -35) {
    threats.push({ name: 'Tsunami', description: 'Coastal area - know evacuation routes to higher ground' });
  }

  return {
    riskLevel: 'Medium',
    threats,
    recommendations: [
      'Keep emergency kit ready with water, food, and supplies',
      'Monitor local weather alerts and emergency broadcasts',
      'Know your evacuation routes and shelter locations',
      'Keep important documents in a secure, waterproof container',
    ],
  };
};

export const getDisasterGuide = async (disaster: string): Promise<string> => {
  const prompt = `Provide a comprehensive emergency guide for a "${disaster}" disaster.

Structure the response clearly with:
1. 🚨 **Immediate Actions** (What to do NOW - bullet points)
2. ✅ **Do's** and ❌ **Don'ts** (clear lists)
3. 🎒 **Preparation Checklist** (items to have ready)
4. 🏥 **Emergency Resources** (important contacts)

Use relevant emojis for every bullet point. Make it visually easy to scan during an emergency.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content || getFallbackGuide(disaster);
    return stripMarkdown(content);
  } catch (error) {
    console.error('Groq guide error:', error);
    return getFallbackGuide(disaster);
  }
};

const getFallbackGuide = (disaster: string): string => {
  const guides: Record<string, string> = {
    earthquake: `
## 🌍 Earthquake Emergency Guide

### 🚨 Immediate Actions
- 🔥 Drop to your hands and knees
- 🛡️ Cover your head and neck under sturdy furniture
- 🏃 Hold on until the shaking stops
- ⚠️ Stay away from windows and heavy objects

### ✅ Do's
- ✅ Stay indoors until shaking stops
- ✅ Check for injuries
- ✅ Expect aftershocks
- ✅ Use flashlight, not candles

### ❌ Don'ts
- ❌ Don't run outside during shaking
- ❌ Don't use elevators
- ❌ Don't touch downed power lines
- ❌ Don't spread rumors

### 🎒 Preparation Checklist
- [ ] Emergency kit with water and food
- [ ] Flashlight and batteries
- [ ] First aid supplies
- [ ] Battery-powered radio
- [ ] Important documents
`,
    flood: `
## 🌊 Flood Emergency Guide

### 🚨 Immediate Actions
- 🚨 Move to higher ground immediately
- 🏠 Get to roof if trapped by rising water
- 🚗 Never walk or drive through flood waters
- 📻 Listen to emergency broadcasts

### ✅ Do's
- ✅ Follow evacuation orders
- ✅ Turn off utilities if safe
- ✅ Sanitize contaminated items
- ✅ Document damage for insurance

### ❌ Don'ts
- ❌ Don't walk in standing water
- ❌ Don't drive through flooded roads
- ❌ Don't drink flood water
- ❌ Don't return until safe

### 🎒 Preparation Checklist
- [ ] Sandbags if available
- [ ] Water purification tablets
- [ ] Emergency food and water (3 days)
- [ ] waterproof containers for documents
`,
    fire: `
## 🔥 Fire Emergency Guide

### 🚨 Immediate Actions
- 🔔 Alert others and evacuate
- 🧊 Close doors behind you to slow spread
- 🚪 Feel doors before opening
- 🏃 Stay low to avoid smoke

### ✅ Do's
- ✅ Crawl low under smoke
- ✅ Stop, drop, and roll if clothes catch fire
- ✅ Use fire extinguisher if trained
- ✅ Call 911 from safe location

### ❌ Don'ts
- ❌ Don't use elevators
- ❌ Don't hide in closets
- ❌ Don't go back inside
- ❌ Don't use water on electrical fires

### 🎒 Preparation Checklist
- [ ] Fire extinguisher
- [ ] Smoke detectors (test monthly)
- [ ] Emergency escape plan
- [ ] Meeting point outside
`,
    hurricane: `
## 🌀 Hurricane Emergency Guide

### 🚨 Immediate Actions
- 📻 Monitor weather updates
- 🏠 Board up windows
- 🧊 Fill containers with water
- 🚗 Know your evacuation route

### ✅ Do's
- ✅ Follow evacuation orders
- ✅ Stay away from windows
- ✅ Use flashlights, not candles
- ✅ Keep refrigerator closed

### ❌ Don'ts
- ❌ Don't go outside during storm
- ❌ Don't drive through water
- ❌ Don't use generators indoors
- ❌ Don't ignore warnings

### 🎒 Preparation Checklist
- [ ] 3 days of water and food
- [ ] Flashlights and batteries
- [ ] Portable phone charger
- [ ] Important documents in waterproof bag
`,
  };

  return guides[disaster.toLowerCase()] || `
## ⚠️ ${disaster.charAt(0).toUpperCase() + disaster.slice(1)} Emergency Guide

### 🚨 Immediate Actions
- Stay calm and assess the situation
- Follow local emergency instructions
- Move to safety if in immediate danger

### ✅ Do's
- ✅ Stay informed via official channels
- ✅ Check on others if safe
- ✅ Prepare for potential evacuation
- ✅ Document any damage

### ❌ Don'ts
- ❌ Don't panic
- ❌ Don't spread unverified information
- ❌ Don't put yourself at unnecessary risk
- ❌ Don't return home until declared safe

### 🎒 Preparation Checklist
- [ ] Emergency kit ready
- [ ] Important documents secured
- [ ] Communication plan with family
- [ ] Know your nearest shelter
`;
};
