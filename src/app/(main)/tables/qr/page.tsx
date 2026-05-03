"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, QrCode as QrCodeIcon, Store } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTables } from "@/hooks/api/use-tables";
import { useAuth } from "@/contexts/auth-context";

type LayoutKey = "1up" | "4up" | "12up";

interface LayoutSpec {
  perPage: number;
  cols: number;
  rows: number;
  qrSize: number; // pixels for screen preview; print scales via mm
  cellMm: { w: number; h: number };
  fontSize: { name: string; venue: string };
  description: string;
}

const LAYOUTS: Record<LayoutKey, LayoutSpec> = {
  "1up": {
    perPage: 1,
    cols: 1,
    rows: 1,
    qrSize: 380,
    cellMm: { w: 190, h: 270 },
    fontSize: { name: "text-5xl", venue: "text-xl" },
    description: "1 sticker / trang A4 — đặt trên kệ standee",
  },
  "4up": {
    perPage: 4,
    cols: 2,
    rows: 2,
    qrSize: 200,
    cellMm: { w: 95, h: 135 },
    fontSize: { name: "text-3xl", venue: "text-base" },
    description: "4 stickers / trang — vừa phải, in giấy thường rồi cắt",
  },
  "12up": {
    perPage: 12,
    cols: 3,
    rows: 4,
    qrSize: 130,
    cellMm: { w: 63, h: 67 },
    fontSize: { name: "text-xl", venue: "text-xs" },
    description: "12 stickers / trang — dùng giấy nhãn label A4 (Tomy/Wela)",
  },
};

function buildQrUrl(origin: string, tenantSlug: string, tableId: string): string {
  return `${origin}/m/${tenantSlug}/t/${tableId}`;
}

interface StickerProps {
  url: string;
  tableName: string;
  venueName: string;
  layout: LayoutSpec;
}

function Sticker({ url, tableName, venueName, layout }: StickerProps) {
  return (
    <div
      className="qr-sticker flex break-inside-avoid flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-3 text-black"
      style={{
        width: `${layout.cellMm.w}mm`,
        height: `${layout.cellMm.h}mm`,
      }}
    >
      <div className={`font-bold ${layout.fontSize.venue} mb-1 text-center`}>{venueName}</div>
      <div className="mb-1.5 text-xs text-gray-500">Quét để gọi món</div>
      <div className="rounded bg-white p-2">
        <QRCodeSVG value={url} size={layout.qrSize} level="M" includeMargin={false} />
      </div>
      <div className={`font-extrabold ${layout.fontSize.name} mt-1.5 text-center leading-none`}>
        {tableName}
      </div>
    </div>
  );
}

export default function PrintQrPage() {
  const { tenants, activeTenantId } = useAuth();
  const tables = useTables();

  const [layoutKey, setLayoutKey] = useState<LayoutKey>("4up");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [origin, setOrigin] = useState<string>("");

  // Resolve origin (env hoặc window)
  useEffect(() => {
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
    if (envOrigin) {
      setOrigin(envOrigin.replace(/\/$/, ""));
    } else if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Default: chọn tất cả table khi data load xong
  useEffect(() => {
    if (tables.data && selectedIds.size === 0) {
      setSelectedIds(new Set(tables.data.map((t) => t.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.data]);

  const tenant = tenants.find((t) => t.id === activeTenantId);
  const layout = LAYOUTS[layoutKey];

  const selectedTables = useMemo(() => {
    if (!tables.data) return [];
    return tables.data.filter((t) => selectedIds.has(t.id));
  }, [tables.data, selectedIds]);

  // Group by section cho UI selector
  const grouped = useMemo(() => {
    if (!tables.data) return {};
    const out: Record<string, typeof tables.data> = {};
    for (const t of tables.data) {
      (out[t.section] ??= []).push(t);
    }
    return out;
  }, [tables.data]);

  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handlePrint = () => {
    if (selectedTables.length === 0) return;
    window.print();
  };

  if (tenant && !tenant.slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Tenant chưa có slug</h1>
        <p className="text-muted-foreground mb-4 max-w-md">
          Quán của bạn được tạo trước khi tính năng QR có. Tải lại trang —
          backend sẽ tự sinh slug.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-semibold"
        >
          Tải lại
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <>
      {/* CSS print rules */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 8mm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .qr-sticker {
            border: 1px dashed #cccccc !important;
          }
        }
      `}</style>

      {/* Toolbar (no-print) */}
      <div className="no-print flex flex-col">
        <header className="bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
          <Link
            href="/tables"
            className="hover:bg-muted -ml-2 flex size-9 items-center justify-center rounded-lg"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="flex items-center gap-2 text-base font-semibold md:text-lg">
            <QrCodeIcon className="size-5" /> In QR bàn
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {selectedTables.length} bàn — {Math.ceil(selectedTables.length / layout.perPage)}{" "}
              trang A4
            </span>
            <Button size="lg" onClick={handlePrint} disabled={selectedTables.length === 0}>
              <Printer className="mr-2 size-5" />
              In ngay
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
          {/* Sidebar config */}
          <aside className="space-y-4">
            <section className="bg-card space-y-3 rounded-lg border p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <Store className="size-4" />
                Quán
              </h2>
              <div className="text-sm">
                <div className="font-medium">{tenant.name}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  Slug: <code className="bg-muted rounded px-1.5 py-0.5">{tenant.slug}</code>
                </div>
              </div>
            </section>

            <section className="bg-card space-y-3 rounded-lg border p-4">
              <h2 className="font-semibold">Bố cục in</h2>
              <Select value={layoutKey} onValueChange={(v) => setLayoutKey(v as LayoutKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1up">1 / trang (lớn)</SelectItem>
                  <SelectItem value="4up">4 / trang (vừa)</SelectItem>
                  <SelectItem value="12up">12 / trang (label sheet)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{layout.description}</p>
            </section>

            <section className="bg-card space-y-3 rounded-lg border p-4">
              <h2 className="flex items-center justify-between font-semibold">
                <span>Chọn bàn</span>
                {tables.data && tables.data.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const all = tables.data!.map((t) => t.id);
                      const allSelected = all.every((id) => selectedIds.has(id));
                      setSelectedIds(allSelected ? new Set() : new Set(all));
                    }}
                    className="text-primary text-xs hover:underline"
                  >
                    {tables.data.length === selectedIds.size ? "Bỏ tất cả" : "Chọn tất cả"}
                  </button>
                )}
              </h2>

              {tables.isLoading ? (
                <Skeleton className="h-32" />
              ) : tables.data?.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa có bàn nào.{" "}
                  <Link href="/tables" className="text-primary underline">
                    Tạo bàn
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([section, list]) => {
                    const sectionIds = list.map((t) => t.id);
                    const allSelected = sectionIds.every((id) => selectedIds.has(id));
                    return (
                      <div key={section}>
                        <button
                          type="button"
                          onClick={() => toggleAll(sectionIds)}
                          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-1 text-xs uppercase"
                        >
                          <span className="font-semibold">{section}</span>
                          <span>{allSelected ? "Bỏ" : "Tất cả"}</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          {list.map((t) => (
                            <label
                              key={t.id}
                              className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-sm ${
                                selectedIds.has(t.id)
                                  ? "bg-primary/10 border-primary"
                                  : "bg-muted/40 hover:border-border border-transparent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(t.id)}
                                onChange={() => toggleId(t.id)}
                                className="accent-primary size-4"
                              />
                              <span className="truncate">{t.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">💡 Lưu ý in</p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                <li>Tắt &quot;Headers and footers&quot; trong dialog in</li>
                <li>Bật &quot;Background graphics&quot; nếu có viền QR</li>
                <li>Chọn giấy A4, không scale</li>
                <li>Test 1 trang trước khi in nhiều</li>
              </ul>
            </section>
          </aside>

          {/* Preview */}
          <div className="space-y-4">
            <h2 className="text-muted-foreground text-sm font-semibold">Xem trước</h2>
            {selectedTables.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border-2 border-dashed p-12 text-center">
                Chọn bàn để xem trước QR
              </div>
            ) : (
              <PrintArea
                tables={selectedTables}
                tenantSlug={tenant.slug}
                venueName={tenant.name}
                layout={layout}
                origin={origin}
              />
            )}
          </div>
        </div>
      </div>

      {/* Print area — hiển thị thường, nhưng @media print chỉ phần này */}
      <div className="print-area hidden">
        <PrintArea
          tables={selectedTables}
          tenantSlug={tenant.slug}
          venueName={tenant.name}
          layout={layout}
          origin={origin}
        />
      </div>
    </>
  );
}

function PrintArea({
  tables,
  tenantSlug,
  venueName,
  layout,
  origin,
}: {
  tables: Array<{ id: string; name: string }>;
  tenantSlug: string;
  venueName: string;
  layout: LayoutSpec;
  origin: string;
}) {
  // Chia thành các trang theo perPage
  const pages: Array<typeof tables> = [];
  for (let i = 0; i < tables.length; i += layout.perPage) {
    pages.push(tables.slice(i, i + layout.perPage));
  }

  return (
    <div className="space-y-6">
      {pages.map((pageTables, pageIdx) => (
        <div
          key={pageIdx}
          className="mx-auto break-after-page bg-white shadow-lg"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "8mm",
            display: "grid",
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
            gap: "4mm",
          }}
        >
          {pageTables.map((t) => (
            <Sticker
              key={t.id}
              url={buildQrUrl(origin, tenantSlug, t.id)}
              tableName={t.name}
              venueName={venueName}
              layout={layout}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
