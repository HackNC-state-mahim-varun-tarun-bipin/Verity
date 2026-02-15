# Verity
### Real-time fact verification for the copy-paste world

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#quick-start)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![Team](https://img.shields.io/badge/team-Heart__Overflow-purple)](#team-heart_overflow)

Verity is a desktop fact-checking system by **Team Heart_Overflow** that validates copied text against both public and internal sources in near real time.

## Table of Contents
- [Inspiration](#inspiration)
- [What It Does](#what-it-does)
- [How We Built It](#how-we-built-it)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Challenges](#challenges-we-ran-into)
- [Accomplishments](#accomplishments-that-were-proud-of)
- [What We Learned](#what-we-learned)
- [Whats Next](#whats-next-for-verity-by-heart_overflow)
- [Team Heart_Overflow](#team-heart_overflow)
- [License](#license)

## Inspiration
We live in a copy-paste world where claims travel faster than verification. People reuse stats, AI-generated text, tweets, and chat snippets constantly, while manual fact-checking is slow enough that most people skip it.

Inside organizations, this gets riskier: outdated specs, unapproved claims, and misunderstood compliance guidance spread quickly. Verity was built to make truth-checking feel as fast and natural as spell-check.

## What It Does
Verity is platform-agnostic and works from clipboard events, so users do not need app-specific integrations.

It performs **dual-layer fact checking**:
1. **Public RAG layer** checks claims against trusted external sources.
2. **Internal company RAG layer** checks claims against organization-specific policies, product docs, and compliance references.

This allows one statement to be evaluated for both public accuracy and internal correctness.

## How We Built It
- **Desktop client**: Electron
- **Clipboard trigger handling**: OS-level commands (including osascripts)
- **Backend orchestration**: AWS Lambda + Flask
- **AI support**: Backboard.io AI for summarization and citation assistance
- **RAG foundation**: AWS Bedrock knowledge base retrieval for internal truth grounding

## Architecture

### System Diagram

![Verity Architecture](docs/architecture.png)

## Quick Start

```bash
cd HeartOverflowElectron
npm install
npm start
```

## Challenges We Ran Into
- Building a truly platform-agnostic workflow that works consistently across operating systems and applications.
- Ensuring reliable text clipping and clipboard retrieval across environments.
- Architecting backend concurrency to handle parallel verification paths and multiple knowledge-base contexts.

## Accomplishments That We're Proud Of
- Made fact-checking feel natural inside existing workflows rather than forcing users to switch tools.
- Enabled enterprise onboarding by reusing existing knowledge bases instead of requiring retraining from scratch.
- Delivered an end-to-end product under hackathon constraints, not just a prototype.

## What We Learned
- **Concurrency is UX**: Sequential checks were too slow; parallel orchestration significantly improved responsiveness.
- **Truth is contextual**: A claim can conflict with public sources but still be valid in a company-specific policy context.
- **Invisible UX is hardest**: The best experience is verification that appears exactly when needed with minimal user friction.

## What's Next for Verity by Heart_Overflow
- Continuous monitoring to proactively flag risky content and suspicious links.
- Security-focused controls for enterprise deployments.
- Expansion into a developer-assistant mode for repository and workflow context retrieval.

## Team Heart_Overflow

Verity is built by Team Heart_Overflow for a Master's-level hackathon, focused on practical real-time truth verification across everyday tools.

## License

MIT
