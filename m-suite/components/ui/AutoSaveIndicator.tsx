interface AutoSaveIndicatorProps {
  saving?: boolean;
  saved?: boolean;
}

export function AutoSaveIndicator({ saving, saved }: AutoSaveIndicatorProps) {
  if (saving) {
    return (
      <span className="text-[11px] text-ww-text-muted animate-pulse">
        Saving...
      </span>
    );
  }

  if (saved) {
    return (
      <span className="text-[11px] text-ww-green">
        Saved
      </span>
    );
  }

  return null;
}
