# Skill: Code Testability Audit & Refactor

## Goal

Analyze a given code file and:

1. Evaluate testability
2. Identify architectural problems
3. Suggest concrete refactoring
4. Generate improved version of the code
5. Suggest unit tests

---

## Project Context

Stack:

- Fastify
- Prisma
- Supabase Auth
- Zod
- TypeScript

Architecture:

Route → Controller → Service → Repository

Rules:

- Controllers must not access Prisma
- Business logic must live in services
- Database access only in repositories
- All inputs must be validated with Zod

---

## Input

A single file or code snippet.

---

## Step 1 — Structural Analysis

Identify:

- Layer (route, controller, service, repository)
- Responsibilities
- Violations of architecture

---

## Step 2 — Testability Score (0–10)

Evaluate:

### 1. Modularity (0–2)

Is logic separated into small functions?

### 2. Dependency Control (0–2)

Are dependencies injected or hardcoded?

### 3. Side Effects (0–2)

Does code depend on external state (DB, globals)?

### 4. Input Validation (0–2)

Is Zod or validation used?

### 5. Isolation (0–2)

Can this be unit tested without DB?

---

## Step 3 — Identify Problems

List clearly:

- Tight coupling
- Direct Prisma usage outside repository
- Missing validation
- Hardcoded values
- Hidden side effects

---

## Step 4 — Refactor Plan

Provide actionable improvements:

- Extract functions
- Move logic to service
- Introduce dependency injection
- Create schema validation
- Separate concerns

Explain WHY each change improves testability.

---

## Step 5 — Refactored Code

Generate improved version of the code following:

- Clean architecture
- Separation of concerns
- Testable design
- Project standards

---

## Step 6 — Unit Test Suggestions

Generate:

- Test cases (list)
- Example using Vitest

Example:

- should create trip successfully
- should fail with invalid input
- should handle repository error

---

## Step 7 — Output Format

Return:

1. Testability Score
2. Problems List
3. Refactor Plan
4. Refactored Code
5. Suggested Tests

---

## Important Rules

- Be practical, not theoretical
- Prefer simple refactors
- Avoid over-engineering
- Focus on backend real-world usage
