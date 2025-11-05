import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "../../utils/html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  vus: 5,
  duration: "15s",
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(95)<500", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(99)<1000", abortOnFail: false }],
    checks: [{ threshold: "rate>0.99", abortOnFail: false }],
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
    }
  );
  if (postRatingRes.status !== 201) {
    console.error(`POST FAILED: Status ${postRatingRes.status}`);
    console.error(`Body: ${postRatingRes.body}`);
    console.error(`Sent: ${JSON.stringify(newRating)}`);
  }

  check(postRatingRes, {
    "POST /api/ratings status is 201": (r) => r.status === 201,
    "POST /api/ratings has rating id": (r) => r.json().id !== undefined,
    "POST /api/ratings has correct stars": (r) =>
      r.json().stars === newRating.stars,
  });

  let ratingId = null;
  if (postRatingRes.status === 201) {
    ratingId = postRatingRes.json().id;
    console.log(
      `Created rating ${ratingId} with ${newRating.stars} stars for pizza ${newRating.pizza_id}`
    );
  }

  sleep(1);

  // Test 2: GET /api/ratings - Get all ratings
  const getAllRatingsRes = http.get(`${BASE_URL}/api/ratings`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
  });

  check(getAllRatingsRes, {
    "GET /api/ratings status is 200": (r) => r.status === 200,
    "GET /api/ratings has ratings array": (r) =>
      Array.isArray(r.json().ratings),
  });

  if (getAllRatingsRes.status === 200) {
    console.log(`Total ratings: ${getAllRatingsRes.json().ratings.length}`);
  }

  sleep(1);

  // Test 3: GET /api/ratings/{id} - Get specific rating
  if (ratingId) {
    const getRatingRes = http.get(`${BASE_URL}/api/ratings/${ratingId}`, {
      headers: {
        Authorization: AUTH_TOKEN,
      },
    });

    check(getRatingRes, {
      "GET /api/ratings/{id} status is 200": (r) => r.status === 200,
      "GET /api/ratings/{id} has correct id": (r) => r.json().id === ratingId,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    "results/smoke/ratings-smoke-report.html": htmlReport(data),
    "results/smoke/ratings-smoke-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
