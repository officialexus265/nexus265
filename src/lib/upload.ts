/** Upload a file to Cloudinary via our API. Falls back to data-URL if Cloudinary is offline. */
export async function uploadImage(
  file: File,
  folder = "nexus265"
): Promise<{ url: string; via: "cloudinary" | "local" }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return { url: data.url, via: "cloudinary" };
    }
  } catch {
    /* fall through */
  }

  // Local fallback (data URL) — works without Cloudinary
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return { url: dataUrl, via: "local" };
}
