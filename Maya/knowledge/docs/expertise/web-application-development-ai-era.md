# Web Application Development in the AI Era
**Category**: expertise / teaching  
**Priority**: high  
**Last Updated**: February 14, 2026  
**Target Audience**: college and university students at all levels  
**Curriculum Designer and Lecturer**: Janet Xiu Shi

---

## Executive Summary

This document articulates the pedagogical vision, strategic framework, and knowledge architecture for a modern web development course designed for the AI era. The course is built on the foundational principle that web developers in 2026 and beyond must build for a dual audience: human users and AI agents. By integrating AI-first thinking from Day 1, students will learn to create web applications that are not only visually appealing and user-friendly but also semantically rich, machine-readable, and optimized for AI search engines and intelligent agents.

---

## Part 1: The Core Philosophy

### Building for a Dual Audience

The central vision of this course is to cultivate a new generation of web developers who are not just coders, but digital architects. In the modern web (2026 and beyond), content is consumed by two primary audiences: **Humans and Machines**. 

The human audience requires intuitive design, clear presentation, and accessible interfaces. The machine audience includes:
- AI Search Engines (Google SGE, Perplexity)
- AI Agents (ChatGPT, Claude, Manus)
- Large Language Models (LLMs)
- Other automated systems that require structured, semantic, and machine-readable data

Our curriculum is designed to equip students with the skills to build for both audiences simultaneously. Every line of code is a decision that impacts both user experience (UX) and machine interpretability. This dual-focus approach is the key to creating robust, future-proof, and valuable web applications.

**Example**: A well-crafted `<img>` tag with proper alt text serves blind users via screen readers and AI vision models simultaneously. A semantic `<article>` tag helps both human readers navigate content and AI agents understand the document structure for summarization and indexing.

### The Paradigm Shift: From Web Pages to Data Structures

Traditional web development education focuses on creating visually appealing pages for human consumption. However, the rise of AI has fundamentally shifted the value proposition of web content. Modern web pages are not just visual artifacts; they are structured data sources that feed AI systems.

**Key Statistics**:
- According to the 2024 Stack Overflow Developer Survey, 76% of developers are now using or planning to use AI tools in their development process, up from 70% in 2023.
- This trend underscores the importance of building web applications that are optimized for AI consumption from the ground up.

The course emphasizes **Generative Engine Optimization (GEO)**, a new paradigm that extends traditional SEO to optimize content for AI-powered search engines and chatbots. Students will learn that metadata, semantic HTML, and structured data are no longer optional enhancements but essential components of modern web development.

By the end of the course, students will understand that every HTML element they write is a signal to both browsers and bots, and they will have the skills to craft these signals intentionally and strategically.

---

## Part 2: The Knowledge Graph - Three Pillars of Modern Development

Our curriculum is built upon three interconnected pillars that form a holistic understanding of modern web development. These pillars are not taught in isolation; they are woven together throughout the course to create a comprehensive learning experience.

### Pillar 1: The Human Developer (The Creator)

The first pillar focuses on equipping students with the foundational skills and mindset needed to translate ideas into functional, human-centric products. This pillar emphasizes the creative and collaborative aspects of web development, ensuring that students understand the why before diving into the how.

#### Core Competencies:

**Design Thinking and UI/UX Principles**: Students learn to empathize with users, define problems, ideate solutions, and prototype interfaces before writing a single line of code. This human-centric approach ensures that technical skills are always grounded in real-world user needs. The curriculum covers:
- Visual hierarchy, consistency, contrast, proximity, and alignment
- Progressive disclosure and accessibility considerations
- Industry-standard design tools like Figma and Canva
- AI features (like Figma's Auto Layout) that can accelerate workflow

**Version Control and Collaboration with Git**: In the modern development landscape, no developer works in isolation. Students learn the complete Git workflow using GitHub Desktop, a GUI-based approach that makes version control accessible to non-CS students. The curriculum covers the 8-step collaborative journey:
1. Working locally
2. Making commits
3. Pushing to remote repositories
4. Creating pull requests
5. Conducting code reviews
6. Merging changes
7. Resolving merge conflicts
8. Repeating the cycle

**HTML, CSS, and JavaScript Skills**: These are the core languages of the web, and students learn them in a structured, progressive manner:
- **HTML chapter (4 weeks)**: Focuses on semantic structure and AI readability
- **CSS chapter**: Emphasizes responsive design for desktop environments
- **JavaScript chapter**: Introduces interactivity and dynamic content

Throughout all three chapters, students are taught to write clean, maintainable, and future-proof code.

#### AI Era Relevance:

The Human Developer pillar empowers students to translate ideas into functional, human-centric products while understanding how their work will be consumed by AI systems. Students learn that design decisions (like choosing semantic HTML tags) have downstream implications for AI agents. They understand that version control systems like Git are not just for collaboration but also for creating transparent, auditable development histories that AI coding assistants can leverage for context.

### Pillar 2: The AI Agent (The Consumer)

The second pillar focuses on enabling machines to understand, index, and interact with web content. This pillar is the most distinctive aspect of the course, as it explicitly teaches students to think about AI agents as a primary audience for their work.

#### Core Competencies:

**Semantic HTML5**: The foundation of machine-readable web content. Semantic tags like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>` provide meaningful structure that AI agents can parse and understand. Unlike generic `<div>` tags, semantic tags convey the purpose of content, not just its visual layout. Students learn that a `<nav>` tag tells AI agents "this is navigation," enabling better content summarization and extraction.

**Metadata and SEO**: Students learn to craft `<meta>` tags for descriptions, keywords, and social media previews (Open Graph). They understand that these metadata elements control how their content appears in search results and social media feeds, and how AI agents use this metadata to understand page context. Students are introduced to Schema.org structured data, which provides explicit semantic information to search engines and AI systems.

**ARIA (Accessible Rich Internet Applications) Basics**: Introduced to ensure that dynamic web content is accessible to screen readers and other assistive technologies. Students learn that ARIA attributes like `aria-label` and `role` provide additional semantic information that benefits both human users with disabilities and AI agents attempting to understand page structure.

#### AI Era Relevance:

The AI Agent pillar enables machines to understand, index, and interact with content, driving AI SEO (Generative Engine Optimization) and Agent awareness. Students learn that modern web development is not just about rendering pixels on a screen but about creating structured, semantic data that AI systems can consume, analyze, and repurpose. By the end of this pillar, students understand that their HTML is a form of communication with AI agents, and they have the skills to craft this communication intentionally.

### Pillar 3: The Modern Platform (The Environment)

The third pillar ensures that applications are robust, inclusive, and performant across the modern digital ecosystem. This pillar focuses on the technical standards and best practices that define professional web development.

#### Core Competencies:

**Responsive Design Principles**: Students learn to create layouts that adapt to various desktop screen sizes. The curriculum focuses on modern CSS techniques like Flexbox and Grid, which provide powerful layout capabilities without the complexity of older frameworks. Students understand that responsive design is not just about mobile vs. desktop but about creating flexible layouts that work across a spectrum of screen sizes and resolutions.

**Performance Optimization**: Emphasized throughout the course. Students learn to use modern image formats like WebP, which offer superior compression compared to traditional JPG and PNG formats. They learn to specify width and height attributes on images to prevent layout shifts, a key metric in Google's Core Web Vitals. Students understand that performance is not just about speed but about creating a smooth, predictable user experience.

**Accessibility (WCAG 2.2 Level AA)**: Integrated into every lesson. Students learn that accessibility is not an afterthought but a fundamental requirement of modern web development. The curriculum covers:
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation
- Color contrast
- Form labels

Students understand that accessible design benefits everyone, not just users with disabilities, and that many accessibility features (like semantic HTML and alt text) also improve AI agent comprehension.

**Security Basics**: Introduced, including the importance of HTTPS, the dangers of inline JavaScript, and the use of `rel="noopener"` on external links to prevent security vulnerabilities. Students learn that security is an ongoing concern that must be considered at every stage of development.

#### AI Era Relevance:

The Modern Platform pillar ensures applications are robust, inclusive, and performant across the modern digital ecosystem. Students learn that professional web development requires attention to detail across multiple dimensions: performance, accessibility, security, and standards compliance. By mastering this pillar, students create web applications that are not only functional but also professional-grade and future-proof.

---

## Part 3: The Curriculum Roadmap - A Strategic Progression

The 12-week course is structured to build foundational skills first, then layer on complexity, with the AI-first mindset reinforced at every stage. The curriculum follows a deliberate progression that mirrors the professional development workflow: understand the problem, design the solution, build the structure, add the presentation layer, and finally add interactivity.

### Module 1: Foundations (Weeks 1-4)
**Focus**: Equipping the Human Developer

#### Week 1: Design Thinking & UI/UX Principles
The course begins with design, not code. Students learn the five core UI design principles: visual hierarchy, consistency, contrast, proximity, and alignment. They are introduced to Figma and Canva, learning when to use each tool and how AI features can accelerate their workflow. The week includes a deep dive into pixel education, covering screen resolution, pixel density, and common pixel values.

#### Week 2: File Systems & Terminal Commands
Before students can build web applications, they must understand how computers organize and manage files. This week provides a "crystal clear blueprint" of file structure, directories, folder hierarchies, and file types. Students practice command-line operations on both Windows and Mac operating systems, learning essential commands like `cd`, `pwd`, `ls`, `mkdir`, `cp`, `touch`, `mv`, and `rm`.

#### Week 3: Version Control with Git & GitHub Desktop
Students learn the complete Git workflow using GitHub Desktop, a GUI-based approach that makes version control accessible to non-CS students. The curriculum covers the 8-step collaborative journey: working locally, making commits, pushing to remote repositories, creating pull requests, conducting code reviews, merging changes, resolving merge conflicts, and repeating the cycle.

#### Week 4: Integration & Practice
The final week of Module 1 consolidates learning through hands-on practice and assessment. Students complete a quiz covering design principles, file systems, and Git workflows. They work on a small project that integrates all three skills.

**Outcome**: Students can think like designers and work like professional developers before writing a single line of HTML.

### Module 2: HTML - The Structure (Weeks 5-8)
**Focus**: Bridging the Human Developer and the AI Agent

#### Week 5: HTML Foundations
Students learn the absolute basics of HTML: document structure, text elements, lists, links, and images. The week begins with an introduction to HTML's role in web development, the three layers of the web (HTML for structure, CSS for presentation, JavaScript for behavior), and the anatomy of an HTML tag. Students set up VSCode and create their first HTML file. They learn the HTML5 boilerplate, the purpose of `<!DOCTYPE html>`, and the structure of `<html>`, `<head>`, and `<body>` tags.

**Labs**:
- Lab 1: Builds a basic personal introduction page
- Lab 2: Enhances it with multimedia and AI-optimized metadata
- Lab 3: Creates a professional profile with nested lists, definition lists, and pure HTML interactivity using `<details>` and `<summary>` tags

#### Week 6: Forms & User Input
Students learn to create interactive forms using HTML5 input types and built-in validation. The curriculum covers form structure, input types (text, email, tel, number, date, etc.), labels, fieldsets, and the required attribute. Students understand that forms are the primary mechanism for user input on the web and that proper form design is essential for both user experience and accessibility.

#### Week 7: Semantic HTML5 & Multimedia
This week introduces the semantic HTML5 elements that revolutionized web development: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>`. Students learn that these tags provide meaningful structure that benefits both human users (via screen readers) and AI agents (via semantic parsing). The curriculum covers multimedia elements like `<video>` and `<audio>`, teaching students how to embed native media without relying on third-party plugins. Students learn about the `<figure>` and `<figcaption>` tags for semantic media presentation.

#### Week 8: Modern Features & Integration
The final week of Module 2 introduces cutting-edge HTML5 features like `<dialog>` for native modals and the `popover` attribute for tooltips and menus. Students learn ARIA basics for enhancing accessibility in dynamic content. The week culminates in a final project where students build a complete multi-page portfolio website (Home, About, Projects, Contact) that demonstrates mastery of semantic HTML, accessibility, and AI optimization.

**Outcome**: Students can build a well-structured, accessible, and machine-readable website. They understand that HTML is not just for browsers but for bots.

### Module 3: CSS & JavaScript - Presentation & Behavior (Weeks 9-12)
**Focus**: Connecting all three pillars to create a polished product for the Modern Platform

#### Weeks 9-10: CSS Foundations & Responsive Design
Students learn to style the semantic structure built in Module 2. The curriculum covers CSS selectors, the box model, typography, color theory, and layout techniques (Flexbox and Grid). Students learn responsive design principles, creating layouts that adapt to various desktop screen sizes using media queries and flexible units. The focus is on modern CSS techniques that provide powerful layout capabilities without the complexity of older frameworks.

#### Weeks 11-12: JavaScript Fundamentals & Interactivity
Students learn the basics of JavaScript, the language that brings web pages to life. The curriculum covers variables, data types, functions, events, and DOM manipulation. Students learn to add interactivity to their web applications, such as form validation, dynamic content updates, and user-triggered animations. The focus is on practical, real-world JavaScript that enhances user experience without compromising accessibility or performance.

**Outcome**: Students can create beautiful, interactive, and responsive web applications that are built on an AI-friendly foundation.

---

## Part 4: AI-First Pedagogy in Practice

The "AI Era" theme is not an afterthought; it is an integral part of every lecture and lab. The course employs several pedagogical strategies to ensure that AI-first thinking is embedded throughout the learning experience.

### Dedicated "AI Trend" Slides

Every theory section includes a dedicated slide explaining how the topic relates to modern AI. For example:
- In the HTML Foundations section, students learn "How LLMs Read Semantic Structure," understanding that AI agents parse HTML documents to extract meaning and context.
- In the Links and Images section, students learn about "Computer Vision & Alt Text," discovering how AI vision models like GPT-4 Vision process images and why descriptive alt text is essential for both accessibility and AI comprehension.

These AI Trend slides are supported by credible sources (Stack Overflow surveys, W3C standards, Google Search Central documentation) cited in the slide notes, ensuring that students understand the real-world relevance of these concepts.

### AI-Optimized Labs

Labs are designed to build in best practices from Day 1. For example:
- Lab 2 (Enhanced Intro Page) explicitly adds `<meta name="description">` and Open Graph tags for AI SEO.
- Lab 3 (Professional Profile) includes a dedicated "AI Insight" slide explaining how code comments help AI coding assistants like GitHub Copilot understand project structure and generate better code suggestions.

By integrating AI optimization into hands-on exercises, students develop muscle memory for writing AI-friendly code.

### Teaching "Why," Not Just "What"

The course emphasizes understanding over memorization. Students don't just learn what a `<nav>` tag is; they learn why it's better than `<div class="nav">` for screen readers and AI agents. They understand that semantic HTML provides meaningful structure that benefits both human users and machine consumers. This "why-first" approach cultivates critical thinking and prepares students to adapt to future changes in web standards and AI capabilities.

### Critical Thinking Over Generation

Students are taught the fundamentals so they can effectively critique and manage AI-generated code, rather than blindly trusting it. The curriculum includes exercises where students analyze AI-generated HTML, identifying semantic errors, accessibility issues, and performance problems. Students learn that AI tools are powerful assistants but not infallible oracles. By developing a deep understanding of web standards, students become effective managers of AI tools, leveraging their speed and creativity while maintaining quality and best practices.

---

## Part 5: Assessment Strategy & Learning Outcomes

### Formative Assessment (Weekly)

Each week includes formative assessments designed to reinforce learning and provide immediate feedback. Week 1-4 includes a 25-question quiz covering design principles, file systems, and Git workflows. The quiz uses a difficulty distribution of 50% easy, 30% easy-medium, and 20% medium questions, ensuring that it is accessible to non-CS students while still challenging them to think critically.

Weeks 5-8 include weekly lab submissions (Lab 1, Lab 2, Lab 3) that are graded on HTML structure, semantics, accessibility, and organization. These formative assessments account for 40% of the final grade (10% per week for Weeks 5-7, 10% for the Week 1-4 quiz).

### Summative Assessment (Final Project)

Week 8 includes a final project where students build a complete multi-page portfolio website (Home, About, Projects, Contact). This project demonstrates mastery of semantic HTML, accessibility, and AI optimization. The rubric evaluates:
- HTML structure (25%)
- Semantics (20%)
- Accessibility (20%)
- Forms (15%)
- Organization (10%)
- GitHub usage (10%)

This summative assessment accounts for 20% of the final grade. The final project serves as both a learning exercise and a professional portfolio piece that students can showcase to potential employers.

### Learning Outcomes

By the end of this course, students will be able to:

1. Design user-centric interfaces using established UI/UX principles and industry-standard tools (Figma, Canva).
2. Manage projects professionally using Git version control and GitHub Desktop for collaboration.
3. Build semantic, accessible, and AI-optimized web pages using HTML5, demonstrating mastery of 75+ HTML tags.
4. Create responsive layouts using modern CSS techniques (Flexbox, Grid) that adapt to various desktop screen sizes.
5. Add interactivity to web applications using JavaScript, enhancing user experience without compromising accessibility.
6. Optimize content for AI consumption using metadata, semantic HTML, and structured data, understanding the principles of Generative Engine Optimization (GEO).
7. Critique and manage AI-generated code effectively, leveraging AI tools as assistants while maintaining quality and best practices.

These learning outcomes prepare students for entry-level web development roles and provide a foundation for lifelong learning in the rapidly evolving field of web technology.

---

## Part 6: The Future-Proof Mindset

By the end of this course, students will not just be prepared for a job in 2026; they will be equipped with a durable, future-proof mindset that understands the symbiotic relationship between human developers, AI agents, and the web platform itself. They will be the architects of the next-generation web, building applications that serve both human users and AI consumers with equal sophistication.

The course instills a mindset of continuous learning and adaptation. Students understand that web technologies evolve rapidly and that their education is not an endpoint but a beginning. They learn to consult documentation (MDN Web Docs, W3C standards), engage with developer communities (Stack Overflow, GitHub), and stay current with industry trends.

The course emphasizes ethical considerations in web development. Students learn that their code has real-world impact on users, including those with disabilities, those using assistive technologies, and those in regions with limited internet connectivity. They understand that accessibility is not just a legal requirement but a moral imperative. They learn that AI optimization should enhance user experience, not manipulate or deceive users.

Finally, the course cultivates professional pride and craftsmanship. Students learn that web development is not just about writing code that works but about writing code that is elegant, maintainable, and future-proof. They understand that their HTML is a form of communication with both humans and machines, and they take pride in crafting this communication with care and intention.

---

## Conclusion

This course represents a paradigm shift in web development education. By integrating AI-first thinking from Day 1, we prepare students for the realities of modern web development, where content is consumed by both humans and machines. By emphasizing semantic HTML, accessibility, and metadata, we ensure that students build applications that are not only visually appealing but also machine-readable and future-proof. By teaching critical thinking and ethical considerations, we cultivate professional developers who can navigate the rapidly evolving landscape of web technology with confidence and integrity.

**The vision is clear**: to create a new generation of web developers who are digital architects, building the infrastructure of the AI-powered web with skill, intention, and pride.

---

---

## Part 7: The CSS Philosophy: Legacy Literacy and the AI-Era Stack

This section captures Janet's pedagogical position on CSS frameworks, taught in Weeks 11-12 of the course. It is her direct response to the student belief that "AI will write all the CSS, so why learn it?"

### The Creator vs Consumer Distinction

Janet's core argument: AI can generate CSS. It cannot judge whether that CSS is correct, maintainable, semantically sound, or appropriate for the context it is being deployed in. A developer who cannot read and critique CSS output is not a developer who uses AI. They are a developer who is used by AI. The goal of this module is to produce creators: people who direct AI tools with precision, catch errors, and know why a piece of code works or fails.

This is not an anti-AI position. It is a pro-skill position. The more powerful AI tooling becomes, the more valuable the human who can evaluate its output becomes.

### Why Both Frameworks Are Taught

Janet teaches Bootstrap (the legacy web) and Tailwind CSS (the AI-era web) in the same module. This is a deliberate choice grounded in professional reality.

**Bootstrap represents the legacy web.** As of March 2026, Bootstrap holds 74.7% market share among CSS frameworks (W3Techs), with 2.5 million weekly npm downloads and the top position in junior developer job listings. The majority of corporate dashboards, internal tools, and client sites that students will encounter in their first jobs were built with Bootstrap. A developer who cannot navigate a Bootstrap codebase is illiterate in the professional environment they are entering.

**Tailwind CSS represents the AI-era web.** Released in 2019, Tailwind's utility-first approach, where styles are applied directly as atomic classes in HTML rather than in separate stylesheets, aligns naturally with how AI UI generators work. Tools like Vercel's v0.dev and Cursor output Tailwind by default. Tailwind v4 (2025) introduced a pure CSS-first engine, cementing its position as the modern standard. 31.1 million weekly npm downloads and 37% active developer adoption (State of CSS Survey) reflect where the industry is moving.

The concluding principle Janet teaches: **Learn Bootstrap to read yesterday's code. Learn Tailwind to guide AI-built UIs.**

### The Historical Arc: From Dark Ages to AI Era

Janet teaches CSS framework history before students touch any framework code. Understanding why a tool was created is what allows a developer to use it with intention rather than cargo-culting its patterns.

The arc she maps:

**Pre-2011 (The Dark Ages):** No shared grid system. Every developer wrote complex float-based math from scratch for basic layouts. Browser inconsistencies (Internet Explorer vs Firefox vs Chrome) meant the same CSS could produce different results across browsers. Every project reinvented the same solutions.

**2011: Bootstrap 1.0:** Built internally at Twitter by Mark Otto and Jacob Thornton to enforce UI consistency across internal tools. Open-sourced and became the most starred project on GitHub within months. It solved the #1 developer pain point of 2011: browser inconsistency. Write once, trust it looks the same everywhere.

**The Bootstrap Era (2011-2019):** The standardised 12-column grid and pre-built component library (buttons, navbars, modals, cards) democratised interface design. A developer with no design skills could produce a professional-looking interface. The unintended consequence: millions of sites looked identical. "The Bootstrap Look" became a cliché. Overriding Bootstrap's defaults to create a custom design became a heavy burden. Developers were fighting the framework.

**2015: Flexbox lands in browsers.** 2017: CSS Grid standardised. The platform itself was catching up, reducing Bootstrap's layout advantage.

**2019: Tailwind CSS 1.0:** Adam Wathan rejected the entire premise of Bootstrap. Instead of pre-built semantic components (`.card`, `.btn`), Tailwind gives developers atomic utility classes (`bg-white`, `p-6`, `rounded-lg`). Style is applied directly in HTML. No more fighting the framework. Build exactly what the designer drew, without overrides. Tailwind is a 1-to-1 mapping of CSS properties: `bg-white` = `background-color: white`, so it reinforces CSS knowledge rather than abstracting it away.

**2021: Bootstrap 5 drops jQuery.** 2025: Tailwind v4 with CSS-first engine. Now powering GitHub, Shopify, Vercel, Netflix, and NASA.

### The Modern CSS Stack (Four Layers)

Janet teaches the full ecosystem as a layered model so students understand where each tool sits and why:

| Layer | Role | Examples |
|---|---|---|
| Layer 4: AI UI Generators | The Output: tools that write the code for you | v0.dev, Cursor |
| Layer 3: Copy-Paste Components | The Design: pre-built UI blocks | DaisyUI, shadcn/ui |
| Layer 2: Headless Accessibility | The Behaviour: unstyled keyboard nav, focus, screen readers | Radix, Headless UI |
| Layer 1: The Styling Engine | The Foundation: utility classes that power everything above | Tailwind CSS |

Understanding this stack means a student can look at any modern web project and know what each dependency is doing and why. It also means they can evaluate AI-generated code against this architecture and identify when something is missing or misplaced.

### The Dual-Framework Lab

The Weeks 11-12 lab puts students in two real professional scenarios back to back:

**Lab 1: Bootstrap Assembly:** Students are a junior developer joining a corporate team that already uses Bootstrap. The layout is already built. Their job is to navigate the existing component system, replace placeholder content, and change button styles using their cheat sheet, without breaking the grid. The goal is reading and navigating legacy code, not writing from scratch. This mirrors what most first jobs actually involve.

**Lab 2: Tailwind Theming:** Students are launching a new startup. They have a basic landing page and need to apply their brand using Tailwind utility classes. Every class change is a direct CSS property change. The goal is experiencing how utility-first CSS allows precise, no-override design control, which is the same control that AI UI generators leverage.

Labs conclude with a structured peer review: students swap screens, identify which Tailwind classes produced a specific visual element on their peer's page, check their guess against the code, and then reflect on three questions: what was easier in Tailwind, what was harder, and which framework they would choose for their own startup.

### Usage Guidelines for This Section

- Use the creator vs consumer framing when a user or student argues that AI makes CSS fundamentals irrelevant
- Reference the Bootstrap market share data (74.7%, March 2026) when discussing why legacy literacy matters professionally
- Use the four-layer stack diagram when someone asks how modern CSS tooling fits together
- Cite the historical arc when explaining why Tailwind was designed the way it was
- Reference the dual-framework lab design when discussing Janet's hands-on teaching approach

---

## Related Documents
- `docs/experience/iadt.md` - Full IADT teaching experience across all three modules
- `docs/expertise/ai-security.md` - AI security expertise
- `docs/expertise/digital-transformation.md` - Digital transformation expertise

## Usage Guidelines
- Reference when discussing Janet's teaching expertise and curriculum design
- Mention when users ask about web development education or AI-first pedagogy
- Highlight the dual-audience approach (humans and AI agents)
- Emphasise the integration of AI-first thinking throughout the curriculum
- Use Part 7 specifically when the conversation is about CSS, frameworks, legacy code, or the "why learn fundamentals" question
