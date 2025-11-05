import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "../../utils/html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  stages: [
    { duration: "5m", target: 100 },
    { duration: "1h", target: 100 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    // SOAK debe ser estricto
    http_req_duration: [{ threshold: "p(95)<800", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(99)<1500", abortOnFail: false }],
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
    checks: [{ threshold: "rate>0.98", abortOnFail: false }],

    // CRÍTICO: Verificar estabilidad al FINAL (no debe degradarse)
    "http_req_duration{stage:stage_1}": [
      { threshold: "p(95)<1000", abortOnFail: false },
    ],
  },
};

export default function () {
  // Test 1: POST /api/pizza - Get pizza recommendation
  const restrictions = {
    maxCaloriesPerSlice: 800,
    mustBeVegetarian: Math.random() > 0.7,
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
    "POST /api/pizza response time consistent": (r) => r.timings.duration < 500,
    "POST /api/pizza has valid pizza": (r) => {
      const json = r.json();
      return json.pizza?.name && json.calories > 0;
    },
  });

  sleep(2);

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
    "GET /api/ingredients response time consistent": (r) =>
      r.timings.duration < 300,
  });

  sleep(2);

  // Test 3: GET /api/doughs
  const doughsRes = http.get(`${BASE_URL}/api/doughs`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetDoughs" },
  });

  check(doughsRes, {
    "GET /api/doughs status is 200": (r) => r.status === 200,
    "GET /api/doughs response time consistent": (r) => r.timings.duration < 300,
  });

  sleep(3); // Variable user think time

  // Test 4: GET /api/tools
  const toolsRes = http.get(`${BASE_URL}/api/tools`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetTools" },
  });

  check(toolsRes, {
    "GET /api/tools status is 200": (r) => r.status === 200,
    "GET /api/tools response time consistent": (r) => r.timings.duration < 300,
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    "results/soak/pizza-soak-report.html": htmlReport(data),
    "results/soak/pizza-soak-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
