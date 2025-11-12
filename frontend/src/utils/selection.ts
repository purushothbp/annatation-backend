export interface SelectionResult {
  start: number;
  end: number;
  exact: string;
  prefix: string;
  suffix: string;
}

export const getSelectionOffsets = (container: HTMLElement, text: string): SelectionResult | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;

  const endRange = document.createRange();
  endRange.selectNodeContents(container);
  endRange.setEnd(range.endContainer, range.endOffset);
  const end = endRange.toString().length;

  if (start === end) {
    return null;
  }

  const safeStart = Math.max(0, Math.min(start, end));
  const safeEnd = Math.min(text.length, Math.max(start, end));

  const contextRadius = 32;
  const exact = text.slice(safeStart, safeEnd);
  const prefix = text.slice(Math.max(0, safeStart - contextRadius), safeStart);
  const suffix = text.slice(safeEnd, Math.min(text.length, safeEnd + contextRadius));

  return {
    start: safeStart,
    end: safeEnd,
    exact,
    prefix,
    suffix,
  };
};
