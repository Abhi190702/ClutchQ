# Optional ClutchQ MCP Plan

MCP is planned as a developer/admin tool only. It is not required for normal ClutchQ users, demo accounts, matchmaking, lobbies, scorecards, or production page loads.

## Proposed Folder

```txt
mcp-server/
├── package.json
├── README.md
└── src/
    ├── index.js
    ├── tools/
    │   ├── getGameplayGraph.js
    │   ├── getLobbyHealth.js
    │   ├── comparePlayers.js
    │   ├── summarizeReports.js
    │   └── getDemoStatus.js
    └── utils/
        └── apiClient.js
```

## Environment

```env
CLUTCHQ_API_URL=http://localhost:5000/api
CLUTCHQ_MCP_TOKEN=
```

Do not commit real tokens. The MCP server should call existing Express endpoints through an admin/dev token and should not connect directly to MongoDB unless that is explicitly documented later.

## Tools

- `get_gameplay_graph`: returns gameplay score, style, strengths, and recommendations for an email or user ID.
- `compare_players`: returns compatibility, shared games, trust, reasons, and warnings.
- `get_lobby_health`: returns members, chemistry, missing roles, and Discord room status.
- `summarize_reports`: returns pending moderation report summary by status.
- `get_demo_status`: confirms demo users, graphs, lobbies, requests, and activity records exist.

## Safety

- Optional only.
- No production user request path depends on MCP.
- No secrets in repo.
- Normal deployment works without this folder.
- If the MCP server is added later, smoke-test it separately from the main MERN app.
