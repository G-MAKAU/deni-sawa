'use client';

/** Rendered inside a Lexical decorator host (non-editable by construction). */
export function VariablePill({ name }: { name: string }) {
  return (
    <span className="ds-variable" data-variable={name} title={`Variable: {{${name}}}`}>
      {`{{${name}}}`}
    </span>
  );
}
