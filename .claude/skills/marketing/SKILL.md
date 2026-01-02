# Lighthouse Marketing Expert Skill
# Elite direct-response marketing for yacht crew & villa staff recruitment
# For Claude Code / AI Agent Systems

name: lighthouse-marketing-expert
version: "1.0"
description: >
  Elite direct-response marketing expert for luxury yacht crew and villa staff recruitment.
  Use for website audits, landing page copy, ad copy, email sequences, conversion optimization,
  SEO content, sales pages, and any marketing copywriting for Lighthouse Careers or
  Lighthouse Crew Network SaaS.

triggers:
  keywords:
    - audit website
    - write copy
    - improve conversion
    - landing page
    - ad copy
    - email sequence
    - sales page
    - headline
    - CTA
    - yacht crew marketing
    - recruitment marketing
    - superyacht
    - stewardess
    - deckhand
    - yacht chef
    - captain hiring
  contexts:
    - marketing copywriting
    - conversion optimization
    - website analysis
    - content creation
    - lead generation
    - email marketing
    - paid advertising
    - SEO content

# =============================================================================
# CORE CAPABILITIES
# =============================================================================

capabilities:
  website_audits:
    description: Analyze pages for conversion, copy, and UX issues
    workflow:
      - step: 1
        action: Fetch the page using web fetch or provided HTML
      - step: 2
        action: Score against audit checklist framework
      - step: 3
        action: Identify top 3-5 critical issues with specific fixes
      - step: 4
        action: Provide rewritten copy where needed
      - step: 5
        action: Prioritize by impact (high/medium/low)

  copywriting:
    description: Headlines, body copy, CTAs, full pages
    frameworks:
      - PAS (Problem-Agitate-Solve)
      - AIDA (Attention-Interest-Desire-Action)
      - 4Ps (Promise-Picture-Proof-Push)

  landing_pages:
    description: High-converting page structures

  ad_copy:
    description: Meta, Google, LinkedIn ads

  email_sequences:
    description: Nurture flows, cold outreach

  seo_content:
    description: Blog posts, guides, pillar pages

  conversion_optimization:
    description: A/B test recommendations, friction analysis

# =============================================================================
# WEBSITE AUDIT FRAMEWORK
# =============================================================================

audit_checklist:
  above_the_fold:
    - item: Clear value proposition visible immediately
      priority: critical
    - item: Headline addresses specific pain or desire
      priority: critical
    - item: Subhead clarifies offer/mechanism
      priority: high
    - item: Primary CTA visible without scrolling
      priority: critical
    - item: Visual hierarchy guides eye to CTA
      priority: high
    - item: Social proof present (logos, numbers, testimonials)
      priority: high

  copy_quality:
    - item: Benefits over features
      priority: critical
    - item: Specific over vague ("47 placements this month" not "many placements")
      priority: high
    - item: Active voice, second person ("you" not "our clients")
      priority: medium
    - item: No jargon unless audience-specific
      priority: medium
    - item: Emotional triggers present
      priority: high
    - item: Objections addressed
      priority: high
    - item: Risk reversal (guarantee, no commitment)
      priority: medium

  conversion_elements:
    - item: Single clear CTA per section
      priority: critical
    - item: CTA copy is action-specific ("Get My Free Salary Guide" not "Submit")
      priority: critical
    - item: Form fields minimized
      priority: high
    - item: Trust signals near CTA (security, privacy, testimonials)
      priority: high
    - item: Urgency/scarcity if appropriate
      priority: medium
    - item: Mobile-optimized
      priority: critical

  technical_ux:
    - item: Page loads fast
      priority: high
    - item: No broken elements
      priority: critical
    - item: Clear navigation hierarchy
      priority: medium
    - item: Exit intent or secondary capture
      priority: low

# =============================================================================
# COPYWRITING FRAMEWORKS
# =============================================================================

headline_formulas:
  problem_agitate_solution:
    pattern: "[Pain Point]? Here's [Solution] (Without [Common Objection])"
    example: "Struggling to Find Quality Crew? Get Pre-Vetted Candidates in 48 Hours (Without the Agency Runaround)"

  specific_result:
    pattern: "How [Audience] [Achieves Result] in [Timeframe]"
    example: "How Yacht Captains Fill Crew Positions in 48 Hours—Not 4 Weeks"

  question_hook:
    pattern: "What If You Could [Desire] Without [Pain]?"
    example: "What If You Could Land Your Dream Yacht Job Without Endlessly Refreshing Job Boards?"

  curiosity_gap:
    pattern: "The [Adjective] [Method/Thing] That [Result]"
    example: "The 3-Step CV Trick That Gets Stewardesses Hired on 60m+ Yachts"

body_copy_structures:
  pas:
    name: Problem-Agitate-Solve
    steps:
      - State the problem
      - Twist the knife (make it visceral)
      - Present the solution

  aida:
    name: Attention-Interest-Desire-Action
    steps:
      - Hook with headline
      - Build interest with story/proof
      - Create desire with benefits
      - Call to action

  four_ps:
    name: Promise-Picture-Proof-Push
    steps:
      - Make the promise (headline)
      - Paint the picture (transformation)
      - Prove it works (testimonials, data)
      - Push to action (CTA)

cta_guidelines:
  bad_examples:
    - Submit
    - Click Here
    - Learn More
    - Send
  good_pattern: "Action + Benefit"
  good_examples:
    - Get My Free Salary Guide
    - Find My Next Yacht Job
    - Send Me Qualified Candidates
    - Start My Free CV Review
    - Show Me Available Positions

# =============================================================================
# INDUSTRY CONTEXT
# =============================================================================

industry:
  name: Superyacht crew recruitment and luxury villa/household staffing
  geography: Global (Monaco, Antibes, Fort Lauderdale, Palma, Barcelona)
  revenue_model: Placement fees (15-20% annual salary) + SaaS subscriptions
  average_placement_fee: "€8,000-25,000"

audiences:
  candidates:
    description: Yacht crew seeking positions
    primary_pain: Uncertainty, ghosted by agencies, missing seasons
    primary_desire: Career progression, better vessels, stability
    trigger_words:
      - dream yacht
      - career
      - get hired
      - placement
    emotional_triggers:
      - Fear of missing Med/Caribbean season
      - Frustration with unresponsive agencies
      - Desire for recognition and growth
      - Pride in vessel and profession

  clients:
    description: Captains, owners, management companies hiring crew
    primary_pain: Urgency, bad hires, crew turnover
    primary_desire: Reliable crew fast, discretion, minimal hassle
    trigger_words:
      - qualified
      - vetted
      - fast
      - trusted
    emotional_triggers:
      - Time pressure (charter starting, crew quit)
      - Fear of wrong hire (stuck with them at sea)
      - Cost of vacancy vs. cost of mistake
      - Need for discretion

# =============================================================================
# AUDIENCE PSYCHOLOGY BY POSITION
# =============================================================================

positions:
  captain:
    salary_range: "€8,000-25,000/month"
    decision_authority: Hires all crew
    pains:
      - Liability burden
      - Owner vs. crew balance
      - Unreliable agencies
      - Compliance paperwork
      - Crew poaching
    desires:
      - Drama-free crew
      - Verified references
      - Discretion
      - Long-term stability
    copy_angles:
      - "Crew you can trust"
      - "Verified references"
      - "Captains trust us because..."
    objections:
      - "Been burned by agencies"
      - "Fees too high"
      - "Can find crew on Facebook"

  chief_stewardess:
    salary_range: "€4,500-7,000/month"
    manages: 2-8 interior crew
    pains:
      - Managing junior crew with little authority
      - Demanding guests
      - Service standards pressure
      - Burnout
      - Seasonal instability
    desires:
      - Larger yachts
      - Professional recognition
      - Career progression to yacht management
    copy_angles:
      - "Move up to 60m+"
      - "Your service standards deserve better vessels"
    objections:
      - "All the good jobs are taken"
      - "Agencies only care about placement fees"

  stewardess:
    salary_range: "€2,500-4,000/month"
    level: Entry to mid-level
    pains:
      - Entry barriers
      - Low pay on small boats
      - Difficult chief stews
      - Long hours
      - Isolation
    desires:
      - Bigger yacht = better pay
      - Travel
      - Professional growth
      - Stable position
    copy_angles:
      - "Break into yachting"
      - "Your next step up"
      - "From 30m to 50m"
    objections:
      - "Not enough experience"
      - "Can't get my foot in the door"

  chef:
    salary_range: "€4,000-12,000/month"
    demand: High
    pains:
      - Impossible provisioning
      - Dietary restrictions
      - Budget constraints
      - Isolation in galley
      - Preference sheets chaos
    desires:
      - Creative freedom
      - Quality provisions
      - Appreciative principals
      - Work-life balance
    copy_angles:
      - "Owners who appreciate culinary excellence"
      - "Real budgets, real creativity"
    objections:
      - "Every yacht says they want a great chef but won't pay for ingredients"

  deckhand:
    salary_range: "€2,200-3,500/month"
    level: Entry level
    pains:
      - Lowest rung
      - Long hours
      - Limited advancement visibility
      - Tender driving pressure
      - Weather exposure
    desires:
      - Clear path to Bosun/Mate
      - License progression
      - Quality vessel for CV
      - Learning opportunities
    copy_angles:
      - "Your path to Mate starts here"
      - "Vessels that invest in crew development"
    objections:
      - "No one wants green deckhands"
      - "Need seatime but can't get hired"

  engineer:
    salary_range: "€5,000-15,000/month"
    type: Technical specialist
    pains:
      - On-call 24/7
      - Blamed for breakdowns
      - Parts procurement nightmare
      - Isolation from crew social life
    desires:
      - Well-maintained vessels
      - Adequate budget
      - Technical challenges
      - Recognition
    copy_angles:
      - "Vessels that invest in maintenance"
      - "Engineering roles with real support"
    objections:
      - "Owners don't understand engineering costs"

# =============================================================================
# CLIENT TYPES
# =============================================================================

client_types:
  private_yacht_owner:
    budget: Flexible for right crew
    priority: Discretion
    pains:
      - Can't trust strangers in home
      - Confidentiality concerns
      - Previous crew issues
      - Don't know industry standards
    desires:
      - Invisible excellence
      - Crew who "get it"
      - No drama
      - Recommendations from trusted sources
    copy_angles:
      - "Discretion guaranteed"
      - "Crew who understand UHNW environments"
    objections:
      - "How do I know you won't share our information?"

  charter_yacht_captain:
    budget: Fixed by management
    priority: Speed + reliability
    pains:
      - Crew quit before charter
      - Pressure from management
      - Limited hiring authority
      - Blame if hire fails
    desires:
      - Fast turnaround
      - Safe choices
      - Crew that won't embarrass them
      - Reliable agency relationship
    copy_angles:
      - "48-hour turnaround"
      - "Candidates we'd put on our own yacht"
    objections:
      - "Management approves the budget, not me"

  yacht_management_company:
    budget: Pass-through
    priority: Volume + compliance
    pains:
      - Managing multiple vessels
      - Compliance tracking
      - Captain relationships
      - Liability
    desires:
      - Scalable solution
      - Compliance documentation
      - Reduce captain complaints
      - Streamlined process
    copy_angles:
      - "One agency for your entire fleet"
      - "Compliance documentation included"
    objections:
      - "We have preferred supplier lists"

  villa_estate_owner:
    budget: High
    priority: Discretion + quality
    pains:
      - Staff turnover
      - Finding staff who understand UHNW lifestyle
      - Privacy concerns
      - Managing multiple properties
    desires:
      - Invisible excellence
      - Staff who anticipate needs
      - Long-term retention
      - One point of contact
    copy_angles:
      - "Yacht-trained staff for your estate"
      - "Service standards from the superyacht industry"
    objections:
      - "Villa staff is different from yacht crew"

# =============================================================================
# OBJECTION HANDLING
# =============================================================================

objection_responses:
  - objection: "Your fees are too high"
    response: "Cost of bad hire = 3x salary. Cost of vacancy = lost charter revenue."

  - objection: "We can find crew ourselves"
    response: "You can. But you'll spend 40 hours screening. We've already done it."

  - objection: "Agencies send anyone"
    response: "We send 3 candidates max. Pre-vetted, reference-checked, matched to your vessel."

  - objection: "Been burned before"
    response: "That's why we exist. We're the agency built by people tired of the old way."

  - objection: "We need someone yesterday"
    response: "48-hour delivery on most positions. Emergency placements available."

# =============================================================================
# BRAND VOICE & LANGUAGE
# =============================================================================

brand_voice:
  tone: Professional yet approachable, knowledgeable insider, trustworthy partner
  positioning: Industry insiders who understand both sides—not a job board, a career partner
  differentiators:
    - Speed (48-hour response, not weeks)
    - Quality over quantity (pre-vetted, not CV spam)
    - Genuine care (career partners, not transactional)
    - Industry insiders (we know both sides)

language_guidelines:
  use:
    - term: "Yacht crew"
      instead_of: "seafarers, maritime workers"
    - term: "Vessel or yacht"
      instead_of: "boat (boat = under 24m)"
    - term: "Principal or owner"
      instead_of: "boss, employer"
    - term: "Placement"
      instead_of: "recruitment"
    - term: "Programme"
      note: "British spelling for European market"
  avoid:
    - Corporate jargon (synergy, leverage, ecosystem)
    - Desperate urgency (ACT NOW!)
    - Overpromising (guaranteed placement)
    - Negative framing about competitors

yacht_size_categories:
  - range: "Under 24m"
    term: "Boat"
    crew_size: "smaller crew, lower pay"
  - range: "24-50m"
    term: "Yacht"
    crew_size: "3-8 crew"
  - range: "50-80m"
    term: "Large yacht"
    crew_size: "8-15 crew"
  - range: "80m+"
    term: "Superyacht"
    crew_size: "15-30+ crew"

certifications:
  - abbrev: STCW
    full: Standards of Training, Certification, Watchkeeping
  - abbrev: ENG1
    full: UK maritime medical certificate
  - abbrev: B1/B2
    full: US visa types
  - abbrev: PYA
    full: Professional Yachting Association
  - abbrev: MCA
    full: Maritime and Coastguard Agency
  - abbrev: USCG
    full: United States Coast Guard

seasons:
  mediterranean:
    period: May-October
    hiring_surge: February-April
  caribbean:
    period: November-April
    hiring_surge: September-November

key_events:
  - name: Antibes Crew Show
    timing: Early October
    type: Major industry event
  - name: Fort Lauderdale Boat Show
    timing: Late October/November
    type: Major industry event

# =============================================================================
# CONTENT TEMPLATES
# =============================================================================

landing_page_structure:
  sections:
    - name: hero
      elements:
        - Headline (problem or promise)
        - Subhead (mechanism or clarification)
        - Primary CTA
        - Social proof snippet (logos or stat)
        - Hero image (real yacht/crew, not stock)

    - name: problem
      elements:
        - Agitate the pain (3 specific problems)
        - "Sound familiar?" moment

    - name: solution
      elements:
        - Introduce mechanism/approach
        - 3-4 key benefits (not features)
        - Visual or diagram if applicable

    - name: proof
      elements:
        - Testimonials (specific results)
        - Case study snippet
        - Numbers/stats

    - name: how_it_works
      elements:
        - 3-step process (simplify complexity)
        - Address "what happens next" anxiety

    - name: offer
      elements:
        - What they get (stack value)
        - Risk reversal (guarantee)
        - CTA repeated

    - name: faq
      elements:
        - Address remaining objections
        - 4-6 questions

    - name: final_cta
      elements:
        - Urgency if appropriate
        - Last chance push

email_sequences:
  lead_magnet_followup:
    emails: 7
    structure:
      - day: 0
        content: Deliver lead magnet + welcome
      - day: 2
        content: Quick win related to lead magnet
      - day: 4
        content: Industry insight/trend
      - day: 7
        content: Success story
      - day: 10
        content: Common mistake
      - day: 14
        content: Soft CTA
      - day: 21
        content: Direct CTA

  cold_outreach:
    emails: 3
    structure:
      - email: 1
        content: Problem + curiosity
      - email: 2
        content: Proof + mechanism
      - email: 3
        content: Direct ask + urgency

# =============================================================================
# SWIPE FILE - PROVEN COPY
# =============================================================================

swipe_file:
  headlines:
    problem_focused:
      - "Tired of Agencies That Ghost You After Taking Your CV?"
      - "Another Season, Another Job Board Refresh. There's a Better Way."
      - "Your Crew Quit 2 Weeks Before Charter. Now What?"
      - "Why 80% of the Best Yacht Jobs Never Get Posted"

    result_focused:
      - "From 30m to 60m in One Season: How Strategic Moves Build Careers"
      - "47 Placements This Month. Zero Complaints."
      - "The Fastest Path from Deckhand to Mate (It's Not What You Think)"
      - "Pre-Vetted Candidates in 48 Hours. Not 4 Weeks."

    curiosity_gap:
      - "The CV Mistake That Costs Stewardesses 6-Figure Positions"
      - "What Captains Actually Look for (It's Not More Certifications)"
      - "The Hidden Job Market: How to Access Positions Before They're Posted"
      - "Why Some Crew Get Hired in Days While Others Wait Months"

    question_hooks:
      - "What If Your Next Yacht Job Found You?"
      - "Ready to Stop Competing with 500 Other Applicants?"
      - "What Would Change If You Had a Career Partner, Not Just an Agency?"

  email_subject_lines:
    open_loops:
      - "The yacht job I didn't want to send you..."
      - "Quick question about your career goals"
      - "This might not be for you, but..."
      - "Something came up that reminded me of your profile"

    specificity:
      - "3 Chief Stew positions on 60m+ (private, not charter)"
      - "Your CV is missing one thing Captains look for"
      - "[First name], 48-hour opportunity window"

    pattern_interrupts:
      - "Bad news about the Med season..."
      - "I was wrong about something"
      - "Delete this if you're happy with your current situation"

  body_copy_blocks:
    problem_agitation_candidate: |
      You've sent out 50 CVs this month.

      Heard back from... maybe 3?

      And those "opportunities" turned out to be 28m boats with no rotation
      and an owner who thinks €2,800 is competitive for a Chief Stew.

      Meanwhile, you watch others land dream positions on yachts you'd kill to work on.

      What do they know that you don't?

    problem_agitation_client: |
      Your Chief Stew just gave notice. Two weeks before a 3-week charter.

      Now you're scrambling. Posting on Facebook groups. Begging your network.
      Considering candidates you'd normally reject.

      Because an empty position costs you more than a bad hire.

      Or does it?

      The average cost of a wrong crew hire: 3x their salary.
      Severance. Recruitment. Training. The damage to your charter reputation.

      There's a faster way that doesn't mean settling.

    mechanism_introduction: |
      Here's what most agencies won't tell you:

      We don't want to send you 20 CVs. That's not matching—that's hoping
      you'll do our job for us.

      We send 3 candidates. Maximum.

      Each one pre-vetted. Reference-checked. Matched to your vessel's culture,
      not just the job description.

      Our placement managers have worked on yachts. They know the difference
      between a CV that looks good and a crew member who actually performs.

    social_proof_block: |
      "I was skeptical—every agency says they're different. But Lighthouse
      actually delivered. 3 candidates, all qualified, one perfect fit.
      Hired within a week."
      — Captain, 72m M/Y (name withheld for privacy)

      This month: 47 placements. 23 repeat clients. 0 complaints.

      We don't succeed unless you do.

    risk_reversal: |
      Here's our promise:

      If the candidates we send don't meet the brief you gave us, we don't get paid. Period.

      No "close enough." No "give them a chance."

      Either they're right for your yacht, or we keep searching.

      Your reputation is worth more than our placement fee.

  ad_templates:
    facebook_candidate: |
      Still sending CVs into the void?

      Here's the uncomfortable truth:

      The best yacht jobs don't get posted on job boards. They go to agencies
      with trusted candidate pools—filled before you even knew the position existed.

      We've placed 147 crew on 50m+ yachts this season.

      Your experience deserves better than refresh, apply, wait, repeat.

      [Get on the priority list → Free CV review included]

    facebook_client: |
      Crew emergency?

      We know the panic. Charter in 2 weeks. Your [position] just quit.

      → Most agencies: "We'll get back to you"
      → Us: Pre-vetted candidates in your inbox within 48 hours

      Not 20 random CVs. 3 candidates. Matched. Reference-checked. Ready.

      [Brief us now — see candidates by tomorrow]

    linkedin_saas: |
      Your competitors are still matching crew with spreadsheets.

      Meanwhile, you're spending 4 hours per search manually cross-referencing:
      - Certifications
      - Availability
      - Yacht size experience
      - Location
      - Preferences

      What if that took 4 minutes?

      Lighthouse Crew Network: AI-powered matching for yacht recruitment agencies.

      [See it in action →]

  landing_page_heroes:
    candidate: |
      # Land Your Dream Yacht Job in 30 Days—Or We Keep Working Until You Do

      Stop competing with 500 applicants on job boards.

      Get matched to positions on 50m+ yachts that fit your experience,
      goals, and preferences.

      [Get Matched to Positions →]

      ✓ Pre-screened positions  ✓ Career guidance included  ✓ 847 placements this year

    client: |
      # Pre-Vetted Yacht Crew. 48 Hours. Guaranteed.

      Stop scrolling through 200 unqualified CVs.

      Get 3 candidates matched to your vessel—reference-checked and ready to interview.

      [Brief Us Now →]

      Trusted by 120+ yachts from 30m to 90m

  cta_variations:
    low_commitment:
      - "See Available Positions →"
      - "Get a Free CV Review →"
      - "Check If You Qualify →"
      - "Browse Yacht Jobs →"

    medium_commitment:
      - "Start My Application →"
      - "Brief Us on Your Needs →"
      - "Schedule a Quick Call →"
      - "Get Matched to Positions →"

    high_commitment:
      - "Hire Crew Now →"
      - "Submit My Requirements →"
      - "Start Recruiting Today →"

# =============================================================================
# SEO KEYWORDS
# =============================================================================

seo_keywords:
  high_intent_candidate:
    job_search:
      - yacht stewardess jobs
      - superyacht chef jobs
      - yacht deckhand jobs near me
      - yacht crew jobs mediterranean
      - yacht crew jobs caribbean
      - yacht jobs no experience
      - entry level yacht jobs
      - yacht crew recruitment agencies

    salary_research:
      - yacht stewardess salary
      - superyacht chef salary 2024
      - yacht captain salary by boat size
      - yacht crew salary guide
      - chief stew salary 60m yacht
      - yacht engineer salary

    how_to:
      - how to become a yacht stewardess
      - how to get a job on a yacht
      - how to become a yacht deckhand
      - how to get into yachting
      - yacht crew training courses
      - STCW certification requirements

    cv_application:
      - yacht crew CV template
      - yacht stewardess CV example
      - yacht crew CV tips
      - how to write a yacht CV

  high_intent_client:
    recruitment:
      - yacht crew recruitment agency
      - hire yacht crew
      - yacht crew placement
      - superyacht recruitment
      - yacht staffing agency
      - charter yacht crew hire

    location_specific:
      - yacht crew agency antibes
      - hire yacht crew monaco
      - yacht recruitment fort lauderdale
      - yacht crew agency palma
      - superyacht recruitment mediterranean

    urgent:
      - emergency yacht crew
      - last minute yacht crew
      - urgent yacht crew needed
      - yacht crew replacement

  content_pillars:
    - pillar: "Complete Guide to Yacht Crew Careers"
      supporting:
        - How to become a yacht stewardess (guide)
        - Yacht deckhand career path (guide)
        - Yacht chef day in the life (article)
        - STCW certification explained (guide)
        - Yacht crew salary guide 2024 (resource)
        - Entry level yacht jobs where to start (guide)

    - pillar: "Yacht Crew Recruitment for Owners & Captains"
      supporting:
        - How to hire reliable yacht crew (guide)
        - Yacht crew interview questions (resource)
        - Cost of yacht crew turnover (article)
        - Yacht crew contracts explained (guide)
        - Reference checking yacht crew (article)
        - Emergency crew replacement options (article)

# =============================================================================
# LIGHTHOUSE CREW NETWORK SAAS
# =============================================================================

saas_marketing:
  positioning: >
    B2B SaaS for yacht management companies and recruitment agencies—
    AI-powered crew matching and compliance automation.

  value_propositions:
    - AI matching (hours → minutes)
    - Compliance automation (never miss expiring certs)
    - Client self-service portal
    - Pipeline analytics

  copy_angles:
    - "From spreadsheets to system"
    - "Your competitors are still doing this manually"
    - "What 40,000 candidate records taught us about matching"
    - "The compliance nightmare that costs agencies €50K/year"

# =============================================================================
# OUTPUT GUIDELINES
# =============================================================================

output_guidelines:
  - rule: Be specific
    detail: Numbers, timeframes, results
  - rule: Be conversational
    detail: Write how people talk
  - rule: Cut ruthlessly
    detail: Every word earns its place
  - rule: Lead with benefits
    detail: Features support, don't lead
  - rule: Include proof
    detail: Testimonials, stats, logos
  - rule: One CTA per context
    detail: Don't dilute focus
  - rule: Test variations
    detail: Provide A/B options when relevant