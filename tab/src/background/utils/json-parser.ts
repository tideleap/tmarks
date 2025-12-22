/**
 * JSON 解析工具函数
 */

export function safeParseJson(text: string): any {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const normalizeJsonText = (s: string) => {
    const t = (s || '').trim();
    if (!t) return '';
    return t.replace(/,\s*([}\]])/g, '$1');
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    const fenced = tryParse(normalizeJsonText(fenceMatch[1]));
    if (fenced) return fenced;
  }

  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const obj = tryParse(normalizeJsonText(trimmed.slice(objStart, objEnd + 1)));
    if (obj) return obj;
  }

  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const arr = tryParse(normalizeJsonText(trimmed.slice(arrStart, arrEnd + 1)));
    if (arr) return arr;
  }

  const keyMatch = trimmed.match(/"domainMoves"|"domain_moves"/);
  if (keyMatch?.index !== undefined) {
    const start = trimmed.lastIndexOf('{', keyMatch.index);
    if (start !== -1) {
      const slice = trimmed.slice(start);
      const sliceNormalized = normalizeJsonText(slice);

      const candidates: string[] = [];
      candidates.push(sliceNormalized);

      const lastBrace = sliceNormalized.lastIndexOf('}');
      if (lastBrace !== -1) {
        const toLastBrace = sliceNormalized.slice(0, lastBrace + 1);
        candidates.push(toLastBrace);

        const keyIndex = toLastBrace.search(/"domainMoves"|"domain_moves"/);
        if (keyIndex !== -1) {
          const arrOpen = toLastBrace.indexOf('[', keyIndex);
          const arrClose = toLastBrace.lastIndexOf(']');
          if (arrOpen !== -1 && arrClose < arrOpen) {
            candidates.push(`${toLastBrace}]}`);
          }
        }
      }

      for (const c of candidates) {
        const parsed = tryParse(c);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname || '';
  } catch {
    return '';
  }
}
