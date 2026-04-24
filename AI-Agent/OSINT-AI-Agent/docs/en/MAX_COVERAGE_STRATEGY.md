# Max Coverage Strategy

## Goal

Use as many relevant OSINT tools as possible without turning the workflow into an unmanageable pile of brittle scripts.

## Principle

Do not treat "more tools" as one flat list.

Instead, structure the project around:

1. Target type
2. Pivot family
3. OPSEC level
4. Output normalization
5. Analyst review

## Source Hubs Used For This Project

This repository should use the following hubs as curation inputs:

- `awesome-osint`: very broad category coverage and a large curated tool/resource index
- `OSINT Framework`: free-first framework with category navigation and tool metadata markers
- `OSINT Resources in Canada` Start.me page: localization-oriented Canada research hub
- `OSINT4ALL` Start.me page: broad multi-topic OSINT hub

## Why These Matter

As of April 23, 2026:

- `awesome-osint` includes a very wide category map covering username checks, people investigations, email search, phone research, company research, domain/IP research, geospatial tools, image/video tooling, and more. Source: [awesome-osint](https://github.com/jivoi/awesome-osint)
- `OSINT Framework` explicitly focuses on free or partially free resources and uses useful markers like local install, Google dork, registration required, and edit-manually URL. Sources: [OSINT Framework site](https://osintframework.com/), [GitHub README](https://github.com/lockfale/osint-framework/blob/master/README.md)
- The Start.me pages you provided are best treated as curated regional/topic hubs inside the project, even though their full contents were not machine-readable in this environment. Sources: [OSINT Resources in Canada](https://start.me/p/aLe0vp/osint-resources-in-canada), [OSINT4ALL](https://start.me/p/L1rEYQ/osint4all)

## Coverage Buckets

### Identity

- username
- alias
- email
- phone
- person name

### Social

- mainstream social networks
- niche communities
- developer platforms
- forums and public discussion

### Corporate

- companies
- business registries
- public filings
- supplier and partner mentions

### Infrastructure

- domains
- subdomains
- IPs
- URLs
- repos and exposed code

### Media and Geospatial

- images
- video
- maps
- geolocation clues
- public records tied to place

## Engineering Approach

The project should maintain three layers:

1. `collector tools`
2. `resource hubs`
3. `profiles`

Collector tools are binaries or APIs we can call directly.

Resource hubs are curated pages we use to decide where to pivot next.

Profiles define which categories to activate for a given investigation type.

## Recommended Next Build Steps

1. Expand the registry in `config/osint_sources_registry.yaml`
2. Add profile-driven collector selection
3. Normalize outputs into confirmed, candidate, and reference-only buckets
4. Add bilingual reporting sections by pivot family
5. Add a Canada-focused profile for location-heavy cases

