0) Bugfix — Error handler consistente (err.statusCode)

Commit sugerido: fix(errors): soportar err.statusCode en middleware

Diff (para aplicar tal cual)
--- a/src/middlewares/error.js
+++ b/src/middlewares/error.js
@@ -1,10 +1,22 @@
 /**
  * Middleware de manejo de errores
  */
 
 export default (err, _req, res, _next) => {
-    console.error('X', err);
-
-    const status = err.status || 500;
-
-    res.status(status).json({ error: err.message || 'Error interno' });
+    const message = err?.message || 'Error interno';
+    console.error('[ERROR]', message);
+
+    // Priorizamos statusCode (custom) y luego status (Express/otros)
+    const status = err?.statusCode || err?.status || 500;
+
+    const response = { error: message };
+
+    // En development, agregar stack para debug
+    if (process.env.NODE_ENV === 'development') {
+        response.stack = err?.stack;
+    }
+
+    res.status(status).json(response);
 };

 Checklist rápido

Errores que tiran err.statusCode = 400/401/403/404 ahora devuelven el HTTP correcto (no 500).

En NODE_ENV=development aparece stack en la respuesta JSON.