/** Upload a file to Cloudinary via our API. */
export async function uploadImage(
  file: File,
  folder = "nexus265"
): Promise<{ url: string; via: "cloudinary" }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Upload failed. Check Cloudinary env vars and login.");
  }

  if (!data.url) {
    throw new Error("Upload returned no URL");
  }

  return { url: data.url, via: "cloudinary" };
}
