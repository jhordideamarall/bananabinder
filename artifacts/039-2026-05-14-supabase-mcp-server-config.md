# 039 — Supabase MCP Server Config

**Date:** 2026-05-14

## Apa

Mengisi ulang `.mcp.json` dengan konfigurasi Supabase MCP server (project-scoped).

## Di mana

- `.mcp.json`

## Apa yang diubah

File `.mcp.json` sebelumnya kosong di working tree (versi git lama menunjuk ke
`project_ref=kjvnbnwdcyilzqymknxm`). Direstore dengan project ref baru:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=xiumxugolyfsvwnwzenp"
    }
  }
}
```

## Mengapa

User meminta menambahkan Supabase MCP server sesuai instruksi setup Supabase,
menggunakan project ref `xiumxugolyfsvwnwzenp`.

## Catatan

Autentikasi belum dilakukan — jalankan `/mcp`, pilih `supabase`, lalu Authenticate
di terminal biasa (bukan IDE extension).
