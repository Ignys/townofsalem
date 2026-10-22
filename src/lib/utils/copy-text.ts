/**
 * Copia texto mesmo fora de HTTPS (ex.: celular abrindo o dev server pelo IP da rede),
 * onde o navegador desliga navigator.clipboard.
 */
export async function copyText(value: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, value.length);
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("copy failed");
}
