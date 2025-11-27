// ============================================================================
// SUPABASE EDGE FUNCTION: parse-brief
// ============================================================================
// Receives a raw brief (from WhatsApp, email, or portal), parses it using
// Claude AI, and returns structured requirements with clarifying questions.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ----------------------------------------------------------------------------
// PROMPTS
// ----------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert yacht and villa crew recruitment specialist at Lighthouse Careers. Your job is to parse job briefs into structured requirements.

You have deep knowledge of:
- Yacht crew positions (Captain, Chief Officer, Chief Engineer, Bosun, Chief Stew, etc.)
- Villa/estate staff positions (Estate Manager, Head of House, Butler, Chef, etc.)
- Industry certifications (STCW, ENG1, yacht licenses, food safety, etc.)
- Contract types (permanent, rotational, seasonal, temporary)
- Geographic cruising areas (Mediterranean, Caribbean, etc.)
- Typical salary ranges by position and vessel size
- Common client preferences and requirements

When parsing a brief:
1. Extract all explicit information
2. Infer reasonable defaults based on industry standards
3. Flag any ambiguities that need clarification
4. Be conservative with requirements (don't assume requirements that aren't mentioned)
5. Always ensure STCW and ENG1 are included for sea-going positions unless explicitly not needed

Output valid JSON only. No markdown, no explanation outside the JSON.`;

const PARSE_PROMPT = `Parse this job brief into structured requirements.

<brief>
{BRIEF_CONTENT}
</brief>

{CLIENT_CONTEXT}

Output this exact JSON structure (use null for unknown fields):

{
  "position": "Standardized position title",
  "position_category": "deck|interior|engineering|galley|medical|childcare|security|management|other",
  
  "vessel": {
    "name": "string or null",
    "type": "Motor|Sailing|null",
    "size_min": "number or null",
    "size_max": "number or null"
  },
  
  "contract": {
    "type": "permanent|rotational|seasonal|temporary|freelance|null",
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null",
    "rotation": "string or null"
  },
  
  "location": {
    "region": "string or null",
    "itinerary": "string or null"
  },
  
  "compensation": {
    "salary_min": "number (monthly EUR) or null",
    "salary_max": "number (monthly EUR) or null",
    "currency": "EUR",
    "benefits": "string or null"
  },
  
  "requirements": {
    "experience_years_min": "number or null",
    "certifications_required": ["STCW", "ENG1", "..."],
    "certifications_preferred": [],
    "visas_required": [],
    "languages_required": ["English"],
    "languages_preferred": [],
    "non_smoker": "boolean or null",
    "no_visible_tattoos": "boolean or null",
    "nationality_preferences": [],
    "couple_acceptable": "boolean or null"
  },
  
  "confidence": 0.0-1.0,
  "ambiguities": ["List of things needing clarification"],
  "clarifying_questions": ["Questions to ask the client"],
  "inferred": ["Things you assumed that weren't explicit"]
}`;

// ----------------------------------------------------------------------------
// POSITION STANDARDIZATION
// ----------------------------------------------------------------------------

const POSITION_MAP: Record<string, string> = {
  'captain': 'Captain',
  'master': 'Captain',
  'skipper': 'Captain',
  'chief officer': 'Chief Officer',
  'first officer': 'Chief Officer',
  'first mate': 'Chief Officer',
  'mate': 'Chief Officer',
  '2nd officer': 'Second Officer',
  'second officer': 'Second Officer',
  'bosun': 'Bosun',
  'boatswain': 'Bosun',
  'deckhand': 'Deckhand',
  'chief engineer': 'Chief Engineer',
  'chief eng': 'Chief Engineer',
  '2nd engineer': 'Second Engineer',
  'second engineer': 'Second Engineer',
  'eto': 'ETO',
  'chief stewardess': 'Chief Stewardess',
  'chief stew': 'Chief Stewardess',
  'head stew': 'Chief Stewardess',
  '2nd stewardess': 'Second Stewardess',
  'second stew': 'Second Stewardess',
  'stewardess': 'Stewardess',
  'stew': 'Stewardess',
  'purser': 'Purser',
  'head chef': 'Head Chef',
  'chef': 'Chef',
  'sole chef': 'Sole Chef',
  'sous chef': 'Sous Chef',
  'nanny': 'Nanny',
  'estate manager': 'Estate Manager',
  'house manager': 'House Manager',
  'butler': 'Butler',
};

function standardizePosition(position: string): string {
  const lower = position.toLowerCase().trim();
  return POSITION_MAP[lower] || position;
}

// ----------------------------------------------------------------------------
// MAIN HANDLER
// ----------------------------------------------------------------------------

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API keys from environment
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Parse request body
    const { 
      brief_content, 
      client_id,
      source,
      source_identifier,
      save_brief = true 
    } = await req.json();

    if (!brief_content) {
      return new Response(
        JSON.stringify({ error: 'brief_content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get client context if client_id provided
    let clientContext = '';
    if (client_id) {
      const { data: client } = await supabase
        .from('organizations')
        .select('name, vessel_name, vessel_type, vessel_size_meters, settings')
        .eq('id', client_id)
        .single();

      if (client) {
        clientContext = `
<client_context>
Client: ${client.name}
${client.vessel_name ? `Vessel: ${client.vessel_name}` : ''}
${client.vessel_type ? `Vessel type: ${client.vessel_type}` : ''}
${client.vessel_size_meters ? `Vessel size: ${client.vessel_size_meters}m` : ''}
</client_context>`;
      }
    }

    // Build prompt
    const prompt = PARSE_PROMPT
      .replace('{BRIEF_CONTENT}', brief_content)
      .replace('{CLIENT_CONTEXT}', clientContext);

    // Call Claude via OpenRouter
    const aiResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lighthouse-careers.com',
        'X-Title': 'Lighthouse Crew Network',
      },
      body: JSON.stringify({
        model: `anthropic/${CLAUDE_MODEL}`,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from response (in case there's any wrapper text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Post-process: standardize position
    if (parsed.position) {
      parsed.position = standardizePosition(parsed.position);
    }

    // Ensure default certifications for sea-going positions
    const seaPositions = ['deck', 'interior', 'engineering', 'galley'];
    if (seaPositions.includes(parsed.position_category)) {
      const reqCerts = parsed.requirements?.certifications_required || [];
      if (!reqCerts.includes('STCW')) {
        reqCerts.push('STCW');
      }
      if (!reqCerts.includes('ENG1')) {
        reqCerts.push('ENG1');
      }
      parsed.requirements = parsed.requirements || {};
      parsed.requirements.certifications_required = reqCerts;
    }

    // Save brief to database if requested
    let briefId = null;
    if (save_brief) {
      const { data: savedBrief, error: saveError } = await supabase
        .from('briefs')
        .insert({
          source: source || 'api',
          source_identifier: source_identifier,
          raw_content: brief_content,
          client_id: client_id,
          parsed_at: new Date().toISOString(),
          parsed_requirements: parsed,
          parsing_confidence: parsed.confidence,
          parsing_ambiguities: parsed.ambiguities,
          status: parsed.confidence > 0.7 ? 'parsed' : 'needs_review',
        })
        .select('id')
        .single();

      if (saveError) {
        console.error('Failed to save brief:', saveError);
      } else {
        briefId = savedBrief.id;
      }
    }

    // Return parsed brief
    return new Response(
      JSON.stringify({
        success: true,
        brief_id: briefId,
        parsed: parsed,
        needs_clarification: parsed.clarifying_questions?.length > 0,
        clarifying_questions: parsed.clarifying_questions || [],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error parsing brief:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
