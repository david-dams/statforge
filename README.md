# StatForge

A lightweight solution for creating interactive Single Page Applications (SPAs), designed primarily for building cross-device, ruleset-agnostic tabletop role-playing game (TRPG) character sheets.

## Motivation

With the vast array of TRPG systems available, players need a simple and adaptable tool for managing characters across different games and rulesets. **StatForge** aims to address this by offering a flexible, lightweight approach to character management.

## How It Works

StatForge generates interactive character sheets from TRPG rules defined in a JSON-based domain-specific language (DSL), following three core steps:

1. Define TRPG rules using a JSON-based DSL.
2. Convert these rules into an interactive character sheet.
3. Create, download, and manage character sheets easily.

All of this functionality is contained within a *single HTML page*, with no external dependencies required.

## Rules Format

StatForge's approach is inspired by [Entity-Component-Systems (ECS)](https://en.wikipedia.org/wiki/Entity_component_system). A nested dictionary structure represents all character attributes. Derived attributes (for example, if dexterity is dependent on strength) are computed using expressions within the DSL. Currently, most expressions are executed as plain JavaScript.

For a basic demonstration of this structure, see this [example JSON file](./example.json).

## Roadmap / TODO

- [ ] Improve layout and design.
- [ ] Replace the current `eval`-based DSL for enhanced security and performance.
