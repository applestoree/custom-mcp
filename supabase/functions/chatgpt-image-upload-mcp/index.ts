import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { Hono } from "npm:hono@^4.9.7";
import { z } from "npm:zod@^4.1.13";

const app = new Hono();
const MENU_URI = "ui://upload-generated-image/menu-v3.html";
const menuHtml = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Upload Generated Image</title>
<style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{margin:0;padding:16px;color:var(--color,inherit)}.wrap{display:grid;gap:12px;max-width:560px}
h2{font-size:17px;margin:0 0 2px;font-weight:650}.sub{font-size:13px;opacity:.72;margin:0 0 4px}
button{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;padding:15px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:14px;background:transparent;color:inherit;cursor:pointer}
button:hover{background:color-mix(in srgb,currentColor 6%,transparent)}button:focus-visible{outline:2px solid #3987f7;outline-offset:2px}
.ico{font-size:23px;line-height:1.2}strong{display:block;font-size:14px;margin-bottom:4px}small{display:block;font-size:12px;line-height:1.45;opacity:.72}#status{font-size:12px;opacity:.75;min-height:16px}
</style></head><body><div class="wrap">
<div><h2>Upload Generated Image</h2><p class="sub">Pilih tindakan yang ingin Anda lakukan.</p></div>
<button id="create" type="button"><span class="ico">🖼️</span><span><strong>1. Buat gambar dan upload ke Supabase</strong><small>Buat gambar berdasarkan instruksi Anda, lalu simpan ke bucket generated-images dan tampilkan URL publik.</small></span></button>
<button id="prompt" type="button"><span class="ico">✍️</span><span><strong>2. Buat atau edit prompt</strong><small>Susun prompt baru atau perbaiki prompt terlebih dahulu sebelum membuat gambar.</small></span></button>
<button id="edit" type="button"><span class="ico">🛠️</span><span><strong>3. Edit plugin ini</strong><small>Diskusikan perubahan plugin, susun requirement, minta konfirmasi, lalu terapkan melalui koneksi Supabase.</small></span></button>
<div id="status" role="status" aria-live="polite"></div></div>
<script>
const statusEl=document.getElementById("status");
async function choose(message){const api=window.openai;if(api&&typeof api.sendFollowUpMessage==="function"){statusEl.textContent="Meneruskan pilihan ke percakapan…";try{await api.sendFollowUpMessage({prompt:message});statusEl.textContent="Pilihan berhasil dikirim."}catch(e){statusEl.textContent="Tidak dapat meneruskan pilihan. Silakan tulis pilihan Anda di kolom chat."}}else{statusEl.textContent="Silakan tulis pilihan ini di kolom chat: "+message}}
document.getElementById("create").addEventListener("click",()=>choose("Saya memilih opsi 1: Buat gambar dan upload ke Supabase. Tanyakan detail gambar jika prompt belum tersedia; setelah gambar dibuat, gunakan plugin upload_generated_image untuk mengunggah lampiran ke Supabase dan berikan URL publik."));
document.getElementById("prompt").addEventListener("click",()=>choose("Saya memilih opsi 2: Bantu saya membuat atau mengedit prompt gambar terlebih dahulu. Jangan membuat atau mengunggah gambar sebelum saya menyetujui prompt."));
document.getElementById("edit").addEventListener("click",()=>choose("Saya memilih opsi 3: Edit plugin tool-supabase ini. Mulai workflow DISKUSI > REQUIREMENT > KONFIRMASI > IMPLEMENTASI. Gunakan koneksi Supabase yang sudah terhubung untuk memeriksa dan mengubah Edge Function chatgpt-image-upload-mcp. Pada tahap diskusi, tanyakan perubahan yang saya inginkan. Susun requirement dan tampilkan rencana/diff sebelum meminta persetujuan eksplisit. Jangan mengubah kode atau melakukan deployment sebelum saya menyetujui perubahan spesifik tersebut. Setelah disetujui, terapkan perubahan langsung melalui koneksi Supabase, pertahankan fungsi lain yang tidak terkait, lalu verifikasi deployment."));

 // MCP Apps lifecycle handshake: finish UI initialization before any slow work.
 (function initializeMcpApp(){
   const host = window.parent;
   if (host === window) return;
   const requestId = "mcp-ui-init-" + Date.now();
   let settled = false;
   const status = document.getElementById("status");
   const cleanup = () => window.removeEventListener("message", onMessage);
   function onMessage(event){
     if (event.source !== host) return;
     const message = event.data;
     if (!message || message.id !== requestId) return;
     settled = true;
     cleanup();
     if (message.error) {
       if (status) status.textContent = "Menu siap; koneksi UI host tidak dapat diselesaikan.";
       return;
     }
     const theme = message.result && message.result.hostContext && message.result.hostContext.theme;
     if (theme === "dark" || theme === "light") document.documentElement.style.colorScheme = theme;
     host.postMessage({
       jsonrpc: "2.0",
       method: "ui/notifications/initialized",
       params: {}
     }, "*");
   }
   window.addEventListener("message", onMessage);
   host.postMessage({
     jsonrpc: "2.0",
     id: requestId,
     method: "ui/initialize",
     params: {
       appInfo: { name: "Upload Generated Image", version: "1.0.0" },
       appCapabilities: {}
     }
   }, "*");
   window.setTimeout(() => {
     if (!settled) {
       cleanup();
       if (status) status.textContent = "Menu tetap dapat digunakan; koneksi lifecycle host belum terkonfirmasi.";
     }
   }, 4000);
 })();
</script></body></html>`;

function createMcpServer() {
  const server = new McpServer({ name: "chatgpt-image-upload", version: "1.2.0" });

server.registerResource("upload-generated-image-menu", MENU_URI, {}, async () => ({contents:[{uri:MENU_URI,mimeType:"text/html;profile=mcp-app",text:menuHtml,_meta:{ui:{prefersBorder:true}}}]}));
server.registerTool("show_upload_menu", {
 title:"Show image creation, prompt, and plugin editing menu",
 description:"Display the interactive three-option menu whenever the user invokes the Upload Generated Image plugin or asks to open its menu. Always use this tool first for a plugin invocation; do not upload anything until the user chooses option 1 and an image attachment exists. Option 3 starts a discussion-requirements-explicit-confirmation-implementation workflow for editing this plugin through the connected Supabase project.",
 inputSchema:{},
 _meta:{ui:{resourceUri:MENU_URI},"openai/outputTemplate":MENU_URI,"openai/toolInvocation/invoking":"Menyiapkan menu…","openai/toolInvocation/invoked":"Menu siap."}
},async()=>({structuredContent:{menu:"upload-generated-image",options:["create_and_upload","create_or_edit_prompt","edit_plugin"]},content:[{type:"text",text:"Menu tiga pilihan ditampilkan. Tunggu pilihan pengguna sebelum membuat/mengunggah gambar atau memulai diskusi perubahan plugin."}]}));

server.registerTool("upload_generated_image", {
 title:"Upload generated image to Supabase",
 description:"Upload an image attachment from this ChatGPT conversation to the public generated-images bucket and return its public URL. Accepts PNG, JPEG, or WEBP up to 10 MB.",
 inputSchema:{image:z.object({download_url:z.string().url(),file_id:z.string().min(1),mime_type:z.enum(["image/png","image/jpeg","image/webp"]).optional(),file_name:z.string().optional()}),prompt:z.string().max(10000).optional()},
 _meta:{"openai/fileParams":["image"]}
},async({image,prompt})=>{
 const url=Deno.env.get("SUPABASE_URL");const secretKeysRaw=Deno.env.get("SUPABASE_SECRET_KEYS");
 if(!url||!secretKeysRaw)throw new Error("Supabase server credentials are not configured.");
 const secretKeys=JSON.parse(secretKeysRaw);const secretKey=secretKeys.default;if(!secretKey)throw new Error("Supabase secret key is missing.");
 const parsed=new URL(image.download_url);const allowedHosts=["oaiusercontent.com","chatgpt.com","oaisdmntprindiasocentral.blob.core.windows.net"];
 if(parsed.protocol!=="https:"||!allowedHosts.some(h=>parsed.hostname===h||parsed.hostname.endsWith("."+h)))throw new Error("The attachment download host is not allowed: "+parsed.hostname);
 const response=await fetch(image.download_url,{redirect:"error"});if(!response.ok||!response.body)throw new Error("Could not download the ChatGPT attachment.");
 const contentType=(response.headers.get("content-type")||image.mime_type||"").split(";")[0].trim().toLowerCase();
 if(!["image/png","image/jpeg","image/webp"].includes(contentType)){await response.body.cancel();throw new Error("Only PNG, JPEG, and WEBP images are accepted.");}
 const declaredLength=Number(response.headers.get("content-length")||"0");if(declaredLength>10*1024*1024){await response.body.cancel();throw new Error("Image exceeds the 10 MB limit.");}
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let total=0;
 while(true){const{done,value}=await reader.read();if(done)break;total+=value.length;if(total>10*1024*1024){await reader.cancel();throw new Error("Image exceeds the 10 MB limit.");}chunks.push(value);}
 if(total===0)throw new Error("The image attachment is empty.");const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const ext=contentType==="image/jpeg"?"jpg":contentType==="image/webp"?"webp":"png";const storagePath=`chatgpt/${crypto.randomUUID()}.${ext}`;
 const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const{error:uploadError}=await admin.storage.from("generated-images").upload(storagePath,bytes,{contentType,cacheControl:"31536000",upsert:false});
 if(uploadError)throw new Error("Storage upload failed: "+uploadError.message);
 const{data:publicData}=admin.storage.from("generated-images").getPublicUrl(storagePath);
 const{data:row,error:insertError}=await admin.from("generated_images").insert({prompt:(prompt||image.file_name||"Uploaded from ChatGPT").slice(0,10000),image_url:publicData.publicUrl,storage_path:storagePath,mime_type:contentType}).select("id, image_url, storage_path, mime_type, created_at").single();
 if(insertError){await admin.storage.from("generated-images").remove([storagePath]);throw new Error("Image metadata could not be saved: "+insertError.message);}
 return{content:[{type:"text",text:JSON.stringify({success:true,image:row})}]};
});
  return server;
}

app.all("*", async (c) => {
  // Stateless Streamable HTTP: each request gets an isolated server and transport.
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});
Deno.serve(app.fetch);
