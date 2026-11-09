import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

/** Icon PNG cho PWA (192/512), vẽ bằng ImageResponse — không cần file ảnh trong repo. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#ffffff",
        fontSize: size * 0.42,
        fontWeight: 800,
        letterSpacing: -size * 0.02,
        fontFamily: "sans-serif",
      }}
    >
      OG
    </div>,
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
