import type { GeneratedItinerary } from '@/lib/domain/trip';
import { parseItineraryJson } from '@/lib/dify/schema';
import { completeChat, streamChat } from '@/lib/ai/openai-client';

const OUTPUT_SCHEMA = `{
  "trip_title": "string",
  "trip_highlights": {
    "destination": "string",
    "travel_dates": "string",
    "travelers": "string",
    "weather_info": "string"
  },
  "overview": {
    "daily_arrangement": ["string"],
    "transportation": ["string"],
    "accommodation": ["string"],
    "practical_info": ["string"]
  },
  "detailed_itinerary": [
    {
      "day_index": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "events": [
        {
          "time": "HH:mm",
          "title": "string",
          "category": "spot|food|hotel|transport|custom",
          "description": "string",
          "location": "string",
          "geo": { "lat": 0, "lng": 0 },
          "transport": "string",
          "tips": "string"
        }
      ]
    }
  ],
  "transportation": {
    "city_transfers": ["string"],
    "in_city_transport": ["string"]
  },
  "accommodation_dining": {
    "stay_recommendations": ["string"],
    "dining_recommendations": ["string"]
  },
  "map_navigation": [
    {
      "day_index": 1,
      "route_name": "string",
      "waypoints": [{ "name": "string", "lat": 0, "lng": 0 }]
    }
  ],
  "practical_info": {
    "packing_checklist": ["string"],
    "budget_tips": ["string"],
    "emergency_info": ["string"],
    "family_friendly_tips": ["string"]
  }
}`;

const SYSTEM_PROMPT = `你是资深旅行规划师和行程优化师。
请严格输出“纯 JSON”，并且必须遵循固定结构。

要求：
1. 输出内容必须完整覆盖：行程要点、概览、详细行程、交通、住宿与餐饮、地图导航、实用信息。
2. 详细行程必须细化到每天多个时段，说明交通衔接与注意事项。
3. 若用户提供了家庭/亲子信息，优先给出亲子友好建议。
4. 天气信息给出概览和穿衣/出行提醒。
5. 地图导航必须给出每天路线和 waypoint 经纬度。
6. 只能输出 JSON，不要 markdown，不要解释。

固定输出 JSON Schema:
${OUTPUT_SCHEMA}`;

export type GenerateArgs = {
  prompt: string;
  existingItinerary?: GeneratedItinerary;
  refinementMode?: 'canvas_refine' | 'regenerate';
};

function buildUserPrompt({ prompt, existingItinerary, refinementMode }: GenerateArgs) {
  if (!existingItinerary || refinementMode === 'regenerate') {
    return prompt;
  }

  return `用户初始需求：${prompt}

当前已生成行程（JSON）：
${JSON.stringify(existingItinerary)}

请基于当前 JSON 进行二次完善：
- 保留用户在画布里已修改的内容
- 自动修复不合理时间和交通衔接
- 对缺失字段做补全
- 输出完整新 JSON`;
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

export async function generateItineraryWithOpenAICompatibleApi(args: GenerateArgs) {
  const content = await completeChat({ system: SYSTEM_PROMPT, user: buildUserPrompt(args), temperature: 0.4 });

  return {
    itinerary: parseItineraryJson(stripJsonFence(content)),
    rawContent: content,
  };
}

export async function requestOpenAIStream(args: GenerateArgs): Promise<Response> {
  return streamChat({ system: SYSTEM_PROMPT, user: buildUserPrompt(args), temperature: 0.4 });
}

export function parseItineraryFromRawContent(rawContent: string) {
  return parseItineraryJson(stripJsonFence(rawContent));
}
