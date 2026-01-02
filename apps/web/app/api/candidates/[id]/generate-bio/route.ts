import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateCandidateBio,
  BIO_GENERATION_VERSION,
  type BioGenerationCandidate,
} from '@lighthouse/ai';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/candidates/[id]/generate-bio
 *
 * Manually trigger bio generation for a candidate.
 * Requires authentication (recruiters only).
 *
 * Query params:
 *   - force=true: Regenerate even if bio already exists
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid candidate ID format' },
        { status: 400 }
      );
    }

    // Check force flag
    const force = request.nextUrl.searchParams.get('force') === 'true';

    // Fetch candidate with CV extraction data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(
        `
        id, first_name, last_name, date_of_birth, nationality,
        primary_position, years_experience, positions_held, positions_extracted,
        yacht_experience_extracted, villa_experience_extracted,
        certifications_extracted, licenses_extracted, education_extracted,
        references_extracted, languages_extracted, cv_skills,
        profile_summary, highest_license, has_stcw, has_eng1,
        cv_extracted_at, bio_full, bio_generated_at
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (candidateError) {
      if (candidateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', candidateError);
      return NextResponse.json(
        { error: 'Failed to fetch candidate' },
        { status: 500 }
      );
    }

    // Check if CV extraction has been done
    if (!candidate.cv_extracted_at) {
      return NextResponse.json(
        {
          error: 'CV extraction required',
          message:
            'This candidate does not have CV extraction data. Please run CV extraction first.',
        },
        { status: 400 }
      );
    }

    // Check if bio already exists (unless force flag)
    if (candidate.bio_full && !force) {
      return NextResponse.json(
        {
          error: 'Bio already exists',
          message:
            'This candidate already has a bio. Use ?force=true to regenerate.',
          bio_generated_at: candidate.bio_generated_at,
        },
        { status: 409 }
      );
    }

    // Build the candidate data for bio generation
    const bioCandidate: BioGenerationCandidate = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      date_of_birth: candidate.date_of_birth,
      nationality: candidate.nationality,
      primary_position: candidate.primary_position,
      years_experience: candidate.years_experience,
      positions_held:
        candidate.positions_extracted as BioGenerationCandidate['positions_held'],
      yacht_experience_extracted:
        candidate.yacht_experience_extracted as BioGenerationCandidate['yacht_experience_extracted'],
      villa_experience_extracted:
        candidate.villa_experience_extracted as BioGenerationCandidate['villa_experience_extracted'],
      certifications_extracted:
        candidate.certifications_extracted as BioGenerationCandidate['certifications_extracted'],
      licenses_extracted:
        candidate.licenses_extracted as BioGenerationCandidate['licenses_extracted'],
      education_extracted:
        candidate.education_extracted as BioGenerationCandidate['education_extracted'],
      references_extracted:
        candidate.references_extracted as BioGenerationCandidate['references_extracted'],
      languages_extracted:
        candidate.languages_extracted as BioGenerationCandidate['languages_extracted'],
      cv_skills: candidate.cv_skills,
      profile_summary: candidate.profile_summary,
      highest_license: candidate.highest_license,
      has_stcw: candidate.has_stcw ?? undefined,
      has_eng1: candidate.has_eng1 ?? undefined,
    };

    // Generate the bio
    const bioResult = await generateCandidateBio({ candidate: bioCandidate });

    // Update candidate record
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        bio_full: bioResult.bio_full,
        bio_generated_at: new Date().toISOString(),
        bio_generation_version: BIO_GENERATION_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update candidate:', updateError);
      return NextResponse.json(
        { error: 'Failed to save bio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bio_full: bioResult.bio_full,
        generation_confidence: bioResult.generation_confidence,
        generation_notes: bioResult.generation_notes,
        bio_generation_version: BIO_GENERATION_VERSION,
        regenerated: !!candidate.bio_full,
      },
    });
  } catch (error) {
    console.error('Unexpected error generating bio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
