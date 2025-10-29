import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  stages: [
    { duration: "5m", target: 15 },
    { duration: "3h", target: 15 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.98"],
    http_req_duration: ["p(99)<1000"],
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
    "POST /api/ratings response time consistent": (r) =>
      r.timings.duration < 400,
    "POST /api/ratings has valid response": (r) => {
      const json = r.json();
      return json.id && json.stars >= 1 && json.stars <= 5;
    },
  });

  let ratingId = null;
  if (postRatingRes.status === 201) {
    ratingId = postRatingRes.json().id;
  }

  sleep(2); // Realistic user think time

  // Test 2: GET /api/ratings - Get all ratings
  const getAllRatingsRes = http.get(`${BASE_URL}/api/ratings`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetAllRatings" },
  });

  check(getAllRatingsRes, {
    "GET /api/ratings status is 200": (r) => r.status === 200,
    "GET /api/ratings response time consistent": (r) =>
      r.timings.duration < 300,
    "GET /api/ratings has ratings array": (r) =>
      Array.isArray(r.json().ratings),
  });

  sleep(3); // Variable user think time

  // Test 3: GET /api/ratings/{id} - Get specific rating
  if (ratingId) {
    const getRatingRes = http.get(`${BASE_URL}/api/ratings/${ratingId}`, {
      headers: {
        Authorization: AUTH_TOKEN,
      },
      tags: { name: "GetRatingById" },
    });

    check(getRatingRes, {
      "GET /api/ratings/{id} status is 200 or 404": (r) =>
        r.status === 200 || r.status === 404,
      "GET /api/ratings/{id} response time consistent": (r) =>
        r.timings.duration < 300,
    });
  }

  sleep(2);
}
