type FieldErrors = Record<string, string[] | undefined> | undefined;

/** Previously submitted value, echoed back by the server action after a failed submit. */
export function fieldValue(fields: Record<string, unknown> | undefined, name: string): string {
  const value = fields?.[name];
  return typeof value === 'string' ? value : '';
}

/** First server-side validation message for a field, if any. */
export function fieldError(errors: FieldErrors, name: string): string | undefined {
  return errors?.[name]?.[0];
}

/**
 * Props that tie an input to its error message for assistive technology.
 * Spread onto the input: `<input {...invalidProps(state.errors, 'email')} />`.
 */
export function invalidProps(errors: FieldErrors, name: string) {
  return fieldError(errors, name)
    ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` }
    : {};
}

/** Inline error message whose id matches `invalidProps`. Renders nothing when the field is valid. */
export function FieldError({ errors, name }: { errors: FieldErrors; name: string }) {
  const message = fieldError(errors, name);
  if (!message) return null;
  return <p id={`${name}-error`} className="vendor-form-error">{message}</p>;
}

/**
 * Off-screen trap field. People never see or fill it; naive bots do. The
 * server action silently drops any submission where it has a value.
 */
export function HoneypotField() {
  return (
    <div className="form-honeypot" aria-hidden="true">
      <label htmlFor="fax_number">Leave this field empty</label>
      <input id="fax_number" name="fax_number" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
