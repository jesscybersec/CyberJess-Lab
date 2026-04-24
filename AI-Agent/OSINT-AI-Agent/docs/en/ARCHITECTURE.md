# Architecture

## Overview

The pipeline is designed as a controlled sequence with explicit checkpoints:

```text
Target Input
  -> Scope Validation
  -> Source Family Selection
  -> Collection
  -> Normalization
  -> Correlation
  -> Analyst Review
  -> Report Generation
```

## Stage Details

### 1. Target Input

Supported target families:

- domain
- subdomain
- ip
- organization
- company
- email
- username
- person_name
- phone

### 2. Scope Validation

Before running collection, the pipeline validates:

- passive-only mode or not
- approved source families
- case tags
- output location

### 3. Source Family Selection

Collectors are chosen based on target type.

Examples:

- domain -> Amass, BBOT, theHarvester, SpiderFoot
- username -> social, identity
- person_name -> social, identity, company_registry
- company -> company_registry, domain, social
- phone -> identity

### 4. Collection

Each collector is wrapped behind a dedicated module and stores raw artifacts under `data/raw/`.

### 5. Normalization

All outputs are converted into a shared schema:

- observable type
- value
- source
- timestamp
- confidence
- tags

### 6. Correlation

The system deduplicates and links findings across:

- usernames
- names
- emails
- phones
- companies
- domains
- IPs
- social profiles

### 7. Analyst Review

This is a deliberate pause before final publication.

### 8. Report Generation

The final report should support both French and English output and include:

- executive summary
- collection log
- key findings
- observables
- confidence notes
- limitations

## Design Principles

- traceable sourcing
- separation between collection and interpretation
- persistent intermediate outputs
- low coupling between tool wrappers
- reproducible report generation


