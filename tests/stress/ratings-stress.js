import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "../../utils/html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  stages: [
    { duration: "2m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "2m", target: 100 },
    { duration: "3m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "3m", target: 200 },
    { duration: "2m", target: 400 },
    { duration: "3m", target: 400 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    // Más permisivo porque esperamos degradación
    http_req_duration: [{ threshold: "p(95)<3000", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(99)<5000", abortOnFail: false }],
    http_req_failed: [{ threshold: "rate<0.10", abortOnFail: false }],
    checks: [{ threshold: "rate>0.85", abortOnFail: false }],

    // Agregar: asegurar que al menos funcione con carga baja
    "http_req_duration{stage:stage_0}": [
      { threshold: "p(95)<1000", abortOnFail: false },
    ],
  },
};

export default function () {
  // Test 1: POST /api/ratings - Create a new rating
  const newRating = {
    stars: Math.floor(Math.random() * 5) + 1,
    pizza_id: Math.floor(Math.random() * 100) + 1,
  };

  const postRatingRes = http.post(
    `${BASE_URL}/api/ratings`,
    JSON.stringify(newRating),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      tags: { name: "PostRating" },
    }
  );

  check(postRatingRes, {
    "POST /api/ratings status is 201": (r) => r.status === 201,
    "POST /api/ratings has valid response": (r) => {
      if (r.status !== 201) return false;
      const json = r.json();
      return json.id && json.stars >= 1 && json.stars <= 5;
    },
  });

  let ratingId = null;
  if (postRatingRes.status === 201) {
    ratingId = postRatingRes.json().id;
  }

  sleep(0.5);

  // Test 2: GET /api/ratings - Get all ratings
  const getAllRatingsRes = http.get(`${BASE_URL}/api/ratings`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetAllRatings" },
  });

  check(getAllRatingsRes, {
    "GET /api/ratings status is 200": (r) => r.status === 200,
    "GET /api/ratings has ratings array": (r) => {
      if (r.status !== 200) return false;
      return Array.isArray(r.json().ratings);
    },
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    "results/spike/ratings-spike-report.html": htmlReport(data),
    "results/spike/ratings-spike-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
