export default async (request, context) => {
  const PASSWORD = Deno.env.get("SITE_PASSWORD");
  const COOKIE = "site_auth";

  // Si no hay contraseña configurada, bloquea (nunca abrir por defecto)
  if (!PASSWORD) {
    return new Response("Falta configurar SITE_PASSWORD.", { status: 503 });
  }

  const url = new URL(request.url);
  const cookies = request.headers.get("cookie") || "";

  // Ya autenticado -> deja pasar
  if (cookies.includes(`${COOKIE}=ok`)) {
    return context.next();
  }

  // Envío del formulario
  if (request.method === "POST") {
    const form = await request.formData();
    if (form.get("password") === PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: {
          "Set-Cookie": `${COOKIE}=ok; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
          "Location": url.pathname,
        },
      });
    }
  }

  // Muestra el formulario
  const error = request.method === "POST" ? "<p style='color:red'>Contraseña incorrecta</p>" : "";
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Acceso restringido</title></head>
     <body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">
       <form method="POST" style="text-align:center">
         <h2>Sitio protegido</h2>
         ${error}
         <input type="password" name="password" placeholder="Contraseña" autofocus
           style="padding:10px;font-size:16px"><br><br>
         <button type="submit" style="padding:10px 20px;font-size:16px">Entrar</button>
       </form>
     </body></html>`,
    { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
};

export const config = { path: "/*" };
