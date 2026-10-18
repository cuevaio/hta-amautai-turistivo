# Amautai

Multilingual mathematics learning and lesson planning for primary education in Peru.

## Problem

Primary-school teachers and families need practical ways to support children who struggle with mathematics, including understanding what a problem asks. Amautai aims to connect classroom planning and practice at home while taking language and regional context into account.

## Who it is for

- Primary-school teachers preparing mathematics lessons and supporting their students.
- Parents and guardians helping children practice mathematics at home.

The product targets primary education. The current lesson-planning demo focuses on Grade 2.

## How it works

The documented public demo supports teacher onboarding and saved Grade 2 mathematics session drafts. Teachers enter their classroom context, select competencies and capacities from a versioned catalogue based on Peru's national curriculum, and organize the lesson purpose, situation, timing, and teaching moment. Drafts can be edited and reopened later.

The repository also implements five mathematics games covering multiplication, addition and subtraction, units and tens, equality, and geometry. Teacher rooms record participant scores, while family practice supports child aliases and resumable sessions. A further implemented workflow assigns a game through a guardian's WhatsApp number and returns student progress to the teacher; its production release and delivery still require verification.

The interface supports Spanish, Chanka Quechua, and Peruvian Aymara. React and TypeScript power the interface; Hono, Cloudflare Workers, and D1 handle the API and persistence, with WorkOS authentication and shared Zod validation.

## Problem discovery

An October 18, 2026 survey snapshot contains 28 teacher responses and 56 family responses. Of the teachers, 18 of 28 reported students frequently or always needing additional mathematics help during the previous four weeks. Of the families, 33 of 56 reported children needing help sometimes, frequently, or always.

These convenience samples describe the respondents' experiences. They do not establish product adoption, demand for games or multilingual features, or improved learning outcomes.

## Current limitations

- Lesson planning currently supports Grade 2 mathematics only.
- Learning gains and sustained use by external users have not been measured.

## Submission links

- [Live application](https://amautai.turistivo.com/)
- [Presentation](https://docs.google.com/presentation/d/1TMAc5OI7j3k6nmsJtoPF6GwafxPQO7O2moXpUfIuFiM/edit?usp=sharing)
- [GitHub repository](https://github.com/turistivo/amautai)
