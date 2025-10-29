import http from "k6/http";
import { check, sleep } from "k6";

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
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.05"],
    checks: ["rate>0.90"],
  },
};

export default function () {
  // Test 1: POST /api/pizza - Get pizza recommendation
  const restrictions = {
    maxCaloriesPerSlice: 800,
    mustBeVegetarian: Math.random() > 0.5,
    excludedIngredients: [],
    excludedTools: [],
    maxNumberOfToppings: 5,
    minNumberOfToppings: 2,
  };

  const postPizzaRes = http.post(
    `${BASE_URL}/api/pizza`,
    JSON.stringify(restrictions),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      tags: { name: "PostPizza" },
    }
  );

  check(postPizzaRes, {
    "POST /api/pizza status is 200": (r) => r.status === 200,
    "POST /api/pizza has valid pizza": (r) => {
      const json = r.json();
      return json.pizza?.name && json.calories > 0;
    },
  });

  sleep(0.5); // Shorter sleep during spike

  // Test 2: GET /api/ingredients/{type}
  const types = ["olive_oil", "tomato", "mozzarella", "topping"];
  const randomType = types[Math.floor(Math.random() * types.length)];

  const ingredientsRes = http.get(`${BASE_URL}/api/ingredients/${randomType}`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetIngredients" },
  });

  check(ingredientsRes, {
    "GET /api/ingredients status is 200": (r) => r.status === 200,
  });

  sleep(0.5);

  // Test 3: GET /api/doughs
  const doughsRes = http.get(`${BASE_URL}/api/doughs`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetDoughs" },
  });

  check(doughsRes, {
    "GET /api/doughs status is 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
