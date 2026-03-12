interface FileInfoProps {
  fileName: string;
  extension: string;
  sizeBytes: number;
  layout?: "column" | "row";
  className?: string;
}

function FileInfo({
  fileName,
  extension,
  sizeBytes,
  layout = "column",
  className = "",
}: FileInfoProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Retorna com 2 casas decimais e a unidade correta
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const displaySize = formatSize(sizeBytes);

  const content = (
    <>
      <span className="text-primary truncate text-sm font-semibold">
        {fileName}
      </span>
      <span className="text-secondary/60 shrink-0 text-xs">
        .{extension} — {displaySize}
      </span>
    </>
  );

  return (
    <div
      className={`flex min-w-0 ${layout === "row" ? "items-baseline gap-2" : "flex-col"} ${className}`}
    >
      {content}
    </div>
  );
}
export default FileInfo;
