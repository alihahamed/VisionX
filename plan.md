Proof of Thinking
Product Requirements Document (PRD)
Version: 1.0 (Initial Draft)
Status: Concept / Hackathon Scope
Target Audience: Product Engineering, Data Science, and Design Teams
1. Executive Summary & Vision
In a rapidly evolving technological landscape where Generative AI can produce code, essays, and
polished outputs instantly, the traditional metrics of productivity—lines of code, word counts, or
hours logged—have lost their fidelity. Thinking, problem-solving, and decision-making are
rapidly becoming the only meaningful signals of human contribution.

"There is no reliable way to measure who actually shaped a project’s
direction. Proof of Thinking makes those invisible signals visible."
1.1 Product Vision
The vision for Proof of Thinking is to build a definitive platform that reconstructs the evolution of a

project to identify and highlight meaningful contributions based on decision impact rather than
sheer volume of output. By parsing historical artifacts (such as Git commits, pull requests, and
project histories), the platform infers the narrative of a project's creation and surfaces the true
architects of its success.

2. Problem Statement & Market Context
Generative AI has democratized output creation, making it trivial to produce highly polished work.
This introduces a critical evaluation problem across multiple domains:

Homogenization of Effort: Contributors who deeply understand the project architecture and
those who rely heavily on AI to generate boilerplate appear nearly identical on paper.
Unfair Evaluation: Group work evaluation relies on flawed peer reviews or simplistic activity
tracking (e.g., number of commits), which fails to capture leadership or architectural pivoting.
Loss of Signal: Leadership, critical thinking, unblocking stalled progress, and vital decision-
making are qualitative events that are not captured by quantitative tracking tools.
•
•
•
The Core Problem
Existing collaboration and evaluation tools measure activity (how much was done), but they
entirely fail to measure impact (how it shaped the outcome). Proof of Thinking bridges this
gap.
2.1 Target Audience & Personas
Persona Pain Point Desired Outcome (Value
Proposition)
Student
Contributor
Group projects suffer from "free-rider"
problems; true effort goes
unrecognized.
Verifiable proof of their specific
architectural contributions and
problem-solving skills for
placements.
Team Lead /
Senior Dev
Carries the mental load of architectural
decisions, unblocks peers, but may
write fewer raw lines of code.
A platform that visualizes their
influence map—showing how their
core ideas propagated through the
team.
Professor /
Evaluator
Lacks visibility into team dynamics and
relies on biased self-reporting for
grading.
Automated, objective narratives and
timelines detailing exactly who drove
the project forward.
Recruiter
(Future Phase)
Cannot distinguish between an AI-
generated portfolio and a candidate
with genuine deep engineering
experience.
A trusted, verifiable "Contribution
Profile" that proves candidate
competency and critical thinking.
3. Core Mechanics & Principles
3.1 Key Principles
Impact over activity: 10 lines of code that fix a core architectural flaw are worth more than
1,000 lines of AI-generated boilerplate.
•
Inference over tracking: No invasive spyware or mandatory logging. The system relies
entirely on analyzing digital exhaust (existing repository data and artifacts).
Narrative over scoring: Avoiding opaque, arbitrary numeric scores (e.g., "You are an 8.5/
contributor"). Instead, output human-readable narratives.
Transparency over black-box AI: The user must understand why a decision was attributed to
them.
3.2 Core Concepts Defined
To standardize the engine's functionality, we define the following platform primitives:

Decision Moment: A measurable point in time where the project's trajectory shifts. Examples
include:
Introduction of a novel approach or architecture.
Identification and correction of a fundamental flaw.
Resolution of an ambiguous team debate.
A commit that unblocks stalled team progress.
Influence: The metric of impact. If Contributor A creates a module, and Contributors B and C
subsequently build features extending that module, Contributor A's influence propagates
through the project graph.
4. Functional Requirements (Scope)
4.1 Data Ingestion Engine
The system must accept raw project data to begin analysis.

Inputs: GitHub repository URL, uploaded `.git` files, or raw JSON project histories.
Parsing: Extract commit messages, file diffs, timestamps, and author metadata.
Constraint: The initial MVP will focus exclusively on Git version control data.
• • • • • • • • • •
4.2 Change Analysis & Decision Detection Engine
This is the core analytical brain of the platform. It must process diffs to categorize changes
semantically.

Categorization: The engine must tag commits as: Feature Gen , Refactor , Bug Fix , or
Architecture.
Decision Pattern Recognition: Detect specific events, such as:
Convergence: Resolving conflicting files/approaches into a unified module.
Unblocking: A highly active period from multiple users immediately following a specific,
complex commit by one user.
Replacement: Wholesale deprecation of an existing logic flow in favor of a new one.
4.3 Influence Mapping (The Graph)
The system must generate a directed acyclic graph (DAG) representing the flow of ideas.

Map dependencies between code changes (e.g., User A creates `auth.py`, User B imports it in
`routes.py`).
Output a quantifiable node-link graph showing who acts as "hubs" (high influence) versus
"spokes" (implementers).
4.4 Narrative Generation & Attribution
Translate the complex data graph into readable summaries using LLMs.

Role Classification: Tag users as Initiator , Implementer , Corrector , or Unblocker.
Summarization: Generate a clear paragraph for each user. E.g., "Alex functioned as the core
Initiator for the backend. Their pivot to WebSockets on Day 2 directly unblocked 4 subsequent
features built by the rest of the team."
• • ◦ ◦ ◦ • • • •
5. User Experience & Interfaces
5.1 User Journey (Hackathon Demo Path)
Onboarding: User accesses the web platform and connects a GitHub repository via OAuth or
public URL.
Processing State: An animated loading screen indicates the system is "Analyzing project
history", "Detecting decision moments", and "Mapping influence".
Dashboard Reveal: The user is presented with the Master Project Dashboard.
5.2 Core UI Views
A. The Timeline View
A horizontal, chronologically sorted visualization. Instead of showing every commit, it only
plots Key Decision Moments. Clicking a node expands the specific diff and explains why it
was flagged as a critical decision.
B. The Influence Graph
A visual web of contributor avatars. Thicker connection lines indicate deeper reliance on
another contributor's code/decisions. Visualizes team dynamics at a glance.
C. Individual Contribution Profiles
A personalized, exportable summary card for each team member. Contains their Role Tag ,
their auto-generated Narrative Paragraph , and highlights of their 3 most impactful decisions.
6. Non-Functional Requirements
Performance: For demo-scale data (e.g., a hackathon project with ~100-500 commits),
analysis, graph generation, and narrative creation must complete in under 15 seconds to
ensure a compelling live demo.
1.
2.
3.
•
Privacy & Security: No raw proprietary code is permanently stored. Only metadata and the
structural AST (Abstract Syntax Tree) hashes are retained for graph rendering. The system
strictly adheres to non-invasive tracking (no IDE plugins watching keystrokes).
Explainability (UX/AI): To build trust, the AI-generated narratives must include citations (e.g.,
"You are tagged as 'Corrector' because of Commits #a1b2c and #f4e5d which rewrote 60% of
the database schema." ).
7. Success Metrics & Mitigations
7.1 Evaluating Success
Category Metric Target / Goal
Technical
Quality
Decision Detection
Accuracy
>80% of human-verified key commits are flagged by
the engine.
User
Sentiment Perceived Fairness
Users surveyed agree the narrative accurately
reflects their actual effort.
Viral Loop Profile Sharing Rate Percentage of users who export/share their
generated Contribution Profile.
7.2 Risks & Mitigations
Risk: Misattribution of Impact. The engine might misinterpret a massive auto-generated file
dump as a "major architectural decision."
Mitigation: Filter out bulk inserts, package-lock files, and utilize semantic chunking. Provide
users an interface to dispute or manually adjust the confidence scoring of a decision.
Risk: Incomplete Visibility. A lot of thinking happens in voice calls or on whiteboards, which
Git cannot capture.
Mitigation: Product copy must heavily frame the platform as an "approximation based on
artifacts" rather than the absolute, objective truth.
•
•
•
•
8. Future Scope & Roadmap
While the initial version focuses on retroactive analysis of Git histories for hackathons and
academic settings, the future roadmap includes:

Multi-modal Data Ingestion: Integrating with Jira, Linear, Slack, and Discord to analyze
technical debates and ticket resolution as "Decision Moments."
Verification Layer: Utilizing zero-knowledge proofs or cryptographic signing to verify that the
person claiming the "Contribution Profile" genuinely holds the repository credentials.
Recruitment Integrations: API endpoints allowing ATS (Applicant Tracking Systems) to query
a candidate's "Impact Score" based on their public open-source contributions.
•
•
•   