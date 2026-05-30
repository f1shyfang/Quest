/** MVP RPCs RETURN jsonb; `select * from fn(...)` yields one row whose single
 *  column is named after the function. Return that jsonb payload. */
export function jsonbPayload(row: Record<string, unknown> | null): unknown {
  if (!row) return null;
  const values = Object.values(row);
  return values.length > 0 ? values[0] : null;
}
