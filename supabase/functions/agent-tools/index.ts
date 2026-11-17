import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { Hono } from "npm:hono@^4.9.7";
import { cors } from "npm:hono@^4.9.7/cors";
import { z } from "npm:zod@^4.1.13";

const FUNCTION_NAME = "agent-tools";
const SERVER_VERSION = "1.0.0";
const UPLOAD_UI_URI = "ui://agent-tools/upload-image-v1.html";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const ALLOWED_DOWNLOAD_HOSTS = ["oaiusercontent.com", "chatgpt.com", "oaisdmntprindiasocentral.blob.core.windows.net"];

const app = new Hono();

const uploadUiHtml = [
  "<!doctype html>",
  '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  "<title>Upload generated image</title>",
  "<style>",
  ":root{color-scheme:light dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}",
  "body{margin:0;padding:16px;color:var(--color,inherit)}.wrap{display:grid;gap:12px;max-width:560px}",
  "h2{font-size:16px;margin:0;font-weight:650}.sub{font-size:13px;opacity:.72;margin:0;line-height:1.5}",
  "button{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 16px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:12px;background:var(--button-bg,#2563eb);color:white;font-weight:650;font-size:14px;cursor:pointer}",
  "button:disabled{opacity:.55;cursor:wait}button:focus-visible{outline:2px solid #3987f7;outline-offset:2px}",
  "#status{font-size:12px;line-height:1.5;overflow-wrap:anywhere;min-height:18px;opacity:.85}",
  ".success{padding:10px;border-radius:10px;background:color-mix(in srgb,#16a34a 12%,transparent)}",
  "a{color:inherit;overflow-wrap:anywhere}",
  "</style></head><body><main class='wrap'>",
  "<div><h2>Upload generated image</h2><p class='sub'>Pilih file gambar hasil generasi ChatGPT. File akan dikirim ke Supabase Storage setelah Anda menekan tombol di bawah.</p></div>",
  "<input id='file' type='file' accept='image/png,image/jpeg,image/webp' hidden>",
  "<button id='upload' type='button'>Upload Image to Supabase</button>",
  "<div id='status' role='status' aria-live='polite'>PNG, JPEG, atau WEBP · Maksimum 10 MB.</div>",
  "</main><script>",
  "const button=document.getElementById('upload');",
  "const picker=document.getElementById('file');",
  "const statusEl=document.getElementById('status');",
  "const api=window.openai;",
  "const toolInput=api?.toolInput||{};",
  "let prompt=typeof toolInput.prompt==='string'?toolInput.prompt:'';window.addEventListener('message',event=>{if(event.source!==window.parent)return;const message=event.data;if(message?.method==='ui/notifications/tool-input'&&typeof message.params?.prompt==='string')prompt=message.params.prompt;});",
  "function status(message,success){statusEl.className=success?'success':'';statusEl.textContent=message;}",
  "button.addEventListener('click',()=>{if(!api?.uploadFile||!api?.getFileDownloadUrl||!api?.callTool){",
  "if(api?.sendFollowUpMessage){api.sendFollowUpMessage({prompt:'Saya ingin mengunggah gambar hasil generasi. Mohon minta saya melampirkan file gambar PNG, JPEG, atau WEBP, lalu panggil tool upload_image dengan attachment tersebut.'});status('Silakan lampirkan gambar pada percakapan ChatGPT.',false);}",
  "else{status('Fitur upload file ChatGPT tidak tersedia pada host ini. Lampirkan gambar di percakapan lalu panggil upload_image.',false);}return;}picker.click();});",
  "picker.addEventListener('change',async()=>{const file=picker.files?.[0];if(!file)return;",
  "if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status('Format tidak didukung. Gunakan PNG, JPEG, atau WEBP.',false);picker.value='';return;}",
  "if(file.size>10*1024*1024){status('Ukuran gambar melebihi batas 10 MB.',false);picker.value='';return;}",
  "button.disabled=true;status('Mengirim file ke ChatGPT…',false);",
  "try{const uploaded=await api.uploadFile(file);const fileId=uploaded?.fileId;if(!fileId)throw new Error('ChatGPT tidak mengembalikan file ID.');",
  "status('Menyiapkan transfer aman ke Supabase…',false);const fileUrl=await api.getFileDownloadUrl({fileId});",
  "if(!fileUrl?.downloadUrl)throw new Error('URL download sementara tidak tersedia.');",
  "const result=await api.callTool('upload_image',{image:{download_url:fileUrl.downloadUrl,file_id:fileId,mime_type:file.type,file_name:file.name},prompt});",
  "const data=result?.structuredContent||{};if(data.success&&data.image?.image_url){",
  "status('Upload berhasil. Public URL: '+data.image.image_url,true);",
  "}else if(data.status==='awaiting_file'){status('File belum diterima server. Silakan coba kembali.',false);}",
  "else{const message=(result?.content||[]).map(x=>x.text||'').filter(Boolean).join(' ');throw new Error(message||'Upload gagal.');}",
  "}catch(error){status(error?.message||'Upload gagal. Silakan coba kembali.',false);}finally{button.disabled=false;picker.value='';}",
  "});",
  "</script></body></html>"
].join("\n");

function buildFinalPrompt(input: {
  products: string;
  headline: string;
  subheadline: string;
  features: string;
  composition: string;
  layout: string;
  background: string;
  quality: string;
}): string {
  return [
    "Create a professional commercial advertising poster featuring:",
    "",
    "PRODUCT: " + input.products,
    "",
    "HEADLINE: " + input.headline,
    "",
    "SUBHEADLINE: " + input.subheadline,
    "",
    "PRODUCT FEATURES:",
    input.features,
    "",
    "COMPOSITION:",
    input.composition,
    "",
    "LAYOUT:",
    input.layout,
    "",
    "BACKGROUND:",
    input.background,
    "",
    "VISUAL QUALITY:",
    input.quality,
    "",
    "## Design Requirements",
    "",
    "- Create a premium, professional advertising design.",
    "- Make the selected product the primary visual focus.",
    "- Maintain realistic product proportions and details.",
    "- Use professional commercial photography aesthetics.",
    "- Ensure clear visual hierarchy.",
    "- Make headline and subheadline visually readable.",
    "- Arrange all elements harmoniously.",
    "- Avoid unnecessary decorative elements.",
    "- Do not create, redraw, or generate any logo.",
    "- Leave the top-left area suitable for a small logo overlay.",
    "",
    "## Output Requirements",
    "",
    "- Image dimensions: 1080 × 1350 pixels.",
    "- Aspect ratio: 4:5.",
    "- High-resolution commercial advertising quality.",
    "- Ready for social media publication."
  ].join("\n");
}

function isAllowedDownloadUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_DOWNLOAD_HOSTS.some((host) => hostname === host || hostname.endsWith("." + host));
  if (parsed.protocol !== "https:" || !allowed || parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    throw new Error("Attachment download URL is not from an allowed HTTPS host.");
  }
  return parsed;
}

function detectImageMime(bytes: Uint8Array): typeof ALLOWED_MIME_TYPES[number] | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function downloadImage(image: {
  download_url: string;
  file_id: string;
  mime_type?: string;
  file_name?: string;
}): Promise<{ bytes: Uint8Array; mimeType: typeof ALLOWED_MIME_TYPES[number] }> {
  isAllowedDownloadUrl(image.download_url);
  const response = await fetch(image.download_url, { redirect: "error" });
  if (!response.ok || !response.body) throw new Error("Could not download the ChatGPT image attachment.");

  const declaredLength = Number(response.headers.get("content-length") || "0");
  if (declaredLength > MAX_IMAGE_BYTES) {
    await response.body.cancel();
    throw new Error("Image exceeds the 10 MB limit.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("Image exceeds the 10 MB limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) throw new Error("The image attachment is empty.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const actualMime = detectImageMime(bytes);
  if (!actualMime || !ALLOWED_MIME_TYPES.includes(actualMime)) {
    throw new Error("The uploaded file content is not a supported PNG, JPEG, or WEBP image.");
  }
  if (image.mime_type && image.mime_type !== actualMime) {
    throw new Error("The attachment MIME type does not match its actual file content.");
  }
  return { bytes, mimeType: actualMime };
}

function getSupabaseSecretKey(): string {
  const directKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (directKey) return directKey;
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeysRaw) throw new Error("Supabase server credentials are not configured.");
  const secretKeys = JSON.parse(secretKeysRaw);
  const secretKey = secretKeys?.default;
  if (typeof secretKey !== "string" || !secretKey) throw new Error("Supabase secret key is missing.");
  return secretKey;
}

function createMcpServer() {
  const server = new McpServer({ name: FUNCTION_NAME, version: SERVER_VERSION });

  server.registerResource("upload-image-app", UPLOAD_UI_URI, {}, async () => ({
    contents: [{
      uri: UPLOAD_UI_URI,
      mimeType: "text/html;profile=mcp-app",
      text: uploadUiHtml,
      _meta: {
        ui: {
          prefersBorder: true
        }
      }
    }]
  }));

  server.registerTool("generate", {
    title: "Generate commercial image prompt",
    description: "Build the final commercial advertising image prompt from all eight manually supplied variables. It does not call an image-generation API. Return the final prompt for ChatGPT to use with its built-in image generation capability. After ChatGPT finishes generating the image, call upload_image without an image argument to show the user the upload control; do not upload until the user selects a file.",
    inputSchema: {
      products: z.string().min(1).max(5000),
      headline: z.string().min(1).max(2000),
      subheadline: z.string().min(1).max(3000),
      features: z.string().min(1).max(10000),
      composition: z.string().min(1).max(2000),
      layout: z.string().min(1).max(2000),
      background: z.string().min(1).max(3000),
      quality: z.string().min(1).max(3000)
    },
    outputSchema: {
      success: z.boolean(),
      final_prompt: z.string(),
      output: z.object({ width: z.number(), height: z.number(), aspect_ratio: z.string() })
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    _meta: {
      "openai/toolInvocation/invoking": "Menyusun image prompt…",
      "openai/toolInvocation/invoked": "Image prompt siap."
    }
  }, async (input) => {
    const finalPrompt = buildFinalPrompt(input);
    return {
      structuredContent: {
        success: true,
        final_prompt: finalPrompt,
        output: {
          width: 1080,
          height: 1350,
          aspect_ratio: "4:5"
        }
      },
      content: [{
        type: "text",
        text: "Image prompt berhasil disusun. Gunakan final_prompt berikut untuk membuat gambar melalui kemampuan Image Generation bawaan ChatGPT."
      }]
    };
  });

  server.registerTool("upload_image", {
    title: "Upload generated image to Supabase",
    description: "Open the Upload Image control when called without an image. After the user selects a generated image, upload the supplied ChatGPT file attachment to the public Supabase Storage bucket 'image', insert metadata into 'generated_images', and return the public URL. Accepts PNG, JPEG, or WEBP up to 10 MB.",
    inputSchema: {
      image: z.object({
        download_url: z.string().url(),
        file_id: z.string().min(1),
        mime_type: z.string().optional(),
        file_name: z.string().optional()
      }).optional(),
      prompt: z.string().max(10000).optional()
    },
    outputSchema: {
      success: z.boolean(),
      status: z.string(),
      message: z.string().optional(),
      image: z.object({
        id: z.union([z.string(), z.number()]).optional(),
        image_url: z.string(),
        storage_path: z.string(),
        mime_type: z.string(),
        created_at: z.string().optional()
      }).optional()
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false
    },
    _meta: {
      ui: { resourceUri: UPLOAD_UI_URI },
      "openai/outputTemplate": UPLOAD_UI_URI,
      "openai/fileParams": ["image"],
      "openai/toolInvocation/invoking": "Menyiapkan upload gambar…",
      "openai/toolInvocation/invoked": "Upload gambar selesai."
    }
  }, async ({ image, prompt }) => {
    if (!image) {
      return {
        structuredContent: {
          success: true,
          status: "awaiting_file",
          message: "Pilih file gambar melalui tombol Upload Image pada UI."
        },
        content: [{
          type: "text",
          text: "Tombol Upload Image siap. Pengguna harus memilih file gambar sebelum upload dijalankan."
        }]
      };
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured.");

    const { bytes, mimeType } = await downloadImage(image);
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
    const storagePath = "chatgpt/" + crypto.randomUUID() + "." + extension;
    const admin = createClient(supabaseUrl, getSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error: uploadError } = await admin.storage.from("image").upload(storagePath, bytes, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: false
    });
    if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

    const { data: publicData } = admin.storage.from("image").getPublicUrl(storagePath);
    const { data: row, error: insertError } = await admin.from("generated_images").insert({
      prompt: (prompt || image.file_name || "Generated image uploaded from ChatGPT").slice(0, 10000),
      image_url: publicData.publicUrl,
      storage_path: storagePath,
      mime_type: mimeType
    }).select("id, image_url, storage_path, mime_type, created_at").single();

    if (insertError) {
      const { error: cleanupError } = await admin.storage.from("image").remove([storagePath]);
      if (cleanupError) console.error("Storage rollback failed:", cleanupError.message);
      throw new Error("Image metadata could not be saved: " + insertError.message);
    }

    return {
      structuredContent: {
        success: true,
        status: "uploaded",
        image: row
      },
      content: [{
        type: "text",
        text: "Gambar berhasil diunggah ke bucket image dan metadata disimpan ke generated_images. Public URL: " + row.image_url
      }]
    };
  });

  return server;
}

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Authorization", "Content-Type", "mcp-session-id", "mcp-protocol-version"],
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  exposeHeaders: ["Mcp-Session-Id", "Mcp-Protocol-Version"]
}));

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") return c.body(null, 204);

  const expectedToken = Deno.env.get("AGENT_TOOLS_BEARER_TOKEN");
  if (!expectedToken) {
    return c.json({ error: "Server authentication is not configured." }, 500);
  }

  const authorization = c.req.header("Authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!suppliedToken) return c.json({ error: "Unauthorized." }, 401);

  const encoder = new TextEncoder();
  const [expectedHash, suppliedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expectedToken)),
    crypto.subtle.digest("SHA-256", encoder.encode(suppliedToken))
  ]);
  const expectedBytes = new Uint8Array(expectedHash);
  const suppliedBytes = new Uint8Array(suppliedHash);
  let difference = 0;
  for (let i = 0; i < expectedBytes.length; i++) difference |= expectedBytes[i] ^ suppliedBytes[i];
  if (difference !== 0) return c.json({ error: "Unauthorized." }, 401);

  await next();
});

app.all("*", async (c) => {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});

Deno.serve(app.fetch);
