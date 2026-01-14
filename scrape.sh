#!/bin/bash

# Run the 4-phase data pipeline
echo "Starting Phase 1: Fetching HN Metadata..."
npm run phase1

echo "Starting Phase 2: Downloading Link Content..."
npm run phase2

echo "Starting Phase 3: Extracting Metadata..."
npm run phase3

echo "Starting Phase 4: LLM-based Classification..."
npm run phase4

echo "Pipeline complete!"
