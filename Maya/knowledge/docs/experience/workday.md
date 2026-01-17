# Senior QA Engineer, Security Champion, Scrum Master - Workday

**Category**: experience  
**Priority**: high  
**Last Updated**: 2026-01-06  
**Date**: October 2017 – March 2025  
**Location**: County Dublin, Ireland · Hybrid

## About Workday
Workday is a cloud-based software company that provides Human Capital Management (HCM) and Financial Management applications to businesses, helping them manage their employees, finances, and operations. Used by over 11,000 organizations worldwide, including more than 65% of the Fortune 500, across various industries.

**Key Features:**
- Human Capital Management (HCM): Manages hiring, onboarding, payroll, performance reviews, talent acquisition, benefits, and time tracking
- Financial Management: Handles accounting, budgeting, and financial reporting
- Planning: Tools for financial planning, budgeting, and forecasting
- Unified Platform: Integrates finance and HR into a single system
- Cloud-Based and Mobile-Friendly: Secure cloud storage with access from anywhere
- AI Integration: Built with AI to elevate people, supercharge work, and improve business operations

## Summary
Senior Software Quality Assurance Engineer, Product Security Champion, and Scrum Master at Workday. Led end-to-end quality strategy across Financials, Supply Chain, Procure to Pay, Vendor Management, and Expenses. Delivered 32% development cycle time reduction and achieved zero SLA breaches during final 8 months. Founded and scaled Employee Belonging Council globally to 16 locations with 30% YoY growth.

## Role Timeline
**Primary Roles:** Senior Software Quality Assurance Engineer, Application Product Security Champion, Data Explorer, Scrum Master

- **October 2017 - 2019:** Spend Management Procurement - Procure to Pay team
- **2019 - 2022:** Spend Management Vendor Management team
- **2022 - March 2025:** Spend Management Payment team

## Key Points
- Product Domains: Financials, Supply Chain, Procure to Pay, Vendor Management, Expenses
- 32% development cycle time reduction
- Zero SLA breaches during final 8 months
- Application Security Champion (FY24–FY26)
- Founded and scaled Employee Belonging Council globally to 16 locations
- 30% YoY membership growth until 2025
- Product & Tech VIBE Global Impact Award (first-ever global recognition)
- Official Workday Ireland photographer for high-profile events

## Quality & Technical Leadership
- Led end-to-end quality strategy across multiple product domains
- Owned quality sign-off for features, enhancements, and bug fixes
- Application Security Champion implementing shift-left security practices
- Delivered OFAC compliance functionalities, vendor management portal, and AI-powered expenses automation
- Designed and executed end-to-end test scenarios cross features, ensuring quality sign-offs
- Maintained master test strategy repository, conducted root cause analysis
- Collaborated with cross-functional teams to address impacted areas proactively
- Maintained weekly deployment including feature flag promotion and verification
- Followed CI/CD best practices, monitored pipeline health metrics
- Ensured cross-team functional test suites were integrated effectively
- Contributed to automation design by supporting unit and system test coverage
- Created realistic test data to replicate business scenarios

## QA Experience - Detailed

### Automation Testing Frameworks

**Framework Selection:**
- Primarily used Workday proprietary language XO frameworks (based on Java) for automation
- Conducted in-depth spikes of feature designs and technical documents to identify business logic, existing automation coverage, and touchpoints with upstream and downstream product areas
- Performed regression analysis to identify high-risk areas requiring focused testing
- Automation written by individual user stories at early stage, starting with test data generation and basic attribute validation
- Unified frameworks (modular components of Integration, UI, Business Process, Security, Accounting) speed up development
- Addressed framework constraints (slow background processing, limited cache storage, inefficient data conversion, concurrency challenges) through custom functions

**Industry Standard Framework - Cypress:**
- Explored Cypress for React UI features requiring WCAG Accessibility Level AA (Intermediate) compliance
- Leveraged cypress-axe for accessibility testing with `cy.checkA11y()`
- Identified specific sections and elements' accessibility audit failures
- Detected missing aria-describedby attributes, generating actionable logs
- Initiated collaboration with UI/UX and design teams to create compliance checklists
- Factored accessibility at earliest stages of development

**Custom Framework Extensions:**
- Extended existing test suites to meet additional requirements for new features
- Prioritized reusing methods and libraries whenever possible
- Used feature flags to control new code, ensuring automation aligns with incremental milestones
- Added sub-flags to manage specific business logic
- Expanded automation from basic happy paths to complex execution flows
- Addressed Integration framework's lack of dynamic filtering capabilities through collaborative problem-solving
- Worked with framework team to add many-to-many relationships and logical conditions for granular data filtering

### Test Design Patterns

**Behavior Driven Development (BDD):**
- Followed BDD approach aligning automation with feature requirements and business behaviors
- Structured tests in human-readable format ensuring alignment with scrum team expectations
- Grouped automation tests by feature and product functional area
- Created modular and reusable test functions
- Shared utilities handled repetitive tasks (user data setup, API interactions)
- Enforced strict code review process requiring at least 2 reviewers
- Ensured cross-team handshake code reviews for overlapping features

**Maintainability:**
- Produced automation design documents after feature design document sign-off
- Documented all test cases and scripts for seamless handoffs
- Regularly refactored scripts to remove redundancy and improve readability
- Organized milestone check-ins with PMs and development teams

**Scalability:**
- Worked closely with management and PMO for feature growth
- Leveraged effective tooling to manage feature flags and sub-flags
- Released features to targeted customer selections (regional or pilot groups) before global rollout
- Designed flexible opt-in options for customers allowing granular configuration and control

### Test Data Management

**Mixed Approach:**
- Used combination of static data and dynamically generated data
- Evaluated types and volume of test data required at feature design stage
- Mimicked real-world business scenarios as closely as possible

**Static Data:**
- Built on existing test data profiles in test environment
- Seeded additional static data to complement existing datasets
- Ensured consistency and repeatability for predefined conditions or edge cases
- Regularly audited seeded static test data to identify low or unused data
- Removed unused data to reduce clutter and maintain efficiency

**Dynamically Generated Data:**
- Generated test data dynamically during test execution for transactional scenarios
- Created data reflecting varying business conditions (transaction types, volumes, user behaviors)

### Pipeline Orchestration & CI/CD Integration

**Tools:** GitHub, Jenkins, Cypress, Gradle, and Workday proprietary tools

**CI Process:**
- Development stack build published into build artifact repository (JFrog Artifactory)
- Local unit tests validated individual components ensuring stability
- Integration stage conducted granular integration tests, performance tests, security tests, UI tests, and QA tests
- QA test layer ran in parallel with other test layers
- Version package promoted to integration Artifactory after all tests passed
- Multiple internal approval processes tracked via Jira
- Deployment prepared upon approval

**Continuous Deployment (CD) Challenges:**
- CD practices not as consistently applied as CI processes
- CD often required manual intervention
- Rollbacks required effective communication with scrum team, stakeholders, and customers
- Re-releases required additional testing in production environments
- Complex features or high-risk releases relied on manual oversight

**Test Triggering & Management:**
- Tests categorized and executed at specific stages based on purpose and complexity
- Unit tests triggered during initial build process
- Integration tests verified interaction between modules and external APIs
- QA and end-to-end tests executed at QA stage, mimicking real-world workflows
- Feature broken down into functional milestone flows
- Leveraged feature flags and sub-flags to control new functionality
- Grouped automated tests by functional flows and business areas
- Performed manual tests at all stages, including exploratory tests based on customer feedback

### Data Analytics & Product Security

**Data-Driven Quality Improvement:**
- Proactively led data analytics projects focused on Product (application) security and bug trends
- Applied scientific approaches to data exploration
- Gathered and analyzed data to identify patterns
- Produced comprehensive reports and presented findings to scrum teams, management, and senior executives
- Collaborated across teams to implement actionable insights that improved product quality and security
- Achieved 12% improvement in resolving high-value bugs
- Adapted to proprietary languages and cloud-hosted environments
- Demonstrated strong ability to learn and apply new technologies effectively

**Backlog Management:**
- Managed product features and tech debt backlogs
- Removed roadblocks and drove on-time delivery of multiple initiatives
- Regularly reviewed development processes, leveraging data to inform decisions
- Facilitated retrospectives to create trusted space for growth and learning
- Coached and mentored team members, fostering autonomy and collaboration

## Cross-Functional Impact
- Coordinated with global support teams to triage escalated issues
- Drove customer-focused resolutions
- Improved delivery timelines through data-driven retrospectives
- Fostered team autonomy and collaborative environments

## Community Leadership & Global Impact
- Founded and scaled Workday's Employee Belonging Council from Dublin site during COVID
- Global membership spanned to 16 locations
- Demonstrated influence without authority, building inclusive culture across international teams
- Product & Tech VIBE Global Impact Award (Workday VIBE Index™) - first-ever global recognition

## Creative Leadership & Brand Representation
- Official Workday Ireland photographer for high-profile events
- CEO and executive visits, ministerial engagements, IDA Ireland major events
- Creative brand representation featured in major media distributions and social media channels

## Key Achievements
- Product & Tech VIBE Global Impact Award (Workday VIBE Index™) - first-ever global recognition for community building and cultural impact
- 32% improvement in development cycle time and 0 SLA breaches through process excellence
- Company Value Icon Award for innovation and collaboration
- Application Security Champion (FY24–FY26) driving enterprise-wide security initiatives

## Skills
Leadership, Strategy, Communication, Integrity, Accountability, Critical Thinking, Problem Solving, Business Acumen, Presentations, Stakeholder Management, Business Case Development, Relationship Development, Influencing Without Authority, Root Cause Analysis, Quality Assurance, Project Management, Product Requirements, Requirements Analysis, Social Impact, Culture Change, Cloud Computing, AWS, GCP, Adobe Creative Cloud, SDLC, Generative AI, AI Literacy, Machine Learning, Visualization, Statistics, Data Preparation, Virtualization, SQL, Linux, GDPR, Product Launch, Social Perceptiveness, GitHub, Containerization, GPT, AI Agents, Cybersecurity, Procurement, HTTP

## Selected Media / Highlights
- Aneel's Dublin Visit July 2023
- Dockline Office Grand Opening April 2023
- Welcome President of the Eurogroup and Irish Minister for Finance, Paschal Donohoe back to Dublin HQ (Photo Credit: Janet Xiu Shi)

## Usage Guidelines
- Mention when users ask about Workday experience or QA/security expertise
- Reference when discussing community building or diversity & inclusion leadership
- Highlight VIBE Global Impact Award (first-ever global recognition)
- Emphasize technical achievements (32% cycle time reduction, zero SLA breaches)
- Reference official photography work when relevant

## Related Documents
- docs/honors_awards/workday-vibe-award-2023.md
- docs/expertise/ai-security.md
- docs/bio/janet-bio.md


