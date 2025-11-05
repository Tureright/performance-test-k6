import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "../../utils/html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "10s", target: 400 },
    { duration: "2m", target: 400 },
    { duration: "10s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    // Thresholds GENERALES (todo el test)
    http_req_duration: [{ threshold: "p(95)<2000", abortOnFail: false }],
    http_req_failed: [{ threshold: "rate<0.10", abortOnFail: false }],
    checks: [{ threshold: "rate>0.85", abortOnFail: false }],

    // Verificar RECUPERACIÓN (última etapa antes de llegar a 0 VUs)
    // Debe volver a la normalidad después del spike
    "http_req_duration{stage:stage_5}": [
      { threshold: "p(95)<1000", abortOnFail: false },
    ],
    "http_req_failed{stage:stage_5}": [
      { threshold: "rate<0.05", abortOnFail: false },
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
    "GET /api/ratings has ratings array": (r) =>
      Array.isArray(r.json().ratings),
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
