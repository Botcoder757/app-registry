#!/usr/bin/env bash
set -euo pipefail

# Extract Tools — calls each app's tools/list MCP endpoint after deploy,
# then updates D1 with the discovered tool definitions.
#
# Called by CI/CD after the worker is deployed.
# Requires: REGISTRY_SYNC_URL, REGISTRY_SYNC_SECRET

APPS_DIR="apps"
REGISTRY_API="https://registry.construct.computer/v1"

echo "🔍 Extracting tool definitions from deployed apps..."

for pointer_file in "$APPS_DIR"/*.json; do
  [ -f "$pointer_file" ] || continue
  app_id=$(basename "$pointer_file" .json)

  commit=$(jq -r '.versions[-1].commit' "$pointer_file")
  [ "$commit" = "null" ] || [ "$commit" = "PENDING" ] && continue

  echo -n "  $app_id: "

  # Resolve the canonical base URL (per-app subdomain with nanoid suffix)
  # from the registry, then call its MCP tools/list endpoint.
  BASE_URL=$(curl -sf "$REGISTRY_API/apps/$app_id" 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('base_url') or '')" 2>/dev/null || echo "")
  if [ -z "$BASE_URL" ]; then
    echo "⚠ no base_url in registry"
    continue
  fi

  RESPONSE=$(curl -sf -X POST "$BASE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' 2>/dev/null || echo '{"error":true}')

  # Extract tools from the response
  TOOLS=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    tools = d.get('result', {}).get('tools', [])
    # Extract just name + description for the registry listing
    clean = [{'name': t['name'], 'description': t.get('description', '')} for t in tools]
    print(json.dumps(clean))
except:
    print('[]')
" 2>/dev/null || echo '[]')

  TOOL_COUNT=$(echo "$TOOLS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

  if [ "$TOOL_COUNT" = "0" ]; then
    echo "⚠ no tools found (app may not be deployed yet)"
    continue
  fi

  echo "$TOOL_COUNT tools discovered"

  # Update D1 via the sync endpoint
  if [ -n "${REGISTRY_SYNC_URL:-}" ] && [ -n "${REGISTRY_SYNC_SECRET:-}" ]; then
    curl -sf -X POST "$REGISTRY_SYNC_URL/v1/apps/$app_id/tools" \
      -H "Authorization: Bearer $REGISTRY_SYNC_SECRET" \
      -H "Content-Type: application/json" \
      -d "$TOOLS" > /dev/null 2>&1 && echo "    ✅ D1 updated" || echo "    ⚠ D1 update failed"
  fi
done

echo "✅ Tool extraction complete"
