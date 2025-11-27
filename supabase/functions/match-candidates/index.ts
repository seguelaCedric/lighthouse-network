// ============================================================================
// SUPABASE EDGE FUNCTION: match-candidates
// ============================================================================
// Takes a job or parsed brief and returns ranked candidates with AI reasoning.
// Uses vector similarity search + Claude AI for final ranking.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/embeddings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface MatchRequest {
  job_id?: string;
  parsed_brief?: any;
  requirements?: any;
  options?: {
    limit?: number;
    similarity_threshold?: number;
    verification_tiers?: string[];
    availability_statuses?: string[];
    exclude_submitted_to_job?: string;
    agency_id?: string;
  };
}

interface CandidateMatch {
  candidate_id: string;
  candidate: any;
  match_score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  vector_similarity: number;
}

// ----------------------------------------------------------------------------
// PROMPTS
// ----------------------------------------------------------------------------

const RANKING_SYSTEM = `You are an expert yacht crew recruitment specialist. Rank candidates against job requirements.

Scoring guide:
- 90-100: Exceptional match, exceeds requirements
- 80-89: Strong match, meets all key requirements
- 70-79: Good match, minor gaps
- 60-69: Adequate, some concerns
- Below 60: Significant gaps

Be specific and direct. Hard requirements (certs, visas, availability) are deal-breakers.`;

const RANKING_PROMPT = `Rank these candidates for the position.

<position>
{POSITION}
</position>

<job_details>
{JOB_DETAILS}
</job_details>

<requirements>
{REQUIREMENTS}
</requirements>

<candidates>
{CANDIDATES}
</candidates>

Output JSON array only, ranked highest to lowest:
[
  {
    "candidate_id": "uuid",
    "match_score": 85,
    "strengths": ["specific strength 1", "specific strength 2"],
    "concerns": ["specific concern if any"],
    "summary": "One sentence summary"
  }
]`;

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function buildSearchText(job: any): string {
  const parts: string[] = [];
  
  parts.push(`Position: ${job.title || job.position || 'Unknown'}`);
  
  if (job.vessel_type) parts.push(`Vessel: ${job.vessel_type}`);
  if (job.vessel_size_meters) parts.push(`Size: ${job.vessel_size_meters}m`);
  if (job.vessel?.type) parts.push(`Vessel: ${job.vessel.type}`);
  if (job.vessel?.size_min) parts.push(`Size: ${job.vessel.size_min}m+`);
  
  if (job.contract_type || job.contract?.type) {
    parts.push(`Contract: ${job.contract_type || job.contract?.type}`);
  }
  
  if (job.primary_region || job.location?.region) {
    parts.push(`Region: ${job.primary_region || job.location?.region}`);
  }
  
  const req = job.requirements || {};
  if (req.experience_years_min) parts.push(`Experience: ${req.experience_years_min}+ years`);
  if (req.certifications_required?.length) {
    parts.push(`Certifications: ${req.certifications_required.join(', ')}`);
  }
  if (req.languages_required?.length) {
    parts.push(`Languages: ${req.languages_required.join(', ')}`);
  }
  if (req.non_smoker) parts.push('Non-smoker required');
  if (req.no_visible_tattoos) parts.push('No visible tattoos');
  
  return parts.join('\n');
}

function buildCandidateText(candidates: any[]): string {
  return candidates.map((c, i) => {
    const parts: string[] = [];
    parts.push(`[Candidate ${i + 1}]`);
    parts.push(`ID: ${c.id}`);
    parts.push(`Name: ${c.first_name} ${c.last_name?.charAt(0) || ''}.`);
    parts.push(`Position: ${c.primary_position || 'Not specified'}`);
    parts.push(`Experience: ${c.years_experience || '?'} years`);
    parts.push(`Verification: ${c.verification_tier}`);
    parts.push(`Availability: ${c.availability_status}${c.available_from ? ` from ${c.available_from}` : ''}`);
    parts.push(`Nationality: ${c.nationality || 'Unknown'}`);
    
    const certs: string[] = [];
    if (c.has_stcw) certs.push('STCW');
    if (c.has_eng1) certs.push('ENG1');
    if (c.highest_license) certs.push(c.highest_license);
    if (certs.length) parts.push(`Certifications: ${certs.join(', ')}`);
    
    const visas: string[] = [];
    if (c.has_schengen) visas.push('Schengen');
    if (c.has_b1b2) visas.push('B1/B2');
    if (c.has_c1d) visas.push('C1/D');
    if (visas.length) parts.push(`Visas: ${visas.join(', ')}`);
    
    if (c.is_smoker !== null) parts.push(`Smoker: ${c.is_smoker ? 'Yes' : 'No'}`);
    if (c.has_visible_tattoos !== null) parts.push(`Tattoos: ${c.has_visible_tattoos ? 'Yes' : 'No'}`);
    if (c.preferred_yacht_size_max) parts.push(`Preferred size: up to ${c.preferred_yacht_size_max}m`);
    
    parts.push(`Similarity: ${(c.similarity * 100).toFixed(0)}%`);
    parts.push('');
    
    return parts.join('\n');
  }).join('\n');
}

function filterByHardRequirements(candidates: any[], requirements: any): any[] {
  if (!requirements) return candidates;
  
  return candidates.filter(c => {
    // Availability
    if (!['available', 'looking'].includes(c.availability_status)) return false;
    
    // Required certs
    if (requirements.certifications_required?.includes('STCW') && !c.has_stcw) return false;
    if (requirements.certifications_required?.includes('ENG1') && !c.has_eng1) return false;
    
    // Visas
    if (requirements.visas_required?.includes('Schengen') && !c.has_schengen) return false;
    if (requirements.visas_required?.includes('B1/B2') && !c.has_b1b2) return false;
    
    // Experience
    if (requirements.experience_years_min && c.years_experience < requirements.experience_years_min) return false;
    
    // Personal
    if (requirements.non_smoker === true && c.is_smoker === true) return false;
    if (requirements.no_visible_tattoos === true && c.has_visible_tattoos === true) return false;
    
    return true;
  });
}

// ----------------------------------------------------------------------------
// MAIN HANDLER
// ----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openrouterKey || !openaiKey) {
      throw new Error('API keys not configured');
    }

    const body: MatchRequest = await req.json();
    const { job_id, parsed_brief, requirements, options = {} } = body;

    if (!job_id && !parsed_brief && !requirements) {
      return new Response(
        JSON.stringify({ error: 'job_id, parsed_brief, or requirements required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get job details if job_id provided
    let job = parsed_brief;
    if (job_id) {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (jobError || !jobData) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      job = jobData;
    }

    // Build search text and generate embedding
    const searchText = buildSearchText(job);
    console.log('Search text:', searchText);

    let embedding = job.embedding;
    if (!embedding) {
      console.log('Generating embedding...');
      embedding = await generateEmbedding(searchText, openaiKey);
    }

    // Vector search
    const limit = options.limit || 20;
    const threshold = options.similarity_threshold || 0.5;

    console.log('Running vector search...');
    const { data: vectorResults, error: searchError } = await supabase.rpc(
      'match_candidates_vector',
      {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit * 3, // Get more than needed for filtering
      }
    );

    if (searchError) {
      console.error('Vector search error:', searchError);
      throw new Error(`Vector search failed: ${searchError.message}`);
    }

    console.log(`Vector search returned ${vectorResults?.length || 0} candidates`);

    if (!vectorResults || vectorResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          matches: [],
          total_searched: 0,
          search_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by hard requirements
    const jobRequirements = job.requirements || requirements || {};
    const filtered = filterByHardRequirements(vectorResults, jobRequirements);
    console.log(`After filtering: ${filtered.length} candidates`);

    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          matches: [],
          total_searched: vectorResults.length,
          filtered_out: vectorResults.length,
          search_time_ms: Date.now() - startTime,
          message: 'No candidates passed hard requirements filter',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Take top candidates for AI ranking
    const toRank = filtered.slice(0, Math.min(filtered.length, limit * 2));

    // Build AI ranking prompt
    const jobDetails = [
      job.vessel_type ? `Vessel: ${job.vessel_type}` : '',
      job.vessel_size_meters ? `Size: ${job.vessel_size_meters}m` : '',
      job.vessel?.type ? `Vessel: ${job.vessel.type}` : '',
      job.vessel?.size_min ? `Size: ${job.vessel.size_min}m+` : '',
      job.contract_type || job.contract?.type ? `Contract: ${job.contract_type || job.contract?.type}` : '',
      job.primary_region || job.location?.region ? `Region: ${job.primary_region || job.location?.region}` : '',
      job.start_date || job.contract?.start_date ? `Start: ${job.start_date || job.contract?.start_date}` : '',
    ].filter(Boolean).join('\n');

    const reqText = [
      jobRequirements.experience_years_min ? `Experience: ${jobRequirements.experience_years_min}+ years` : '',
      jobRequirements.certifications_required?.length ? `Required certs: ${jobRequirements.certifications_required.join(', ')}` : '',
      jobRequirements.languages_required?.length ? `Languages: ${jobRequirements.languages_required.join(', ')}` : '',
      jobRequirements.non_smoker ? 'Non-smoker required' : '',
      jobRequirements.no_visible_tattoos ? 'No visible tattoos' : '',
    ].filter(Boolean).join('\n') || 'No specific requirements';

    const prompt = RANKING_PROMPT
      .replace('{POSITION}', job.title || job.position || 'Unknown Position')
      .replace('{JOB_DETAILS}', jobDetails || 'No details')
      .replace('{REQUIREMENTS}', reqText)
      .replace('{CANDIDATES}', buildCandidateText(toRank));

    console.log('Calling Claude for ranking...');
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
          { role: 'system', content: RANKING_SYSTEM },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`AI ranking failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rankingText = aiData.choices?.[0]?.message?.content;

    if (!rankingText) {
      throw new Error('No ranking response from AI');
    }

    // Parse rankings
    let rankings: any[] = [];
    try {
      const jsonMatch = rankingText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rankings = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse rankings:', rankingText);
    }

    // Map rankings back to full candidate data
    const candidateMap = new Map(toRank.map(c => [c.id, c]));
    
    const matches: CandidateMatch[] = rankings
      .filter(r => candidateMap.has(r.candidate_id))
      .slice(0, limit)
      .map(r => {
        const candidate = candidateMap.get(r.candidate_id);
        return {
          candidate_id: r.candidate_id,
          candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            email: candidate.email,
            phone: candidate.phone,
            primary_position: candidate.primary_position,
            years_experience: candidate.years_experience,
            nationality: candidate.nationality,
            verification_tier: candidate.verification_tier,
            availability_status: candidate.availability_status,
            available_from: candidate.available_from,
            has_stcw: candidate.has_stcw,
            has_eng1: candidate.has_eng1,
            highest_license: candidate.highest_license,
            has_schengen: candidate.has_schengen,
            has_b1b2: candidate.has_b1b2,
            is_smoker: candidate.is_smoker,
            has_visible_tattoos: candidate.has_visible_tattoos,
          },
          match_score: r.match_score,
          strengths: r.strengths || [],
          concerns: r.concerns || [],
          summary: r.summary || '',
          vector_similarity: candidate.similarity,
        };
      });

    const searchTime = Date.now() - startTime;
    console.log(`Matching complete in ${searchTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        matches,
        total_searched: vectorResults.length,
        passed_filter: filtered.length,
        ranked: toRank.length,
        returned: matches.length,
        search_time_ms: searchTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Matching error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        search_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
