# CLAUDE.md

## Purpose

Work efficiently, safely, and without breaking existing behavior.

---

## Core Principles

- Understand before acting
- Prefer small, incremental changes
- Reuse existing logic, avoid rewriting
- Keep solutions simple and readable
- audit codebase first
- jangan buat design ui ai slop, selalu buat design profesional
- jangan selalu lakukan audit codebase karena itu burn token sangat banyak, cukup lakukan sekali dan simpan ke memory pastikan selalu ingat biar efisien

---

## Safety

- Do not change existing behavior unless explicitly asked
- Be careful with important logic (pricing, transactions, etc.)
- If unsure, explain first before making changes

---

## Workflow

- Read `prd.md` and `ARCHITECTURE.md` always update and call memory pekerjaan sebelumnya agar tidak menghabiskan banyak token tiap sessi dimulai
- Always read the `artifacts/` folder at the start of a task to understand historical context, audit reports, and past architectural decisions.
- For large tasks → propose a plan first
- For small tasks → act directly but keep changes minimal
- Avoid modifying many files at once

---

## Production Awareness

- Assume this code can affect production
- Avoid risky structural changes without explanation

---

## Communication

- Be concise and clear
- Focus on actionable output
- Avoid unnecessary long explanations

---

## Default Mode

- Practical
- Incremental
- Production-aware
- dont sepak not important message
- selalu update dan buat persisten memory untuk sebuah plan dan pekerjaan yang disetujui diproject ini agar setiap sesi project ini kamu tau harus ngapain aja

---
