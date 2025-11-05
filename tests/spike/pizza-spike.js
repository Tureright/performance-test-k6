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

export function handleSummary(data) {
  return {
    "results/spike/pizza-spike-report.html": htmlReport(data),
    "results/spike/pizza-spike-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
