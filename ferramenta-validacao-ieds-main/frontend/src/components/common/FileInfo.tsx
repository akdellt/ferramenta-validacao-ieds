interface FileInfoProps {
  fileName: string;
  extension: string;
  sizeKB: string;
  layout?: "column" | "row";
  className?: string;
}

function FileInfo({
  fileName,
  extension,
  sizeKB,
  layout = "column",
  className = "",
}: FileInfoProps) {
  if (layout === "row") {
    return (
      <div className={`flex min-w-0 items-baseline gap-2 ${className}`}>
        <span className="text-primary truncate text-sm font-semibold">
          {fileName}
        </span>
        <span className="text-secondary/60 shrink-0 text-xs">
          .{extension} - {sizeKB} KB
        </span>
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className="text-primary truncate text-sm font-semibold">
        {fileName}
      </span>
      <span className="text-secondary/60 text-xs">
        .{extension} - {sizeKB} KB
      </span>
    </div>
  );
}

export default FileInfo;
