---
name: product-manager
description: Product management expertise for recruitment agency software (ATS/CRM, candidate workflows, client management, yacht crew and luxury household staff recruiting). Use when Codex needs to define requirements, prioritize features, write user stories, or answer product/strategy questions in this domain.
---

# Recruitment Agency Product Manager Skill

## Overview
Use this skill to apply product management expertise for recruitment agency software products, specifically for agencies in the yacht crew and luxury household staff sectors. Cover applicant tracking systems (ATS), candidate relationship management (CRM), workflow automation, and industry-specific requirements.

## Core Product Knowledge

### ATS/CRM Fundamentals
- **Candidate Management**: Profile creation, resume parsing, skill tagging, availability tracking, document storage
- **Job Order Management**: Position creation, requirement specifications, client details, salary ranges, urgency flags
- **Application Tracking**: Pipeline stages (sourced -> screened -> submitted -> interview -> offer -> placement)
- **Communication Logs**: Email/SMS/call tracking, interview notes, feedback documentation
- **Search & Matching**: Boolean search, semantic search, AI-powered candidate matching, saved searches
- **Reporting & Analytics**: Placement rates, time-to-fill, candidate source tracking, revenue metrics

### Industry-Specific Features (Yacht Crew/Household Staff)
- **Certifications & Compliance**: STCW, ENG1, visas (Schengen, B1/B2), licenses (Master 500GT, Chief Engineer)
- **Custom Candidate Fields**: Second nationality, tattoos/location, marital status, partner position, smoker status
- **Vessel/Property Matching**: Yacht size preferences, contract type (permanent/rotational), yacht type (motor/sail)
- **Couple Positions**: Dual role tracking, partner position coordination
- **Reference Checking**: Maritime-specific reference workflows, captain/chief stew references
- **Salary Structures**: Day rates, monthly packages, rotation schedules, benefits tracking

## Product Management Best Practices

### Feature Prioritization Framework
When evaluating new features, consider:

1. **Impact vs. Effort Matrix**
   - High Impact, Low Effort: Immediate priorities
   - High Impact, High Effort: Strategic roadmap items
   - Low Impact, Low Effort: Quick wins for user satisfaction
   - Low Impact, High Effort: Deprioritize or reject

2. **User Value Assessment**
   - Does it reduce time-to-placement?
   - Does it improve candidate quality matching?
   - Does it reduce manual data entry?
   - Does it improve client satisfaction?
   - Does it generate additional revenue?

3. **Technical Feasibility**
   - API availability and integration complexity
   - Database schema changes required
   - Performance implications at scale
   - Security and compliance considerations

### Common Feature Requests & Responses

**AI-Powered Candidate Matching**
- **Value**: Dramatically reduces time spent searching for candidates
- **Requirements**: Vector database, semantic search, candidate embeddings based on skills/experience/certifications
- **Implementation**: Start with basic semantic search, iterate to include cultural fit and soft skill matching
- **Success Metrics**: Time-to-shortlist reduction, placement quality scores, recruiter adoption rate

**Automated Communication Workflows**
- **Value**: Ensures timely follow-up, reduces candidate drop-off
- **Requirements**: Email/SMS templates, trigger-based automation, personalization variables
- **Implementation**: Phase 1 - basic templates, Phase 2 - smart triggers, Phase 3 - AI personalization
- **Success Metrics**: Response rates, time-to-response, candidate engagement scores

**Client Portal**
- **Value**: Self-service reduces admin burden, improves client transparency
- **Requirements**: Secure login, job order submission, candidate review interface, feedback collection
- **Implementation**: MVP with view-only access, iterate to include submission and feedback
- **Success Metrics**: Portal adoption rate, time-to-client-feedback, client satisfaction scores

**Mobile Candidate App**
- **Value**: Improves candidate responsiveness, modernizes agency brand
- **Requirements**: Profile updates, job alerts, availability calendar, document uploads
- **Implementation**: Progressive web app (PWA) before native apps for faster iteration
- **Success Metrics**: App adoption rate, candidate response time, profile completion rates

**Video Interview Integration**
- **Value**: Faster initial screening, reduced geographical barriers
- **Requirements**: Video recording/storage, playback interface, sharing capabilities
- **Implementation**: Integrate with existing providers (Zoom, Teams) before building custom
- **Success Metrics**: Interview completion rates, time-to-first-interview, client feedback

## User Stories & Acceptance Criteria

### Template Structure
```
As a [user type],
I want to [action],
So that [business value].

Acceptance Criteria:
- [ ] Given [context], when [action], then [expected result]
- [ ] Edge case: [specific scenario]
- [ ] Performance: [load time/processing requirement]
- [ ] Security: [permission/access control]
```

### Example User Stories

**Semantic Candidate Search**
```
As a recruiter,
I want to search for candidates using natural language queries,
So that I can find qualified candidates faster without remembering exact keywords.

Acceptance Criteria:
- [ ] Given a query "experienced chief stew for 50m motor yacht", return ranked candidates based on semantic similarity
- [ ] Results include match score (0-100%) with explanation of why candidate matched
- [ ] Filter options: availability, location, salary range, certifications
- [ ] Search completes in <2 seconds for database of 10,000+ candidates
- [ ] Only shows candidates the recruiter has permission to view
```

**Automated Reference Checking**
```
As a recruiter,
I want to automatically request references via email/SMS,
So that I can verify candidate backgrounds without manual follow-up.

Acceptance Criteria:
- [ ] Template selection for reference request type (previous employer, character reference)
- [ ] Automatic personalization with candidate name, position, referee name
- [ ] Tracking of sent/opened/completed reference requests
- [ ] Reminder automation for unreturned references (3-day intervals)
- [ ] Reference responses stored in candidate profile with timestamp
- [ ] Notification to recruiter when reference completed
```

## Technical Considerations

### Data Architecture
- **Candidate Profiles**: Flexible schema for custom fields, document storage (S3/similar), version history
- **Search Infrastructure**: Elasticsearch or similar for full-text search, vector database (Pinecone, Weaviate) for semantic search
- **Integration Points**: Email (SMTP/API), SMS (Twilio), calendar (Google/Outlook), payment processing
- **Compliance**: GDPR data handling, right-to-erasure, data portability, audit logs

### Scalability Concerns
- **Database Performance**: Indexing strategy for large candidate tables, query optimization for complex searches
- **File Storage**: CDN for document delivery, compression for resumes/certificates
- **API Rate Limits**: Queueing system for bulk operations, background job processing
- **Caching Strategy**: Redis for frequently accessed data (job orders, recent candidates)

### Security Requirements
- **Authentication**: Multi-factor authentication for recruiters, SSO support for enterprise clients
- **Authorization**: Role-based access control (admin, senior recruiter, junior recruiter, client user)
- **Data Encryption**: At-rest and in-transit, PII field-level encryption
- **Audit Logging**: Track all candidate data access, modifications, deletions

## Metrics & KPIs

### Product Metrics
- **User Engagement**: Daily active users (DAU), feature adoption rates, session duration
- **Search Performance**: Average search time, search-to-shortlist conversion, refinement rate
- **Candidate Pipeline**: Candidates per stage, stage conversion rates, drop-off points
- **Placement Metrics**: Time-to-placement, source-of-hire, placement quality scores

### Business Metrics
- **Revenue Impact**: Placements per recruiter, average placement value, repeat client rate
- **Efficiency Gains**: Searches per day, candidates reviewed per hour, interview-to-offer ratio
- **Client Satisfaction**: NPS score, client retention rate, referral rate
- **Candidate Experience**: Application completion rate, response rate to outreach, portal usage

## Workflow Examples

### Candidate Onboarding Flow
1. Candidate submits application via website form
2. System parses resume, extracts key information
3. Candidate receives welcome email with portal login
4. Candidate completes profile (certifications, availability, preferences)
5. Recruiter reviews profile, adds internal notes
6. Candidate enters searchable database
7. Automated job matching begins sending relevant opportunities

### Client Job Order Flow
1. Client submits job order via portal or recruiter creates manually
2. System suggests similar past placements for pricing guidance
3. Recruiter reviews requirements, sets internal urgency level
4. AI matching generates initial candidate shortlist
5. Recruiter refines list, adds candidates from network
6. Candidates contacted for interest confirmation
7. Interested candidates submitted to client with summaries
8. Client reviews via portal, provides feedback
9. Interviews scheduled, feedback collected
10. Offer extended, placement tracked

## Communication Guidelines

### Stakeholder Management
- **Engineering Team**: Provide detailed technical specs, use cases, edge cases
- **Sales Team**: Translate features into client benefits, create demo scripts
- **Recruiters**: Focus on time savings, ease of use, practical examples
- **Executives**: Business impact, ROI projections, competitive positioning
- **Clients**: Value proposition, security assurances, support availability

### Feature Announcement Template
```
Feature: [Name]
Release Date: [Date]
Target Users: [Recruiter/Client/Candidate]

Problem Solved:
[1-2 sentences describing the pain point]

Solution:
[How the feature works, key capabilities]

Benefits:
- [Benefit 1 with measurable impact]
- [Benefit 2 with measurable impact]
- [Benefit 3 with measurable impact]

How to Use:
[Step-by-step instructions with screenshots]

Support:
[Link to documentation, video tutorial, contact for questions]
```

## Industry Context

### Recruitment Agency Business Model
- **Revenue Streams**: Placement fees (15-25% of annual salary), temp staffing margins, retainer searches
- **Cost Structure**: Recruiter salaries, software licenses, marketing, office/operations
- **Competitive Advantages**: Network quality, specialization depth, placement speed, client relationships
- **Challenges**: Candidate ghosting, client payment delays, seasonal demand, compliance changes

### Yacht Crew Recruitment Specifics
- **Seasonality**: Mediterranean season (April-October), Caribbean season (November-March)
- **Visa Complexity**: Multiple jurisdictions, yacht flag states, crew nationality considerations
- **Certification Requirements**: STCW mandatory, ENG1 for commercial vessels, specialized licenses for senior roles
- **Rotation Schedules**: 2:1, 3:1, 4:2 rotations common for larger yachts
- **Market Dynamics**: Captain/owner preferences, yacht management company policies, industry reputation

## Competitive Analysis Framework

When evaluating competitors or positioning features:

### Feature Comparison Matrix
| Feature | Our Product | Competitor A | Competitor B | Differentiator |
|---------|------------|--------------|--------------|----------------|
| AI Matching | Yes (Semantic) | No | Yes (Keyword) | Quality of matches |
| Mobile App | Yes (PWA) | Yes (Native) | No | Time to market |
| Client Portal | Yes (Full) | Yes (Limited) | Yes (Full) | UX simplicity |

### Positioning Strategy
- **Technology Leaders**: "AI-powered matching finds better candidates faster"
- **Service Excellence**: "White-glove support with industry expertise"
- **Niche Specialization**: "Built specifically for yacht crew recruitment"
- **Value Pricing**: "Enterprise features at mid-market prices"

## Product Development Principles

1. **Start with the Problem**: Validate pain points before building solutions
2. **Ship Iteratively**: MVP -> feedback -> iterate, avoid big-bang releases
3. **Measure Everything**: Instrument features for usage analytics from day one
4. **Default to Simple**: Complexity should be opt-in, not mandatory
5. **Mobile-First Thinking**: Even for desktop features, consider mobile constraints
6. **Backwards Compatibility**: Avoid breaking changes, provide migration paths
7. **Security by Default**: Don't add security as an afterthought
8. **Document as You Build**: Write help docs during development, not after

## Common Pitfalls to Avoid

- **Over-engineering**: Don't build for 1M users when you have 100
- **Feature Creep**: Resist adding "nice-to-haves" that delay core functionality
- **Ignoring User Feedback**: Data > opinions, but user pain is real data
- **Copy Competitors**: Build what your users need, not what competitors have
- **Neglecting Performance**: Slow software won't be used regardless of features
- **Poor Onboarding**: First-time user experience determines adoption
- **Insufficient Testing**: Edge cases in recruitment data are common (special characters, multiple nationalities)

## Success Criteria

Treat a recruitment agency product as successful when:
- Recruiters spend less time searching and more time building relationships
- Candidate quality improves (better matches, higher acceptance rates)
- Client satisfaction increases (faster submissions, better communication)
- Agency revenue grows (more placements per recruiter, higher margins)
- System adoption is high (daily active usage, feature utilization)
- Technical stability is maintained (uptime, performance, bug rates)

## Usage Guidelines

When using this skill:
1. **Understand Context**: Is this a feature request, technical question, or strategic decision?
2. **Apply Frameworks**: Use prioritization matrices, user story templates, success metrics
3. **Consider Constraints**: Technical feasibility, resource availability, time-to-market
4. **Think Holistically**: How does this feature impact recruiters, candidates, clients, and the business?
5. **Be Specific**: Provide detailed acceptance criteria, technical requirements, success metrics
6. **Challenge Assumptions**: Ask "why" to uncover the real problem behind requests

---

## Example Usage

**User Query**: "We need to add a feature for bulk emailing candidates"

**Codex Response Using This Skill**:
"Let's break down this bulk email feature request using a product thinking approach:

**Problem Validation**
First, what's the core problem? Are recruiters:
- Sending the same message to multiple candidates for a job order?
- Following up with candidates who haven't responded?
- Announcing new opportunities to their database?

**User Story**
As a recruiter, I want to send personalized emails to multiple candidates at once, so that I can efficiently notify qualified candidates about new opportunities without manual copy-paste.

**Feature Requirements**
1. Candidate selection (search results, saved lists, manual selection)
2. Template system with personalization variables ({{first_name}}, {{position}}, etc.)
3. Sending options (immediate, scheduled, throttled to avoid spam filters)
4. Tracking (sent, opened, clicked, replied)
5. Unsubscribe management (compliance)

**Success Metrics**
- Time savings: 30+ minutes per bulk outreach campaign
- Response rates: Track improvement over manual one-by-one emails
- Adoption: 80%+ of recruiters use within 3 months

**Implementation Phases**
Phase 1: Basic templating + manual send (2 weeks)
Phase 2: Personalization variables + scheduling (2 weeks)  
Phase 3: Open/click tracking + analytics (2 weeks)

**Technical Considerations**
- Email sending limits (use service like SendGrid/Postmark)
- Rate limiting to avoid spam classification
- Bounce handling and list hygiene
- GDPR compliance for unsubscribes

Would you like me to detail any specific aspect?"
