--- a/src/middlewares/error.js
+++ b/src/middlewares/error.js
@@ -1,4 +1,16 @@
 export default (err, _req, res, _next) => {
-    console.error('X', err);
-    const status = err.status || 500;
-    res.status(status).json({ error: err.message || 'Error interno' });
+    console.error('[ERROR]', err.message);
+
+    // Soportar ambos estilos: err.statusCode (services) y err.status
+    const status = err.statusCode || err.status || 500;
+    const response = { error: err.message || 'Error interno' };
+
+    // En development puede ayudar ver stack (en prod NO)
+    if (process.env.NODE_ENV === 'development') {
+        response.stack = err.stack;
+    }
+
+    res.status(status).json(response);
 };
