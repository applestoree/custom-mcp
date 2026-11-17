# Dokumentasi MCP di Supabase Edge Functions

Dokumen ini mengumpulkan tautan dokumentasi resmi untuk membangun, menguji, mengamankan, dan melakukan deployment MCP Server pada Supabase Edge Functions. Referensi ini menjadi acuan teknis repository `applestoree/custom-mcp`.

## 1. Dokumentasi utama Supabase

| Topik | URL | Keterangan |
|---|---|---|
| Deploy MCP Servers | https://supabase.com/docs/guides/ai-tools/byo-mcp | Panduan utama membuat MCP Server di Edge Functions, public MCP, MCP dengan autentikasi Supabase OAuth, tools, pengujian, dan deployment. |
| MCP Server dengan mcp-lite | https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite | Alternatif implementasi MCP menggunakan framework mcp-lite. |
| Edge Functions overview | https://supabase.com/docs/guides/functions | Konsep runtime, request lifecycle, secrets, observability, dan penggunaan Edge Functions. |
| Edge Functions quickstart | https://supabase.com/docs/guides/functions/quickstart | Membuat, menjalankan, menguji, dan deploy Edge Function menggunakan Supabase CLI. |
| Deploy Edge Functions | https://supabase.com/docs/guides/functions/deploy | Langkah deployment function ke project Supabase. |

## 2. MCP TypeScript SDK dan protokol

| Topik | URL | Keterangan |
|---|---|---|
| MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | Repository SDK TypeScript resmi untuk membangun MCP Server dan Client. |
| SDK v1 documentation | https://ts.sdk.modelcontextprotocol.io/ | Dokumentasi SDK v1.x. Periksa versi paket yang digunakan sebelum mengikuti contoh. |
| Streamable HTTP transport examples | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/streamableHttp.examples.ts | Contoh penggunaan Streamable HTTP, termasuk pola stateless dengan Hono. |
| SDK server changelog | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/CHANGELOG.md | Catatan perubahan, perbaikan, dan kompatibilitas lifecycle transport. |
| MCP Specification | https://modelcontextprotocol.io/specification/ | Spesifikasi protokol MCP: lifecycle, messages, tools, resources, prompts, dan transport. |

## 3. Tools pengujian MCP

| Tool | URL | Keterangan |
|---|---|---|
| MCP Inspector | https://github.com/modelcontextprotocol/inspector | UI untuk terhubung ke MCP Server, melihat daftar tools/resources/prompts, dan menguji pemanggilan tool. |

Menjalankan Inspector:

```bash
npx -y @modelcontextprotocol/inspector
```

Pilih transport **Streamable HTTP**, kemudian masukkan URL Edge Function MCP.

## 4. Konsep implementasi yang perlu diperhatikan

### Komponen MCP

- **MCP Server**: instance server yang mendaftarkan kemampuan MCP.
- **Tools**: operasi yang dapat dipanggil MCP Client.
- **Resources**: data atau konteks yang dapat dibaca MCP Client.
- **Prompts**: template prompt yang disediakan server.
- **Transport**: jalur komunikasi client-server; panduan Supabase menggunakan Streamable HTTP.

### Pola stateless pada Edge Functions

Edge Functions berjalan dalam lingkungan stateless. Pada contoh Streamable HTTP stateless, server dan transport dibuat untuk setiap request, lalu server dihubungkan ke transport sebelum request ditangani.

Contoh resmi SDK:
https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/streamableHttp.examples.ts

### Autentikasi dan keamanan

- Contoh public MCP Supabase menonaktifkan verifikasi JWT gateway untuk endpoint tersebut. Ini membuat endpoint dapat dipanggil tanpa autentikasi dan tidak cocok untuk tools yang mengakses data privat tanpa kontrol akses tambahan.
- Untuk server produksi yang membutuhkan identitas pengguna, pelajari bagian authenticated MCP pada panduan Deploy MCP Servers.
- Terapkan autentikasi dan otorisasi sesuai kebutuhan setiap tool.
- Jangan pernah mengekspos Supabase service-role/secret key kepada MCP Client atau frontend.
- Gunakan Supabase secrets untuk kredensial server-side dan terapkan RLS pada akses database yang relevan.

Referensi keamanan Supabase:
https://supabase.com/docs/guides/security

## 5. Catatan untuk repository applestoree/custom-mcp

File MCP yang telah diimpor:

`supabase/functions/chatgpt-image-upload-mcp/index.ts`

File tersebut menggunakan:

- `McpServer` dari `@modelcontextprotocol/sdk`
- `WebStandardStreamableHTTPServerTransport`
- Hono
- Zod
- `Deno.serve()`
- MCP Tools dan Resources
- UI resource dengan MIME type `text/html;profile=mcp-app`

Saat melakukan audit atau perubahan:

1. Cocokkan implementasi dengan panduan Supabase Deploy MCP Servers.
2. Cocokkan transport dan lifecycle dengan dokumentasi serta changelog versi SDK yang benar-benar dipakai.
3. Jangan menganggap contoh SDK versi terbaru otomatis kompatibel dengan dependency `@modelcontextprotocol/sdk@1.25.3` yang ada pada file saat ini.
4. Periksa lifecycle MCP Apps secara terpisah dari lifecycle Streamable HTTP.
5. Audit autentikasi, validasi input, pembatasan akses, penanganan error, dan penggunaan secret.
6. Uji endpoint menggunakan MCP Inspector sebelum menyatakan implementasi siap.
7. Dokumentasikan hasil audit dan perubahan sebelum melakukan deployment.

## 6. Urutan belajar yang disarankan

1. Baca [Deploy MCP Servers](https://supabase.com/docs/guides/ai-tools/byo-mcp).
2. Pelajari [Edge Functions quickstart](https://supabase.com/docs/guides/functions/quickstart) dan [Deploy Edge Functions](https://supabase.com/docs/guides/functions/deploy).
3. Pelajari [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) dan contoh [Streamable HTTP](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/streamableHttp.examples.ts).
4. Pelajari [MCP Specification](https://modelcontextprotocol.io/specification/).
5. Jalankan pengujian melalui [MCP Inspector](https://github.com/modelcontextprotocol/inspector).
6. Lakukan audit terhadap kode di repository ini sebelum perubahan atau deployment.

---

Dokumen referensi ini berisi tautan dan panduan navigasi. Dokumen ini bukan pernyataan bahwa Edge Function telah diuji atau di-deploy.
