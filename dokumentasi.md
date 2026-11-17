# Dokumentasi ChatGPT MCP Server — Supabase Edge Functions

Dokumentasi ini menjadi acuan teknis repository `applestoree/custom-mcp` untuk membangun, menguji, mengamankan, dan menghubungkan MCP Server ke ChatGPT. Dokumentasi OpenAI dan Supabase dipertahankan sebagai sumber utama. Selalu periksa halaman resmi terbaru sebelum mengubah implementasi karena dukungan ChatGPT, MCP, dan SDK dapat berubah.

> **Status proyek:** file ini adalah dokumentasi referensi. Keberadaan tautan atau checklist di sini tidak membuktikan server sudah kompatibel, diuji, atau di-deploy ke ChatGPT.

## 1. Arsitektur target

```text
ChatGPT (MCP client / Apps host)
        |
        | HTTPS + MCP (Streamable HTTP)
        | Authentication sesuai konfigurasi server
        v
Supabase Edge Function (MCP server)
        |
        +-- MCP tools
        +-- MCP resources
        +-- MCP Apps UI resource (opsional)
        |
        v
Supabase Storage + Database
```

Prinsip arsitektur:

- ChatGPT menjadi client dan host aplikasi; MCP Server menyediakan tools/resources dan, bila diperlukan, UI.
- Supabase Edge Function menjalankan server-side logic. Jangan menaruh secret Supabase di UI atau mengirimkannya ke ChatGPT.
- MCP Apps UI bersifat opsional. Setiap tool tetap harus menghasilkan hasil yang bermakna walaupun UI tidak dirender.
- Jangan menyamakan keberhasilan deploy Edge Function dengan keberhasilan koneksi ChatGPT. Keduanya perlu diuji terpisah.

## 2. Dokumentasi resmi OpenAI — integrasi ChatGPT

| Topik | Dokumentasi resmi | Kegunaan |
|---|---|---|
| Menghubungkan custom MCP server | https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt | Persyaratan akun/workspace, menambahkan endpoint HTTPS, autentikasi, pemindaian tools, dan pengelolaan koneksi. |
| Developer mode dan full MCP | https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta | Ketersediaan developer mode, izin workspace, dan dukungan tindakan MCP. Periksa status rollout terbaru. |
| Build with Apps SDK | https://help.openai.com/en/articles/12515353-building-with-the-apps-sdk | Gambaran Apps SDK, pengembangan, pengujian, dan persiapan aplikasi ChatGPT. |
| MCP server and UI quickstart | https://developers.openai.com/plugins/build/app-quickstart | Tutorial resmi membuat MCP server untuk ChatGPT, endpoint `/mcp`, tools, UI opsional, pengujian lokal, dan koneksi ChatGPT. |
| Add UI to your MCP server | https://developers.openai.com/plugins/build/chatgpt-ui | Integrasi UI melalui MCP Apps, resource UI, host bridge, dan ekstensi khusus ChatGPT. |
| Authentication | https://developers.openai.com/plugins/build/auth | Pola autentikasi server MCP, OAuth 2.1, authorization server, dan resource server. |
| Apps SDK documentation | https://developers.openai.com/apps-sdk | Dokumentasi utama Apps SDK dan pengembangan aplikasi ChatGPT. |
| Apps SDK examples | https://github.com/openai/openai-apps-sdk-examples | Contoh implementasi aplikasi dan UI. |
| MCP Apps specification | https://modelcontextprotocol.io/docs/extensions/apps | Standar terbuka untuk menghubungkan tool MCP dengan UI interaktif. |

### 2.1 Ketersediaan dan izin ChatGPT

- Kemampuan membuat, menguji, dan menggunakan custom MCP apps bergantung pada paket ChatGPT, konfigurasi workspace, peran pengguna, dan rollout fitur.
- Dokumentasi OpenAI menyatakan dukungan penuh MCP termasuk write/modify actions tersedia untuk Business dan Enterprise/Edu dalam rollout/beta; Pro memiliki batasan tertentu pada read/fetch. Periksa artikel resmi terbaru sebelum menetapkan target akun.
- Pada workspace Business, pembuatan/publikasi aplikasi custom dibatasi untuk admin/pemilik sesuai kebijakan workspace.
- Pada Enterprise/Edu, admin dapat mengatur izin melalui role-based access control (RBAC).
- Jangan menjanjikan bahwa semua akun ChatGPT dapat menjalankan semua tools atau write actions.

Referensi: [Connecting custom MCP servers](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt) dan [Developer mode and full MCP](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta).

### 2.2 Proses menghubungkan server ke ChatGPT

Ikuti antarmuka ChatGPT yang tersedia pada akun/workspace saat pengujian. Alur umum menurut dokumentasi OpenAI:

1. Pastikan MCP Server tersedia melalui endpoint HTTPS yang dapat dijangkau ChatGPT.
2. Buka menu pengelolaan Plugins/Apps yang tersedia pada workspace.
3. Pilih opsi untuk menambahkan custom MCP server/app.
4. Masukkan nama, deskripsi, dan URL endpoint MCP.
5. Konfigurasikan metode autentikasi yang didukung server.
6. Tinjau peringatan risiko dan konfirmasi pembuatan koneksi.
7. Jalankan pemindaian/discovery tools dan periksa nama, deskripsi, schema input, serta metadata tools.
8. Uji tools dari percakapan ChatGPT dan periksa hasilnya.
9. Setelah perubahan tools atau metadata server, refresh/reconnect aplikasi sesuai petunjuk antarmuka ChatGPT.

**Penting:** dokumentasi OpenAI quickstart menggunakan contoh endpoint berakhiran `/mcp`. Itu bukan berarti URL Supabase Function pada repository ini otomatis memiliki path tersebut. Pastikan URL aktual dan routing function cocok sebelum memasukkannya ke ChatGPT.

## 3. Dokumentasi resmi Supabase — MCP dan Edge Functions

Referensi Supabase yang sudah ada dipertahankan:

| Topik | URL | Keterangan |
|---|---|---|
| Deploy MCP Servers | https://supabase.com/docs/guides/ai-tools/byo-mcp | Panduan utama membuat MCP Server di Edge Functions, public MCP, authenticated MCP, pengujian, dan deployment. |
| MCP Server dengan mcp-lite | https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite | Alternatif implementasi MCP menggunakan mcp-lite. |
| Edge Functions overview | https://supabase.com/docs/guides/functions | Runtime, request lifecycle, secrets, observability, dan Edge Functions. |
| Edge Functions quickstart | https://supabase.com/docs/guides/functions/quickstart | Membuat, menjalankan, menguji, dan deploy Edge Function. |
| Deploy Edge Functions | https://supabase.com/docs/guides/functions/deploy | Langkah deployment function ke project Supabase. |
| Supabase Security | https://supabase.com/docs/guides/security | Panduan keamanan Supabase. |
| Supabase Changelog | https://supabase.com/changelog.md | Periksa perubahan/breaking changes sebelum implementasi Supabase. |

### 3.1 Pola MCP pada Edge Functions

- Edge Functions berjalan dalam lingkungan stateless.
- Untuk pola Streamable HTTP stateless, buat instance server dan transport sesuai lifecycle request; jangan menggunakan ulang transport yang sudah terhubung.
- Supabase menyediakan panduan MCP server menggunakan SDK MCP TypeScript dan pola handler stateless.
- Pastikan request HTTP, method, header, session behavior, CORS, dan response sesuai protokol serta dukungan client.
- Jangan mengasumsikan semua contoh dari SDK versi terbaru cocok dengan dependency versi lama yang dipasang di repository.

### 3.2 URL dan routing

Ada dua konsep endpoint yang harus dibedakan:

- **Path MCP yang diharapkan client:** contoh OpenAI quickstart memakai `/mcp`.
- **URL deployment Supabase:** umumnya berbentuk `https://<project-ref>.supabase.co/functions/v1/<function-name>`.

Jika function menggunakan route internal tertentu, pastikan URL yang diberikan ke ChatGPT benar-benar mencapai handler MCP. Bila diperlukan path `/mcp`, implementasikan routing atau konfigurasi deployment yang sesuai dan verifikasi dengan request nyata. Jangan menambahkan suffix `/mcp` secara asumtif.

## 4. MCP Protocol, transport, dan lifecycle

| Topik | URL | Keterangan |
|---|---|---|
| MCP Specification | https://modelcontextprotocol.io/specification/ | Spesifikasi protokol MCP, lifecycle, messages, tools, resources, prompts, dan transport. |
| MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | SDK TypeScript resmi. |
| SDK v1 documentation | https://ts.sdk.modelcontextprotocol.io/ | Dokumentasi SDK v1.x. |
| Streamable HTTP examples | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/streamableHttp.examples.ts | Contoh transport Streamable HTTP. |
| SDK server changelog | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/CHANGELOG.md | Perubahan dan catatan kompatibilitas lifecycle transport. |

Checklist protokol:

- MCP initialization dan capability negotiation.
- Discovery tools/resources/prompts yang memang disediakan.
- Pemanggilan tools dan validasi input.
- Penanganan JSON-RPC error dan HTTP error.
- Streamable HTTP sesuai spesifikasi dan kompatibilitas client.
- Session handling yang konsisten dengan mode stateless/stateful yang dipilih.
- Timeout, request cancellation, dan error handling.
- Tidak menggunakan ulang instance transport yang tidak boleh digunakan ulang.

### 4.1 Versi SDK repository

Source function yang diimpor sebelumnya menggunakan dependency:

```ts
@modelcontextprotocol/sdk@1.25.3
```

Saat audit:

1. Verifikasi versi aktual di source dan lockfile/config dependency.
2. Gunakan dokumentasi dan API yang cocok dengan versi tersebut.
3. Jangan menyalin contoh SDK v2/main branch tanpa memeriksa breaking changes.
4. Catat versi SDK, runtime Deno, dan dependency terkait pada hasil audit.

## 5. Authentication dan authorization

Referensi utama:

- OpenAI: https://developers.openai.com/plugins/build/auth
- OpenAI: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- MCP Authorization: https://modelcontextprotocol.io/specification/draft/basic/authorization
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase MCP guide: https://supabase.com/docs/guides/ai-tools/byo-mcp

Ketentuan:

- Server tanpa autentikasi hanya boleh digunakan jika semua data dan operasi yang diekspos memang aman untuk akses publik.
- Untuk data privat dan write actions, autentikasi serta otorisasi per pengguna wajib dirancang.
- Jika menggunakan OAuth, implementasikan alur yang sesuai dengan kontrak OAuth/MCP yang didukung ChatGPT, termasuk metadata discovery dan refresh token bila diperlukan.
- Validasi token di server pada setiap request; jangan hanya mengandalkan UI atau parameter dari client.
- Otorisasi setiap tool berdasarkan identitas dan hak akses pengguna.
- Jangan menganggap Supabase JWT gateway dan OAuth ChatGPT adalah mekanisme yang sama atau otomatis saling kompatibel.
- Jangan menonaktifkan verifikasi JWT gateway sebelum memahami konsekuensi keamanan dan menyediakan kontrol akses pengganti.
- Jangan pernah mengekspos Supabase service-role/secret key kepada ChatGPT, MCP client, atau browser.

## 6. MCP Tools, Resources, dan hasil

Setiap tool perlu memiliki:

- Nama stabil dan deskripsi yang jelas untuk model.
- Input schema yang eksplisit dan tervalidasi.
- Output yang ringkas, terstruktur, dan menyertakan informasi error yang dapat ditindaklanjuti.
- Otorisasi server-side sesuai dampak operasi.
- Perilaku aman terhadap input tidak valid, duplikasi, retry, dan kegagalan backend.

Untuk tools yang mengubah data:

- Gunakan konfirmasi pengguna untuk tindakan penting atau destruktif bila sesuai konteks.
- Jangan menganggap tool call sebagai bukti tindakan berhasil; hasil harus berasal dari backend.
- Terapkan validasi, pembatasan akses, dan audit log sesuai kebutuhan.
- Deep Research dan beberapa mode ChatGPT mungkin hanya mendukung read/fetch; jangan mengasumsikan write tools tersedia di semua surface.

Resources harus memiliki URI, MIME type, dan konten yang sesuai. Hanya daftarkan resource yang memang diperlukan oleh client atau UI.

## 7. MCP Apps UI di ChatGPT

UI bersifat opsional. Untuk UI interaktif, gunakan standar MCP Apps yang didukung ChatGPT.

Referensi:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/build/app-quickstart
- https://modelcontextprotocol.io/docs/extensions/apps
- https://github.com/modelcontextprotocol/ext-apps

Prinsip implementasi:

- Hubungkan tool ke UI resource menggunakan metadata MCP Apps `_meta.ui.resourceUri`.
- Gunakan MCP Apps host bridge melalui JSON-RPC dan `postMessage`, termasuk alur `ui/initialize`, notifikasi, dan pemanggilan tools sesuai spesifikasi.
- Untuk implementasi baru, utamakan API standar MCP Apps. Gunakan `window.openai` hanya untuk kemampuan tambahan khusus ChatGPT yang tidak tersedia dalam standar, dengan feature detection dan fallback.
- UI berjalan dalam iframe/sandbox; jangan menganggapnya memiliki akses langsung ke backend atau environment host.
- Pisahkan tool pengambilan/perubahan data dari tool render UI jika pola tersebut membuat alur lebih stabil.
- Tool harus tetap berguna tanpa UI, karena tidak semua MCP client merender komponen.
- Uji resource URI, MIME type, handshake, bridge messages, error handling, dan tampilan di ChatGPT.

### 7.1 UI resource pada function repository ini

Function yang diimpor sebelumnya mendaftarkan resource:

```text
ui://upload-generated-image/menu-v3.html
```

Resource tersebut menggunakan MIME type `text/html;profile=mcp-app`. Keberadaan URI dan MIME type saja belum membuktikan implementasi mengikuti versi MCP Apps yang kompatibel. Audit metadata tool-resource, handshake, bridge, dan API yang dipakai terhadap dokumentasi MCP Apps/OpenAI terkini.

## 8. Security dan privacy checklist

- Simpan credential di Supabase secrets/environment server-side.
- Jangan mengirim service-role key, access token, atau secret ke UI.
- Terapkan autentikasi dan otorisasi pada setiap tool privat.
- Validasi semua input dengan schema.
- Batasi ukuran file, tipe MIME, dan ukuran payload upload.
- Validasi nama/path file untuk mencegah path traversal dan overwrite tidak sah.
- Terapkan kebijakan akses Storage dan database yang sesuai.
- Jangan mempercayai metadata atau identitas yang dikirim client tanpa verifikasi server.
- Hindari menyimpan data pribadi yang tidak diperlukan.
- Jangan mencatat token, secret, atau konten sensitif dalam log.
- Sediakan penanganan error yang tidak membocorkan detail internal.
- Dokumentasikan data yang dikumpulkan, tujuan pemrosesan, retensi, dan privacy policy bila aplikasi didistribusikan.

Referensi: https://supabase.com/docs/guides/security dan https://developers.openai.com/plugins/build/auth.

## 9. Testing dan verifikasi

### 9.1 MCP Inspector

URL: https://github.com/modelcontextprotocol/inspector

Menjalankan Inspector:

```bash
npx -y @modelcontextprotocol/inspector
```

Pilih transport Streamable HTTP dan masukkan endpoint MCP yang benar-benar berjalan. Uji initialize, discovery, dan setiap tool. Inspector membantu menguji protokol, tetapi tidak menggantikan pengujian langsung di ChatGPT.

### 9.2 Pengujian ChatGPT

Checklist:

1. Endpoint HTTPS dapat dijangkau dari internet atau melalui Secure MCP Tunnel yang didukung.
2. ChatGPT dapat menyelesaikan autentikasi.
3. Tool discovery berhasil dan semua tools memiliki nama/deskripsi/schema yang benar.
4. Tool read menghasilkan data yang benar.
5. Tool write hanya berjalan dengan izin yang tepat dan konfirmasi yang diperlukan.
6. Error dari backend ditampilkan dengan aman dan jelas.
7. UI resource dapat dimuat dan MCP Apps bridge berfungsi jika UI digunakan.
8. Tools tetap berfungsi saat UI tidak tersedia.
9. Uji perubahan metadata/tools setelah refresh atau reconnect aplikasi.
10. Catat hasil uji, tanggal, versi SDK, endpoint, dan akun/workspace yang dipakai.

## 10. Deployment Supabase

Referensi:

- https://supabase.com/docs/guides/functions/quickstart
- https://supabase.com/docs/guides/functions/deploy
- https://supabase.com/docs/guides/ai-tools/byo-mcp

Sebelum deployment:

- Periksa konfigurasi function dan gateway JWT verification.
- Periksa secrets yang dibutuhkan dan pastikan tidak ada secret di source.
- Periksa routing endpoint, CORS, dan metode HTTP.
- Periksa dependency serta versi SDK.
- Jalankan pengujian lokal dan MCP Inspector.
- Audit authentication, authorization, Storage, dan database access.

Sesudah deployment:

- Verifikasi endpoint deployment secara langsung.
- Uji MCP initialize dan tool discovery.
- Hubungkan endpoint ke ChatGPT dan jalankan pengujian end-to-end.
- Jangan menyatakan siap produksi sebelum hasil pengujian dan security review dicatat.

## 11. Catatan khusus repository applestoree/custom-mcp

Function yang sebelumnya diimpor:

```text
supabase/functions/chatgpt-image-upload-mcp/index.ts
```

Source tersebut menggunakan:

- `McpServer` dari `@modelcontextprotocol/sdk`
- `WebStandardStreamableHTTPServerTransport`
- Hono
- Zod
- `Deno.serve()`
- MCP Tools dan Resources
- UI resource `ui://upload-generated-image/menu-v3.html`
- Supabase Storage bucket `generated-images`
- Tabel metadata `generated_images`

Audit berikutnya harus memeriksa source aktual, bukan hanya mengandalkan daftar ini:

1. Cocokkan transport dan lifecycle dengan SDK versi yang benar-benar digunakan.
2. Pastikan routing URL deployment dapat digunakan ChatGPT.
3. Pastikan autentikasi dan authorization cocok dengan mekanisme koneksi ChatGPT.
4. Audit tools dan schema input/output.
5. Audit MCP Apps metadata dan bridge handshake.
6. Audit validasi upload, tipe/ukuran file, Storage policy, dan akses tabel.
7. Uji dengan MCP Inspector dan ChatGPT.
8. Dokumentasikan hasil audit sebelum mengubah kode atau melakukan deployment.

## 12. Troubleshooting

| Gejala | Area pemeriksaan |
|---|---|
| ChatGPT tidak dapat terhubung | HTTPS, endpoint path, DNS/TLS, HTTP method, gateway JWT, dan respons server. |
| Authentication gagal | Metode auth yang dipilih, token validation, OAuth discovery, redirect URI, scopes, dan refresh token. |
| Tools tidak muncul | MCP initialize, tools/list, schema, server logs, dan refresh/reconnect aplikasi. |
| Tool call gagal | tools/call, validasi input, authorization, error JSON-RPC, dan backend logs. |
| Koneksi gagal setelah request pertama | Lifecycle server/transport; periksa apakah instance transport digunakan ulang. |
| UI tidak tampil | UI resource URI, metadata `_meta.ui.resourceUri`, MIME type, iframe/sandbox, handshake, dan MCP Apps bridge. |
| Upload gagal | MIME type, ukuran file, Storage bucket/policy, credential server-side, dan metadata database. |

## 13. Urutan implementasi yang disarankan

1. Pelajari OpenAI [MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart).
2. Pelajari [Connecting custom MCP servers in ChatGPT](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt).
3. Pelajari OpenAI [Authentication](https://developers.openai.com/plugins/build/auth).
4. Pelajari OpenAI [Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui) dan MCP Apps specification jika UI dibutuhkan.
5. Pelajari Supabase [Deploy MCP Servers](https://supabase.com/docs/guides/ai-tools/byo-mcp).
6. Audit source function dan versi dependency yang terpasang.
7. Uji endpoint dan tools melalui MCP Inspector.
8. Hubungkan ke ChatGPT dan jalankan pengujian end-to-end.
9. Lakukan security review dan dokumentasikan hasil sebelum deployment produksi.

---

## Riwayat dokumentasi

- Dokumentasi ini menggabungkan referensi awal Supabase dengan referensi resmi OpenAI untuk ChatGPT MCP dan Apps SDK.
- Tidak ada perubahan kode function, konfigurasi Supabase, secrets, atau deployment yang dilakukan melalui pembaruan dokumentasi ini.
