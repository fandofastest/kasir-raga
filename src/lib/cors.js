// lib/cors.js
import Cors from "cors";

export const cors = Cors({
  origin: ["http://localhost:3000", "https://localhost3000.fando.id/"], // sesuaikan domain kamu
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Helper untuk menjalankan middleware
export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
