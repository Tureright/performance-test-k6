import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  vus: 5,
  duration: "15s",
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
