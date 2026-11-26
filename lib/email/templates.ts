function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Magic link email: plain, accessible, and readable without images. */
export function magicLinkEmail({ url, minutes }: { url: string; minutes: number }) {
  const safeUrl = escapeHtml(url);
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f4f8f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2833">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f766e">Wayfund</p>
      <h1 style="margin:0 0 16px;font-size:22px">Your sign-in link</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5">Tap the button to sign in. The link works once and expires in ${minutes} minutes.</p>
      <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:12px">Sign in to Wayfund</a></p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#5b6b78">If you didn't ask for this, you can ignore this email. Nobody can sign in without the link.</p>
    </td></tr>
  </table>
</body></html>`;
  const text = `Sign in to Wayfund\n\nOpen this link to sign in. It works once and expires in ${minutes} minutes:\n${url}\n\nIf you didn't ask for this, you can ignore this email.`;
  return { subject: "Your Wayfund sign-in link", html, text };
}
